#!/usr/bin/env bash
aws cloudformation create-stack \
  --stack-name backlog-issue-validator \
  --capabilities CAPABILITY_IAM \
  --parameters file://cf/params.json \
  --template-url https://${AWS_S3_BUCKET}.s3-ap-northeast-1.amazonaws.com/${AWS_S3_PATH}stack.yml
