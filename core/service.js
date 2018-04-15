const debug = require('debug')('Service')
class Service {

  // GETTERS --------------
  get devices() {
    debug('"devices" not yet implemented in subclass')
    return []
  }

  // ACTIONS --------------
  performActionAll({ action = '', duration, stagger, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      const { devices } = this
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = () => {
        completeCount += 1
        if (completeCount === devices.length) { resolve() }
      }
      let staggerAmt = stagger
      // const actionMethod = this[action].bind(this)
      // If we're performing a valid action
      // Perform that action on every light
      devices.forEach((device) => {
        try {
          setTimeout(() => {
            device[action](params)
            // actionMethod({ id: device.id, ...params })
            staggerAmt += stagger
          }, staggerAmt)
        } catch (error) {
          debug(`Action: ${action} is not a valid function`)
          reject(error)
        }
      })
    })
  }
}

module.exports = Service