const debug = require('debug')('Hook:Server')
const express = require('express')
const bodyParser = require('body-parser')
const Hook = require('../core/types/hook')

class Server extends Hook {
  constructor({ token = null }) {
    super()
    this.token = token
  }

  start() {
    this.port = 6875
    this.app = express()
    this.router = null
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(this.handleRoute.bind(this))
    this.setupRoutes()
    this.app.listen(this.port)
    debug('Server listening on port', this.port)
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
    const { token, ...body } = req.body
    debug('Post request received:', `service "${service}", device "${device || 'all'}", action "${action}"`)

    // Security -- ensure token is correct before performing task
    if (token !== this.token) {
      debug(`Token ${token} is incorrect`)
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    } else {
      debug('Token valid')
    }

    // We are secure now, so
    if (service) {
      const myService = this.application.services[service]
      const myAction = myService.actions[action]
      if (typeof myAction === 'function') {
        const params = { id: device, ...body }
        try {
          myAction(params).then(() => {
            res.json({ success: true })
          }).catch((error) => {
            res.status(500).json({ success: false, error })
          })
        } catch(error) {
          debug(`Action "${action}" in ${service} does not return a promise. Actions must return a promise.`, error)
          res.json({ success: true, error: 'Skipping resolve due to function not returning promise.' })
        }
      } else {
        const error = `Action "${action}" in ${service} is not a valid action.`
        debug(error)
        res.status(400).json({ success: false, error })
      }
    } else {
      const error = `Service "${service}" does not exist.`
      debug(error)
      res.status(400).json({ success: false, error })
    }
  }

  onGet({ req, res, next }) {
    const { service, device, action } = req.params
  }
}

module.exports = Server