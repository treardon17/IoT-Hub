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

    // Service specific routes
    const onPost = (req, res, next) => { this.onPost({ req, res, next }) }
    const onGet = (req, res, next) => { this.onGet({ req, res, next }) }

    // Post
    this.router.post(`/:service/:action`, onPost)
    this.router.post(`/:service/device=:device/:action`, onPost)
    // Get
    this.router.get(`/:service/:action`, onGet)
    this.router.get(`/:service/device=:device/:action`, onGet)
  }

  onPost({ req, res, next }) {
    const { service, device, action } = req.params
    if (service) {
      const myService = this.application.services[service]
      const myAction = myService.actions[action]
      if (typeof myAction === 'function') {
        const params = { id: device, ...req.body }
        myAction(params)
      }
    }
  }

  onGet({ req, res, next }) {
    const { service, device, action } = req.params
  }
}

module.exports = Server