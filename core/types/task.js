const Util = require('../../util')
const debug = Util.Log('Task')

/**
 * 
 * 
 * @class Task
 * A Task is a series of actions to be executed
 */
class Task {
  constructor({ id, name, description, actions }) {
    if (!id) { debug('Task must have an ID') }
    if (!name) { debug('Task must have a name')}

    this.id = id
    this.name = name
    this.description = description
    this.actions = actions || []
  }
  
  addAction({ service, device, action, params }) {
    this.actions.push({ service, device, action, params })
  }
}

module.exports = Task