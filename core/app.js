const debug = require('debug')('App')
const Util = require('../util')
const Device = require('../core/device')
const Config = require('../config')

class App {
  constructor() {
    this.services = {}
    this.initialize()
  }

  // GETTERS --------------------
  get devices() {
    let devices = []
    Object.keys(this.services).forEach((serviceName) => {
      const service = this.services[serviceName]
      devices = [...devices, ...service.devices]
    })
    return devices
  }

  getDevicesOfType(type) {
    return this.devices.filter(device => {
      if (device.type === type) {
        return device
      }
    })
  }

  // INITIALIZATION ---------------
  initialize() {
    this.initializeItem('services')
    this.initializeItem('hooks')
  }

  initializeItem(key) {
    if (Config && Config[key]) {
      this[key] = {}
      Config[key].forEach((item) => {
        if (!this[key][item]) {
          const ItemDefinition = require(`../${key}/${item.filename}`)
          this[key][item.name] = new ItemDefinition()
          debug(`Initializing -- ${item.name}`)
        } else {
          debug(`${key} "${item}" already exists`)
        }
      })
    }
  }
}

module.exports = App