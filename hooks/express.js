const Util = require('../util')
const debug = Util.Log('Hook:Express')
const Hook = require('../core/types/hook')
const express = require('express')
const bodyParser = require('body-parser')
const TaskManager = require('../core/managers/task-manager')

class Express extends Hook {
  constructor({ token = null }) {
    super()
    this.token = token
  }

  start() {
    this.port = 8080
    this.app = express()
    this.router = null
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(this.handleRoute.bind(this))
    this.setupRoutes()
    this.app.listen(this.port)
    debug('Express listening on port', this.port)
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
    // this.router.get(`/:service/:action`, onGet)
    // this.router.get(`/:service/device=:device/:action`, onGet)
  }

  onPost({ req, res, next }) {
    const { service, device, action } = req.params
    const { token, value } = req.body
    debug('Post request received:', `service "${service}", device "${device || 'all'}", action "${action}"`)

    // Security -- ensure token is correct before performing task
    if (token !== this.token) {
      debug(`Token ${token} is incorrect`)
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    } else {
      debug('Token valid')
    }

    const devices = device || this.application.getDevicesOfService(service)

    if (devices.length > 0) {
      TaskManager.performAction({ action, devices, params: value })
        .then(() => {
          res.json({ success: true })
        })
        .catch(() => {
          res.status(500).json({ success: false, error })
        })
    } else {
      debug('No devices from', `service ${service}`, `devices ${devices}`)
      res.status(400).json({ success: false, error })
    }
  }

  onGet({ req, res, next }) {
    const { service, device, action } = req.params
  }

  // ----------------------------
  // LIFECYCLE METHODS ----------
  // ----------------------------
  devicesChanged() { }
}

module.exports = Express