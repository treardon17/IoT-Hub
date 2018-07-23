const Util = require('../../util')
const debug = Util.Log('Trigger')

/**
 * 
 * @class Trigger
 * A Trigger is an automated way to execute a task or action
 */
class Trigger {
  constructor({ app }) {
    this.app = app
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------
  start() {
    debug('The "start" method must be implemented in subclasses of Trigger.')
  }
  stop() {
    debug('The "stop" method must be implemented in subclasses of Trigger.')
  }
  devicesChanged() {
    debug('The "devicesChanged" method must be implemented in subclasses of Trigger.')
  }
  setupTriggerActive() {
    debug('The "triggerActive" method must be implemented in subclasses of Trigger.')
    return new Promise()
  }
  setupTriggerInactive() {
    debug('The "triggerInactive" method must be implemented in subclasses of Trigger.')
    return new Promise()
  }
  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------
}

module.exports = Trigger