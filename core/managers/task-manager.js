const Util = require('../../util')
const debug = Util.Log('Manager:Task')
const Task = require('../types/task')
const TaskDevice = require('../types/task-device')

class TaskManager {
  constructor({ application, onReady }) {
    this.application = application
    this.taskMap = {}
    this.tasksDirty = false
    this.taskDeviceMap = {}
    this.taskDevicesDirty = false
    this.fileName = 'task-manager'
    this.onReady = onReady
    this.init()
  }

  get tasks() {
    if (!this._tasks || this.tasksDirty) {
      this._tasks = Object.keys(this.taskMap).map(key => this.taskMap[key])
      this.tasksDirty = false
    }
    return this._tasks
  }

  get taskDevices() {
    if (!this._taskDevices || this.taskDevicesDirty) {
      this._taskDevices = Object.keys(this.taskDeviceMap).map(key => this.taskDeviceMap[key])
      this.taskDevicesDirty = false
    }
    return this._taskDevices
  }


  // -----------------------------
  // INIT ------------------------
  // -----------------------------
  init() {
    this.initTasks()
      .then(() => {
        if (typeof this.onReady === 'function') { this.onReady() }
      })
      .catch(() => { debug('Task file does not exist') })
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
          if (tasks && Array.isArray(tasks)) {
            tasks.forEach(task => {
              this.taskMap[task.id] = this.createTask({ ...task, save: true })
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
   * @param { desc } string what the task does
   * @param { type } string type of task device being created. default is "task"
   * @param { taskType } string type of task action being created. default is "switch"
   * @param { instructions } array an array of task actions. Look at `task.js` for more information.
   * @param { save } bool whether or not to save the task to the json file. if this is set to true, the function will return a promise
   */
  createTask({ name, desc, type, taskType, instructions, save } = {}) {
    debug(`Creating task ${name}`)
    let myInstructions = instructions;
    if (!Array.isArray(instructions)) {
      myInstructions = [instructions]
    }
    const task = new Task({ id: Util.ID.guid(), name, desc, instructions: myInstructions, application: this.application })
    
    if (save) {
      debug(`Saving task ${name} of type ${type}`)

      let isSharedService = true
      let service = null
      for(let i = 0; i < myInstructions.length; i++) {
        const instruction = myInstructions[i]
        if (service === null) {
          service = instruction.service
        } else if (service !== instruction.service) {
          isSharedService = false
          break
        }
      }

      debug(`Is shared service ${service}? ${isSharedService}`)

      this.tasksDirty = true
      this.taskMap[task.id] = task
      this.taskDeviceMap[task.id] = new TaskDevice({
        name,
        type,
        actions: { on: task }
      })
      this.application.onChildDevicesUpdate()
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

  saveTasks() {
    return new Promise((resolve, reject) => {
      Util.FileIO.saveToDataFile({
        fileName: this.fileName,
        key: 'tasks',
        data: this.getSaveTaskArray()
      })
        .then(() => {
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  getSaveTaskArray() {
    const { tasks } = this
    const saveArray = []
    tasks.forEach(task => {
      saveArray.push(task.getSaveData())
    })
    return saveArray
  }
}

module.exports = TaskManager