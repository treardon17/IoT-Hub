const Service = require('../core/types/service')
const YamahaReceiver = require('../devices/yamaha-receiver')
const Util = require('../util')
const debug = Util.Log('Service:YamahaService')

class YamahaService extends Service {
  constructor() {
    super({ name: 'yamaha', deviceClass: YamahaReceiver })
  }
}

module.exports = YamahaService