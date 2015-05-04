var Router = require('koa-router')
var middleware = require('../../utils/middleware')

module.exports = UsersController
function UsersController () {
  var auth = middleware.authenticate()

  var routes = new Router()
  .get(
    '/api/users/current',
    auth,
    UsersController.current
  )

  return routes.middleware()
}

/**
 * GET /api/users/current
 */
UsersController.current = function* current () {
  this.body = this.state.user
}
