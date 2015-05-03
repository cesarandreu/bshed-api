module.exports = function (thinky, type) {
  var Bike = thinky.createModel('Bike', {
    id: type.string().default(thinky.r.uuid).required(),
    name: type.string().optional(),
    bikeshedId: type.string().required(),
    size: type.number().min(1).max(5000000).required(),
    createdAt: type.date().default(() => new Date()).required(),
    updatedAt: type.date().default(() => new Date()).required(),
    type: type.string().enum('image/png', 'image/jpeg').required(),
    status: type.string().enum('uploading', 'success', 'error').default('uploading').required()
  }, {
    pk: 'id',
    enforce_extra: 'strict',
    enforce_type: 'strict',
    enforce_missing: true
  })

  Bike.pre('save', (next) => {
    this.updatedAt = new Date()
    next()
  })

  Bike.defineStatic('associate', associate)

  return Bike
}

function associate (models) {
  models.Bike.belongsTo(models.Bikeshed, 'bikeshed', 'bikeshedId', 'id')
  models.Bike.hasMany(models.Rating, 'ratings', 'id', 'bikeId')
}
