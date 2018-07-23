const Util = require('../util')
const debug = Util.Log('App')
const Device = require('../core/types/device')
const Config = require('../config')
const TaskManager = require('../core/managers/task-manager')
const TriggerManager = require('../core/managers/trigger-manager')
const _ = require('lodash')

class App {
  constructor() {
    this.services = {}
    this.shouldUpdateDevices = false
    this.config = Object.freeze(Config)
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
      // Get all of the task devices from the task manager
      // and add them to the list of total devices as well
      devices = [...devices, ...this.taskManager.taskDevices]
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

  getDevicesOfService(service) {
    return this.devices.filter(device => {
      const parentName = Util.Object.getNestedElement({ obj: device, keys: ['parentService', 'name'] })
      if (parentName === service) {
        return device
      }
    })
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
    // create managers
    this.taskManager = new TaskManager({ app: this })
    this.triggerManager = new TriggerManager({ app: this })
    // initialize
    this.initializeItem('services')
    this.initializeItem('hooks')
    // start
    this.startItem('hooks')
  }

  initializeItem(key) {
    // Look through the configuration file for the key specified
    // and then initialize the items in that array if it exists
    if (this.config && this.config[key] && Array.isArray(this.config[key])) {
      // Construct the application from those values in the config
      this[key] = {}
      this.config[key].forEach((item) => {
        const itemID = item.id || item.fileName
        if (!this[key][itemID]) {
          // Grab the corresponding classes from the files and create an instance of them
          const ItemDefinition = require(`../${key}/${item.fileName}`)
          if (ItemDefinition) {
            const itemInstance = new ItemDefinition({ token: this.config.token, app: this })
            this[key][itemID] = itemInstance
            debug(`Initializing ${key} -- ${item.id}`)
          } else {
            debug(`No file named "${item.fileName}" in the "${key}" directory`)
          }
        } else {
          debug(`${key} "${itemID}" already exists`)
        }
      })
    }
  }
  
  startItem(key) {
    const item = this[key]
    if (item) {
      Object.keys(item).forEach(key => {
        item[key].start()
      })
    } else {
      debug(`startItem: Could not find "${key}" in app`)
    }
  }
}

module.exports = App