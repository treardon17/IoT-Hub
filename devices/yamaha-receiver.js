const Util = require('../util')
const debug = Util.Log('Device:YamahaReceiver')
const Device = require('../core/types/device')
const axios = require('axios')
const Action = require('../core/types/action')

class YamahaReceiver extends Device {
  constructor({ id, ip, name, receiver = null, parentService }) {
    super({ id, ip, name, type: Device.types.amplifier, parentService })
    this.receiver = receiver
  }

  createActions() {
    return {
      power: new Action({
        desc: "Power on/off receiver",
        execute: this.power.bind(this),
        status: this.getPowerState.bind(this),
        type: Action.types.switch
      })
    }
  }

  getPowerState() {
    return this.receiver.isOn()
  }

  power(on) {
    if (on) {
      return this.receiver.powerOn()
    } else {
      return this.receiver.powerOff()
    }
  }
}

module.exports = YamahaReceiver