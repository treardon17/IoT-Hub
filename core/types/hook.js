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
    debug('The "start" method must be implemented in subclasses.')
  }
  stop() {
    debug('The "stop" method must be implemented in subclasses.')
  }
  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

module.exports = Hook