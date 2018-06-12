const App = require('./core/app')
const Util = require('./util')
const debug = Util.Log('Root')
try {
  const app = new App()
} catch (error) {
  debug('** Uncaught error:', error)
}