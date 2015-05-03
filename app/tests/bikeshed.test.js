var {request, models, buildHeaders} = require('./helper')
var {User, Bikeshed, Bike, Rating, Vote} = models
var chance = require('chance').Chance()
var expect = require('expect.js')
var _ = require('lodash')

var user
var headers

describe('Request:Bikesheds', function () {
  describe('GET /api/bikesheds', function () {
    it('returns a list of bikesheds', function* () {
      var res = yield request
        .get('/api/bikesheds')
        .expect(200)

      expect(res.body)
        .to.be.an('array')
    })
  })

  describe('POST /api/bikesheds', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email()
      }).save()
      headers = buildHeaders({user: {id: user.id}})
    })

    it('lets you create bikeshed and returns 201', function* () {
      var res = yield request
        .post('/api/bikesheds')
        .set(headers)
        .attach('puppy_01.jpg', `${__dirname}/fixtures/puppy_01.jpg`)
        .attach('puppy_02.jpg', `${__dirname}/fixtures/puppy_02.jpg`)
        .expect(201)

      expect(res.body).to.only.have.keys([
        'description',
        'updatedAt',
        'createdAt',
        'status',
        'userId',
        'bikes',
        'id'
      ])
    })

    it('fails with < 2 file', function* () {
      yield request
        .post('/api/bikesheds')
        .set(headers)
        .attach('puppy_01.jpg', `${__dirname}/fixtures/puppy_01.jpg`)
        .expect(422)

      yield request
        .post('/api/bikesheds')
        .set(headers)
        .expect(422)
    })
  })

  describe('GET /api/bikesheds/:bikeshed', function () {
    it('returns a bikeshed with bikes and votes', function* () {
      var bikeshed = yield Bikeshed
        .filter({
          status: 'success'
        })
        .limit(1)
        .getJoin({
          votes: true,
          bikes: {
            ratings: true
          }
        })
      bikeshed = bikeshed[0]

      var res = yield request
        .get(`/api/bikesheds/${bikeshed.id}`)
        .expect(200)

      expect(JSON.stringify(res.body))
        .to.equal(JSON.stringify(bikeshed))
    })
  })

  describe('POST /api/bikesheds/:bikeshed/votes', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email()
      }).save()
      headers = buildHeaders({user: {id: user.id}})
    })

    it('lets you rank bikes in bikeshed', function* () {
      var bikeshed = yield new Bikeshed({
        userId: user.id,
        status: 'success',
        bikes: _.times(5, n => new Bike({
          type: 'image/jpeg',
          status: 'success',
          name: `${n}.jpg`,
          size: 1
        }))
      }).saveAll()

      var ratings = bikeshed.bikes.map((bike, idx) => {
        return {
          bikeId: bike.id,
          value: idx + 1
        }
      })

      var res = yield request
        .post(`/api/bikesheds/${bikeshed.id}/votes`)
        .set(headers)
        .send({ratings})
        .expect(201)

      expect(res.body.bikeshedId)
        .to.equal(bikeshed.id)
      expect(res.body.userId)
        .to.equal(user.id)
      expect(res.body.ratings)
        .to.be.an('array')

      _.sortBy(res.body.ratings, 'value').map((rating, idx) => {
        expect(rating.bikeId).to.equal(ratings[idx].bikeId)
        expect(rating.value).to.equal(ratings[idx].value)
      })

    })

  })

  describe('GET /api/bikesheds/:bikeshed/votes', function () {
    beforeEach(function* () {
      user = yield new User({
        name: chance.name(),
        email: chance.email(),
        bikesheds: _.times(1, n => new Bikeshed({
          status: 'success',
          bikes: _.times(2, n => new Bike({
            type: 'image/jpeg',
            status: 'success',
            name: `${n}.jpg`,
            size: 1
          }))
        }))
      }).saveAll()

      user.votes = _.times(1, n => new Vote({
        bikeshedId: user.bikesheds[0].id,
        userId: user.id,
        ratings: user.bikesheds[0].bikes.map((bike, idx) => new Rating({
          bikeId: bike.id,
          value: idx + 1
        }))
      }))

      user = yield user.saveAll()
      headers = buildHeaders({user: {id: user.id}})
    })

    it('returns your vote', function* () {
      yield request
        .get(`/api/bikesheds/${user.bikesheds[0].id}/votes`)
        .set(headers)
        .expect(200)
    })
  })
})
