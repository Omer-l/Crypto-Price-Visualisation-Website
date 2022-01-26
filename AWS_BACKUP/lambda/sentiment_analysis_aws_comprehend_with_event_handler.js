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
    const tweets = getTweets(); //holds the tweets

    tweets.then((tweets) => { //after promise fulfilled

        tweets.forEach(function(tweet) {
            let tweetMessage = tweet.tweet_message;
            let tweetDate = tweet.date;
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
                else { //SAMPLE : { "Sentiment": "NEUTRAL", "SentimentScore": { "Positive": 0.05800758674740791, "Negative": 0.014315063133835793, "Neutral": 0.9269210696220398, "Mixed": 0.0007562938844785094 } }
                    console.log("\nSuccessful call to Comprehend:\n" + data.SentimentScore.Positive);

                    //sends data to database.

                    const ddbParams = {
                        TableName: 'SentimentAnalysisData',
                        LanguageCode: "en",
                        Item: {
                            date: tweetDate,
                            message: tweetMessage,
                            positiveScore: data.SentimentScore.Positive,
                            neutralScore: data.SentimentScore.Neutral,
                            negativeScore: data.SentimentScore.Negative,
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
        });
    });

    return {
        statusCode: 200,
        body: "Ok"
    };
};
