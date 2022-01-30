//Import functions for database
let db = require('database');
//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    let record = event.Records[0];

    //Handle INSERT request only.
    if (record.eventName === "INSERT") {
        let date = record.dynamodb.NewImage.date.S;
        let tweet_message = record.dynamodb.NewImage.tweet_message.S;
        console.log(date);
        console.log(tweet_message);

        console.log("Domain: " + domainName + " stage: " + stage);
        let msg = "date: " + date + " tweet message: " + tweet_message + " has been added, click the refresh button to view the changes.";

        //Get promises to send messages to connected clients
        let sendMsgPromises = await ws.getSendMessagePromises(msg, domainName, stage);
        //Execute promises
        await Promise.all(sendMsgPromises);

        const response = {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
        };
        return response;
    }
};