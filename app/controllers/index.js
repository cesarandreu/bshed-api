var debug = require('debug')('bshed:api:app:controllers')
var compose = require('koa-compose')

/**
 * Controller loader
 *
 * @returns {Function} controller middleware
 */
module.exports = controllerLoader
function controllerLoader () {
  debug('start')

  var controllers = controllerLoader.load()
  var middleware = controllerLoader.middleware(controllers)

  debug('end')
  return middleware
}

controllerLoader.load = function load () {
  var controllers = [
    'users',
    'bikesheds'
  ].reduce((controllers, name) => {
    debug(`loading ${name} controller`)
    controllers[name] = require(`./${name}_controller`)
    return controllers
  }, {})

  return controllers
}

controllerLoader.middleware = function middleware (controllers) {
  var controllerMiddleware = Object.keys(controllers).map(name => {
    debug(`getting middleware for ${name} controller`)
    return controllers[name]()
  })

  return compose(controllerMiddleware)
}
