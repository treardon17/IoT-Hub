const debug = require('debug')('RokuTV')
const Device = require('../core/device')
var parser = require('xml2json')
const wol = require('wake_on_lan')
const axios = require('axios')

class RokuTV extends Device {
  constructor({ id, name, ip }) {
    super({ type: Device.types.tv })
    this.power({ on: false })
  }

  get actions() {
    return {
      power: {
        desc: 'Toggle power of TV'
      }
    }
  }

  wakeup() {
    return new Promise((resolve, reject) => {
      wol.wake('1c:1e:e3:df:12:e6'.toUpperCase(), (error) => {
        if (error) {
          debug(error)
          reject(error)
        } else { resolve() }
      })
    })
  }

  powerKey() {
    return new Promise((resolve, reject) => {
      axios.post('http://192.168.0.198:8060/keypress/power').then(response => {
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
        // The TV is off, so we need to wake it up
        if (error.timeout && on) {
          console.log('waking up')
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
      axios.get('http://192.168.0.198:8060/query/device-info', { cancelToken: source.token }).then((response) => {
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

new RokuTV({ id: 'roku', name: 'roku', ip: '192.168.0.198' })