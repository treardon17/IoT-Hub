const Util = require('../../util')
const debug = Util.Log('Action')

class Action {
  constructor({ execute, status, desc, type } = {}) {
    if (!execute || typeof execute !== 'function') { debug('Action must have a "execute" --> function returning a promise') }
    if (!status || typeof status !== 'function') { debug('Action must have a "status" --> function returning a promise') }
    if (!type) { debug('Action must have an action "type"') }

    this.execute = execute
    this.status = status
    this.desc = desc
    this.type = type
  }
}

Action.types = {}
Action.types.switch = 'switch'
Action.types.hue = 'hue'

module.exports = Action