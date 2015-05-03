var debug = require('debug')('bshed:api:app')
var compose = require('koa-compose')
var mount = require('koa-mount')
var assert = require('assert')
var qs = require('koa-qs')
var koa = require('koa')

var controllerLoader = require('./controllers')
var middleware = require('./middleware')
var helpers = require('./helpers')

/**
 * App loader
 *
 * @params {Object} opts
 * @params {Object} opts.config
 * @params {Object} opts.models
 * @params {Object} opts.s3
 * @returns {Application} API application
 */
module.exports = function appLoader ({config, models, s3}={}) {
  assert(config && models && s3, 'api requires config, models, and s3')
  debug('start')

  var app = qs(koa())
  Object.assign(app, {
    config,
    models,
    s3
  })

  var routes = compose([
    middleware.errorHandler(),
    middleware.addToContext({
      helpers,
      models,
      s3
    }),
    controllerLoader()
  ])

  app.use(mount(config.endpoint, routes))

  debug('end')
  return app
}
