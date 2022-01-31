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
        accessKeyId: 'ASIA2ZOJXFRAKF4RLFOR',
        secretAccessKey: 'Ajk5QFCFVjL5fhK/u3fOjV8td8K9yCSuy0RvUPMl',
        sessionToken: 'FwoGZXIvYXdzEO7//////////wEaDMPb7UXiKatSYTWBbyLFAb1lPhtTLy+9eSgNw3zIKoMqidFSGMz1ZL3xwrZ+MysAsRzgAVd2+oY1YhH2WTSMSJh2HM+pX04XRzba3ORS05wWIUmxQ+74DYms1XBq9KbpcUdfzcGadIetfbzDjtLLkG3tDwRbj9nWl86uZm+bopHJuRZag0j+OCvqQQd3Tcu7zHsjL31JqbdsmErY+6evMBDLdwi+xn3hKydNwC4Ot0XddaSSPxqZieQlKD3q5Z1BtYyR4LrvM8wsiXzYNW+CxtEGACpaKLv92Y8GMi3ziAoRw3ymXwjqeqey7lw8EWHSuXXjLx1Iwzxg6RD/nHMCtYwUHL+MPNYngwQ='
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
    let date = new Date(year, month, day, hour, minute, second);
}

    // twitterAPI.v2.search('bitcoin', {
    //     'tweet.fields': [
    //         'created_at',
    //     ],
    //     'expansions': [
    //         'author_id',
    //     ],
    //     'user.fields': [
    //         'description',
    //     ],
    //     'max_results': [
    //         '11',
    //     ]
    // }).then((val) => {
    //     let tweets = JSON.parse(JSON.stringify(val.data['data'])); //holds tweets
    //     tweets.forEach((tweet) => {
    //     // let text = tweet.text;
    //     // let date = tweet.created_at;
    //     // date = date.replaceAll("T", " ");
    //     // date = date.substring(0, date.indexOf('.'));
    //     //
    //     //     console.log("NEW TWEET DATE: " + date);
    //     console.log("NEW TWEET : " + JSON.stringify(tweet));
    //
    //         //Table name and data for table
    //         let params = {
    //             TableName: "sentimentData",
    //             Item: {
    //                 date: date,
    //                 tweet_message: text
    //             }
    //         };
    //         //Store data in DynamoDB and handle errors
    //         // documentClient.put(params, (err, data) => {
    //         //     if (err) {
    //         //         console.error("Unable to add item", params.Item.tweet_message);
    //         //         console.error("Error JSON:", JSON.stringify(err));
    //         //     } else {
    //         //         console.log("Tweet added to table:", params.Item);
    //         //     }
    //         // });
    //     });
    // }).catch((err) => {
    //     console.log(err);
    // });
}