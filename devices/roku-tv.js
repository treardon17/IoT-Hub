const debug = require('debug')('RokuTV')
const Device = require('../core/device')
var parser = require('xml2json')
const wol = require('wake_on_lan')
const axios = require('axios')

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

  get actions() {
    return {
      power: { desc: 'Toggle power of TV' }
    }
  }

  setExtraInfo() {
    this.info().then(info => {
      this.mac = (info['device-info']['wifi-mac'] || '').toUpperCase()
      this.id = (info['device-info']['device-id'] || '').toUpperCase()
      if (this.parentService && typeof this.parentService.onDeviceExtraInfo === 'function') {
        this.parentService.onDeviceExtraInfo()
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

  power({ on = true } = {}) {
    return new Promise((resolve, reject) => {
      this.info().then(info => {
        const powerMode = info['device-info']['power-mode']
        // If the display is off, and we want to turn on the tv
        if (on && powerMode !== 'PowerOn') {
          this.powerKey()
        } else if (!on && powerMode === 'PowerOn') {
          // The TV display is on, and we want to turn it off
          this.powerKey()
        }
      }).catch(error => {
       debug('error', error)
        // The TV is off, so we need to wake it up
        if (error.timeout && on) {
          this.wakeup()
        }
      })
    })
  }

  info() {
    return new Promise((resolve, reject) => {
      const source = axios.CancelToken.source()
      setTimeout(() => {
        debug('Device is not awake. Cancelling request.')
        source.cancel()
        reject({ error: 'Request timed out.', timeout: true })
      }, 3000)
      axios.get(`${this.baseURL}/query/device-info`, { cancelToken: source.token }).then((response) => {
        try {
          const info = parser.toJson(response.data)
          const obj = JSON.parse(info)
          resolve(obj)
        } catch (error) {
          reject({ error, timeout: false })
        }
      }).catch(error => reject({ error, timeout: false }))
    })
  }
}

module.exports = RokuTV