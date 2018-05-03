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
const RokuTV = require('../devices/roku-tv')

class HomeKit extends Hook {
  constructor() {
    super()
    this.username = 'CC:22:3D:E3:CE:F9'
    this.pincode = '031-45-154'
    this.setDeviceMap()
    this.setActionMap()
  }

  setDeviceMap() {
    this.deviceTypeMapping = {
      [Device.types.light]: Service.Lightbulb,
      [Device.types.tv]: Service.Switch
    }
  }

  setActionMap() {
    this.deviceActionMapping = {
      [Action.types.switch]: Characteristic.On
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

    // Testing --------------
    const roku = new RokuTV({ id: 'CF:45:E7:43:F8:CE', name: 'roku', ip: '192.168.0.179', mac: 'CF:45:E7:43:F8:CE' })
    this.addDevice(roku)
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
    // const accessory = new Accessory(device.name, uuid.generate(device.id))
    // const type = this.deviceTypeMapping[device.type]
    // if (type != null) {
    //   accessory.addService(type, device.name)
    //   const actionKeys = Object.keys(device.actions) || []
    //   actionKeys.forEach((key) => {
    //     const action = device.actions[key]
    //     const characteristic = this.deviceActionMapping[action.type]
    //     if (characteristic != null) {
    //       const service = accessory.getService(type)
    //       console.log('service is', characteristic)
    //       service
    //         .getCharacteristic(characteristic)
    //         .on('set', (value, callback) => {
    //           action.func({ on: value })
    //         })
    //     } else {
    //       debug(`Action type ${action.type} in ${key} of ${device.name} is not yet supported. Aborting...`)
    //     }
    //   })
    // } else {
    //   debug(`Device type ${device.type} is not yet supported. Aborting...`)
    //   return
    // }
    // this.bridge.addBridgedAccessory(accessory)

    
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
}

module.exports = HomeKit
