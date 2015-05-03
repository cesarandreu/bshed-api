var Router = require('koa-router')
var middleware = require('../middleware')

module.exports = UsersController
function UsersController () {
  var auth = middleware.authenticate()

  var routes = new Router()
  .get(
    '/users/current',
    auth,
    UsersController.current
  )

  return routes.middleware()
}

/**
 * GET /users/current
 */
UsersController.current = function* current () {
  this.body = this.state.user
}
