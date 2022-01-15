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
        accessKeyId: 'ASIA2ZOJXFRAI2IHXEWM',
        secretAccessKey: '3EiFOlW/DJRriFN4EpdVa8NBMtZkKItwOtpZkgUt',
        sessionToken: 'FwoGZXIvYXdzEIv//////////wEaDDfaUK0VgqQuI0m/KCLFAWQ5Uz3aB5UkGeIQdBw5cu3VV+jsWCUqX5XGpDASNEXUEghK8eBW8vlnzFnwp1kXNgh233L9agvp+06eYyBBENQVX5cnIDJYDBggJF6l3bf0B73Emx6IoKqIfNxLW7taW1eDvA+t1B/1XWBhU8+jHGHy0snEmyrNc7A93Ss4LWh4dzT3YAdYZ1Ah0dp/yVnfdtRU1g6IMW2Vb0a3wbStNacdO4aazGY36UVmHDRHOtlgBjMWqY05bsHi0Va+eIpz/GmLZFnfKKCDjI8GMi15NbJsOShjZoI5NZyER5XlfrGq4YhUlpGri9jIztwaU4H4maOZSVyFcIE5aHU='
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

    twitterAPI.v2.search('bitcoin', {
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
            '10',
        ]
    }).then((val) => {
        let tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
        tweets.forEach((tweet) => {
        let text = tweet.text;
        let date = tweet.created_at;
        date = date.replaceAll("T", " ");
        date = date.substring(0, date.indexOf('.'));

            console.log("NEW TWEET DATE: " + date);
        console.log("NEW TWEET : " + text);

            //Table name and data for table
            let params = {
                TableName: "sentimentData",
                Item: {
                    date: date,
                    tweet_message: text
                }
            };
            //Store data in DynamoDB and handle errors
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