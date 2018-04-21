const debug = require('debug')('Service')
const Util = require('../util')

class Service {
  constructor({ name }) {
    this.name = name
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

  // DATA
  saveDevices() {
    Util.FileIO.saveToDataFile({ fileName: this.name, key: 'devices', data: this.devices })
  }
}

module.exports = Service