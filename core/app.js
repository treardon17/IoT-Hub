const server = require('./server')
const RokuService = require('../services/roku')
const LifxService = require('../services/lifx')
const Util = require('../util')

class App {
  constructor() {
    this.services = {}
    this.services.roku = new RokuService()
    this.services.lifx = new LifxService()
    server.start()
  }

}

module.exports = App