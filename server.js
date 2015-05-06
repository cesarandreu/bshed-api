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
var appLoader = require('./app')

// configuration
debug('loading and generating config')
var configGenerator = require('./config')
var config = configGenerator({})

// initialization
debug('initializing libs and modules')
var s3 = s3Loader(config.aws)
var models = modelLoader(config)
var app = appLoader({config, models, s3})

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
  app,
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
server.use(setLoggedInCookie()) // logged_in

/**
 * APPLICATION
 */
debug('mounting modules')
server.use(mount(app))

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
 * Session check is needed in case it's null
 */
function setCsrfToken () {
  return function* setCsrfCookieMidleware (next) {
    yield next
    if (this.session)
      this.cookies.set('XSRF-TOKEN', this.csrf, {httpOnly: false})
  }
}

/**
 * setLoggedInCookie
 * Middleware to set logged_in cookie on every response
 * Used by client to try to guess allowed states
 */
function setLoggedInCookie () {
  return function* setLoggedInCookieMiddleware (next) {
    yield next
    var loggedIn = this.session && this.session.user && this.session.user.name
    this.cookies.set('logged_in', loggedIn ? 'yes' : 'no', {
      httpOnly: false
    })
  }
}
