const Observer = require('../util/observer')

class App {
  constructor() {
    this.setDevices()
    this.setServices()
    this.setHooks()
  }

  // /////////////////
  // Setup ///////////
  // /////////////////

  /**
   * @function setDevices
   * Creates an observable object containing the different devices in the application.
   * This object will be populated by the different services loaded in.
   */
  setDevices() {
    this.devices = new Observer({ onSet: this.onModifyDevices.bind(this) })
  }

  setServices() {
    this.services = new Observer({ onSet: this.onModifyServices.bind(this) })
  }

  setHooks() {}

  // /////////////////
  // Events //////////
  // /////////////////

  onModifyDevices(params) {
    console.log('onModifyDevices', params)
  }

  onModifyServices(params) {
    console.log('onModifyServices', params)
  }
}

module.exports = App
