const Device = require('./device')
const debug = require('../../util/log')

class TaskDevice extends Device {
  constructor({ name, task, type }) {
    super({
      name,
      actions: { on: task },
      type: type || Device.types.task
    })
  }

  createActions() { return {} }
}

module.exports = TaskDevice
