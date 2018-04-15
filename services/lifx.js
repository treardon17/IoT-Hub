const Service = require('../core/service')
const LifxBulb = require('../devices/lifx-bulb')
const LifxClient = require('node-lifx').Client
const debug = require('debug')('LifxService')

class LifxPlugin extends Service {
  constructor() {
    super()
    this.lights = {}
    this.defaultTransition = 2000
    this.client = new LifxClient()
    this.setupListeners()
    this.client.init()

    // setTimeout(() => {
    //   // console.log(this.devices)
    //   this.performActionAll({ action: 'power', params: { on: false } })
    // }, 4000)
  }

  // GETTERS ------------
  get devices() {
    const deviceKeys = Object.keys(this.lights)
    const currentDeviceCount = deviceKeys.length
    const cachedDeviceCount = this._devices ? this._devices.length : 0
    if (currentDeviceCount > cachedDeviceCount || !this._devices) {
      this._devices = deviceKeys.map(key => this.lights[key])
    }
    return this._devices
  }

  // LISTENERS ------------
  setupListeners() {
    this.client.on('light-new', this.onNewLight.bind(this))
  }

  onNewLight(light) {
    light.getLabel((error, label) => {
      if (!error) {
        let bulb = new LifxBulb({ id: light.id, name: label, bulb: light })
        this.lights[light.id] = bulb
        debug('Added light:', label, light.id, light.address)
      } else {
        debug('Error adding light --> could not fetch label')
      }
    })
  }

  // HELPERS ------------
  getLight(id) {
    const light = this.lights[id]
    if (light) {
      return light
    } else {
      debug('Light with ID', `"${id}"`, 'does not exist')
      return null
    }
  }

  powerAll({ duration, on = true, stagger = 0 } = {}) {
    return this.performActionAll({
      duration,
      stagger,
      action: 'power',
      stagger, 
      params: { on }
    })
  }

  colorAll({ id, duration, stagger, red, green, blue } = {}) {
    return this.performActionAll({
      duration,
      stagger,
      action: 'color',
      stagger,
      params: { red, green, blue }
    })
  }
}

module.exports = LifxPlugin
