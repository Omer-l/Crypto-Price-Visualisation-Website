//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});
//Import external library with websocket functions
let ws = require('websocket');

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";


//    assigns seconds and date
function convertSecondsToDateAndTime(secondsSinceEpoch) {
    let date = new Date(secondsSinceEpoch*1000).toISOString().split('T');
    return date[0] + " " + ""; // to beginning of day
}

//reads in crypto data
function readCryptoData() {
    const params = {
        TableName: 'CryptoData',
        IndexName: 'Currency-PriceTimeStamp-index',
        KeyConditionExpression: 'primeTimeStamp= :primeTimeStamp',
        ScanIndexForward: false
    };
    return ddb.scan(params).promise();
}

//reads in the predictions
function readCryptoPredictionData() {
    const params = {
        TableName: 'EndpointPredictions',
        ScanIndexForward: false
    };
    return ddb.scan(params).promise();
}

//turns a string JSON into an array
function getData(dataString) {
    dataString = dataString.replace('[', '');
    dataString = dataString.replace(']', '');
    let splitData = dataString.split(',');

    let dataToNumbers = [];

    for(let splitDataIndex = 0 ; splitDataIndex < splitData.length; splitDataIndex++) {
        let data = splitData[splitDataIndex];
        dataToNumbers[splitDataIndex] = parseFloat(data);
    }
    return dataToNumbers;
}

exports.handler = async (event) => {
    let connectionId = event.requestContext.connectionId;
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
    let startTimeInSeconds = cryptos.Items[0].PriceTimeStamp;
    let endTimeInSeconds = cryptos.Items[cryptos.Items.length - 1].PriceTimeStamp;
    const secondsInADay = 86400;

    cryptos.Items.forEach(function(crypto) {
        if(count < numberOfTimeStamps) {
            //converts the seconds to date from epoch time
            let dateInSeconds = crypto.PriceTimeStamp;
            let date = new Date(dateInSeconds*1000);
            let splitDate = date.toISOString().split('T');
            let time =  splitDate[1].split('.')[0];
            let dateString = splitDate[0] + " " + time;
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

    //Crypto 1
    try {
        var atomLine = {
            x: xValues,
            y: yValuesATOM,
            mode: 'lines',
            name: 'ATOM'
        };
        //get predictions for ATOM

        //Crypto 2
        var dotLine = {
            x: xValues,
            y: yValuesDOT,
            mode: 'lines',
            name: 'DOT'
        };

        //Crypto 3
        var linkLine = {
            x: xValues,
            y: yValuesLINK,
            mode: 'lines',
            name: 'LINK'
        };

        //Crypto 4
        var lunaLine = {
            x: xValues,
            y: yValuesLUNA,
            mode: 'lines',
            name: 'LUNA'
        };

        //Crypto 5
        var solLine = {
            x: xValues,
            y: yValuesSOL,
            mode: 'lines',
            name: 'SOL'
        };

        let allPredictions = await readCryptoPredictionData();
        //assign time series into the x values
        let currentEndTimeInSeconds = endTimeInSeconds;
        let predictionXValues = []; //the time series for the predictions
        let numberOfTimeStampsInPrediction = getData(allPredictions.Items[0].Means).length; //number of data points in prediction
        for(let indexOfTime = 0; indexOfTime < numberOfTimeStampsInPrediction; indexOfTime++) {
            let currentDateAndTime = convertSecondsToDateAndTime(currentEndTimeInSeconds);
            predictionXValues[indexOfTime] = currentDateAndTime;
            currentEndTimeInSeconds += secondsInADay;
        }
        //Add real data
        lines.push([atomLine]);
        lines.push([dotLine]);
        lines.push([linkLine]);
        lines.push([lunaLine]);
        lines.push([solLine]);


        //The first Y
        let initialY = cryptos.Items[cryptos.Items.length - 1].Price;

        //assign mean, lower quantile, upper quantile and sample values for each crypto
        allPredictions.Items.forEach(function(prediction) {
            let currency = prediction.Currency;

            let means = getData(prediction.Means);
            let lowerQuantiles = getData(prediction.LowerQuantiles);
            let upperQuantiles = getData(prediction.UpperQuantiles);
            let samples = getData(prediction.Samples);

            let predictionMeanLine = {
                x: predictionXValues,
                y: means,
                mode: 'lines',
                name: 'Mean',
            };
            let predictionLowerQuantileLine = {
                x: predictionXValues,
                y: lowerQuantiles,
                mode: 'lines',
                name: 'Lower Quantile',
            };
            let predictionUpperQuantileLine = {
                x: predictionXValues,
                y: upperQuantiles,
                mode: 'lines',
                name: 'Upper Quantile',
            };
            let predictionSampleLine = {
                x: predictionXValues,
                y: samples,
                mode: 'lines',
                name: 'Sample',
            };
            let indexOfLine = 0;
            if(currency == "ATOM")
                indexOfLine = 0;
            else if(currency == "DOT")
                indexOfLine = 1;
            else if(currency == "LINK")
                indexOfLine = 2;
            else if(currency == "LUNA")
                indexOfLine = 3;
            else if(currency == "SOL")
                indexOfLine = 4;
            //adds to lines array
            lines[indexOfLine].push(predictionMeanLine);
            lines[indexOfLine].push(predictionLowerQuantileLine);
            lines[indexOfLine].push(predictionUpperQuantileLine);
            lines[indexOfLine].push(predictionSampleLine);
        });

        let msg = {
            data : lines,
            type : 'numerical'
        };
        //Get promises to send messages to connected clients
        let sendMsgPromises = await ws.getSendMessagePromises(msgString, domainName, stage, connectionId);
        //Execute promises
        await Promise.all(sendMsgPromises);

    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + err),
        };
        return response;
    }
};