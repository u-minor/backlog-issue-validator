#!/usr/bin/env bash

# clean build
mkdir -p build
rm build/*.js build/logic.yml > /dev/null

# copy resources
cp lambda/*.js lambda/logic.yml build
cp package.json package-lock.json build

pushd build

# install dependencies
npm install --production
rm package.json package-lock.json

popd
