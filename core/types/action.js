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
    if (typeof this._status === 'function') {
      return this._status()
    }
    debug('Function `status` in Action has invalid type')
    return null
  }
}

Action.types = {}
Action.types.switch = 'switch'
Action.types.hue = 'hue'
Action.types.brightness = 'brightness'

module.exports = Action