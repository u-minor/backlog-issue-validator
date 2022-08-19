import _ = require('lodash');
import fs = require('fs');
import request = require('request-promise-native');
import yaml = require('js-yaml');
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import jsonLogic = require('json-logic-js');
import { RequestPromise } from 'request-promise-native';

declare interface BacklogIssueRequest {
  assigneeId: string;
  notifiedUserId: string[];
  statusId: number;
  comment: string;
}

const rules = yaml.safeLoad(
  fs.readFileSync(`${__dirname}/logic.yml`, { encoding: 'utf-8' })
);

const fetchBacklogIssue = (
  projectKey: string,
  issueKey: string
): RequestPromise =>
  request({
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/issues/${projectKey}-${issueKey}`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    json: true
  });

const fetchBacklogUser = (): RequestPromise =>
  request({
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/users/myself`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    json: true
  });

const updateBacklogIssue = (
  projectKey: string,
  issueKey: string,
  params: BacklogIssueRequest
): RequestPromise =>
  request({
    method: 'PATCH',
    uri: `${process.env.BACKLOG_BASE_URL}/api/v2/issues/${projectKey}-${issueKey}`,
    qs: {
      apiKey: process.env.BACKLOG_API_KEY
    },
    form: params
  });

export const handler: AWSLambda.Handler = async (
  event: AWSLambda.APIGatewayEvent
) => {
  console.log(event);

  if (event.path !== '/' || event.httpMethod !== 'POST') {
    return {
      statusCode: 400,
      body: {
        message: 'invalid request'
      }
    };
  }

  const backlog = JSON.parse(event.body || '');
  if (!backlog || backlog.id === undefined) {
    console.error('cannot parse body:', event.body);
    return {
      statusCode: 400,
      body: {
        message: 'invalid request'
      }
    };
  }

  console.log(`Start ${backlog.project.projectKey}-${backlog.content.key_id}`);

  const [user, issue] = await Promise.all([
    fetchBacklogUser(),
    fetchBacklogIssue(backlog.project.projectKey, backlog.content.key_id)
  ]);

  if (issue.updatedUser.id === user.id) {
    console.log('updated user is myself, skipped...');
    return {
      statusCode: 200,
      body: {
        message: 'OK'
      }
    };
  }

  const messages: string[] = [];

  _.forEach(rules, (val: any, key: string) => {
    const ret = jsonLogic.apply(val.rule, issue);
    console.log(`checking ${key}... ${ret}`);
    if (!ret) {
      messages.push(val.error);
    }
  });

  if (!messages.length) {
    console.log('no error found, finished.');
    return {
      statusCode: 200,
      body: {
        message: 'OK'
      }
    };
  }

  console.log('found some errors, updating issue...');
  try {
    const ret = await updateBacklogIssue(
      backlog.project.projectKey,
      backlog.content.key_id,
      {
        assigneeId: issue.createdUser.id,
        notifiedUserId: [issue.createdUser.id],
        statusId: 1,
        comment: messages.join('\n')
      }
    );
    console.log(ret);
    console.log('finished.');
    return {
      statusCode: 200,
      body: {
        message: 'OK'
      }
    };
  } catch (err) {
    console.log(`error: ${err}`);
    return {
      statusCode: 500,
      body: {
        message: err instanceof Error ? err.toString() : ''
      }
    };
  }
};
