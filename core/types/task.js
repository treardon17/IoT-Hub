const Util = require('../../util')
const Action = require('./action')
const debug = Util.Log('Task')

/**
 * 
 * 
 * @class Task
 * A Task is a series of actions to be executed
 */
class Task extends Action {
  constructor({ id, name, desc, type, instructions, application }) {
    super({ desc, type: type || Action.types.switch })
    if (!id) { debug('Task must have an ID') }
    this.id = id
    this.name = name
    this.instructions = []
    this.application = application

    this.addInstructions({ instructions })
  }
  
  /**
   * 
   * @param { service } string defines which service to filter by
   * @param { devices } array list of devices IDs from that service this action should apply to. If null defaults to all.
   * @param { action } string defining which action from the devices selected should be run
   * @param { params } object the parameters that should be passed to the device action. If null, nothing will be passed.
   */
  addInstruction({ service, devices, action, params }) {
    if (!action) { debug('`action` must be defined in the task', this.name) }
    if (!service || (devices && devices.length === 0)) {
      debug('Task must have `service` or at least one device in `devices`', this.name)
    }
    this.instructions.push({ service, devices, action, params })
  }

  addInstructions({ instructions }) {
    if (Array.isArray(instructions)) {
      instructions.forEach(instruction => {
        this.addInstruction(instruction)
      })
    }
  }

  // -----------------------------
  // ACTIONS ---------------------
  // -----------------------------
  performAction({ action = '', stagger, devices, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      let myDevices = devices
      if (!Array.isArray(devices)) {
        myDevices = [devices]
      }
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = () => {
        if (completeCount === myDevices.length - 1) { resolve() }
        completeCount += 1
      }
      let staggerAmt = stagger
      // If we're performing a valid action
      // Perform that action on every light
      myDevices.forEach((device) => {
        debug(`Performing ${action} on ${device.id}`)
        try {
          const deviceActions = device.actions
          if (deviceActions[action]) {
            setTimeout(() => {
              deviceActions[action]
                .execute(params)
                .then(checkResovle)
                .catch(reject)
              staggerAmt += stagger
            }, staggerAmt)
          } else {
            throw `${action} not found in ${device.name}'s actions`
          }
        } catch (error) {
          debug(error)
          reject(error)
        }
      })
    })
  }

  execute(value, serialize) {
    return new Promise((resolve, reject) => {
      const { instructions } = this
      // Keep track of how many lights we're trying to modify
      const performers = []
      let completeCount = 0
      const checkResovle = () => {
        if (completeCount === instructions.length - 1) { resolve() }
        completeCount += 1
        // If we're serializing the tasks, call the next
        // task here
        if (serialize && performers.length > 0) {
          performers.shift()()
        }
      }
      instructions.forEach(instruction => {
        const { service, action, params } = instruction
        let { devices } = instruction
        if (!devices && service) {
          devices = this.application.getDevicesOfService(service)
        }
        let myParams = params
        if (value != null) {
          myParams = value
        }

        // Add the functions to the performers array
        const perform = () => {
          this.performAction({ devices, action, params: myParams })
            .then(checkResovle)
            .catch(reject)
        }
        performers.push(perform)
      })

      // If we're serializing the commands, start the first function
      if (serialize && performers.length > 0) {
        performers.shift()()
      } else {
        // Otherwise, start all of them at once
        performers.forEach((perform) => {
          perform()
        })
      }
    })
  }


  // -----------------------------
  // QUERIES ---------------------
  // -----------------------------
  checkStatus({ devices, action, expectedValue }) {
    return new Promise((resolve, reject) => {
      let myDevices = devices
      if (!Array.isArray(devices)) {
        myDevices = [devices]
      }
      // Keep track of how many devices
      // have the status we're looking for
      let successCount = 0
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = (device, status) => {
        // If the status is what we're expecting
        // then we're one device closer for the task being true
        if (status === expectedValue) { successCount += 1 }
        if (completeCount === myDevices.length - 1) {
          // We've looked at all the devices
          // this is the moment of truth
          resolve({
            successCount,
            totalChecked: myDevices.length,
            success: successCount === myDevices.length
          })
        }
        completeCount += 1
      }
      // If we're performing a valid action
      // Perform that action on every light
      myDevices.forEach((device) => {
        debug(`Checking status of ${action} on ${device.id}`)
        try {
          const deviceActions = device.actions
          if (deviceActions[action]) {
            deviceActions[action]
              .status()
              .then((status) => {
                debug(`${device.name} ${action} status: ${status}`)
                checkResovle(device, status)
              })
              .catch(reject)
          } else {
            throw `${action} not found in ${device.name}'s actions`
          }
        } catch (error) {
          debug(error)
          reject(error)
        }
      })
    })
  }

  status() {
    return new Promise((resolve, reject) => {
      const { instructions } = this
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const statusArray = []

      // Checker to resolve the promise
      const checkResovle = (status) => {
        statusArray.push(status)
        if (completeCount === instructions.length - 1) {
          let successCount = 0
          statusArray.forEach(item => {
            if (item.status.success) { successCount += 1 }
          })
          resolve({
            success: successCount === statusArray.length,
            statusArray
          })
        }
        completeCount += 1
      }
      // Go through all the instructions,
      // grab the devices, and check their status
      // to see if this task is active
      instructions.forEach(instruction => {
        const { service, action, params } = instruction
        let { devices } = instruction
        if (!devices && service) {
          devices = this.application.getDevicesOfService(service)
        }
        this.checkStatus({ devices, action, expectedValue: params })
          .then((status) => {
            checkResovle({ status, action, service })
          })
          .catch(reject)
      })
    })
  }

  // -----------------------------
  // HELPERS ---------------------
  // -----------------------------
  getSaveData() {
    const { id, name, type, description, instructions } = this
    return { id, name, type, description, instructions }
  }
}

module.exports = Task