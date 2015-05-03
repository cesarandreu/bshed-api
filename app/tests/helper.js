var server = require('../../server')
var supertest = require('supertest-as-promised')
var buildHeadersHelper = require('../../test/buildHeaders')

module.exports = {
  server: server,
  models: server.models,
  config: server.config,
  request: supertest(server.callback()),
  buildHeaders: buildHeadersHelper({
    key: server.config.middleware.session.key,
    secrets: server.config.keys
  })
}

// // https://github.com/neumino/rethinkdbdash#connection-pool
// after(function* closeRethinkDbConnections () {
//   yield server.models.r.getPoolMaster().drain()
// })
