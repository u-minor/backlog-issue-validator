'use strict'
const api = require('./api')

exports.handler = (event, context, callback) => {
  return api(event, context, callback)
}
