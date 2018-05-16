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
  
  /**
   * 
   * @param { service } string defines which service to filter by
   * @param { devices } array list of devices IDs from that service this action should apply to. If null defaults to all.
   * @param { action } string defining which action from the devices selected should be run
   * @param { params } object the parameters that should be passed to the device action. If null, nothing will be passed.
   */
  addAction({ service, devices, action, params }) {
    if (!action) { debug('`action` must be defined in the task', this.name) }
    this.actions.push({ service, devices, action, params })
  }
}

module.exports = Task