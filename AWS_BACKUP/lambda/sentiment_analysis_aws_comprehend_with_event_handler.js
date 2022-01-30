//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

// Function readTwitterData
// Reads 10 CryptoDatas from the DynamoDb table CryptoData
// Returns promise
function readTwitterData() {
    const params = {
        TableName: 'sentimentData'
    }
    return ddb.scan(params).promise();
};

//Function that will be called
async function getTweets() {
    let tweets = [];
    try {
        //promise awaiting
        const Item = await readTwitterData();
        Item.Items.forEach(function(item) {
            let tweet = item;
            tweets.push(tweet);
        });
    }
    catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
    }
    return tweets;
}

exports.handler = (event) => {
    for (let record of event.Records) {

        //Handle INSERT request only.
        if (record.eventName === "INSERT") {
            let tweetMessage = record.dynamodb.NewImage.tweet_message.S;
            let tweetDate = record.dynamodb.NewImage.date.S;

            console.log("DATE: " + tweetDate);
            tweetDate = tweetDate.replace("T", " ");

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
                        TableName: 'SentimentAnalysisData',
                        LanguageCode: "en",
                        Item: {
                            date: tweetDate,
                            message: tweetMessage,
                            Positive: data.SentimentScore.Positive,
                            Negative: data.SentimentScore.Negative,
                            Neutral: data.SentimentScore.Neutral,
                            Mixed: data.SentimentScore.Mixed,
                        },
                    };

                    //Store data in DynamoDB and handle errors
                    ddb.put(ddbParams, (err, data) => {
                        if (err) {
                            // console.error("Unable to add item", ddbParams.Item.message);
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
    return {
        statusCode: 200,
        body: "Ok"
    };
};