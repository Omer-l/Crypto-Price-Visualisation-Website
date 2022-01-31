//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//Import external library with websocket functions
let ws = require('websocket');

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

//Authentication details for Plotly
const PLOTLY_USERNAME = 'omerka1';
const PLOTLY_KEY = 'CngH9Ebp1Ee7SKaVJVPY';


//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

//Initialize Plotly with user details.
let plotly = require('plotly')(PLOTLY_USERNAME, PLOTLY_KEY);

// Function readTwitterData
// Reads Twitter data from the DynamoDb table sentimentData
// Returns promise
function readTwitterData() {
    const params = {
        TableName: 'SentimentAnalysisData'
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

exports.handler = async (event) => {
    const tweets = getTweets(); //holds the tweets
    //count polarity of each tweet, is it mostly positive? negative? neutral? mixed?
    let counter = await tweets.then((tweets) => { //after promise fulfilled
        let polarityCounter = [0, 0, 0, 0]; //index: 0 = positive, 1 = negative, 2 = neutral, 3 = mixed

        tweets.forEach(function(tweet) {
            let positive = tweet.Positive;
            let negative = tweet.Negative;
            let neutral = tweet.Neutral;
            let mixed = tweet.Mixed;

            //gets highest sentiment score
            let sentimentScores = [positive, negative, neutral, mixed];
            const max = Math.max(...sentimentScores);
            const index = sentimentScores.indexOf(max);

            //highest sentiment score's index is incremented in polarityCounter.
            polarityCounter[index]++;

        });
        return polarityCounter;
    });

    let msg = {
        data : {
            values: counter,
            labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
            type: 'pie'
        },
        layout : {
            height: 400,
            width: 500
        }};
    let msgString = JSON.stringify(msg);
    console.log("HELLOW: " + msgString);
    //Get promises to send messages to connected clients
    let sendMsgPromises = await ws.getSendMessagePromises(msgString, domainName, stage);
    //Execute promises
    await Promise.all(sendMsgPromises);

    // plots the results
    // plotData(polarityCounter);

    return {
        statusCode: 200,
        body: "Ok"
    };
};



//Plots the specified data
function plotData(polarityCounter){
    var data = [{
        values: polarityCounter,
        labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
        type: 'pie'
    }];

    var layout = {
        height: 400,
        width: 500
    };
    plotly.plot(data, layout);
}