const Service = require('../core/types/service')
const LifxBulb = require('../devices/lifx-bulb')
const LifxClient = require('node-lifx').Client
const debug = require('debug')('Service:LifxService')

class LifxService extends Service {
  constructor() {
    super({ name: 'lifx', deviceClass: LifxBulb })
    this.defaultTransition = 2000
  }

  // INITIALIZATION
  setupActions() {
    this.actions.power = this.power.bind(this)
    this.actions.color = this.color.bind(this)
    this.actions.getLight = this.getLight.bind(this)
  }

  // LISTENERS ------------
  discoverDevices() {
    return new Promise((resolve, reject) => {
      this.client = new LifxClient()
      this.client.on('light-new', this.onNewLight.bind(this))
      this.client.init()
      // Lets wait a few seconds before we quit trying to discover devices
      setTimeout(() => { resolve() }, 3000)
    })
  }

  onNewLight(light) {
    light.getLabel((error, label) => {
      if (!error) {
        let bulb = new LifxBulb({ ip: light.address, name: label, bulb: light })
        bulb.parentService = this
        this.deviceMap[bulb.id] = bulb
        this.saveDevices()
        this.setShouldUpdateDevices()
        debug('Added light:', label, bulb.id, light.address)
      } else {
        debug('Error adding light --> could not fetch label', error)
      }
    })
  }

  // ACTIONS ------------
  getLight(id) {
    const light = this.deviceMap[id]
    if (light) {
      return light
    } else {
      debug('Light with ID', `"${id}"`, 'does not exist')
      return null
    }
  }

  power({ device, value }) {
    return this.performAction({
      duration: this.defaultTransition,
      device,
      action: 'power',
      params: value
    })
  }

  color({ device, red, green, blue } = {}) {
    return this.performAction({
      duration: this.defaultTransition,
      device,
      action: 'color',
      params: { red, green, blue }
    })
  }
}

module.exports = LifxService
