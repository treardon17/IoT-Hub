const debug = require('debug')('Device')
class Device {
  constructor({ id = '', name = '', ip = '', type }) {
    this.id = id
    this.name = name
    this.ip = ip
    this.type = type || Device.generic
  }
}

Device.types = {}
Device.types.generic = 'generic'
Device.types.light = 'light'

module.exports = Device