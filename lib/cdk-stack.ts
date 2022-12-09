import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // setting Sentry 哨兵
    const dataAccessLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'SentryNodeServerlessSDK',
      'arn:aws:lambda:ap-northeast-1:943013980633:layer:SentryNodeServerlessSDK:76'
    );

    // setting Policy 政策
    const myCustomPolicy = new iam.PolicyStatement({
      "sid": "VisualEditor0",
      "effect": iam.Effect.ALLOW,
      "actions":[
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "resources": ["*"]
    });

    // 整和請求 application/json
    const requestTemplate = `{
      "method": "$context.httpMethod",
      "body" : $input.json('$'),
      "headers": {
        #foreach($param in $input.params().header.keySet())
        "$param": "$util.escapeJavaScript($input.params().header.get($param))" #if($foreach.hasNext),#end
    
        #end
      },
      "queryParams": {
        #foreach($param in $input.params().querystring.keySet())
        "$param": "$util.escapeJavaScript($input.params().querystring.get($param))" #if($foreach.hasNext),#end
    
        #end
      },
      "pathParams": {
        #foreach($param in $input.params().path.keySet())
        "$param": "$util.escapeJavaScript($input.params().path.get($param))" #if($foreach.hasNext),#end
    
        #end
      }  
    }`

    const main = new lambda.Function(this, "lambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: "a-test-function",
      description: "這是一個a-test介紹",
      memorySize: 256,
      timeout: cdk.Duration.seconds(5),
      layers: [dataAccessLayer],
      initialPolicy: [myCustomPolicy],
      code: lambda.Code.fromAsset(path.resolve(__dirname, "../lambda"))
    });

    const main2 = new lambda.Function(this, "lambda2", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: "b-test-function",
      description: "這是一個b-test介紹",
      memorySize: 384,
      timeout: cdk.Duration.seconds(4),
      layers: [dataAccessLayer],
      initialPolicy: [myCustomPolicy],
      code: lambda.Code.fromAsset(path.resolve(__dirname, "../lambda2"))
    });

    // setting API 
    const api = new apigateway.RestApi(this, 'devAPI_test', {
      description: 'dev api gateway test',
      deployOptions: {
        stageName: 'dev'
      }
    });

    const getA = api.root.addResource('getA');
    getA.addMethod(
      'GET',
      new apigateway.LambdaIntegration(main, {
        proxy: false,
        integrationResponses: [
          { statusCode: '200' },
          {
            selectionPattern: '.*"code":403.*',
            statusCode: '403',
            responseTemplates: {
              'application/json': '$input.path(\'$.errorMessage\')'
            }
          },
          {
            selectionPattern: '.*"code":406.*',
            statusCode: '406',
            responseTemplates: {
              'application/json': '$input.path(\'$.errorMessage\')'
            }
          }
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': requestTemplate
        }
      }),
      {
        methodResponses: [
          { statusCode: '200'},
          { statusCode: '403'},
          { statusCode: '406'}
        ]
      }
    );

    const getB = getA.addResource('getB');
    getB.addMethod(
      'GET',
      new apigateway.LambdaIntegration(main2, {
        proxy: false,
        integrationResponses: [
          { statusCode: '200'},
          {
            selectionPattern: '.*"code":403.*',
            statusCode: '403',
            responseTemplates: {
              'application/json': '$input.path(\'$.errorMessage\')'
            }
          },
          {
            selectionPattern: '.*"code":406.*',
            statusCode: '406',
            responseTemplates: {
              'application/json': '$input.path(\'$.errorMessage\')'
            }
          }
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          'application/json': requestTemplate
        }
      }),
      {
        methodResponses: [
          { statusCode: '200'},
          { statusCode: '403'},
          { statusCode: '406'}
        ]
      }
    );
  }
}

