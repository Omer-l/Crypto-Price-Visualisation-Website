var Twitter_Sentiment_Scanner;
(function (Twitter_Sentiment_Scanner) {
    var AWS = require("aws-sdk");
    var TwitterApi = require('twitter-api-v2').TwitterApi;
    //TWITTER 'API KEY' CONFIGURATIONS
    var twitterAPI = new TwitterApi({
        appKey: 'WQlk2KouqzcOTpMnyYyMedPfL',
        appSecret: 'x80LCtbfosizJz6xQrSqx3L8GsUMZcc89fAWwDoL5GPXmS3ATf',
        accessToken: '615346502-R7bC0VOZ4pyTDJNqfkBUAOxktHUFZrLkMNr6AkhP',
        accessSecret: 'NI9xPUy0l8VVN7rXfE2w436qewMiFtKdsdX6rDfx6vHIb',
    });
    //AWS 'API KEY' CONFIGURATIONS
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: 'ASIA2ZOJXFRAKF4RLFOR',
        secretAccessKey: 'Ajk5QFCFVjL5fhK/u3fOjV8td8K9yCSuy0RvUPMl',
        sessionToken: 'FwoGZXIvYXdzEO7//////////wEaDMPb7UXiKatSYTWBbyLFAb1lPhtTLy+9eSgNw3zIKoMqidFSGMz1ZL3xwrZ+MysAsRzgAVd2+oY1YhH2WTSMSJh2HM+pX04XRzba3ORS05wWIUmxQ+74DYms1XBq9KbpcUdfzcGadIetfbzDjtLLkG3tDwRbj9nWl86uZm+bopHJuRZag0j+OCvqQQd3Tcu7zHsjL31JqbdsmErY+6evMBDLdwi+xn3hKydNwC4Ot0XddaSSPxqZieQlKD3q5Z1BtYyR4LrvM8wsiXzYNW+CxtEGACpaKLv92Y8GMi3ziAoRw3ymXwjqeqey7lw8EWHSuXXjLx1Iwzxg6RD/nHMCtYwUHL+MPNYngwQ='
    });
    var documentClient = new AWS.DynamoDB.DocumentClient(); //for pushing onto database table
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
            '90',
        ]
    }).then(function (val) {
        var tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
        tweets.forEach(function (tweet) {
            var text = tweet.text;
            var date = tweet.created_at;
            date = date.replaceAll("T", " ");
            date = date.substring(0, date.indexOf('.'));
            console.log("NEW TWEET DATE: " + date);
            console.log("NEW TWEET : " + text);
            //Table name and data for table
            var params = {
                TableName: "sentimentData",
                Item: {
                    date: date,
                    tweet_message: text
                }
            };
            //Store data in DynamoDB and handle errors
            documentClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item", params.Item.tweet_message);
                    console.error("Error JSON:", JSON.stringify(err));
                }
                else {
                    console.log("Tweet added to table:", params.Item);
                }
            });
        });
    }).catch(function (err) {
        console.log(err);
    });
})(Twitter_Sentiment_Scanner || (Twitter_Sentiment_Scanner = {}));
//# sourceMappingURL=twitter_get_sentiment.js.map