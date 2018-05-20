const Device = require('./device')
const debug = require('../../util/log')

class TaskDevice extends Device {
  constructor({ name, task }) {
    super({
      name,
      actions: { on: task },
      type: Device.types.task
    })
  }

  createActions() { return {} }
}

module.exports = TaskDevice
