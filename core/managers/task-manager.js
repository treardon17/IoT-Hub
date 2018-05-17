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
   * @param { actions } array an array of task actions. Look at `task.js` for more information.
   */
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

  performTask(taskID) {
    return new Promise((resolve, reject) => {
      const task = this.taskMap[taskID]
      if (task) {
        const { instructions } = task
        // Keep track of how many lights we're trying to modify
        let completeCount = 0
        const checkResovle = () => {
          completeCount += 1
          if (completeCount === instructions.length - 1) { resolve() }
        }
        instructions.forEach(instruction => {
          const { service, action, params } = instruction
          let { devices } = instruction
          if (!devices && service) {
            devices = this.application.getDevicesOfService(service)
          }
          this.performAction({ devices, action, params })
            .then(checkResovle)
            .catch(reject)
        })
      } else {
        reject({ error: `Invalid task. ${taskID} does not exist in the taskMap` })
      }
    })
  }
}

module.exports = TaskManager