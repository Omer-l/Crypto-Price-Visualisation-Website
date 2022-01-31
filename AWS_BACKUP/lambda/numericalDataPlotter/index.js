//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//Import external library with websocket functions
let ws = require('websocket');

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Create instance of Comprehend
let comprehend = new AWS.Comprehend();

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";



function readCryptoData() {
    const params = {
        TableName: 'CryptoData',
        IndexName: 'Currency-PriceTimeStamp-index',
        KeyConditionExpression: 'primeTimeStamp= :primeTimeStamp',
        ScanIndexForward: false
    }
    return ddb.scan(params).promise();
}

exports.handler = async (event) => {
    //Holds the main line, predictions (Lower Quartile, mean, Upper Quartile)
    let lines = [];
    let yValues = []; //holds the prices
    //basic X values for plot
    let xValues = []; //holds the time
    //promise awaiting
    const cryptos  = await readCryptoData();
    cryptos.Items.forEach(function(crypto) {
        yValues.push(crypto.Price);
        xValues.push(crypto.PriceTimeStamp);
    });

    var yRealLine = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: 'Real Data'
    };

    lines.push(yRealLine);

    let msg = {
        data : lines,
        type : 'numerical'
    };
    let msgString = JSON.stringify(msg);
    // console.log("HELLOW: " + msgString);
    //Get promises to send messages to connected clients
    let sendMsgPromises = await ws.getSendMessagePromises(msgString, domainName, stage);
    //Execute promises
    await Promise.all(sendMsgPromises);

    return {
        statusCode: 200,
        body: "Ok"
    };
};