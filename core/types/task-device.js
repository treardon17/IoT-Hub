const Device = require('./device')
const debug = require('../../util/log')

class TaskDevice extends Device {
  constructor({ name, type, actions }) {
    super({
      name,
      type: type || Device.types.task,
      actions
    })
  }

  createActions() { return {} }
}

module.exports = TaskDevice
