import { SynthUtils } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Cdk = require('../lib/cdk-stack');

test('Valid Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Cdk.CdkStack(app, 'MyTestStack');
  // THEN
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
