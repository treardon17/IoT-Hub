const debug = require('debug')('Hook:Homekit')
const HAPNodeJS = require('hap-nodejs')
const Hook = require('../core/types/hook')
const fs = require('fs')
const path = require('path')
const storage = require('node-persist')
const { Accessory, Service, Characteristic, Bridge, uuid } = HAPNodeJS
const RokuTV = require('../devices/roku-tv')

class HomeKit extends Hook {
  constructor() {
    super()
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
      username: 'CC:22:3D:E3:CE:F8',
      port: 51826,
      pincode: '031-45-154',
      category: Accessory.Categories.BRIDGE
    })

    const roku = new RokuTV({ id: 'CF:45:E7:43:F8:CE', name: 'roku', ip: '192.168.0.179', mac: 'CF:45:E7:43:F8:CE' })
    this.addDevice(roku)
  }

  addDevice(device) {
    const accessory = new Accessory(device.name, uuid.generate(device.id))
    
    accessory
    .addService(Service.Lightbulb, device.name)
    .getCharacteristic(Characteristic.On)
    .on('set', (value, callback) => {
      console.log('setting value to', value)
      callback()
    })
    
    // accessory
    //   .getService(Service.Lightbulb)
    //   .getCharacteristic(Characteristic.ColorTemperature)
    //   .on('set', (value, callback) => {
    //     console.log('setting value to', value)
    //     callback()
    //   })

    accessory
      .getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.Hue)
      .on('set', (value, callback) => {
        console.log('setting value to', value)
        callback()
      })

    accessory
      .getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .on('get', function (callback) {

        // this event is emitted when you ask Siri directly whether your fan is on or not. you might query
        // the fan hardware itself to find this out, then call the callback. But if you take longer than a
        // few seconds to respond, Siri will give up.

        var err = null // in case there were any problems
        const isOn = true
        if (isOn) {
          callback(err, true)
        }
        else {
          callback(err, false)
        }
      })
    this.bridge.addBridgedAccessory(accessory)
  }
}

module.exports = HomeKit
