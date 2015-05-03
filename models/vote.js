module.exports = function (thinky, type) {
  var Vote = thinky.createModel('Vote', {
    id: type.string().default(thinky.r.uuid).required(),
    userId: type.string().required(),
    bikeshedId: type.string().required(),
    updatedAt: type.date().default(() => new Date()).required(),
    createdAt: type.date().default(() => new Date()).required()
  }, {
    pk: 'id',
    enforce_extra: 'strict',
    enforce_type: 'strict',
    enforce_missing: true
  })

  Vote.pre('save', (next) => {
    this.updatedAt = new Date()
    next()
  })

  Vote.defineStatic('associate', associate)

  return Vote
}

function associate (models) {
  models.Vote.belongsTo(models.Bikeshed, 'bikeshed', 'bikeshedId', 'id')
  models.Vote.belongsTo(models.User, 'user', 'userId', 'id')
  models.Vote.hasMany(models.Rating, 'ratings', 'id', 'voteId')
}
