#!/usr/bin/env bash

# clean build
mkdir -p build dist
rm build/*.js build/logic.yml dist/* > /dev/null

# copy resources
cp src/*.js src/logic.yml build
cp package.json yarn.lock build

pushd build

# install dependencies
yarn install --production

# pack assets
rm package.json yarn.lock
zip -r ../dist/${npm_package_version}.zip .

popd
