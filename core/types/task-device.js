const Device = require('./device')
const debug = require('../../util/log')

class TaskDevice extends Device {
  constructor({ name, task }) {
    this.task = task
    super({ name, type: Device.types.task })
  }

  createActions() {
    return {
      on: this.task
    }
  }
}

module.exports = TaskDevice
