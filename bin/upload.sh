#!/usr/bin/env bash

aws s3 cp cf/stack.yml s3://${AWS_S3_BUCKET}/${AWS_S3_PATH}
aws s3 cp dist/${npm_package_version}.zip s3://${AWS_S3_BUCKET}/${AWS_S3_PATH}lambda/
