const express = require('express')
const bodyParser = require('body-parser')

class Server {
  start() {
    this.port = 6875
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.setupRoutes()
    this.app.listen(this.port)
    console.log('Server listening on port', this.port)
  }

  setupRoutes() {
    // this.app.post('/lifx', (req, res) => {
    //   this.lifx.powerAll({ on: req.body.on, duration: 5000 })
    // })
  }
}

module.exports = new Server()