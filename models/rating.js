module.exports = function (thinky, type) {
  var Rating = thinky.createModel('Rating', {
    id: type.string().default(thinky.r.uuid).required(),
    bikeId: type.string().required(),
    voteId: type.string().required(),
    value: type.number().min(1).max(10).required(),
    updatedAt: type.date().default(() => new Date()).required(),
    createdAt: type.date().default(() => new Date()).required()
  }, {
    pk: 'id',
    enforce_extra: 'strict',
    enforce_type: 'strict',
    enforce_missing: true
  })

  Rating.pre('save', (next) => {
    this.updatedAt = new Date()
    next()
  })

  Rating.defineStatic('associate', associate)

  return Rating
}

function associate (models) {
  models.Rating.belongsTo(models.Bike, 'bike', 'bikeId', 'id')
  models.Rating.belongsTo(models.Vote, 'vote', 'voteId', 'id')
}
