const Util = require('../../util')
const debug = Util.Log('Task')

/**
 * 
 * 
 * @class Task
 * A Task is a series of instructions to be executed
 */
class Task {
  constructor({ id, name, description, instructions }) {
    if (!id) { debug('Task must have an ID') }
    if (!name) { debug('Task must have a name')}

    this.id = id
    this.name = name
    this.fileName = `task-${this.name}`
    this.description = description
    this.instructions = instructions || []
  }
  
  addInstruction({ service, device, action, params }) {
    this.instructions.push({ service, device, action, params })
  }
}

module.exports = Task