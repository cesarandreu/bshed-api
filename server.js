// modules
var koa = require('koa')
var csrf = require('koa-csrf')
var mount = require('koa-mount')
var session = require('koa-session')
var compress = require('koa-compress')
var responseTime = require('koa-response-time')
var debug = require('debug')('bshed:api:server')

// libs and modules
debug('loading libs and modules')
var modelLoader = require('./models')
var s3Loader = require('./lib/s3')
var apiLoader = require('./api')

// configuration
debug('loading and generating config')
var configGenerator = require('./config')
var config = configGenerator({})

// initialization
debug('initializing libs and modules')
var s3 = s3Loader(config.aws)
var models = modelLoader(config)
var api = apiLoader({config, models, s3})

/**
 * SERVER
 * Exported so it can be started externally
 */
var server = module.exports = koa()
Object.assign(server, {
  name: config.name,
  keys: config.keys,
  env: config.env,
  config,
  models,
  api,
  s3
})

/**
 * MIDDLEWARE
 */
if (server.env === 'development')
  server.use(require('koa-logger')()) // request logging
server.use(responseTime()) // x-response-time
server.use(compress()) // compression
server.use(session(config.middleware.session, server)) // cookie sessions
server.use(csrf()) // csrf token
server.use(setCsrfToken()) // XSRF-TOKEN

/**
 * APPLICATION
 */
debug('mounting modules')
server.use(mount(api))

/**
 * SERVER INITIALIZER
 *
 * Listen for connections
 * returns server instance
 */
server.init = function init (port=config.port) {
  debug(`initializing server using port ${port}`)
  server.server = server.listen(port, () => debug(`listening on port ${port}`))
  return server.server
}

// initialize server if called directly
if (require.main === module)
  server.init()

/**
 * setCsrfToken
 * Middleware to set XSRF-TOKEN cookie on every response
 */
function setCsrfToken () {
  return function* setCsrfCookieMidleware (next) {
    this.cookies.set('XSRF-TOKEN', this.csrf)
    yield next
  }
}
