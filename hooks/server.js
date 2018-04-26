const debug = require('debug')('Hook:Server')
const express = require('express')
const bodyParser = require('body-parser')
const Hook = require('../core/hook')

class Server extends Hook {
  start() {
    this.port = 6875
    this.app = express()
    this.router = null
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(this.handleRoute.bind(this))
    this.setupRoutes()
    this.app.listen(this.port)
    console.log('Server listening on port', this.port)
  }

  handleRoute(req, res, next) {
    if (this.router) {
      this.router(req, res, next)
    }
  }

  setupRoutes() {
    this.router = express.Router()
    const { services } = this.application
    const serviceKeys = Object.keys(services)
    serviceKeys.forEach(service => {
      this.router.post(`/${service}`, () => {
        console.log('success!')
      })
    })
    // this.app.post('/lifx', (req, res) => {
    //   this.lifx.powerAll({ on: req.body.on, duration: 5000 })
    // })
  }
}

module.exports = Server