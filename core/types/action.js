const Util = require('../../util')
const debug = Util.Log('Action')

class Action {
  constructor({ execute, status, desc, type } = {}) {
    if (execute && typeof execute !== 'function') { debug('Action must have a "execute" --> function returning a promise') }
    if (status && typeof status !== 'function') { debug('Action must have a "status" --> function returning a promise') }
    if (!type) { debug('Action must have an action "type"') }

    this._execute = execute
    this._status = status
    this.desc = desc
    this.type = type

    // internal state
    this._previousCheckTime = Number.MIN_VALUE
    this._cachedStatus = null
  }

  /**
   * Performs the action with the given parameters.
   * Should return a promise if overridden.
   * @param {*} params 
   */
  execute(...params) {
    if (typeof this._execute === 'function') {
      return this._execute(...params)
    }
    debug('Function `execute` in Action has invalid type')
    return null
  }

  /**
   * Gets the current status/state of the action
   * Should return a promise if overridden.
   */
  status() {
    return new Promise((resolve, reject) => {
      if (typeof this._status === 'function') {
        const currentTime = new Date().getTime()
        const difference = currentTime - this._previousCheckTime
        // If the function has been called within the last half second,
        // use the cached status rather than making the same request again
        if (this._cachedStatus != null && difference < 500) {
          debug('Using cached status for action')
          resolve(this._cachedStatus)
        }
  
        // Otherwise query the device again and then cache the status
        debug('Refreshing action status')
        this._status()
          .then((status) => {
            this._cachedStatus = status
            this._previousCheckTime = new Date().getTime()
            resolve(status)
          })
      } else {
        debug('Function `status` in Action has invalid type')
        resolve(null)
      }
    })
  }
}

Action.types = {}
Action.types.switch = 'switch'
Action.types.hue = 'hue'
Action.types.brightness = 'brightness'

module.exports = Action