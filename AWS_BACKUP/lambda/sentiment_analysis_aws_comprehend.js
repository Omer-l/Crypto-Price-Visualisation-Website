//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

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
        const Item  = await readTwitterData();
        Item.Items.forEach(function(item) {
            let tweetMessage = item.tweet_message;
            tweets.push(tweetMessage);
        });
    }
    catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
    }
    return tweets;
}

exports.handler = (event) => {
    const tweets = getTweets(); //holds the tweets

    tweets.then((tweetMessages) => { //after promise fulfilled

        tweetMessages.forEach(function(tweet) {

            // Parameters for call to AWS Comprehend
            let params = {
                LanguageCode: "en",//Possible values include: "en", "es", "fr", "de", "it", "pt"
                Text: tweet
            };

            comprehend.detectSentiment(params, (comprehendErr, data) => {
                //Log result or error
                if (comprehendErr) {
                    console.log("\nError with call to Comprehend:\n" + JSON.stringify(comprehendErr));
                }
                else {
                    console.log("\nSuccessful call to Comprehend:\n" + JSON.stringify(data));
                }
            });
        });
    });

    return {
        statusCode: 200,
        body: "Ok"
    };
};