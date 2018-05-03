const debug = require('debug')('App')
const Util = require('../util')
const Device = require('../core/types/device')
const Config = require('../config')

class App {
  constructor() {
    this.services = {}
    this.shouldUpdateDevices = false
    this.initialize()
  }

  get devices() {
    if (this.shouldUpdateDevices || !this._devices) {
      let devices = []
      Object.keys(this.services).forEach((serviceName) => {
        const service = this.services[serviceName]
        devices = [...devices, ...service.devices]
      })
      this._devices = devices
      this.shouldUpdateDevices = false
    }
    return this._devices
  }

  getDevicesOfType(type) {
    return this.devices.filter(device => {
      if (device.type === type) {
        return device
      }
    })
  }

  // HELPERS ----------------------
  onDevicesUpdate() {
    this.shouldUpdateDevices = true
  }

  // INITIALIZATION ---------------
  initialize() {
    this.initializeItem('services')
    this.initializeItem('hooks')
    this.startHooks()
  }

  initializeItem(key) {
    if (Config && Config[key] && Array.isArray(Config[key])) {
      this[key] = {}
      Config[key].forEach((item) => {
        const itemName = item.name.toLowerCase()
        if (!this[key][itemName]) {
          const ItemDefinition = require(`../${key}/${item.filename}`)
          const itemInstance = new ItemDefinition({ token: Config.token })
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