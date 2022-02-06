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
    //basic X values for time plot
    let xValues = []; //holds the time
    //Y Values for prices
    let yValuesSOL = []; //holds SOL prices
    let yValuesATOM = []; //holds ATOM prices
    let yValuesLUNA = []; //holds LUNA prices
    let yValuesDOT = []; //holds DOT prices
    let yValuesLINK = []; //holds LINK prices
    //promise awaiting
    const cryptos  = await readCryptoData();
    let numberOfCryptoTypes = 5;
    let count = 0; //there is n / numberOfCryptos of time stamps, to avoid duplication
    let totalScannedCryptos = cryptos.Items.length;
    let numberOfTimeStamps = Math.ceil(totalScannedCryptos / numberOfCryptoTypes);
    cryptos.Items.forEach(function(crypto) {
        if(count < numberOfTimeStamps) {
            //converts the seconds to date from epoch time
            let dateInSeconds = crypto.PriceTimeStamp;
            let date = new Date(dateInSeconds*1000);
            let dateString = date.toISOString().split('T')[0];
            xValues.push(dateString);
            count++;
        }
        //assigns currency values for the y axis
        let currency = crypto.Currency;
        if(currency.includes("SOL"))
            yValuesSOL.push(crypto.Price);
        else if(currency.includes("ATOM"))
            yValuesATOM.push(crypto.Price);
        else if(currency.includes("LUNA"))
            yValuesLUNA.push(crypto.Price);
        else if(currency.includes("DOT"))
            yValuesDOT.push(crypto.Price);
        else if(currency.includes("LINK"))
            yValuesLINK.push(crypto.Price);
    });

    //Lines
    var solLine = {
        x: xValues,
        y: yValuesSOL,
        mode: 'lines',
        name: 'SOL'
    };
    var atomLine = {
        x: xValues,
        y: yValuesATOM,
        mode: 'lines',
        name: 'ATOM'
    };
    var lunaLine = {
        x: xValues,
        y: yValuesLUNA,
        mode: 'lines',
        name: 'LUNA'
    };
    var dotLine = {
        x: xValues,
        y: yValuesDOT,
        mode: 'lines',
        name: 'DOT'
    };
    var linkLine = {
        x: xValues,
        y: yValuesLINK,
        mode: 'lines',
        name: 'LINK'
    };

    lines.push(solLine);
    lines.push(atomLine);
    lines.push(lunaLine);
    lines.push(dotLine);
    lines.push(linkLine);

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