var Router = require('koa-router')

module.exports = UsersController
function UsersController () {
  var routes = new Router()
  .get(
    '/users/current',
    UsersController.current
  )

  return routes.middleware()
}

/**
 * GET /users/current
 */
UsersController.current = function* current () {

}
