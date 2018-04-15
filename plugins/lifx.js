const PluginBase = require('../core/plugin-base')
const LifxClient = require('node-lifx').Client
const debug = require('debug')('LifxPlugin')

class LifxPlugin extends PluginBase {
  constructor() {
    super()
    this.lights = {}
    this.defaultTransition = 2000
    this.client = new LifxClient()
    this.setupListeners()
    this.client.init()
  }

  // LISTENERS ------------
  setupListeners() {
    this.client.on('light-new', this.onNewLight.bind(this))
  }

  onNewLight(light) {
    light.getLabel((error, label) => {
      this.lights[light.id] = light
      if (!error) {
        this.lights[light.id].label = label
        debug('Added light:', label, light.id, light.address)
      } else {
        debug('Error adding light')
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

  // ACTIONS ------------
  performActionAll({ action = '', duration, stagger, params = {} } = {}) {
    return new Promise((resolve, reject) => {
      if (this.lights) {
        const keys = Object.keys(this.lights)
        // Keep track of how many lights we're trying to modify
        let completeCount = 0
        const checkResovle = () => {
          completeCount += 1
          if (completeCount === keys.length) { resolve() }
        }
        let staggerAmt = stagger
        const actionMethod = this[action].bind(this)
        // If we're performing a valid action
        if (typeof actionMethod === 'function') {
          // Perform that action on every light
          keys.forEach((key) => {
            const light = this.lights[key]
            setTimeout(() => {
              actionMethod({ id: key, ...params })
              staggerAmt += stagger
            }, staggerAmt)
          })
        } else {
          debug(`Action: ${action} is not a valid function`)
          reject()
        }
      } else {
        debug('Object of lights does not exist')
        reject()
      }
    })
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

  power({ id = '', duration, on = true } = {}) {
    return new Promise((resolve, reject) => {
      const light = this.getLight(id)
      if (light) {
        if (on) {
          debug('Turning on', light.label, light.id, light.address)
          light.on(duration || this.defaultTransition, resolve)
        } else {
          debug('Turning off', light.label, light.id, light.address)
          light.off(duration || this.defaultTransition, resolve)
        }
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
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

  color({ id, duration, red = 255, green = 255, blue = 255 } = {}) {
    return new Promise((resolve, reject) => {
      const light = this.getLight(id)
      if (light) {
        debug('Changing color', light.label, light.id, light.address)
        light.colorRgb(red, green, blue, duration || this.defaultTransition, resolve)
      } else {
        reject({ error: `Light ${id} does not exist` })
      }
    })
  }
}

module.exports = LifxPlugin
