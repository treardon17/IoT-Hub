const Service = require('../core/service')
const RokuTV = require('../devices/roku-tv')
const Util = require('../util')
const debug = require('debug')('Service:RokuService')

class RokuService extends Service {
  constructor() {
    super({ name: 'roku', deviceClass: RokuTV })
  }

  initDevices() {
    this.initExistingDevices()
      .then(this.discoverDevices.bind(this))
      .then(this.saveDevices.bind(this))
  }

  initExistingDevices() {
    return new Promise((resolve, reject) => {
      this.readData().then(data => {
        data.devices.forEach((device) => {
          this.deviceMap[device.id] = new RokuTV(device)
        })
        resolve()
      }).catch(reject)
    })
  }

  setupActions() {
    this.actions.power = this.power.bind(this)
  }

  discoverDevices() {
    return new Promise((resolve, reject) => {
      try {
        Util.Network.getIPsOnNetworkOnPort(8060).then(ips => {
          ips.forEach((ip, index) => {
            const id = Util.ID.guid()
            const tv = new RokuTV({ id, ip, name: `Roku-${index}` })
            tv.parentService = this
            this.deviceMap[id] = tv
            this.setShouldUpdateDevices()
          })
          resolve()
        })
      } catch (error) {
        reject(error)
      }   
    })
  }

  onDeviceExtraInfo({ existingID, id }) {
    const device = this.deviceMap[existingID]
    delete this.deviceMap[existingID]
    this.deviceMap[id] = device
    this.saveDevices()
  }

  // ACTIONS ------------
  power({ id, on, devices }) {
    if (id) {
      // Turn on specific device
      const device = this.deviceMap[id]
      device.power({ on })
    } else {
      // Turn on all devices
      this.performAction({ action: 'power', params: { on }, devices })
    }
  }
}

module.exports = RokuService