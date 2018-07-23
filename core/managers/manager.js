const Util = require('../../util')
const debug = Util.Log('Manager')

class Manager {
  constructor({ app, name, onReady }) {
    this.app = app
    this.name = (name || '').toLowerCase()
    this.fileName = `manager-${this.name}`
    this.onReady = onReady
    this.beforeInit()
    this.init()
  }

  beforeInit() {}

  init() {
    debug(`${this.name} manager initializing...`)
    return new Promise((resolve, reject) => {
      this.initManager().then(() => {
        if (typeof this.onReady === 'function') { this.onReady() }
      }).catch(() => { debug(`${this.name} file does not exist`) })
    })
  }

  initManager() {
    return Promise.resolve()
  }
}

module.exports = Manager
