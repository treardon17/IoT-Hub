const debug = require('debug')('Service')
const Util = require('../util')

class Service {
  constructor({ name }) {
    this.name = name
    this.saveInProgress = false
    this.saveQueue = []
    if (!name) {
      console.error('Service must have a name!')
    }
  }

  // GETTERS --------------
  get devices() {
    debug('"devices" not yet implemented in subclass')
    return []
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
  getDevicesWithoutParentReference() {
    return this.devices.map(device => {
      const { parentService, ...rest } = device
      return { ...rest }
    })
  }

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
        if (this.name) {
          Util.FileIO.saveToDataFile({ fileName: this.name, key: 'devices', data: this.getDevicesWithoutParentReference() })
            .then(() => {
              callback()
              resolve()
            })
            .catch(() => {
              callback()
              reject()
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
            resolve({})
          })
      } else {
        reject('Service needs name')
      }
    })
  }
}

module.exports = Service