const Util = require('../../util')
const debug = Util.Log('Manager:Task')
const Task = require('../types/task')

class TaskManager {
  constructor() {
    this.taskMap = {}
    this.fileName = 'task-manager'
    this.init()
  }

  init() {
    this.initTasks().catch(() => { debug('Task file does not exist') })
  }

  initTasks() {
    debug('Initializing tasks')
    return new Promise((resolve, reject) => {
      Util.FileIO.readDataFile({ fileName: this.fileName })
        .then((data) => {
          const { tasks } = data
          if (tasks) {
            Object.keys(tasks).forEach(key => {
              this.taskMap[key] = new Task(tasks[key])
            })
            resolve()
          } else {
            debug('Tasks not available in data file')
            reject()
          }
        })
        .catch((error) => {
          debug('Error initializing tasks', error)
          reject(error)
        })
    })
  }

  createTask({ name, description, save } = {}) {
    const task = new Task({ id: Util.ID.hash(name), name, description })
    this.taskMap[task.id] = task

    if (save) {
      return new Promise((resolve, reject) => {
        this.saveTasks()
          .then(() => { resolve(task) })
          .catch(reject)
      })
    }
    return task
  }

  saveTasks() {
    return new Promise((resolve, reject) => {
      Util.FileIO.saveToDataFile({
        fileName: this.fileName,
        key: 'tasks',
        data: this.taskMap
      })
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

module.exports = new TaskManager()