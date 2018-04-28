const debug = require('debug')('Device:LifxBulb')
const Device = require('../core/device')

class LifxBulb extends Device {
  constructor({ id, ip, name, bulb = {} }) {
    super({ id, ip, name, type: Device.types.light })
    this.bulb = bulb
    this.defaultTransition = 2000
  }

  get actions() {
    return {
      power: {
        desc: "Power on/off lights",
        func: this.power.bind(this)
      },
      color: {
        desc: "Change color of lights",
        func: this.color.bind(this)
      }
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

  power({ duration, on = true } = {}) {
    duration ? null : duration = this.defaultTransition
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        if (on && typeof this.bulb.on === 'function') {
          debug('Turning on', this.name, this.id, this.ip)
          this.bulb.on(duration, resolve)
        } else if (typeof this.bulb.off === 'function') {
          debug('Turning off', this.name, this.id, this.ip)
          this.bulb.off(duration, resolve)
        } else {
          debug(`The bulb in "${this.name}" did not initialize. Aborting...`)
        }
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }

  colorRGB({ duration, red = 255, green = 255, blue = 255 } = {}) {
    duration ? null : duration = this.defaultTransition
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        debug('Changing color', light.name, this.id, this.ip)
        this.bulb.colorRgb(red, green, blue, duration, resolve)
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }

  color({hue, saturation, brightness, kelvin, duration, callback}) {
    duration ? null : duration = this.defaultTransition
    return new Promise((resolve) => {
      this.bulb.getState((state) => {
        hue = hue ? self.maxMin({ min: 0, max: 360, name: 'hue', value: hue }) : state.hue
        saturation = saturation ? self.maxMin({ min: 0, max: 100, name: 'saturation', value: saturation }) : state.saturation
        brightness = brightness ? self.maxMin({ min: 0, max: 100, name: 'brightness', value: brightness }) : state.brightness
        kelvin = kelvin ? self.maxMin({ min: 2500, max: 9000, name: 'kelvin', value: kelvin }) : state.kelvin
        light.color(hue, saturation, brightness, kelvin, duration, resolve)
      })
    })
  }
}

module.exports = LifxBulb