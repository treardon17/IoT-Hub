const debug = require('debug')('App')
const Util = require('../util')
const Device = require('../core/device')
const Config = require('../config')

class App {
  constructor() {
    this.services = {}
    this.devices = []
    this.initialize()
  }

  getDevicesOfType(type) {
    return this.devices.filter(device => {
      if (device.type === type) {
        return device
      }
    })
  }

  // HELPERS ----------------------
  getAllDevices() {
    let devices = []
    Object.keys(this.services).forEach((serviceName) => {
      const service = this.services[serviceName]
      devices = [...devices, ...service.devices]
    })
    return devices
  }

  onDevicesUpdate() {
    this.devices = this.getAllDevices()
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
        if (!this[key][item]) {
          const ItemDefinition = require(`../${key}/${item.filename}`)
          const itemInstance = new ItemDefinition()
          itemInstance.application = this
          this[key][item.name] = itemInstance
          debug(`Initializing ${key} -- ${item.name}`)
        } else {
          debug(`${key} "${item}" already exists`)
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