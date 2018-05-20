const Util = require('../../util')
const debug = Util.Log('Device')

/**
 * 
 * 
 * @class Device
 * A Device is anything that can be controlled
 */
class Device {
  constructor({ id = '', guid = '', name = '', ip = '', type, parentService }) {
    this.id = id || Util.ID.hash(name)
    this.guid = Util.ID.guid()
    this.name = name
    this.ip = ip
    this.type = type || Device.generic
    this.parentService = parentService
    this.actions = this.createActions()
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------

  createActions() {
    debug('"createActions" must be implemented by subclass --> return an Action object with keys matching the name of the function you wish to call. Include "desc" as a child of the object, describing what the function does.')
    return {}
  }

  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

Device.types = {}
Device.types.generic = 'generic'
Device.types.task = 'task'
Device.types.light = 'light'
Device.types.tv = 'tv'

module.exports = Device