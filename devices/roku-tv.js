const debug = require('debug')('RokuTV')
const Device = require('../core/device')
var parser = require('xml2json')
const wol = require('wake_on_lan')
const axios = require('axios')

class RokuTV extends Device {
  constructor({ id, name, ip }) {
    super({ type: Device.types.tv })
    this.power({ on: true })
  }

  get actions() {
    return {
      power: {
        desc: 'Toggle power of TV'
      }
    }
  }

  power({ on = true } = {}) {
    return new Promise((resolve, reject) => {
      // this.info().then(info => {
      //   console.log(info)
      // }).catch(info => {
      //   console.log(info)
      // })
      if (on) {
        wol.wake('1c:1e:e3:df:12:e6'.toUpperCase(), (error) => {
          if (error) {
            debug(error)
            reject(error)
          } else { resolve() }
        })
      } else {
        axios.get('http://192.168.0.198:8060/keypress/power').then(response => {
          debug(response)
        }).catch(err => {
          debug('ERROR', err)
        })
      }
    })
  }

  info() {
    return new Promise((resolve, reject) => {
      axios.post('http://192.168.0.198:8060/query/device-info', { timeout: 2000 }).then((response) => {
        try {
          const info = parser.toJson(response.data)
          const obj = JSON.parse(info)
          resolve(obj)
        } catch (error) { reject(error) }
      }).catch(error => reject(error))
    })
  }
}

new RokuTV({ id: 'roku', name: 'roku', ip: '192.168.0.198' })