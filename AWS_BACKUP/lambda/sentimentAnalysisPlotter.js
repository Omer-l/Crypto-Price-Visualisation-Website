//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

//Authentication details for Plotly
const PLOTLY_USERNAME = 'omerka1';
const PLOTLY_KEY = 'CngH9Ebp1Ee7SKaVJVPY';

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

exports.handler = (event) => {
    const tweets = getTweets(); //holds the tweets
    tweets.then((tweets) => { //after promise fulfilled
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
        //plots the results
        let plotResult = plotData(polarityCounter);
    });

    return {
        statusCode: 200,
        body: "Ok"
    };
};



//Plots the specified data
async function plotData(polarityCounter){
    var data = [{
        values: polarityCounter,
        labels: ['Positive', 'Negative', 'Neutral', 'Mixed'],
        type: 'pie'
    }];

    var layout = {
        height: 400,
        width: 500
    };

    return new Promise ( (resolve, reject)=> {
        plotly.plot(data, layout, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
}