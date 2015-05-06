var {request, models, buildHeaders} = require('./helper')
var chance = require('chance').Chance()
var expect = require('expect.js')
var {User} = models

var user
var headers

describe('Request:Authentications', function () {
  describe('POST /login', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email(),
        password: yield User.hashPassword('password')
      }).save()
      headers = buildHeaders({})
    })

    it('returns the user', function* () {
      var res = yield request
        .post('/login')
        .set(headers)
        .send({
          name: user.name,
          password: 'password'
        })
        .expect(200)

      expect(res.headers['set-cookie'])
        .to.contain('logged_in=yes; path=/')

      expect(res.body)
        .to.have.property('name', user.name)

      expect(res.body)
        .to.have.property('email', user.email)

      expect(res.body)
        .to.only.have.keys([
          'name',
          'email',
          'updatedAt',
          'createdAt'
        ])
    })
  })

  describe('POST /register', function () {
    beforeEach(function () {
      user = {
        name: chance.name(),
        email: chance.email(),
        password: 'password'
      }
      headers = buildHeaders({})
    })

    it('returns the user with 201', function* () {
      var res = yield request
        .post('/register')
        .set(headers)
        .send(user)
        .expect(201)

      expect(res.headers['set-cookie'])
        .to.contain('logged_in=yes; path=/')

      expect(res.body)
        .to.have.property('name', user.name)

      expect(res.body)
        .to.have.property('email', user.email)

      expect(res.body)
        .to.only.have.keys([
          'name',
          'email',
          'updatedAt',
          'createdAt'
        ])
    })
  })

  describe('DELETE /logout', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email(),
        password: yield User.hashPassword('password')
      }).save()
      headers = buildHeaders({user: {name: user.name}})
    })

    it('returns the user', function* () {
      var res = yield request
        .del('/logout')
        .set(headers)
        .expect(204)

      expect(res.headers['set-cookie'])
        .to.contain('logged_in=no; path=/')
    })
  })
})
