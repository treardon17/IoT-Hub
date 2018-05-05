const debug = require('debug')('App')
const Util = require('../util')
const Device = require('../core/types/device')
const Config = require('../config')
const _ = require('lodash')

class App {
  constructor() {
    this.services = {}
    this.shouldUpdateDevices = false
    this.setupDebounce()
    this.initialize()
  }

  setupDebounce() {
    this.notifyHooks = _.debounce(this.notifyHooksOfDeviceChange.bind(this), 1000)
  }

  get devices() {
    if (this.shouldUpdateDevices || !this._devices) {
      let devices = []
      // Go through all of the services and aggregate
      // a complete list of devices available
      Object.keys(this.services).forEach((serviceName) => {
        const service = this.services[serviceName]
        devices = [...devices, ...service.devices]
      })
      // Hang on to the previous state of devices so we
      // can see any new devices that have been added
      this._prevDevices = (this._devices || []).slice()
      // Set the new value of devices here
      this._devices = devices
      // We don't want to update this again unless we have to
      // --> the child services will set this value to true
      // if they find a new device
      this.shouldUpdateDevices = false
    }
    return this._devices
  }

  get previousDevices() {
    return this._prevDevices || []
  }

  getDevicesOfType(type) {
    return this.devices.filter(device => {
      if (device.type === type) {
        return device
      }
    })
  }

  // ------------------------------
  // HELPERS ----------------------
  // ------------------------------
  onChildDevicesUpdate() {
    // Next time `this.devices` gets used, it will update
    this.shouldUpdateDevices = true
    this.notifyHooks()
  }

  notifyHooksOfDeviceChange() {
    const newDevices = _.differenceBy(this.devices, this.previousDevices, 'id')
    Object.keys(this.hooks).forEach((key) => {
      const hook = this.hooks[key]
      if (typeof hook.devicesChanged === 'function') {
        hook.devicesChanged({ newDevices })
      }
    })
  }

  // ------------------------------
  // INITIALIZATION ---------------
  // ------------------------------
  initialize() {
    this.initializeItem('services')
    this.initializeItem('hooks')
    this.startHooks()
  }

  initializeItem(key) {
    // Look through the configuration file for the key specified
    // and then initialize the items in that array if it exists
    if (Config && Config[key] && Array.isArray(Config[key])) {
      // Construct the application from those values in the config
      this[key] = {}
      Config[key].forEach((item) => {
        const itemName = item.name.toLowerCase()
        if (!this[key][itemName]) {
          // Grab the corresponding classes from the files and create an instance of them
          const ItemDefinition = require(`../${key}/${item.filename}`)
          const itemInstance = new ItemDefinition({ token: Config.token })
          // Set the item's parent application so it has access to all the devices
          itemInstance.application = this
          this[key][itemName] = itemInstance
          debug(`Initializing ${key} -- ${item.name}`)
        } else {
          debug(`${key} "${itemName}" already exists`)
        }
      })
    }
  }

  startHooks() {
    Object.keys(this.hooks).forEach(key => {
      const hook = this.hooks[key]
      hook.start()
    })
  }
}

module.exports = App