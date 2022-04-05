var Twitter_Sentiment_Scanner;
(function (Twitter_Sentiment_Scanner) {
    var AWS = require("aws-sdk");
    //Holds access keys for APIs
    var pH = require('./passwordsHolder');
    var TwitterApi = require('twitter-api-v2').TwitterApi;
    //TWITTER 'API KEY' CONFIGURATIONS
    var twitterAPI = new TwitterApi({
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
    var documentClient = new AWS.DynamoDB.DocumentClient(); //for pushing onto database table
    function dateToMilliseconds(created_at) {
        // created_at = "2022-01-31T02:35:18.000Z"; //for testing
        created_at = created_at.replaceAll("T", " ");
        created_at = created_at.replaceAll("Z", "");
        var splitT = created_at.split(" ");
        var dateSplit = splitT[0].split("-");
        var timeSplit = splitT[1].split(":");
        var year = Number(dateSplit[0]);
        var month = Number(dateSplit[1]);
        var day = Number(dateSplit[2]);
        var hour = Number(timeSplit[0]);
        var minute = Number(timeSplit[1]);
        var second = Number(timeSplit[2]);
        return new Date(year, month, day, hour, minute, second).getTime();
    }
    var currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];
    var limit = 30;
    var _loop_1 = function (index) {
        var currency = currencies[index];
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
                limit,
            ]
        }).then(function (val) {
            var tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
            tweets.forEach(function (tweet) {
                console.log("NEW TWEET : " + JSON.stringify(tweet));
                var timeStamp = dateToMilliseconds(tweet.created_at);
                var tweetId = tweet.id;
                var text = tweet.text;
                //Table name and data for table
                var params = {
                    TableName: "TwitterTweets",
                    Item: {
                        message_id: tweetId,
                        date: tweet.created_at,
                        tweet_message: text,
                        currency: currency
                    }
                };
                // Store data in DynamoDB and handle errors
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
    };
    for (var index = 0; index < currencies.length; index++) {
        _loop_1(index);
    }
})(Twitter_Sentiment_Scanner || (Twitter_Sentiment_Scanner = {}));
//# sourceMappingURL=twitter_get_sentiment.js.map