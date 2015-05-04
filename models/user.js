module.exports = function (thinky, type) {
  var User = thinky.createModel('User', {
    name: type.string().max(255).required(),
    email: type.string().min(3).max(254).email().required(),
    updatedAt: type.date().default(() => new Date()).required(),
    createdAt: type.date().default(() => new Date()).required()
  }, {
    pk: 'name',
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
  models.User.hasMany(models.Bikeshed, 'bikesheds', 'name', 'username')
  models.User.hasMany(models.Vote, 'votes', 'name', 'username')
}
