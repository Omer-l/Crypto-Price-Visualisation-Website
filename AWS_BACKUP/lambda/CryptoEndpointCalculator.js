//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });


function wipeDDB(tableName, currency) {
    return ddb.delete({
        "TableName": tableName,
        "Key" : {
            "Currency": currency
        }
    }).promise();
}

//    assigns seconds and date
function convertSecondsToDateAndTime(secondsSinceEpoch) {
    let date = new Date(secondsSinceEpoch*1000).toISOString().split('T');
    return date[0] + " " + date[1].split('.')[0];
}

function readCryptoData() {
    const params = {
        TableName: 'CryptoData',
        IndexName: 'Currency-PriceTimeStamp-index',
        KeyConditionExpression: 'primeTimeStamp= :primeTimeStamp',
        ScanIndexForward: false
    };
    return ddb.scan(params).promise();
}

async function writeEndpointData(currency, means, lowerQuantiles, upperQuantiles, samples) {
    let tableName = 'CryptoDataEndpointPredictions';
    await wipeDDB(tableName, currency); // first wipe the matching row
    var params = {
        TableName: tableName,
        Item: {
            'Currency' : currency,
            'Means' : means,
            'LowerQuantiles' : lowerQuantiles,
            'UpperQuantiles' :  upperQuantiles,
            'Samples' : samples,
        }
    };

    return ddb.put(params).promise();
}

//Gets end point predictions given an endpoint name
async function readEndpoint(endpointName, endpointData) {
    //Parameters for calling endpoint
    let params = {
        EndpointName: endpointName,
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    };
    return awsRuntime.invokeEndpoint(params).promise();
}

async function addCurrencyPredictionsToDynamoDB(startDateAndTime, yValues, currency) {
    //get predictions for ATOM
    let endpointData = {
        instances:
            [
                {
                    start: startDateAndTime,
                    target: yValues
                }
            ],
        configuration:
            {
                num_samples: 50,
                output_types:["mean","quantiles","samples"],
                quantiles:["0.1","0.9"]
            }
    };
    console.log(JSON.stringify(endpointData));
    //GET predictions from sagemaker
    //promise awaiting
    const predictionItem  = await readEndpoint(currency.toLowerCase(), endpointData);

    const predictions = JSON.parse(Buffer.from(predictionItem.Body)).predictions;
    const means = JSON.stringify(predictions[0]['mean']);
    const lowerQuantiles = JSON.stringify(predictions[0]['quantiles']['0.1']);
    const upperQuantiles = JSON.stringify(predictions[0]['quantiles']['0.9']);
    const samples = JSON.stringify(predictions[0]['samples'][0]);
    console.log(predictions);

    await writeEndpointData(currency, means, lowerQuantiles, upperQuantiles, samples);
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
    let startTimeInSeconds = cryptos.Items[0].PriceTimeStamp;
    let startDateAndTime = convertSecondsToDateAndTime(startTimeInSeconds);
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
    try {
        await addCurrencyPredictionsToDynamoDB(startDateAndTime, yValuesATOM, "ATOM");
        await addCurrencyPredictionsToDynamoDB(startDateAndTime, yValuesDOT, "DOT");
        await addCurrencyPredictionsToDynamoDB(startDateAndTime, yValuesLINK, "LINK");
        await addCurrencyPredictionsToDynamoDB(startDateAndTime, yValuesLUNA, "LUNA");
        await addCurrencyPredictionsToDynamoDB(startDateAndTime, yValuesSOL, "SOL");
    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + err),
        };
        return response;
    }
};