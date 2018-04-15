const debug = require('debug')('LifxBulb')
const Device = require('../core/device')

class LifxBulb extends Device {
  constructor({ id, name, bulb = {} }) {
    super({ id, name, type: Device.types.light, ip: bulb.address })
    this.bulb = bulb
    this.defaultTransition = 2000
  }

  power({ duration, on = true } = {}) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        if (on) {
          debug('Turning on', this.name, this.id, this.ip)
          this.bulb.on(duration || this.defaultTransition, resolve)
        } else {
          debug('Turning off', this.name, this.id, this.ip)
          this.bulb.off(duration || this.defaultTransition, resolve)
        }
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }

  color({ duration, red = 255, green = 255, blue = 255 } = {}) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        debug('Changing color', light.name, this.id, this.ip)
        this.bulb.colorRgb(red, green, blue, duration || this.defaultTransition, resolve)
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }
}

module.exports = LifxBulb