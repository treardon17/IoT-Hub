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

  createTask({ name, description, save, actions } = {}) {
    const task = new Task({ id: Util.ID.guid(), name, description, actions })
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

  // -----------------------------
  // ACTIONS ---------------------
  // -----------------------------
  performAction({ action = '', stagger, devices, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      let myDevices = devices
      if (!Array.isArray(devices)) {
        myDevices = [devices]
      }
      // Keep track of how many lights we're trying to modify
      let completeCount = 0
      const checkResovle = () => {
        completeCount += 1
        if (completeCount === myDevices.length - 1) { resolve() }
      }
      let staggerAmt = stagger
      // If we're performing a valid action
      // Perform that action on every light
      myDevices.forEach((device) => {
        debug(`Performing ${action} on ${device.id}`)
        try {
          const deviceActions = device.actions
          if (deviceActions[action]) {
            setTimeout(() => {
              deviceActions[action]
                .execute(params)
                .then(checkResovle)
                .catch(reject)
              staggerAmt += stagger
            }, staggerAmt)
          } else {
            throw `${action} not found in ${device.name}'s actions`
          }
        } catch (error) {
          debug(error)
          reject(error)
        }
      })
    })
  }
}

module.exports = new TaskManager()