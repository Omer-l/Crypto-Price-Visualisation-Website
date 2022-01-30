//Import functions for database
let db = require('database');
//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

exports.handler = async (event) => {
    let record = event.Records[0];
    let priceTimeStamp = record.dynamodb.NewImage.PriceTimeStamp.N;
    let currency = record.dynamodb.NewImage.Currency.S;
    let price = record.dynamodb.NewImage.Price.N;
    console.log(priceTimeStamp);
    console.log(currency);
    console.log(price);

    console.log("Domain: " + domainName + " stage: " + stage);
    let msg = "Currency: " + currency + " Price: " + price + " has been added, click the refresh button to view the changes.";

    //Get promises to send messages to connected clients
    let sendMsgPromises = await ws.getSendMessagePromises(msg, domainName, stage);
    //Execute promises
    await Promise.all(sendMsgPromises);

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
