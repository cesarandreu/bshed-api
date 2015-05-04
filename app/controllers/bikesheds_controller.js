var fs = require('fs')
var Joi = require('joi')
var _ = require('lodash')
var Router = require('koa-router')
var bodyParser = require('koa-better-body')
var middleware = require('../../utils/middleware')

module.exports = BikeshedsController
function BikeshedsController () {
  var auth = middleware.authenticate()
  var bodyForm = bodyParser()
  var bodyFile = bodyParser({
    multipart: true,
    formidable: {
      multiples: true
    }
  })

  var routes = new Router()
  .get(
    '/api/bikesheds',
    BikeshedsController.index
  )
  .post(
    '/api/bikesheds',
    auth,
    bodyFile,
    BikeshedsController.create
  )
  .get(
    '/api/bikesheds/:bikeshed',
    BikeshedsController.show
  )
  .post(
    '/api/bikesheds/:bikeshed/votes',
    auth,
    bodyForm,
    BikeshedsController.rate
  )
  .get(
    '/api/bikesheds/:bikeshed/votes',
    auth,
    BikeshedsController.votes
  )

  return routes.middleware()
}

/**
 * GET /api/bikesheds?limit&after
 */
BikeshedsController.index = function* index () {
  var {Bikeshed, r} = this.models
  var query = this.query

  // limit must be a number between 0 and 100
  var limit = /^([0-9]{1,3})$/.test(query.limit) ? Number(query.limit) : 20
  limit = limit < 0 || limit > 100 ? 20 : limit

  // after must be a unix timestamp number or Date string
  var after = new Date(/^([0-9]+)$/.test(query.after) ? Number(query.after) * 1000 : query.after)
  after = after.valueOf() ? after : r.maxval

  var bikesheds = yield Bikeshed
    .between(r.minval, after, {index: 'createdAt'})
    .orderBy({index: r.desc('createdAt')})
    .filter({status: 'success'})
    .limit(limit)
    .getJoin({bikes: true})

  this.body = bikesheds
}

/**
 * POST /api/bikesheds
 */
BikeshedsController.create = function* create () {
  var {Bikeshed, Bike} = this.models
  var {user} = this.state
  var s3 = this.s3

  var body = this.request.body
  var schema = BikeshedsController.create.schema
  var value = yield (cb) => Joi.validate(body, schema, cb)

  var bikeshed = yield new Bikeshed({
    description: value.fields.description,
    username: user.name,
    bikes: _.map(value.files, file => {
      return new Bike({
        type: file.type,
        size: file.size,
        name: file.name
      })
    })
  }).saveAll()

  bikeshed.bikes = yield bikeshed.bikes.map(bike => {
    var file = value.files[bike.name]
    return BikeshedsController.create.uploadBike({
      bike, file, s3
    })
  })

  if (_.every(bikeshed.bikes, {status: 'success'})) {
    bikeshed.status = 'success'
    this.status = 201
  } else {
    bikeshed.status = 'error'
    this.status = 503
  }

  this.body = yield bikeshed.saveAll()
}

/**
 * uploadBike
 * Try uploading file to s3
 * Sets bike status to success or error
 * Tries deleting failed file uploads
 *
 * @param options.bike
 * @param options.file
 * @param options.s3
 * @returns bike
 */
BikeshedsController.create.uploadBike = function* uploadBike ({bike, file, s3}={}) {
  var Key = `${bike.bikeshedId}/${bike.id}`
  var Bucket = 'bshed'

  var uploadFileOptions = {
    Body: fs.createReadStream(file.path),
    ACL: 'public-react',
    Bucket, Key
  }

  try {
    yield s3.uploadFilePromise(uploadFileOptions)
    bike.status = 'success'
  } catch (err) {
    console.log('ERROR UPLOAD BIKE', err)
    bike.status = 'error'
    try {
      yield s3.deleteObjectPromise({Bucket, Key})
    } catch (err) {
      console.log('ERROR DELETING BIKE', err)
    }
  }

  return bike
}

/**
 * Create bikeshed schema
 * Check validation on ctx.request.body
 */
BikeshedsController.create.schema = Joi.object().required().keys({
  files: Joi.object().min(2).max(10).required(),
  fields: Joi.object().default({}).keys({
    description: Joi.string().default('')
  })
})


/**
 * GET /api/bikesheds/:bikeshed
 */
BikeshedsController.show = function* show () {
  var {Bikeshed} = this.models
  var bikeshed = yield Bikeshed
    .get(this.params.bikeshed)
    .getJoin({
      votes: true,
      bikes: {
        ratings: true
      }
    })

  if (!bikeshed)
    this.throw(404, 'Bikeshed not found')

  this.body = bikeshed
}


/**
 * POST /api/bikesheds/:bikeshed/votes
 */
BikeshedsController.rate = function* rate () {
  var {Bikeshed, Rating, Vote} = this.models
  var {user} = this.state

  var bikeshed = yield Bikeshed
    .get(this.params.bikeshed)
    .getJoin({bikes: true, votes: true})

  if (!bikeshed)
    this.throw(404, 'Bikeshed not found')

  if (_.some(bikeshed.votes, {username: user.name}))
    this.throw(409, 'Bikeshed already rated')

  var vote = yield new Vote({
    bikeshedId: bikeshed.id,
    username: user.name
  }).save()

  var voteCount = yield Vote
    .filter({
      bikeshedId: bikeshed.id,
      username: user.name
    })
    .count()

  try {
    if (voteCount !== 1)
      this.throw(409, 'Bikeshed already rated')

    var bikes = bikeshed.bikes
    var schema = BikeshedsController.rate.schema
    var body = _.get(this.request, 'body.fields')
    var result = yield (cb) => Joi.validate(body, schema, cb)

    var ratings = result.ratings
    if (ratings.length !== bikes.length)
      this.throw(422, 'Rating count does not match bike count')

    var missingBikes = _.difference(
      _.pluck(bikes, 'id'),
      _.pluck(ratings, 'bikeId')
    )
    if (missingBikes.length)
      this.throw(422, `Missing bikes: ${JSON.stringify(missingBikes)}`)

    var missingValues = _.difference(
      _.range(1, ratings.length),
      _.pluck(ratings, 'value')
    )
    if (missingValues.length)
      this.throw(422, `Missing values: ${JSON.stringify(missingValues)}`)

    vote.ratings = ratings.map(rating => new Rating({
        bikeId: rating.bikeId,
        value: rating.value
      })
    )

    this.body = yield vote.saveAll()
    this.status = 201
  } catch (err) {
    yield vote.delete()
    throw err
  }
}

/**
 * Rate bikeshed schema
 * Check validation on ctx.request.body.fields
 */
BikeshedsController.rate.schema = Joi.object().required().keys({
  ratings: Joi.array().min(2).max(10).unique().required().items(
    Joi.object().required().keys({
      value: Joi.number().min(1).max(10).required(),
      bikeId: Joi.string().required()
    })
  )
})

/**
 * GET /api/bikesheds/:bikeshed/votes
 */
BikeshedsController.votes = function* () {
  var {Bikeshed, Vote} = this.models
  var {user} = this.state

  var bikeshed = yield Bikeshed
    .get(this.params.bikeshed)

  if (!bikeshed)
    this.throw(404, 'Bikeshed not found')

  var votes = yield Vote
    .filter({
      bikeshedId: bikeshed.id,
      username: user.name
    })

  if (!votes.length)
    this.throw(404, 'Vote not found')

  this.body = votes.pop()
}
