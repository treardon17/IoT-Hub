const debug = require('debug')('Manager:Task')
const Task = require('../types/task')

class TaskManager {
  constructor() {
    this.taskMap = {}
  }
}

module.exports = new TaskManager()