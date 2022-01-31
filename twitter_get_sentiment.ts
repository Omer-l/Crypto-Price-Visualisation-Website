namespace Twitter_Sentiment_Scanner {
    let AWS = require("aws-sdk");

    const {TwitterApi} = require('twitter-api-v2');

    //TWITTER 'API KEY' CONFIGURATIONS
    const twitterAPI = new TwitterApi({
        appKey: 'WQlk2KouqzcOTpMnyYyMedPfL',
        appSecret: 'x80LCtbfosizJz6xQrSqx3L8GsUMZcc89fAWwDoL5GPXmS3ATf',
        accessToken: '615346502-R7bC0VOZ4pyTDJNqfkBUAOxktHUFZrLkMNr6AkhP',
        accessSecret: 'NI9xPUy0l8VVN7rXfE2w436qewMiFtKdsdX6rDfx6vHIb',
    });
    //AWS 'API KEY' CONFIGURATIONS
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: 'ASIA2ZOJXFRAMOWO2UP3',
        secretAccessKey: 'VnPNzZc8HS9HZFCsbpghK43OdaQ92MomTzyXYfGz',
        sessionToken: 'FwoGZXIvYXdzEPr//////////wEaDLqNmllYG4dOjLdRUyLFAZ1zOdL+55BB1maonCl6Tikrc+q25DKzqiKiuRxgrz+/gk7MgJ6O+lkBUC6v4VznR/ZMHx29EW761FELGTi28byg3cs5k6gMnTfe9Fgpear+BUql8p9t14HrF7UfgT2RDHLslKMuw2TEbM4JZN6naq3nShr1L6Q8Je6V5SjDDSA1MfFlUgALiMkzUcjiR86bP+YQ9YiPqoC9F5HzDeIHrxyGtvkXtbgwARoHFq24QbbXcwTj0gJNFGAnL0YBY5mxC9e3Q2/cKLfQ3I8GMi3IpOMfHLo+d7QFBPVwcSEhlpvFhuKRMsGKdTp324tWFYJIJ2o8QvcK5Ri0eKw='
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
    let created_at = "2022-01-31T02:35:18.000Z";
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

let currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];
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
            '100',
        ]
    }).then((val) => {
        let tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
        tweets.forEach((tweet) => {
            console.log("NEW TWEET : " + JSON.stringify(tweet));
            let timeStamp = dateToMilliseconds(tweet.created_at);
            let tweetId = tweet.id;
            let text = tweet.text;
            //Table name and data for table
            let params = {
                TableName: "sentimentData",
                Item: {
                    date: tweet.created_at,
                    tweet_id: tweetId,
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