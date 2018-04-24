const debug = require('debug')('App')
const Util = require('../util')
const Config = require('../config')

class App {
  constructor() {
    this.services = {}
    this.initialize()

    setTimeout(() => {
      console.log(this.devices)
    }, 3000)
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
    return this.devices.map(device => {
      if (device.type === type) {
        return device
      }
    })
  }

  // INITIALIZATION ---------------
  initialize() {
    this.initServices()
  }

  initServices() {
    if (Config && Config.services) {
      Config.services.forEach((service) => {
        if (!this.services[service]) {
          const ServiceDef = require(`../services/${service.filename}`)
          this.services[service.name] = new ServiceDef()
          debug(`Initializing -- ${service.name}`)
        } else {
          debug(`Service "${service}" already exists`)
        }
      })
    }
  }

}

module.exports = App