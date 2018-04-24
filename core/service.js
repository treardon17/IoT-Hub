const debug = require('debug')('Service')
const Util = require('../util')

class Service {
  constructor({ name, deviceClass }) {
    // VALIDATION
    if (!name) { console.error('Service must have a "name" attribute!') }
    if (!deviceClass) { console.error('Service must have a "deviceClass" attribute!') }

    // REQUIRED
    this.name = name
    this.deviceClass = deviceClass
    this.deviceMap = {}

    // HELPERS
    this.saveInProgress = false
    this.saveQueue = []
  }

  // INIT -----------------
  initDevices() {
    this.initExistingDevices()
      .then(this.discoverDevices.bind(this))
      .then(this.saveDevices.bind(this))
  }

  initExistingDevices() {
    return new Promise((resolve, reject) => {
      if (!this.deviceClass) {
        const errMsg = 'Service missing "deviceClass"'
        debug(errMsg)
        reject(errMsg)
      } else {
        this.readData().then(data => {
          data.devices.forEach((device) => {
            debug('Creating device from existing data: ', device)
            this.deviceMap[device.id] = new this.deviceClass(device)
          })
          resolve()
        }).catch(reject)
      }
    })
  }

  // GETTERS --------------
  get devices() {
    debug('"devices" not yet implemented in subclass')
    return []
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

  // ACTIONS --------------
  performAction({ action = '', duration, stagger, devices, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      const actionDevices = devices || this.devices
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = () => {
        completeCount += 1
        if (completeCount === actionDevices.length) { resolve() }
      }
      let staggerAmt = stagger
      // If we're performing a valid action
      // Perform that action on every light
      actionDevices.forEach((device) => {
        try {
          if (device.actions[action]) {
            setTimeout(() => {
              device[action](params)
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

  discoverDevices() {
    debug('`discoverDevices` must be implemented in the service subclass.')
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

  saveDevices() {
    return new Promise((resolve, reject) => {
      const saveProcess = (callback) => {
        const resolver = () => {
          callback()
          resolve()
        }
        if (this.name) {
          this.readData().then((data) => {
            let devices = data.devices || []
            devices = [...devices, ...this.simpleDevices]
            devices = Util.Array.removeDuplicates({ array: devices, prop: 'id' })
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