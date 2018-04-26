const debug = require('debug')('Hook')

class Hook {
  constructor() {
    this.application = null
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------
  start() {
    debug('The "start" method must be implemented in subclasses.')
  }
  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

module.exports = Hook