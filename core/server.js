const express = require('express')
const bodyParser = require('body-parser')
const Lifx = require('../plugins/lifx')

class Server {
  start() {
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.setupRoutes()
    this.app.listen(6875)
    this.lifx = new Lifx()
  }

  setupRoutes() {
    this.app.post('/lifx', (req, res) => {
      this.lifx.powerAll({ on: req.body.on, duration: 5000 })
    })
  }
}

module.exports = new Server()