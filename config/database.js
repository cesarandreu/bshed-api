var assert = require('assert')

var config = {
  development: {
    db: 'bshed_api_development',
    host: 'localhost',
    port: 28015,
    authKey: ''
  },
  test: {
    db: 'bshed_api_test',
    host: 'localhost',
    port: 28015,
    authKey: ''
  },
  production: {
    db: 'bshed_api_production',
    host: 'localhost',
    port: 28015,
    authKey: ''
  }
}

module.exports = function databaseConfig (env) {
  assert(env && config[env], `database config env ${env} is invalid`)
  return config[env]
}
