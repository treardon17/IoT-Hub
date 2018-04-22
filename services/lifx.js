const Service = require('../core/service')
const LifxBulb = require('../devices/lifx-bulb')
const LifxClient = require('node-lifx').Client
const debug = require('debug')('LifxService')

class LifxService extends Service {
  constructor() {
    super({ name: 'lifx' })
    this.lights = {}
    this.defaultTransition = 2000
    this.client = new LifxClient()
    this.discoverDevices()
    this.client.init()
  }

  // GETTERS ------------
  get devices() {
    const deviceKeys = Object.keys(this.lights)
    const currentDeviceCount = deviceKeys.length
    const cachedDeviceCount = this._devices ? this._devices.length : 0
    if (currentDeviceCount > cachedDeviceCount || !this._devices) {
      this._devices = deviceKeys.map(key => {
        return this.lights[key]
      })
    }
    return this._devices
  }

  // LISTENERS ------------
  discoverDevices() {
    this.client.on('light-new', this.onNewLight.bind(this))
  }

  onNewLight(light) {
    light.getLabel((error, label) => {
      if (!error) {
        let bulb = new LifxBulb({ id: light.id, name: label, bulb: light })
        bulb.parentService = this
        this.lights[light.id] = bulb
        this.saveDevices()
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

  powerDevices({ duration, on = true, stagger = 0 } = {}) {
    return this.performAction({
      duration,
      stagger,
      action: 'power',
      stagger, 
      params: { on }
    }).catch(error => { debug(error) })
  }

  colorDevices({ id, duration, stagger, red, green, blue } = {}) {
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
