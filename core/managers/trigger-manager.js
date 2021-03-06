const Util = require('../../util')
const debug = Util.Log('Manager:Trigger')
const Manager = require('./manager')
const ObjectMap = require('../../helpers/ObjectMap')

class TriggerManager extends Manager {
  constructor({ app, onReady }) {
    super({ app, name: 'Trigger', onReady })
  }

  // -----------------------------
  // INIT ------------------------
  // -----------------------------
  beforeInit() {
    this.triggers = new ObjectMap()
  }
  
  initManager() {
    debug('Initializing triggers')
    return new Promise((resolve, reject) => {
      this.initTriggers()
        .then(this.initTriggerActionsFromConfig.bind(this))
        .then(this.startTriggers.bind(this))
        .catch(reject)
    })
    triggerInstance.start()
  }

  initTriggers() {
    return new Promise((resolve, reject) => {
      // Read in all of the triggers from the /triggers folder and create
      // instances of them. Create a map of trigger objects that we can
      // reference later when we initialize the trigger actions.
      const { triggers = [] } = this.app.config
      debug('Initializing triggers', triggers)
      triggers.forEach((item) => {
        try {
          const Trigger = require(`../../triggers/${item.fileName}.js`)
          const triggerInstance = new Trigger({ app: this.app })
          this.triggers.map[item.fileName] = triggerInstance
        } catch (error) {
          debug('Error initializing trigger', error)
          reject(error)
        }
        resolve()
      })
    })
  }

  startTriggers() {
    return new Promise((resolve, reject) => {
      try {
        debug('Starting triggers', this.triggers.items)
        this.triggers.items.forEach((trigger) => {
          trigger.start()
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  initTriggerActionsFromConfig() {
    return new Promise((resolve, reject) => {
      debug(`Initializing triggers from ${this.fileName}`)
      Util.FileIO.readDataFile({ fileName: this.fileName })
        .then((data) => {
          const { triggers } = data
          if (triggers && Array.isArray(triggers)) {
            triggers.forEach(trigger => {
              const { tasks } = trigger
              const triggerInstance = this.triggers.map[trigger.id]
              if (triggerInstance) {
                tasks.forEach((task) => {
                  // setup the actions for when the trigger is activated
                  if (task.on) {
                    debug('Setting up trigger active actions')
                    const callback = (() => this.app.taskManager.taskMap[task.on.action].execute(task.on.params)) || (() => { debug('Could not complete trigger action. Invalid function') })
                    triggerInstance.setupTriggerActive({
                      ...task.on.setupParams,
                      callback
                    })
                  }
                  // setup the actions for when the trigger is no longer active
                  if (task.off) {
                    debug('Setting up trigger inactive actions')
                    const callback = (() => this.app.taskManager.taskMap[task.off.action].execute(task.off.parms)) || (() => { debug('Could not complete trigger action. Invalid function') })
                    triggerInstance.setupTriggerInactive({
                      ...task.off.setupParams,
                      callback
                    })
                  }
                })
              } else {
                debug('Trigger', trigger.id, 'is not specified in the main config file. Add it there.')
              }
            })
            resolve()
          } else {
            debug('Triggers not available in data file')
            reject()
          }
        })
        .catch((error) => {
          debug('Error initializing triggers', error)
          reject(error)
        })
    })
  }

  saveTriggers() {
    return new Promise((resolve, reject) => {
      Util.FileIO.saveToDataFile({
        fileName: this.fileName,
        key: 'triggers',
        data: this.triggers.map
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

module.exports = TriggerManager