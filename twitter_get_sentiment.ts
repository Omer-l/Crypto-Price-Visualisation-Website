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
        accessKeyId: 'ASIA2ZOJXFRAAUVTPTBS',
        secretAccessKey: '371USrO7izMH2prtOuXnNUc+Oa+PoyizlYdzkTV6',
        sessionToken: 'FwoGZXIvYXdzEEAaDOUSbZBecusfx8ca4CLFAbNFCbVpj83BjoGw5rstlDV28V9CouC7Pn6CO0sDzTZmRsx4X0qukdPDcBFZbMplctLxkgMgObwGuyXqLGFNwnV6p+nhZrTAhkQoVWPCXkO76mRSpTH1B3RXPwQ1bZCFtr947JSRH4eJEWymfMAIXo/18XPi/iSz7uAV19Xx8ju1FnmSz6BVwBbIjJqG2ntlHzRld0u1LVEjtypCYu1zIwVlu3FZg2CPchdtI8nNnn9XI31GKQ4rgEzegmHDgHCbxemr/Q0+KKTJ+44GMi3KWc7DZNUSWIh9ZYh3QtYIwjlZHQ/zKr/pe4Ro1U1k8wIlNbiFzy9YpgL21O4='
    });

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

    let tweets: Array<Tweet>; //holds tweets

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
        let tweets = JSON.parse(JSON.stringify(val.data['data']));
        console.log(tweets[0]);


        //Store data in DynamoDB and handle errors
        // documentClient.put(params, (err, data) => {
        //     if (err) {
        //         console.error("Unable to add item", params.Item.Currency);
        //         console.error("Error JSON:", JSON.stringify(err));
        //     } else {
        //         console.log("Currency added to table:", params.Item);
        //     }
        // });
    }).catch((err) => {
        console.log(err);
    });
}