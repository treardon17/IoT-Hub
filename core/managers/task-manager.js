const Util = require('../../util')
const debug = Util.Log('Manager:Task')
const Manager = require('./manager')
const Task = require('../types/task')
const TaskDevice = require('../types/task-device')
// const ObjectMap = require('../../helpers/ObjectMap')

class TaskManager extends Manager {
  constructor({ application, onReady }) {
    super({ application, name: 'Task', onReady })
  }

  beforeInit() {
    // this.tasks = new ObjectMap()
    // this.taskDevices = new ObjectMap()
    this.taskMap = {}
    this.tasksDirty = false
    this.taskDeviceMap = {}
    this.taskDevicesDirty = false
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

  /**
   * Initializes the tasks from the tasks file
   * creates the taskMap
   */
  initManager() {
    debug('Initializing tasks')
    return new Promise((resolve, reject) => {
      Util.FileIO.readDataFile({ fileName: this.fileName })
        .then((data) => {
          const { tasks } = data
          if (tasks && Array.isArray(tasks)) {
            tasks.forEach(task => {
              this.taskMap[task.id] = this.createTask({ ...task, save: false, addAsDevice: true })
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
  createTask({ name, desc, type, taskType, instructions, save, addAsDevice } = {}) {
    debug(`Creating task ${name}`)
    let myInstructions = instructions;
    if (!Array.isArray(instructions)) {
      myInstructions = [instructions]
    }
    const task = new Task({ id: Util.ID.guid(), name, desc, instructions: myInstructions, application: this.application })
    
    if (addAsDevice) {
      debug(`Adding task ${name} of type ${type} as device`)
      this.tasksDirty = true
      this.taskMap[task.id] = task
      this.taskDeviceMap[task.id] = new TaskDevice({
        name,
        actions: { on: task }
      })
    }
    
    if (save) {
      debug(`Saving task ${name} of type ${type}`)
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