'use strict'
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')
const jsonLogic = require('json-logic-js')
const request = require('request-promise-native')
const response = require('./response')
const rules = yaml.safeLoad(fs.readFileSync(`${__dirname}/logic.yml`))

module.exports = async (event, context, callback) => {
  if (event.path !== '/notify' || event.httpMethod !== 'POST') {
    return callback(null, response(400))
  }

  const backlog = JSON.parse(event.body)
  if (!backlog || !backlog.id) {
    console.error('cannot parse body:', event.body)
    return callback(null, response(400))
  }

  console.log(`Start ${backlog.project.projectKey}-${backlog.content.key_id}`)

  const [user, issue] = await Promise.all([
    fetchBacklogUser(),
    fetchBacklogIssue(backlog.project.projectKey, backlog.content.key_id)
  ])

  if (issue.updatedUser.id === user.id) {
    console.log('updated user is myself, skipped...')
    callback(null, response(200, 'OK'))
    return
  }

  const messages = []

  _.forEach(rules, (val, key) => {
    const ret = jsonLogic.apply(val.rule, issue)
    console.log(`checking ${key}... ${ret}`)
    if (!ret) {
      messages.push(val.error)
    }
  })

  if (!messages.length) {
    console.log('no error found, finished.')
    callback(null, response(200, 'OK'))
    return
  }

  console.log('found some errors, updating issue...')
  try {
    const ret = await updateBacklogIssue(backlog.project.projectKey, backlog.content.key_id, {
      assigneeId: issue.createdUser.id,
      notifiedUserId: [issue.createdUser.id],
      statusId: 1,
      comment: messages.join('\n')
    })
    console.log(ret)
    console.log('finished.')
    callback(null, response(200, 'OK'))
  } catch (err) {
    console.log(`error: ${err}`)
    callback(null, response(500, err))
  }
}

/**
 * fetch backlog issue
 * @param projectKey
 * @param issueKey
 */
const fetchBacklogIssue = (projectKey, issueKey) =>
  request({
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/issues/${projectKey}-${issueKey}`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    json: true
  })

const fetchBacklogUser = () =>
  request({
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/users/myself`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    json: true
  })

const updateBacklogIssue = (projectKey, issueKey, params) =>
  request({
    method: 'PATCH',
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/issues/${projectKey}-${issueKey}`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    form: params
  })
