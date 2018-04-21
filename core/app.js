const server = require('./server')
const RokuService = require('../services/roku')
const LifxService = require('../services/lifx')
const Util = require('../util')
const path = require('path')

class App {
  constructor() {
    this.services = {}
    this.services.roku = new RokuService()
    this.services.lifx = new LifxService()
    server.start()

    const contents = {
      testing: 'hello',
      testing2: 'world'
    }

    Util.FileIO.writeFile({ filePath: path.resolve(__dirname, './something/test.json'), contents })
  }

}

module.exports = App