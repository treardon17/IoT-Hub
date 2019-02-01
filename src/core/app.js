const Observer = require('../util/observer')

class App {
  constructor() {
    this.services = new Observer()
  }
}

module.exports = App
