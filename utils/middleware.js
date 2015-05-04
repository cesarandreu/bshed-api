// var debug = require('debug')('bshed-api:api:middleware')
var assert = require('assert')

/**
 * Middleware
 */

/**
 * addToContext
 * Adds all enumerable keys in objects to context
 *
 * @param {Object} [objects={}]
 * @returns {Function} addToContextMiddleware
 */
exports.addToContext = function addToContext (objects={}) {
  return function* addToContextMiddleware (next) {
    Object.assign(this, objects)
    yield next
  }
}

/**
 * authenticate
 *
 * Load user to ctx.state.user using session.user.id
 * Throws 401 if session isn't set or user isn't found
 *
 * @param {Object} [opts={}]
 * @param {boolean} [opts.skippable=false]
 * @returns {Function} authenticateMiddleware
 */
exports.authenticate = function authenticate ({skippable=false}={}) {
  return function* authenticateMiddleware (next) {
    try {
      var {User} = this.models
      this.state.user = yield User.get(this.session.user.name)
      if (!this.state.user) throw new Error('user not found')
    } catch (err) {
      if (!skippable) this.throw(401)
    }
    yield next
  }
}

/**
 * errorHandler
 * Handle Joi and Boom errors
 */
exports.errorHandler = function errorHandler () {
  return function* errorHandlerMiddleware (next) {
    try {
      yield next
    } catch (err) {
      // console.error('ERR IS', err)
      var [status, body] = errorHandlerHelper(err)
      this.status = status
      this.body = body
    }
  }

  function errorHandlerHelper (err) {
    switch (err.name) {
      case 'ValidationError':
        return [422, err.details]
      default:
        throw err
    }
  }
}

/**
 * load
 *
 * Searches for :name param using resource model and sets value to ctx.state[name]
 * Throws 404 if search fails
 *
 * @param resource - model name
 * @param param - param to use, defaults to lowercase model name
 *
 * @example load('Bikeshed') - uses Bikeshed model, :bikeshed param, and sets ctx.state.bikeshed
 */
exports.load = function load (resource, param) {
  assert(resource, 'load middleware requires a resource')
  param = param || resource.toLowerCase()

  return function* loadMiddleware (next) {
    try {
      this.state[param] = yield this.models[resource].get(this.params[param])
      if (!this.state[param]) throw new Error(`${resource} not found`)
    } catch (err) {
      this.throw(404, `${resource} not found`)
    }
    yield next
  }
}
