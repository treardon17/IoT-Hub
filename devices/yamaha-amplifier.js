const Util = require('../util')
const debug = Util.Log('Device:YamahaAmplifier')
const Device = require('../core/types/device')
const axios = require('axios')
const Action = require('../core/types/action')

class YamahaAmplifier extends Device {
  constructor({ id, ip, name, receiver = null, parentService }) {
    super({ id, ip, name, type: Device.types.amplifier, parentService })
    this.receiver = receiver
  }

  createActions() {
    return {
      power: new Action({
        desc: 'Power on/off amplifier',
        execute: this.power.bind(this),
        status: this.getPowerState.bind(this),
        type: Action.types.switch
      }),
      hdmi1: new Action({
        desc: 'Change input of amplifier to HDMI 1',
        execute: this.setInputHDMI1.bind(this),
        status: this.isInputHDMI1.bind(this),
      }),
      input: new Action({
        desc: 'Change input of amplifier',
        execute: this.input.bind(this),
        status: this.getInputState.bind(this),
      })
    }
  }

  // ------------------------
  // ACTIONS ----------------
  // ------------------------
  power(on) {
    if (on) {
      return this.receiver.powerOn()
    } else {
      return this.receiver.powerOff()
    }
  }

  volume(level) {
    return new Promise((resolve, reject) => {
      this.receiver.setVolumeTo(level)
        .then(resolve)
    })
  }

  mute(on) {
    if (on) {
      return this.receiver.muteOn()
    } else {
      return this.receiver.muteOff()
    }
  }

  input(input) {
    return this.receiver.setMainInputTo(input)
  }

  setInputHDMI1() {
    return this.input('HDMI 1')
  }

  isInputHDMI1() {
    return new Promise((resolve, reject) => {
      this.getInputState()
        then(input => {
          resolve(input === 'HDMI 1')
        })
    })
  }

  // ------------------------
  // GETTERS ----------------
  // ------------------------
  getPowerState() {
    return this.receiver.isOn()
  }

  getInputState() {
    return new Promise((resolve, reject) => {
      this.getInfo()
        .then(info => {
          resolve(info.currentInput)
        })
    })
  }

  getInfo() {
    return new Promise((resolve, reject) => {
      //Get Info
      this.receiver.getBasicInfo().done((basicInfo) => {
        const info = {
          volume: basicInfo.getVolume(),
          muted: basicInfo.isMuted(),
          poweredOn: basicInfo.isOn(),
          poweredOff: basicInfo.isOff(),
          currentInput: basicInfo.getCurrentInput(),
          partyModeEnabled: basicInfo.isPartyModeEnabled(),
          pureDirectEnabled: basicInfo.isPureDirectEnabled(),
          bass: basicInfo.getBass(),
          treble: basicInfo.getTreble(),
          subwooferTrim: basicInfo.getSubwooferTrim(),
          dialogueLift: basicInfo.getDialogueLift(),
          dialogueLevel: basicInfo.getDialogueLevel(),
          YPAOVolumeEnabled: basicInfo.isYPAOVolumeEnabled(),
          extraBassEnabled: basicInfo.isExtraBassEnabled(),
          adaptiveDRCEnabled: basicInfo.isAdaptiveDRCEnabled()
        }
        resolve(info)
      })
    })
  }
}
module.exports = YamahaAmplifier