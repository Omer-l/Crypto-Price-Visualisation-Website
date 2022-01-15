
const {TwitterApi} = require('twitter-api-v2');

const client = new TwitterApi({
    appKey: 'WQlk2KouqzcOTpMnyYyMedPfL',
    appSecret: 'x80LCtbfosizJz6xQrSqx3L8GsUMZcc89fAWwDoL5GPXmS3ATf',
    accessToken: '615346502-R7bC0VOZ4pyTDJNqfkBUAOxktHUFZrLkMNr6AkhP',
    accessSecret: 'NI9xPUy0l8VVN7rXfE2w436qewMiFtKdsdX6rDfx6vHIb',
});

client.v2.search('bitcoin', {
    'tweet.fields': [
        'created_at',
    ],
    'expansions': [
        'author_id',
    ],
    'user.fields': [
        'description',
    ],
    // 'max_results': [
    //     '2',
    // ]
}).then((val) => {
    let data = val.data;
    // data.forEach((tweet) => {
        console.log(data);
    // });
}).catch((err) => {
    console.log(err);
})