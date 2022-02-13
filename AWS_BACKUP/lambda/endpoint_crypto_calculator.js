//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});
//Import external library with websocket functions
let ws = require('websocket');

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });


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

    //Lines

    //Crypto 1
    try {
        var atomLine = {
            x: xValues,
            y: yValuesATOM,
            mode: 'lines',
            legendgroup: "atomGroup",
            name: 'ATOM'
        };
        //get predictions for ATOM
        let endpointDataATOM = {
            instances:
                [
                    {
                        start: startDateAndTime,
                        target: yValuesATOM
                    }
                ],
            configuration:
                {
                    num_samples: 50,
                    output_types:["mean","quantiles","samples"],
                    quantiles:["0.1","0.9"]
                }
        };
        console.log(JSON.stringify(endpointDataATOM));
        //GET predictions from sagemaker
        //promise awaiting
        const predictionItem  = await readEndpoint("atom", endpointDataATOM);

        const predictions = JSON.parse(Buffer.from(predictionItem.Body)).predictions;
        const mean = predictions[0]['mean'];
        const lowerQuantile = predictions[0]['quantiles']['0.1'];
        const upperQuantile = predictions[0]['quantiles']['0.9'];
        const samples = predictions[0]['samples'];

        console.log(predictions);
        //Crypto 2
        var dotLine = {
            x: xValues,
            y: yValuesDOT,
            legendgroup: "dotGroup",
            mode: 'lines',
            name: 'DOT'
        };

        //Crypto 3
        var linkLine = {
            x: xValues,
            y: yValuesLINK,
            legendgroup: "linkGroup",
            mode: 'lines',
            name: 'LINK'
        };

        //Crypto 4
        var lunaLine = {
            x: xValues,
            y: yValuesLUNA,
            legendgroup: "lunaGroup",
            mode: 'lines',
            name: 'LUNA'
        };

        //Crypto 5
        var solLine = {
            x: xValues,
            y: yValuesSOL,
            mode: 'lines',
            legendgroup: "solGroup",
            name: 'SOL'
        };
        //get predictions for SOL
        let endpointDataSOL = {
            "instances":
                [
                    {
                        "start": startDateAndTime,
                        "target": yValuesSOL
                    }
                ],
            "configuration":
                {
                    "num_samples": 50,
                    "output_types":["mean","quantiles","samples"],
                    "quantiles":["0.1","0.9"]
                }
        };

    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + err),
        };
        return response;
    }
};