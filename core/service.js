const debug = require('debug')('Service')
const Util = require('../util')

class Service {
  constructor({ name, deviceClass }) {
    // VALIDATION
    if (!name) { debug('Service must have a "name" attribute!') }
    if (!deviceClass) { debug('Service must have a "deviceClass" attribute!') }

    // REQUIRED
    this.name = name
    this.deviceClass = deviceClass
    this.deviceMap = {}
    this.actions = {}
    // END REQUIRED

    // HELPERS
    this.application = null
    this.shouldUpdateDevices = false
    this.saveInProgress = false
    this.saveQueue = []

    // INITIALIZATION
    this.initDevices()
    this.setupActions()
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------

  // Discovery
  discoverDevices() {
    debug('"discoverDevices" must be implemented in the service subclass.')
  }

  setupActions() {
    debug('"setupActions" must be implemented in the service subclass.')
  }

  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------

  // GETTERS -----------------
   /**
   * Gets every device this service has
   */
  get devices() {
    if (this.shouldUpdateDevices || !this._devices) {
      const deviceKeys = Object.keys(this.deviceMap)
      this._devices = deviceKeys.map(key => this.deviceMap[key])
      this.notifyParentOfDeviceChanges()
      this.shouldUpdateDevices = false
    }
    return this._devices
  }

  /**
 * Gets the minimal amount of info for each device
 */
  get simpleDevices() {
    return this.devices.map(device => {
      const { id, name, ip, type, mac } = device
      return { id, name, ip, type, mac }
    })
  }

  // INIT -----------------
  initDevices() {
    this.initExistingDevices()
      .then(this.discoverDevices.bind(this))
      .then(this.saveDevices.bind(this))
      .catch((error) => {
        debug('Issue initializing devices', error)
      })
  }

  initExistingDevices() {
    return new Promise((resolve, reject) => {
      if (!this.deviceClass) {
        const errMsg = 'Service missing "deviceClass"'
        debug(errMsg)
        reject(errMsg)
      } else {
        this.readData().then(data => {
          if (data.devices) {
            data.devices.forEach((device) => {
              debug('Creating device from existing data -- id:', device.id)
              this.deviceMap[device.id] = new this.deviceClass(device)
              this.notifyParentOfDeviceChanges()
            })
          }
          resolve()
        }).catch(reject)
      }
    })
  }

  // HELPERS --------------
  notifyParentOfDeviceChanges() {
    if (this.application && typeof this.application.onDevicesUpdate === 'function') {
      this.application.onDevicesUpdate()
    }
  }

  setShouldUpdateDevices() {
    this.shouldUpdateDevices = true
  }

  // ACTIONS --------------
  performAction({ action = '', duration, stagger, devices, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      const actionDevices = devices || this.devices
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = () => {
        completeCount += 1
        if (completeCount === actionDevices.length - 1) { resolve() }
      }
      let staggerAmt = stagger
      // If we're performing a valid action
      // Perform that action on every light
      actionDevices.forEach((device) => {
        debug(`Performing ${action} on ${device.id}`)
        try {
          const deviceActions = device.actions
          if (deviceActions[action]) {
            setTimeout(() => {
              deviceActions[action].func(params).then(checkResovle)
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

  // DATA
  processSaveQueue() {
    if (!this.saveInProgress && this.saveQueue.length > 0) {
      this.saveInProgress = true
      this.saveQueue.shift()(() => {
        this.saveInProgress = false
        this.processSaveQueue()
      })
    }
  }

  deviceArrayToObject({ array }) {
    const obj = {}
    array.forEach(device => {
      obj[device.id] = device
    })
    return obj
  }

  saveDevices({ override } = {}) {
    return new Promise((resolve, reject) => {
      const saveProcess = (callback) => {
        const resolver = () => {
          callback()
          resolve()
        }
        if (this.name) {
          this.readData().then((data) => {

            let devices = null
            if (override && data.devices) {
              // We want to erase the existing devices and
              // start over with the newest ones
              devices = this.simpleDevices
            } else if (!data.devices) {
              // We didn't save any devices, so we make an empty array
              devices = []
            } else {
              devices = [...data.devices, ...this.simpleDevices]
            }
            debug(`Saving ${devices.length} devices`)
            devices = Util.Array.removeDuplicates({ array: devices, prop: ['ip', 'id'] })
            const validIDs = devices.map(device => device.id)
            const currentIDs = Object.keys(this.deviceMap)
            const invalidIDs = Util.Array.difference({ array1: currentIDs, array2: validIDs })
            Util.Object.removeKeysFromObject({ object: this.deviceMap, keys: invalidIDs })
            Util.FileIO.saveToDataFile({ fileName: this.name, key: 'devices', data: devices })
              .then(resolver)
              .catch(() => {
                callback()
                reject(`Could not save device to file ${this.name}`)
              })
          }).catch(() => {
            callback()
            reject('Had trouble reading from file while saving devices')
          })
        } else {
          callback()
          reject('Service needs name')
        }
      }
      this.saveQueue.push(saveProcess)
      this.processSaveQueue()
    })
  }

  readData() {
    return new Promise((resolve, reject) => {
      if (this.name) {
        Util.FileIO.readDataFile({ fileName: this.name })
          .then(resolve)
          .catch(() => {
            debug(`File does not exist, so creating new file: ${this.name}.json`)
            let data = {}
            Util.FileIO.saveToDataFile({ fileName: this.name, data }).then(() => {
              resolve(data)
            })
          })
      } else {
        reject('Service needs name')
      }
    })
  }
}

module.exports = Service