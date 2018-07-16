const Util = require('../../util')
const debug = Util.Log('Manager:Trigger')
const Manager = require('./manager')
const ObjectMap = require('../../helpers/ObjectMap')

class TriggerManager extends Manager {
  constructor({ application, onReady }) {
    super({ application, name: 'Trigger', onReady })
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
      this.initTriggers().then(() => {
        // this.initTriggerActionsFromConfig()
      })
    })
  }

  initTriggers() {
    return new Promise((resolve, reject) => {
      // Read in all of the triggers from the /triggers folder and create
      // instances of them. Create a map of trigger objects that we can
      // reference later when we initialize the trigger actions.
      Util.FileIO.readDataFile({ fileName: this.fileName, createIfNeeded: true })
        .then((data) => {
          const { triggers = [] } = data
          console.log('triggers are:', triggers)
        })
        //   const { triggers } = data
        //   if (triggers && Array.isArray(triggers)) {
        //     triggers.forEach(trigger => {
        //       this.triggers.map[trigger.id] = true // this.createTrigger({ ...trigger, save: false, addAsDevice: true })
        //     })
        //     resolve()
        //   } else {
        //     debug('Triggers not available in data file')
        //     reject()
        //   }
        // })
        // .catch((error) => {
        //   debug('Error initializing triggers', error)
        //   reject(error)
        // })
    })
  }

  // initTriggerActionsFromConfig() {
  //   return new Promise((resolve, reject) => {
  //     Util.FileIO.readDataFile({ fileName: this.fileName })
  //       .then((data) => {
  //         const { triggers } = data
  //         if (triggers && Array.isArray(triggers)) {
  //           triggers.forEach(trigger => {
              
  //             // Generate all the trigger actions here

  //             console.log(trigger)
  //           })
  //           resolve()
  //         } else {
  //           debug('Triggers not available in data file')
  //           reject()
  //         }
  //       })
  //       .catch((error) => {
  //         debug('Error initializing triggers', error)
  //         reject(error)
  //       })
  //   })
  // }

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