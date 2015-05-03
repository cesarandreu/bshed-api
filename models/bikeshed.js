module.exports = function (thinky, type) {
  var Bikeshed = thinky.createModel('Bikeshed', {
    id: type.string().default(thinky.r.uuid).required(),
    userId: type.string().required(),
    createdAt: type.date().default(() => new Date()).required(),
    updatedAt: type.date().default(() => new Date()).required(),
    description: type.string().max(5000).default('').optional(),
    status: type.string().enum('building', 'success', 'error', 'deleted').default('building').required()
  }, {
    pk: 'id',
    enforce_extra: 'strict',
    enforce_type: 'strict',
    enforce_missing: true
  })

  Bikeshed.ensureIndex('createdAt')

  Bikeshed.pre('save', (next) => {
    this.updatedAt = new Date()
    next()
  })

  Bikeshed.defineStatic('associate', associate)

  return Bikeshed
}

function associate (models) {
  models.Bikeshed.belongsTo(models.User, 'user', 'userId', 'id')
  models.Bikeshed.hasMany(models.Bike, 'bikes', 'id', 'bikeshedId')
  models.Bikeshed.hasMany(models.Vote, 'votes', 'id', 'bikeshedId')
}
