const debug = require('debug')('Hook')

/**
 * 
 * @class Hook
 * A Hook is a way of controlling a service
 */
class Hook {
  constructor() {
    this.application = null
    this.token = null
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------
  start() {
    debug('The "start" method must be implemented in subclasses of Hook.')
  }
  stop() {
    debug('The "stop" method must be implemented in subclasses of Hook.')
  }
  devicesChanged() {
    debug('The "devicesChanged" method must be implemented in subclasses of Hook.')
  }
  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

module.exports = Hook