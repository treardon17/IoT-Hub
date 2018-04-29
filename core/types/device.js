const debug = require('debug')('Device')
const Util = require('../../util')

/**
 * 
 * 
 * @class Device
 * A Device is anything that can be controlled
 */
class Device {
  constructor({ id = '', name = '', ip = '', type }) {
    this.id = id || Util.ID.guidMac()
    this.name = name
    this.ip = ip
    this.type = type || Device.generic
    this.parentService = null
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------

  get actions() {
    debug('"actions" must be implemented by subclass --> return an object with keys matching the name of the function you wish to call. Include "desc" as a child of the object, describing what the function does.')
    return {}
  }

  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

Device.types = {}
Device.types.generic = 'generic'
Device.types.light = 'light'
Device.types.tv = 'tv'

module.exports = Device