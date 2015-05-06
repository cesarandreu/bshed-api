var Joi = require('joi')
var Router = require('koa-router')
var bodyParser = require('koa-better-body')

module.exports = AuthenticationsController
function AuthenticationsController () {

  var routes = new Router()
  .post(
    '/login',
    bodyParser(),
    AuthenticationsController.login
  )
  .post(
    '/register',
    bodyParser(),
    AuthenticationsController.register
  )
  .del(
    '/logout',
    AuthenticationsController.logout
  )
  // .post(
  //   '/forgot',
  //   bodyParser(),
  //   AuthenticationsController.forgot
  // )

  return routes.middleware()
}

/**
 * POST /login
 */
AuthenticationsController.login = function* login () {
  var {User} = this.models
  var body = this.request.body.fields
  var schema = AuthenticationsController.login.schema
  var {name, password} = yield (cb) => Joi.validate(body, schema, cb)

  var user = yield User.get(name)
  if (!user)
    this.throw(404, 'User not found')

  var isValid = yield User.comparePassword(password, user.password)
  if (!isValid)
    this.throw(422, 'User password invalid')

  this.session.user = {
    name: user.name
  }

  this.body = yield User.get(name).getView()
}

/**
 * Login schema
 * Check validation on ctx.request.body.fields
 */
AuthenticationsController.login.schema = Joi.object().required().keys({
  name: Joi.string().min(1).max(255).required(),
  password: Joi.string().min(6).max(1000).required()
})

/**
 * POST /register
 */
AuthenticationsController.register = function* register () {
  var {User} = this.models
  var body = this.request.body.fields
  var schema = AuthenticationsController.register.schema
  var {name, password, email} = yield (cb) => Joi.validate(body, schema, cb)

  var hashedPassword = yield User.hashPassword(password)

  var user = yield new User({
    name: name,
    email: email,
    password: hashedPassword
  }).save()

  this.session.user = {
    name: user.name
  }

  this.status = 201
  this.body = yield User.get(name).getView()
}

/**
 * Register schema
 * Check validation on ctx.request.body.fields
 */
AuthenticationsController.register.schema = Joi.object().required().keys({
  name: Joi.string().min(1).max(255).required(),
  password: Joi.string().min(6).max(1000).required(),
  email: Joi.string().min(1).max(254).email().required()
})

/**
 * DELETE /logout
 */
AuthenticationsController.logout = function* logout () {
  this.session = null
  this.status = 204
}

// /**
//  * POST /forgot
//  */
// AuthenticationsController.forgot = function* forgot () {

// }
