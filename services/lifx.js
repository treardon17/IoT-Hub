const Service = require('../core/types/service')
const LifxBulb = require('../devices/lifx-bulb')
const LifxClient = require('node-lifx').Client
const Util = require('../util')
const debug = Util.Log('Service:LifxService')

class LifxService extends Service {
  constructor() {
    super({ name: 'lifx', deviceClass: LifxBulb, loadDevicesFromFile: false })
    this.defaultTransition = 1000
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
        let bulb = new this.deviceClass({ ip: light.address, name: label, bulb: light, parentService: this })
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
}

module.exports = LifxService
