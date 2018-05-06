const Service = require('../core/types/service')
const RokuTV = require('../devices/roku-tv')
const Util = require('../util')
const debug = require('debug')('Service:RokuService')

class RokuService extends Service {
  constructor() {
    super({ name: 'roku', deviceClass: RokuTV })
  }

  setupActions() {
    this.actions.power = this.power.bind(this)
  }

  discoverDevices() {
    return new Promise((resolve, reject) => {
      try {
        Util.Network.getIPsOnNetworkOnPort(8060).then(ips => {
          debug(`Found ${ips.length} IPs`)

          let resolveCount = 0
          const checkResolve = () => {
            resolveCount += 1
            if (resolveCount === ips.length) {
              this.setShouldUpdateDevices()
              resolve()
            }
          }
          
          ips.forEach((ip, index) => {
            const tv = new RokuTV({ ip, name: `Roku-${index}` })
            tv.setExtraInfo().then(() => {
              tv.parentService = this
              this.deviceMap[tv.id] = tv
              checkResolve()
            }).catch((error) => {
              reject(error)
            })
          })
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  onDeviceExtraInfo({ id, device }) {
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