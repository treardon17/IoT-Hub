const Service = require('../core/service')
const RokuTV = require('../devices/roku-tv')
const Util = require('../util')
const debug = require('debug')('RokuService')

class RokuService extends Service {
  constructor() {
    super()
    this.rokuDevices = {}
    this.discoverDevices()
  }

  get devices() {
    if (!this._devices || this._devices.length === 0) {
      this._devices = Object.keys(this.rokuDevices).map((device) => this.rokuDevices[device])
    }
    return this._devices
  }

  discoverDevices() {
    Util.NetworkUtil.getIPsOnNetworkOnPort(8060).then((ips) => {
      ips.forEach((ip, index) => {
        const id = Util.IDUtil.guid()
        this.rokuDevices[id] = new RokuTV({ id, ip, name: `Roku-${index}` })
      })
    })
  }
}

module.exports = RokuService