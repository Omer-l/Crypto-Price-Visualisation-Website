//Import functions for database
let db = require('database');
//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

exports.handler = async (event) => {
    console.log(JSON.stringify(event));
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
    let numberOfCryptoTypes = 5;
    let count = 0; //there is n / numberOfCryptos of time stamps, to avoid duplication
    let totalScannedCryptos = event.Records.length;
    let numberOfTimeStamps = Math.ceil(totalScannedCryptos / numberOfCryptoTypes);

    for (let record of event.Records) {

        //Handle INSERT request only.
        if (record.eventName === "INSERT") {
            let currency = record.dynamodb.NewImage.Currency.S;
            let price = record.dynamodb.NewImage.Price.N;


            if(count < numberOfTimeStamps) {
                if(count == 0) {
                    //converts the seconds to date from epoch time
                    let dateInSeconds = record.dynamodb.NewImage.PriceTimeStamp.N;
                    let date = new Date(dateInSeconds*1000);
                    console.log("DATE: " + date);
                    let dateString = date.toISOString().split('T')[0];
                    xValues.push(dateString + " " + date.toISOString().split('T')[1].split('Z')[0]);
                } else {
                    let datePreviously = new Date(xValues[count-1]);
                    console.log(datePreviously);
                    datePreviously.setTime(datePreviously.getTime() + (60*60*1000));//add 1 hour
                    let dateInMilliseconds = datePreviously.getTime();
                    let date = new Date(dateInMilliseconds);
                    let dateString = date.toISOString().split('T')[0];
                    xValues.push(dateString + " " + date.toISOString().split('T')[1].split('Z')[0]);
                }
                count++;
            }
            //assigns currency values for the y axis
            if(currency.includes("SOL"))
                yValuesSOL.push(price);
            else if(currency.includes("ATOM"))
                yValuesATOM.push(price);
            else if(currency.includes("LUNA"))
                yValuesLUNA.push(price);
            else if(currency.includes("DOT"))
                yValuesDOT.push(price);
            else if(currency.includes("LINK"))
                yValuesLINK.push(price);
        }
    }
    xValues.sort(function(a, b){
        var aa = a.split('-').reverse().join(),
            bb = b.split('-').reverse().join();
        return aa < bb ? -1 : (aa > bb ? 1 : 0);
    });

    for(let xIndex = 0; xIndex < xValues.length; xIndex++) {
        xValues[xIndex] = xValues[xIndex].split('.')[0];
    }
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
    console.log(lines);

    let msg = {
        data : lines,
        type : 'updateNumerical'
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
}