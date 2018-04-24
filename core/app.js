const debug = require('debug')('App')
const Util = require('../util')
const Config = require('../config')

class App {
  constructor() {
    this.services = {}
    this.start()

    setTimeout(() => {
      console.log(this.devices)
    }, 3000)
  }

  get devices() {
    let devices = []
    Object.keys(this.services).forEach((serviceName) => {
      const service = this.services[serviceName]
      devices = [...devices, ...service.devices]
    })
    return devices
  }

  start() {
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