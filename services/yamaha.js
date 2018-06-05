const Service = require('../core/types/service')
const YamahaReceiver = require('../devices/yamaha-receiver')
const Util = require('../util')
const debug = Util.Log('Service:YamahaService')
const Yamaha = require('yamaha-nodejs')

class YamahaService extends Service {
  constructor() {
    super({ name: 'yamaha', deviceClass: YamahaReceiver })
  }

  discoverDevices() {
    // this is only set up for one device on the network currently
    return new Promise((resolve, reject) => {
      const yamahaAmp = new Yamaha()
      const id = 'yamaha'
      this.deviceMap[id] = new YamahaReceiver({ id, name: id, receiver: yamahaAmp, parentService: this })
      this.saveDevices()
      this.setShouldUpdateDevices()
      debug('Added Yamaha amplifier')
    })
  }
}

module.exports = YamahaService