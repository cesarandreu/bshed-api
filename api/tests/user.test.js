var {request, models, buildHeaders} = require('./helper')
var chance = require('chance').Chance()
var expect = require('expect.js')
var {User} = models

var user
var headers

describe('Request:Bikesheds', function () {
  describe('GET /api/users/current', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email()
      }).save()
      headers = buildHeaders({user: {id: user.id}})
    })

    it('returns the user', function* () {
      var res = yield request
        .get('/api/users/current')
        .set(headers)
        .expect(200)

      expect(res.body).to.only.have.keys([
        'id',
        'name',
        'email',
        'createdAt',
        'updatedAt'
      ])
    })
  })
})
