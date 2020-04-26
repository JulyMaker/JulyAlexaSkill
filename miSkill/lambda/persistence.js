
const awsSdk = require('aws-sdk');

const s3SigV4Client = new awsSdk.S3({
    signatureVersion: 'v4'
});


    function getS3PreSignedUrl(s3ObjectKey) {
        const bucketName = process.env.S3_PERSISTENCE_BUCKET;
        const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: s3ObjectKey,
            Expires: 60*1 // the Expires is capped for 1 minute
        });
        console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
        return s3PreSignedUrl;
    
    }

function getPersistenceAdapter(tableName) {
 // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
 function isAlexaHosted() {
     return process.env.S3_PERSISTENCE_BUCKET;
 }
   if (isAlexaHosted()) {
       const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
       return new S3PersistenceAdapter({
           bucketName: process.env.S3_PERSISTENCE_BUCKET
       });
   } else {
       var myDynamoDB = new awsSdk.DynamoDB({
           endpoint: 'http://localhost:8000',
           accessKeyId: 'Julio',
           secretAccessKey: 'july',
           region: 'eu-west-1',
           apiVersion: 'latest' });

       // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
       const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
       return new DynamoDbPersistenceAdapter({
           tableName: tableName || 'happy_birthday',
           createTable: true,
           dynamoDBClient: myDynamoDB
       });
   }
 }

 function createReminder(requestMoment, scheduledMoment, timezone, locale, message) {
        return {
            requestTime: requestMoment.format('YYYY-MM-DDTHH:mm:00.000'),
            trigger: {
                type: 'SCHEDULED_ABSOLUTE',
                scheduledTime: scheduledMoment.format('YYYY-MM-DDTHH:mm:00.000'),
                timeZoneId: timezone
            },
            alertInfo: {
                spokenInfo: {
                    content: [{
                        locale: locale,
                        text: message
                    }]
                }
            },
            pushNotification: {
                status: 'ENABLED'
            }
        }
    }

module.exports =
{
  getPersistenceAdapter,
  createReminder,
  getS3PreSignedUrl
}