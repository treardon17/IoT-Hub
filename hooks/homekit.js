const debug = require('debug')('Hook:Homekit')
const HAPNodeJS = require('hap-nodejs')
const Hook = require('../core/types/hook')
const fs = require('fs')
const path = require('path')
const storage = require('node-persist')
const { Accessory, Service, Characteristic, Bridge, uuid } = HAPNodeJS
const qrcode = require('qrcode-terminal')
const Device = require('../core/types/device')
const Action = require('../core/types/action')
const LifxBulb = require('../devices/lifx-bulb')

class HomeKit extends Hook {
  constructor() {
    super()
    this.username = 'CC:22:3D:E3:CE:F1'
    this.pincode = '031-45-154'
    this.accessoryMap = {}
    this.setDeviceMappings()
    this.setActionMappings()
  }

  setDeviceMappings() {
    debug('Setting device mappings')
    this.deviceTypeMapping = {
      [Device.types.light]: Service.Lightbulb,
      [Device.types.tv]: Service.Switch
    }
  }

  setActionMappings() {
    debug('Setting action mappings')
    this.deviceActionMapping = {
      [Action.types.switch]: Characteristic.On,
      [Action.types.hue]: Characteristic.Hue
    }
  }

  start() {
    debug('HAP-NodeJS starting...')
    // Initialize our storage system
    storage.initSync()
    // Start by creating our Bridge which will host all loaded Accessories
    this.bridge = new Bridge('Node Bridge', uuid.generate('Node Bridged'))
    // Listen for bridge identification event
    this.bridge.on('identify', (paired, callback) => {
      debug('Node Bridge identify')
      callback()
    })

    // Publish the Bridge on the local network.
    this.bridge.publish({
      username: this.username,
      port: 51826,
      pincode: this.pincode,
      category: Accessory.Categories.BRIDGE
    })

    this.printData()
  }

  printData() {
    return new Promise((resolve) => {
      qrcode.generate(this.bridge.setupURI(), (qrcode) => {
        console.log('///////////////////////////////////////////////////////')
        console.log('///////////////////////////////////////////////////////')
        console.log('----------------------- HomeKit -----------------------')
        console.log('///////////////////////////////////////////////////////')
        console.log('///////////////////////////////////////////////////////')
        console.log(qrcode)
        console.log('--- Username is: ', this.username)
        console.log('--- Pincode is:  ', this.pincode)
        resolve()
      })
    })
  }

  addDevice(device) {
    // Create the accessory object
    const accessory = new Accessory(device.name, uuid.generate(device.guid))
    this.accessoryMap[device.id] = accessory
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
            .on('set', (value, callback) => {
              action
                .execute(value)
                .then(() => {
                  console.log('inside then in set')
                  callback(null)
                })
                .catch(() => {
                  console.log('errored in set')
                  callback()
                })
            })
            .on('get', (callback) => {
              action
                .status()
                .then(() => {
                  console.log('get called')
                  callback()
                })
                .catch(() => {
                  console.log('errored in get')
                  callback(false)
                })
            })
        } else {
          debug(`Action type ${action.type} in ${key} of ${device.name} is not yet supported. Aborting...`)
        }
      })
    } else {
      debug(`Device type ${device.type} is not yet supported. Aborting...`)
      return
    }
    this.bridge.addBridgedAccessory(accessory)

    
    // accessory
    // .addService(Service.Lightbulb, device.name)
    // .getCharacteristic(Characteristic.On)
    // .on('set', (value, callback) => {
    //   this.application.services.Roku.power({ on: value })
    //   callback()
    // })
    
    // accessory
    //   .getService(Service.Lightbulb)
    //   .getCharacteristic(Characteristic.ColorTemperature)
    //   .on('set', (value, callback) => {
    //     console.log('setting value to', value)
    //     callback()
    //   })

    // accessory
    //   .getService(Service.Lightbulb)
    //   .getCharacteristic(Characteristic.Hue)
    //   .on('set', (value, callback) => {
    //     console.log('setting value to', value)
    //     callback()
    //   })

    // accessory
    //   .getService(Service.Lightbulb)
    //   .getCharacteristic(Characteristic.On)
    //   .on('get', function (callback) {
    //     var err = null // in case there were any problems
    //     const isOn = false
    //     if (isOn) {
    //       callback(err, true)
    //     }
    //     else {
    //       callback(err, false)
    //     }
    //   })
  }

  // ----------------------------
  // LIFECYCLE HOOKS ------------
  // ----------------------------
  devicesChanged({ newDevices }) {
    if (newDevices) {
      newDevices.forEach((device) => {
        this.addDevice(device)
      })
    }
  }
}

module.exports = HomeKit
