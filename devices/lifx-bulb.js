const debug = require('debug')('Device:LifxBulb')
const Device = require('../core/types/device')
const Action = require('../core/types/action')

class LifxBulb extends Device {
  constructor({ id, ip, name, bulb = null }) {
    super({ id, ip, name, type: Device.types.light })
    this.bulb = bulb
    this.lightState = {}
    this.defaultTransition = 2000
  }

  createActions() {
    return {
      power: new Action({
        desc: "Power on/off lights",
        execute: this.power.bind(this),
        status: this.getPowerState.bind(this),
        type: Action.types.switch
      }),
      color: new Action({
        desc: "Change color of lights",
        execute: this.color.bind(this),
        status: this.getColorState.bind(this),
        type: Action.types.hue
      })
    }
  }

  // ------------------------
  // HELPER FUNCTIONS -------
  // ------------------------
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

  // ------------------------
  // GETTERS ----------------
  // ------------------------
  getLightState() {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        this.bulb.getState((error, data) => {
          if (error) { reject(error) }
          else {
            this.lightState = data
            resolve(data)
          }
        })
      } else {
        reject({ error: `"getLightState": Light ${this.id} does not exist` })
      }
    })
  }

  getPowerState() {
    return new Promise((resolve, reject) => {
      this.getLightState().then((state) => {
        const powerState = state.power ? true : false
        resolve(powerState)
      }).catch(reject)
    })
  }

  getColorState() {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }


  // ------------------------
  // ACTIONS ----------------
  // ------------------------
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
        reject({ error: `"power": Light ${this.id} does not exist` })
      }
    })
  }

  colorRGB({ red = 255, green = 255, blue = 255 } = {}) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        debug('Changing color', light.name, this.id, this.ip)
        this.bulb.colorRgb(red, green, blue, this.defaultTransition, resolve)
      } else {
        reject({ error: `"colorRGB": Light ${this.id} does not exist` })
      }
    })
  }

  color({ hue, saturation, brightness, kelvin }) {
    return new Promise((resolve, reject) => {
      if (this.bulb) {
        this.bulb.getState((state) => {
          hue = hue ? self.maxMin({ min: 0, max: 360, name: 'hue', value: hue }) : state.hue
          saturation = saturation ? self.maxMin({ min: 0, max: 100, name: 'saturation', value: saturation }) : state.saturation
          brightness = brightness ? self.maxMin({ min: 0, max: 100, name: 'brightness', value: brightness }) : state.brightness
          kelvin = kelvin ? self.maxMin({ min: 2500, max: 9000, name: 'kelvin', value: kelvin }) : state.kelvin
          light.color(hue, saturation, brightness, kelvin, this.defaultTransition, resolve)
        })
      } else {
        reject({ error: `"color": Light ${this.id} does not exist` })
      }
    })
  }
}

module.exports = LifxBulb