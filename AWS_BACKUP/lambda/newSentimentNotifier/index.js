//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//Import functions for database
let db = require('database');
//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

exports.handler = async (event) => {
    for (let record of event.Records) {

        //Handle INSERT request only.
        if (record.eventName === "INSERT") {
            let tweetMessage = record.dynamodb.NewImage.tweet_message.S;
            let tweetDate = record.dynamodb.NewImage.date.S;
            let tweetCurrency = record.dynamodb.NewImage.currency.S;
            let tweet_id = record.dynamodb.NewImage.message_id.S;

            // Parameters for call to AWS Comprehend
            let params = {
                LanguageCode: "en", //Possible values include: "en", "es", "fr", "de", "it", "pt"
                Text: tweetMessage
            };

            comprehend.detectSentiment(params, (comprehendErr, data) => {
                //Log result or error
                if (comprehendErr) {
                    console.log("\nError with call to Comprehend:\n" + JSON.stringify(comprehendErr));
                }
                else {
                    console.log("\nSuccessful call to Comprehend:\n" + data.SentimentScore.Positive);

                    //sends data to database.

                    const ddbParams = {
                        TableName: 'sentimentAnalysisData',
                        LanguageCode: "en",
                        Item: {
                            message_id: tweet_id,
                            date: tweetDate,
                            message: tweetMessage,
                            currency: tweetCurrency,
                            Positive: data.SentimentScore.Positive,
                            Negative: data.SentimentScore.Negative,
                            Neutral: data.SentimentScore.Neutral,
                            Mixed: data.SentimentScore.Mixed,
                        },
                    };

                    //Store data in DynamoDB and handle errors
                    ddb.put(ddbParams, (err, data) => {
                        console.log("ATTEMPTING TO ADD");
                        if (err) {
                            console.error("Error JSON:", JSON.stringify(err));
                        }
                        else {
                            console.log("Sentiment analysis added to table:");
                        }
                    });
                }
            });
        }
    }

    console.log(JSON.stringify(event));
    let record = event.Records[0];

    //Handle INSERT request only.
    if (event.Records[0].eventName === "INSERT") {
        let date = record.dynamodb.NewImage.date.S;
        let tweet_message = record.dynamodb.NewImage.tweet_message.S;
        console.log(date);
        console.log(tweet_message);

        console.log("Domain: " + domainName + " stage: " + stage);
        let msg = "date: " + date + " tweet message: " + tweet_message + " and more has been added.";

        //Get promises to send messages to connected clients
        let sendMsgPromises = await ws.getSendMessagePromises(msg, domainName, stage);
        //Execute promises
        await Promise.all(sendMsgPromises);

        const response = {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
        };
        return response;
    }
};