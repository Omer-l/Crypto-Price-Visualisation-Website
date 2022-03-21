//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//Import external library with websocket functions
let ws = require('websocket');

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

// Function readTwitterData
// Reads Twitter data from the DynamoDb table sentimentData
// Returns promise
function readTwitterData() {
    const params = {
        TableName: 'sentimentAnalysisData'
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

let currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];

exports.handler = async (event) => {
    let connectionId = event.requestContext.connectionId;
    const tweets = getTweets(); //holds the tweets
    //count polarity of each tweet, is it mostly positive? negative? neutral? mixed?
    let counter = await tweets.then((tweets) => { //after promise fulfilled
        let polarityCounter = [
            //For each crypto polarityCounter: index: 0 = positive, 1 = negative, 2 = neutral, 3 = mixed
            [0, 0, 0, 0], //crypto 1  i.e., SOL
            [0, 0, 0, 0], //crypto 2 i.e., LINK
            [0, 0, 0, 0], //crypto 3 i.e., LUNA
            [0, 0, 0, 0], //crypto 4 i.e., ATOM
            [0, 0, 0, 0],];//crypto 5 i.e., DOT


        tweets.forEach(function(tweet) {
            let indexOfCrypto = currencies.indexOf(tweet.currency);
            let positive = tweet.Positive;
            let negative = tweet.Negative;
            let neutral = tweet.Neutral;
            let mixed = tweet.Mixed;

            //gets highest sentiment score
            let sentimentScores = [positive, negative, neutral, mixed];
            const max = Math.max(...sentimentScores);
            const index = sentimentScores.indexOf(max);
            console.log(polarityCounter);
            //highest sentiment score's index is incremented in polarityCounter.
            polarityCounter[indexOfCrypto][index]++;

        });
        return polarityCounter;
    });

    let msg = {
        data : [
            {
                values: counter[0],
                labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                type: 'pie'
            }, {
                values: counter[1],
                labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                type: 'pie'
            }, {
                values: counter[2],
                labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                type: 'pie'
            }, {
                values: counter[3],
                labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                type: 'pie'
            }, {
                values: counter[4],
                labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
                type: 'pie'
            }
        ],

        layout : {
            height: 400,
            width: 500
        }
    };
    let msgString = JSON.stringify(msg);
    console.log("HELLOW: " + msgString);
    //Get promises to send messages to connected clients
    //Get promises to send messages to connected clients
    let sendMsgPromises = await ws.getSendMessagePromises(msgString, domainName, stage, connectionId);
    //Execute promises
    await Promise.all(sendMsgPromises);

    return {
        statusCode: 200,
        body: "Ok"
    };
};