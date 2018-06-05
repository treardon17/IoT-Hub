const Util = require('../util')
const debug = Util.Log('Device:YamahaReceiver')
const Device = require('../core/types/device')
const axios = require('axios')
const Action = require('../core/types/action')

class YamahaReceiver extends Device {
  constructor({ id, ip, name, bulb = null, parentService }) {
    super({ id, ip, name, type: Device.types.amplifier, parentService })
  }
}

module.exports = YamahaReceiver