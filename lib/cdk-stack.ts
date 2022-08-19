import cdk = require('@aws-cdk/core');
import apiGateway = require('@aws-cdk/aws-apigateway');
import lambda = require('@aws-cdk/aws-lambda');
import config = require('config');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunc = new lambda.Function(this, 'Lambda', {
      code: lambda.Code.fromAsset('build'),
      description: 'backlog-issue-validator',
      environment: {
        BACKLOG_API_KEY: config.get('backlogApiKey'),
        BACKLOG_BASE_URL: config.get('backlogBaseUrl')
      },
      functionName: `${id}-LambdaFunction`,
      handler: 'index.handler',
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.seconds(30)
    });

    const api = new apiGateway.RestApi(this, 'RestApi', {
      description: 'backlog-issue-validator',
      restApiName: `${id}-API`
    });
    const integration = new apiGateway.LambdaIntegration(lambdaFunc);
    api.root.addMethod('POST', integration);
  }
}
