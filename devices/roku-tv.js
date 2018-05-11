const Util = require('../util')
const debug = Util.Log('Device:RokuTV')
const Device = require('../core/types/device')
var parser = require('xml2json')
const wol = require('wake_on_lan')
const axios = require('axios')
const Action = require('../core/types/action')

class RokuTV extends Device {
  constructor({ id, name, ip, mac }) {
    super({ id, name, ip, type: Device.types.tv })
    this.mac = (mac || '').toUpperCase()
    this.port = 8060
    this.setExtraInfo()
  }

  get baseURL() {
    return `http://${this.ip}:${this.port}`
  }

  createActions() {
    return {
      power: new Action({
        desc: 'Toggle power of TV',
        execute: this.power.bind(this),
        status: this.getPowerState.bind(this),
        type: Action.types.switch
      })
    }
  }

  // ------------------------
  // HELPER FUNCTIONS -------
  // ------------------------
  setExtraInfo() {
    return this.info().then(info => {
      this.mac = (info['device-info']['wifi-mac'] || '').toUpperCase()
      if (this.parentService && typeof this.parentService.onDeviceExtraInfo === 'function') {
        this.parentService.onDeviceExtraInfo({ id: this.id, device: this })
      }
    }).catch(error => {
      debug(error)
    })
  }

  wakeup() {
    return new Promise((resolve, reject) => {
      wol.wake(this.mac, (error) => {
        if (error) {
          debug(error)
          reject(error)
        } else { resolve() }
      })
    })
  }

  powerKey() {
    return new Promise((resolve, reject) => {
      axios.post(`${this.baseURL}/keypress/power`).then(response => {
        resolve(response)
      }).catch(err => {
        debug('ERROR', err)
        reject(err)
      })
    })
  }

  // ------------------------
  // ACTIONS ----------------
  // ------------------------
  power(on) {
    return new Promise((resolve, reject) => {
      this.info().then(info => {
        const powerMode = info['device-info']['power-mode']
        // If the display is off, and we want to turn on the tv
        if (on && powerMode !== 'PowerOn') {
          this.powerKey()
            .then(resolve)
            .catch(reject)
        } else if (!on && powerMode === 'PowerOn') {
          // The TV display is on, and we want to turn it off
          this.powerKey()
            .then(resolve)
            .catch(reject)
        }
      }).catch(error => {
       debug('error', error)
        // The TV is off, so we need to wake it up
        if (error.timeout && on) {
          this.wakeup()
            .then(resolve)
            .catch(reject)
        }
      })
    })
  }

  // ------------------------
  // GETTERS ----------------
  // ------------------------
  getPowerState() {
    return new Promise(resolve => {
      this.info().then(info => {
        const powerMode = info['device-info']['power-mode']
        // If the display is off
        if (powerMode !== 'PowerOn') {
          resolve(false)
        } else if (powerMode === 'PowerOn') {
          // The TV display is on
          resolve(true)
        }
      }).catch(error => {
        debug('error', error)
        // The TV is off
        if (error.timeout) {
          resolve(false)
        }
      })
    })
  }

  info() {
    return new Promise((resolve, reject) => {
      const source = axios.CancelToken.source()
      const timeout = setTimeout(() => {
        source.cancel()
        reject({ error: 'Request timed out.', timeout: true, reason: 'Device not awake.' })
      }, 3000)
      axios.get(`${this.baseURL}/query/device-info`, { cancelToken: source.token }).then((response) => {
        try {
          const info = parser.toJson(response.data)
          const obj = JSON.parse(info)
          clearTimeout(timeout)
          resolve(obj)
        } catch (error) {
          clearTimeout(timeout)
          reject({ error, timeout: false })
        }
      }).catch(error => {
        clearTimeout(timeout)
        reject({ error, timeout: false })
      })
    })
  }
}

module.exports = RokuTV