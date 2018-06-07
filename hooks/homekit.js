const Util = require('../util')
const debug = Util.Log('Hook:Homekit')
const HAPNodeJS = require('hap-nodejs')
const Hook = require('../core/types/hook')
const fs = require('fs')
const path = require('path')
const storage = require('node-persist')
const { Accessory, Service, Characteristic, Bridge, uuid } = HAPNodeJS
const qrcode = require('qrcode-terminal')
const Device = require('../core/types/device')
const Action = require('../core/types/action')

class HomeKit extends Hook {
  constructor() {
    super()
    this.username = 'CC:22:3D:E3:CE:F7'
    this.pincode = '031-45-154'
    this.port = 51826
    this.accessoryMap = {}
    this.setDeviceMappings()
    this.setActionMappings()
  }

  setDeviceMappings() {
    debug('Setting device mappings')
    this.deviceTypeMapping = {
      [Device.types.light]: Service.Lightbulb,
      [Device.types.tv]: Service.Switch,
      [Device.types.task]: Service.Switch,
      [Device.types.amplifier]: Service.Switch
    }
  }

  setActionMappings() {
    debug('Setting action mappings')
    this.deviceActionMapping = {
      [Action.types.switch]: Characteristic.On,
      [Action.types.hue]: Characteristic.Hue,
      [Action.types.brightness]: Characteristic.Brightness,
      [Action.types.volume]: Characteristic.Volume,
      [Action.types.mute]: Characteristic.Mute,
    }
  }

  start() {
    debug('HAP-NodeJS starting...')
    // Initialize our storage system
    storage.initSync()
    // Start by creating our Bridge which will host all loaded Accessories
    this.bridge = new Bridge('Node Bridge', uuid.generate('Node Bridged'))
    // Listen for bridge identification event
    this.bridge.on('identify', this.onIdentify.bind(this))
    this.bridge.on('listening', this.onListening.bind(this));
    this.bridge.on('identify', this.handleIdentify.bind(this));
    this.bridge.on('pair', this.handlePair.bind(this));
    this.bridge.on('unpair', this.handleUnpair.bind(this));
    this.bridge.on('accessories', this.handleAccessories.bind(this));
    this.bridge.on('get-characteristics', this.handleGetCharacteristics.bind(this));
    this.bridge.on('set-characteristics', this.handleSetCharacteristics.bind(this));
    this.bridge.on('session-close', this.handleSessionClose.bind(this));

    // Publish the Bridge on the local network.
    this.bridge.publish({
      username: this.username,
      port: this.port,
      pincode: this.pincode,
      category: Accessory.Categories.BRIDGE
    })

    this.printData()
  }

  onIdentify(paired, callback) {
    debug('Identified bridge')
    callback()
  }
  onListening() {
    debug('Bridge listening')
  }
  handleIdentify() {
    debug('Bridge identified')
  }
  handlePair() {
    debug('Bridge paired')
  }
  handleUnpair() {
    debug('Bridge unpaired')
  }
  handleAccessories() {
    debug('Bridge handle accessories')
  }
  handleGetCharacteristics() {
    debug('Bridge get characteristics')
  }
  handleSetCharacteristics() {
    debug('Bridge set characteristics')
  }
  handleSessionClose() {
    debug('Bridge session closed')
  }

  printData() {
    return new Promise((resolve) => {
      const uri = this.bridge.setupURI()
      debug('Homekit URI is', uri)
      qrcode.generate(uri, (qrcode) => {
        console.log('///////////////////////////////////////////////////////')
        console.log('///////////////////////////////////////////////////////')
        console.log('----------------------- HomeKit -----------------------')
        console.log('///////////////////////////////////////////////////////')
        console.log('///////////////////////////////////////////////////////')
        console.log(qrcode)
        console.log('--- Username is: ', this.username)
        console.log('--- Pincode is:  ', this.pincode)
        console.log('--- Port is:     ', this.port)
        resolve()
      })
    })
  }

  addDevice(device) {
    // Create the accessory object
    const accessory = new Accessory(device.name, uuid.generate(device.guid))
    this.accessoryMap[device.id] = accessory
    // The type of accessory, mapped to HomeKit's types
    const type = this.deviceTypeMapping[device.type]
    if (type != null) {
      accessory.addService(type, device.name)
      const actionKeys = Object.keys(device.actions) || []
      actionKeys.forEach((key) => {
        const action = device.actions[key]
        const characteristic = this.deviceActionMapping[action.type]
        if (characteristic != null) {
          const service = accessory.getService(type)
          service
            .getCharacteristic(characteristic)
            .on('set', (value, callback) => { this.setAccessory({ value, callback, action }) })
            .on('get', (callback) => { this.getAccessoryStatus({ action, callback, device }) })
        } else {
          debug(`Action type ${action.type} in "${key}" of "${device.name}" is not yet supported. Aborting...`)
        }
      })
    } else {
      debug(`Device type ${device.type} is not yet supported. Aborting...`)
      return
    }
    this.bridge.addBridgedAccessory(accessory)
  }

  setAccessory({ value, callback, action }) {
    debug(`Setting ${value} on ${action}`)
    const myPromise = action.execute(value)
    if (myPromise) {
      myPromise.then(() => {
        callback(null, true)
      }).catch((error) => {
        callback(null, false)
      })
    }
  }

  getAccessoryStatus({ action, callback, device }) {
    const myPromise = action.status()
    if (myPromise) {
      myPromise.then((status) => {
        if (typeof status === 'object') {
          status = status.success
        }
        debug(`Action: ${action.name}`, status)
        callback(null, status)
      }).catch((error) => {
        debug(`Error getting status of device ${device.name}`, error)
        callback(null, false)
      })
    }
  }

  // ----------------------------
  // LIFECYCLE METHODS ----------
  // ----------------------------
  devicesChanged({ newDevices }) {
    if (newDevices && newDevices.length > 0) {
      debug('New devices found:', newDevices.length)
      newDevices.forEach((device) => {
        if (!this.accessoryMap[device.id]) {
          debug('Adding device to HomeKit', device.name)
          this.addDevice(device)
        }
      })
    }
  }
}

module.exports = HomeKit
