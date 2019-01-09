#!/usr/bin/env bash
function_name=$(aws cloudformation describe-stack-resources \
  --stack-name backlog-issue-validator \
  --output text \
  --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId')
aws lambda update-function-code \
  --function-name ${function_name} \
  --s3-bucket ${AWS_S3_BUCKET} \
  --s3-key ${AWS_S3_PATH}lambda/${npm_package_version}.zip
