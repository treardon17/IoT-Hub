const Util = require('../../util')
const debug = Util.Log('Manager:Task')
const Task = require('../types/task')

class TaskManager {
  constructor({ application }) {
    this.application = application
    this.taskMap = {}
    this.fileName = 'task-manager'
    this.initTasks().catch(() => { debug('Task file does not exist') })
  }

  /**
   * Initializes the tasks from the tasks file
   * creates the taskMap
   */
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

  /**
   * 
   * @param { name } string the name of the task
   * @param { description } string what the task does
   * @param { save } bool whether or not to save the task to the json file. if this is set to true, the function will return a promise
   * @param { instructions } array an array of task actions. Look at `task.js` for more information.
   */
  createTask({ name, description, save, instructions } = {}) {
    let myInstructions = instructions;
    if (!Array.isArray(instructions)) {
      myInstructions = [instructions]
    }
    const task = new Task({ id: Util.ID.guid(), name, description, instructions: myInstructions, application: this.application })
    
    if (save) {
      this.taskMap[task.id] = task
      return new Promise((resolve, reject) => {
        this.saveTasks()
          .then(() => { resolve(task) })
          .catch(reject)
      })
    }

    return task
  }

  /**
   * 
   * @param {id} string the id of the task to delete
   * @param {save} bool whether or not to save the change to disk. will return a promise if set to true
   */
  deleteTask({ id, save } = {}) {
    delete this.taskMap[id]
    if (save) {
      return new Promise((resolve, reject) => {
        this.saveTasks()
          .then(resolve)
          .catch(reject)
      })
    }
    return null
  }


  // THIS IS BROKEN NOW BECAUSE THERE'S A CIRCULAR STRUCTURE.
  // NEED TO ONLY SAVE THE NAME, DESCRIPTION, AND INSTRUCTIONS
  // RATHER THAN EVERYTHING IN THE TASK MAP
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

module.exports = TaskManager