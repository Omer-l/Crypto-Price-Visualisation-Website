namespace Twitter_Sentiment_Scanner {
    let AWS = require("aws-sdk");
    //Holds access keys for APIs
    let pH = require('./passwordsHolder');

    const {TwitterApi} = require('twitter-api-v2');

    //TWITTER 'API KEY' CONFIGURATIONS
    const twitterAPI = new TwitterApi({
        appKey: pH.apiKeys.twitterAppKey,
        appSecret: pH.apiKeys.twitterAppSecret,
        accessToken: pH.apiKeys.twitterAccessToken,
        accessSecret: pH.apiKeys.twitterAccessSecret,
    });
    //AWS 'API KEY' CONFIGURATIONS
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: pH.apiKeys.awsAccessKeyId,
        secretAccessKey: pH.apiKeys.awsSecretAccessKey,
        sessionToken: pH.apiKeys.awsSessionToken
    });
    let documentClient = new AWS.DynamoDB.DocumentClient(); //for pushing onto database table

//For reading in the tweets
    interface Tweet {
        author_id: string,
        created_at: string,
        text: string,
        id: number
    }

    interface Tweets {
        tweets: Array<Tweet>,
    }
function dateToMilliseconds(created_at) {
        // created_at = "2022-01-31T02:35:18.000Z"; //for testing
    created_at = created_at.replaceAll("T", " ");
    created_at = created_at.replaceAll("Z", "");
    let splitT = created_at.split(" ");
    let dateSplit = splitT[0].split("-");
    let timeSplit = splitT[1].split(":");
    let year =  Number(dateSplit[0]);
    let month = Number(dateSplit[1]);
    let day =   Number(dateSplit[2]);
    let hour =  Number(timeSplit[0]);
    let minute =Number( timeSplit[1]);
    let second =Number( timeSplit[2]);
    return new Date(year, month, day, hour, minute, second).getTime();
}

const currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];
const LIMIT = 90;
for(let index = 0; index < currencies.length; index++) {
    let currency = currencies[index];
    twitterAPI.v2.search(currency + 'coin', {
        'tweet.fields': [
            'created_at',
        ],
        'expansions': [
            'author_id',
        ],
        'user.fields': [
            'description',
        ],
        'max_results': [
            LIMIT,
        ]
    }).then((val) => {
        let tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
        tweets.forEach((tweet) => {
            console.log("NEW TWEET : " + JSON.stringify(tweet));
            let timeStamp = dateToMilliseconds(tweet.created_at);
            let tweetId: number = tweet.id;
            let text = tweet.text;
            //Table name and data for table
            let params = {
                TableName: "TwitterTweets",
                Item: {
                    message_id: tweetId,
                    date: tweet.created_at,
                    tweet_message: text,
                    currency: currency
                }
            };
            // Store data in DynamoDB and handle errors
            documentClient.put(params, (err, data) => {
                if (err) {
                    console.error("Unable to add item", params.Item.tweet_message);
                    console.error("Error JSON:", JSON.stringify(err));
                } else {
                    console.log("Tweet added to table:", params.Item);
                }
            });
        });
    }).catch((err) => {
        console.log(err);
    });
}
}