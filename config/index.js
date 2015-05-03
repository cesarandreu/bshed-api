var debug = require('debug')('bshed:api:config')
var _ = require('lodash')

var awsConfig = require('./aws')
var serverConfig = require('./server')
var databaseConfig = require('./database')

/**
 * Config generator
 * Takes optional object to overwrite default configuration
 *
 * @param {Object} [overwrite={}]
 * @returns {Object} New configuration object
 */
module.exports = function configGenerator (overwrite={}) {
  debug('start')

  var env = overwrite.env || process.env.NODE_ENV || 'development'
  debug(`using ${env} env`)

  var config = _.merge({
    env: env,
    apiEndpoint: '/api',
    name: 'bshed-api',
    middleware: {
      session: {
        key: `bshed-api-${env}`
      }
    },
    aws: awsConfig(env),
    database: databaseConfig(env)
  }, serverConfig(env), overwrite)

  debug('end')
  return config
}
