const debug = require('debug')('Task')

/**
 * 
 * 
 * @class Task
 * A Task is a series of instructions to be executed
 */
class Task {
  constructor({ id, name, description }) {
    this.id = id
    this.name = name
    this.description = description
    this.instructions = []
  }
  
  addInstruction({ service, device, action, params }) {
    this.instructions.push({ service, device, action, params })
  }
}

module.exports = Task