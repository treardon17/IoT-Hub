const Service = require('../core/types/service')
const RokuTV = require('../devices/roku-tv')
const Util = require('../util')
const debug = Util.Log('Service:RokuService')

class RokuService extends Service {
  constructor({ app }) {
    super({ app, name: 'roku', deviceClass: RokuTV })
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
            const append = index > 0 ? index : ''
            const tv = new this.deviceClass({ ip, name: `TV${append}`, parentService: this })
            tv.setExtraInfo().then(() => {
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
}

module.exports = RokuService