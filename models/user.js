module.exports = function (thinky, type) {
  var User = thinky.createModel('User', {
    id: type.string().default(thinky.r.uuid).required(),
    name: type.string().max(255).default('').required(),
    email: type.string().min(3).max(254).email().required(),
    updatedAt: type.date().default(() => new Date()).required(),
    createdAt: type.date().default(() => new Date()).required()
  }, {
    pk: 'id',
    enforce_extra: 'strict',
    enforce_type: 'strict',
    enforce_missing: true
  })

  User.pre('save', (next) => {
    this.updatedAt = new Date()
    next()
  })

  User.defineStatic('associate', associate)

  return User
}

function associate (models) {
  models.User.hasMany(models.Bikeshed, 'bikesheds', 'id', 'userId')
  models.User.hasMany(models.Vote, 'votes', 'id', 'userId')
}
