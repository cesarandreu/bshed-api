var Router = require('koa-router')
// var middleware = require('../../utils/middleware')

module.exports = AuthenticationsController
function AuthenticationsController () {

  var routes = new Router()
  .post(
    '/login',
    AuthenticationsController.login
  )
  .post(
    '/register',
    AuthenticationsController.register
  )
  // .post(
  //   '/forgot',
  //   AuthenticationsController.forgot
  // )

  return routes.middleware()
}

/**
 * POST /login
 */
AuthenticationsController.login = function* login () {
  this.body = this.state.user
}

/**
 * POST /register
 */
AuthenticationsController.register = function* register () {

}

// /**
//  * POST /forgot
//  */
// AuthenticationsController.forgot = function* forgot () {

// }
