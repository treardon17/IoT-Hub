const Service = require('../core/service')
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
        let bulb = new LifxBulb({ id: light.id, ip: light.address, name: label, bulb: light })
        bulb.parentService = this
        this.deviceMap[light.id] = bulb
        this.saveDevices()
        this.setShouldUpdateDevices()
        debug('Added light:', label, light.id, light.address)
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

  power({ duration, on = true, stagger = 0 } = {}) {
    return this.performAction({
      duration,
      stagger,
      action: 'power',
      stagger, 
      params: { on }
    }).catch(error => { debug(error) })
  }

  color({ id, duration, stagger, red, green, blue } = {}) {
    return this.performAction({
      duration,
      stagger,
      action: 'color',
      stagger,
      params: { red, green, blue }
    }).catch(error => { debug(error) })
  }
}

module.exports = LifxService
