const Util = require('../../util')
const debug = Util.Log('Manager:Trigger')
const Manager = require('./manager')

class TriggerManager extends Manager {
  constructor({ application, onReady }) {
    super({ application, name: 'Trigger', onReady })
  }

  // -----------------------------
  // INIT ------------------------
  // -----------------------------
  beforeInit() {
    this.triggers = []
  }
  
  initManager() {
    debug('Initializing triggers')
    return new Promise((resolve, reject) => {
      Util.FileIO.readDataFile({ fileName: this.fileName })
        .then((data) => {
          const { triggers } = data
          if (triggers && Array.isArray(triggers)) {
            triggers.forEach(trigger => {
              console.log(trigger)
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
        data: this.triggers
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