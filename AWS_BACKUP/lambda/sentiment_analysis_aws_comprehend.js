//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

//Text with positive sentiments about CSD3205
let positiveText = "CSD3205 is a great course. I really love CSD3205. CSD3205 is fantastic.";

//Text with negative sentiments about CSD3205
let negativeText = "CSD3205 is awful. I really hate CSD3205. CSD3205 is terrible.";

//Parameters for call to AWS Comprehend
let params = {
    LanguageCode: "en",//Possible values include: "en", "es", "fr", "de", "it", "pt"
    Text: positiveText
};


// Function readCryptoData
// Reads 10 CryptoDatas from the DynamoDb table CryptoData
// Returns promise
function readCryptoData() {
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
        const Item  = await readCryptoData();
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
    const tweets = getTweets();

    tweets.then((tweetMessages) => {

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