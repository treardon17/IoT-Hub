const Util = require('../../util')
const debug = Util.Log('Manager:Task')
const Task = require('../types/task')

class TaskManager {
  constructor() {
    this.taskMap = {}
  }
}

module.exports = new TaskManager()