var debug = require('debug')('bshed:api:models')
var Thinky = require('thinky')

/**
 * Model loader
 *
 * @param {Object} [opts={}] - options
 * @param {Object} [opts.database={}] - database config
 * @returns {Object} Models
 */
module.exports = function modelLoader (config={}) {
  debug('start')
  var thinky = Thinky(config.database)
  var type = thinky.type
  var r = thinky.r

  var loaders = {}
  var models = [
    'User',
    'Bike',
    'Vote',
    'Rating',
    'Bikeshed'
  ].reduce((models, name) => {
    debug(`loading ${name}`)
    loaders[name] = require(`./${name.toLowerCase()}`)
    models[name] = loaders[name](thinky, type)
    return models
  }, {
    thinky,
    r
  })

  Object.keys(models)
  .filter(name => 'associate' in models[name])
  .map(name => {
    debug(`associating ${name}`)
    models[name].associate(models)
  })

  debug('end')
  return models
}
