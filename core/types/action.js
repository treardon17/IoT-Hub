const debug = require('debug')('Action')

class Action {
  constructor({ desc, func, type } = {}) {
    if (!desc) { debug('Action must have a "description"') }
    if (!func || typeof func !== 'function') { debug('Action must have a "func"') }
    if (!type) { debug('Action must have a "type"') }

    this.desc = desc
    this.func = func
    this.type = type
  }
}

Action.types = {}
Action.types.switch = 'switch'
Action.types.hue = 'hue'

module.exports = Action