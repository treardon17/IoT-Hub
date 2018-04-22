const debug = require('debug')('Device')
class Device {
  constructor({ id = '', name = '', ip = '', type }) {
    this.id = id
    this.name = name
    this.ip = ip
    this.type = type || Device.generic
    this.parentService = null
  }

  get actions() {
    debug('"actions" must be implemented by subclass --> return an object with keys matching the name of the function you wish to call. Include "desc" as a child of the object, describing what the function does.')
    return {}
  }
}

Device.types = {}
Device.types.generic = 'generic'
Device.types.light = 'light'
Device.types.tv = 'tv'

module.exports = Device