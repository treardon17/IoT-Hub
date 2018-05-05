const debug = require('debug')('Device:LifxBulb')
const Device = require('../core/types/device')
const Action = require('../core/types/action')

class LifxBulb extends Device {
  constructor({ id, ip, name, bulb = {} }) {
    super({ id, ip, name, type: Device.types.light })
    this.bulb = bulb
    this.defaultTransition = 2000
  }

  createActions() {
    return {
      power: new Action({
        desc: "Power on/off lights",
        func: this.power.bind(this),
        type: Action.types.switch
      }),
      color: new Action({
        desc: "Change color of lights",
        func: this.color.bind(this),
        type: Action.types.hue
      })
    }
  }

  // HELPER FUNCTIONS
  maxMin({ max, min, name, value }) {
    let newVal = null
    if (value < min) {
      newVal = min
      debug(`Cannot have a ${name} less than ${value}. Setting to ${value}.`)
    } else if (value > max) {
      newVal = max
      debug(`Cannot have a ${name} greater than ${value}. Setting to ${value}.`)
    } else {
      newVal = value
    }
    return newVal
  }

  power(on) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        if (on && typeof this.bulb.on === 'function') {
          debug('Turning on', this.name, this.id, this.ip)
          this.bulb.on(this.defaultTransition, resolve)
        } else if (typeof this.bulb.off === 'function') {
          debug('Turning off', this.name, this.id, this.ip)
          this.bulb.off(this.defaultTransition, resolve)
        } else {
          debug(`The bulb in "${this.name}" did not initialize. Aborting...`)
          reject({ error: `Light ${this.id} did not initialize` })
        }
      } else {
        reject({ error: `Light ${this.id} does not exist` })
      }
    })
  }

  colorRGB({ red = 255, green = 255, blue = 255 } = {}) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        debug('Changing color', light.name, this.id, this.ip)
        this.bulb.colorRgb(red, green, blue, this.defaultTransition, resolve)
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }

  color({ hue, saturation, brightness, kelvin }) {
    return new Promise((resolve) => {
      this.bulb.getState((state) => {
        hue = hue ? self.maxMin({ min: 0, max: 360, name: 'hue', value: hue }) : state.hue
        saturation = saturation ? self.maxMin({ min: 0, max: 100, name: 'saturation', value: saturation }) : state.saturation
        brightness = brightness ? self.maxMin({ min: 0, max: 100, name: 'brightness', value: brightness }) : state.brightness
        kelvin = kelvin ? self.maxMin({ min: 2500, max: 9000, name: 'kelvin', value: kelvin }) : state.kelvin
        light.color(hue, saturation, brightness, kelvin, this.defaultTransition, resolve)
      })
    })
  }
}

module.exports = LifxBulb