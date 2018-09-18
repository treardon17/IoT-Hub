const Util = require('../util')
const debug = Util.Log('Hook:Express')
const Hook = require('../core/types/hook')
const express = require('express')
const bodyParser = require('body-parser')

class Express extends Hook {
  start() {
    this.port = 8080
    this.expressApp = express()
    this.router = null
    this.expressApp.use(bodyParser.json())
    this.expressApp.use(bodyParser.urlencoded({ extended: true }))
    this.expressApp.use(this.handleRoute.bind(this))
    this.setupRoutes()
    this.expressApp.listen(this.port)
    debug('Express listening on port', this.port)
  }

  handleRoute(req, res, next) {
    if (this.router) {
      this.router(req, res, next)
    }
  }

  setupRoutes() {
    this.router = express.Router()
    const { services } = this.app
    const serviceKeys = Object.keys(services)

    // Service specific routes
    const onServicePost = (req, res, next) => { this.onServicePost({ req, res, next }) }
    const onGet = (req, res, next) => { this.onGet({ req, res, next }) }

    // Post
    this.router.post(`/:service/:action`, onServicePost)
    this.router.post(`/:service/device=:device/:action`, onServicePost)
    // Get
    // this.router.get(`/:service/:action`, onGet)
    // this.router.get(`/:service/device=:device/:action`, onGet)
  }

  validateToken(token) {
    if (token !== this.token) {
      debug(`Token ${token} is incorrect`)
      return { success: false, error: 'Unauthorized', responseCode: 401 }
    } else {
      debug('Token valid')
      return { success: true }
    }
  }

  onServicePost({ req, res, next }) {
    const { service, device, action } = req.params
    const { token, value } = req.body
    debug('Service post request received:', `service "${service}", device "${device || 'all'}", action "${action}"`, 'value is:', value)

    // Security -- ensure token is correct before performing task
    const tokenValidation = this.validateToken(token)
    if (!tokenValidation.success) {
      res.status(tokenValidation.responseCode).json(tokenValidation)
      return
    }

    const devices = device || this.app.getDevicesOfService(service)

    if (devices.length > 0) {
      const task = this.app.taskManager.createTask({
        instructions: [{ action, params: value, devices }]
      })
      task.execute()
        .then(() => {
          res.json({ success: true })
        })
        .catch((error) => {
          res.status(500).json({ success: false, error })
        })
    } else {
      debug('No devices from', `service ${service}`, `devices ${devices}`)
      res.status(400).json({ success: false, error: 'No devices found' })
    }
  }

  onTaskPost({ req, res, next }) {
    const { task } = req.params
    const { token, value } = req.body
    debug('Task post request received:', `task "${task}"`)
    const theTask = this.app.taskManager.taskMap[task]
    if (theTask && typeof theTask.execute === 'function') {
      theTask.execute(value)
        .then(() => {
          res.json({ success: true })
        })
        .catch((error) => {
          res.status(500).json({ success: false, error })
        })
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