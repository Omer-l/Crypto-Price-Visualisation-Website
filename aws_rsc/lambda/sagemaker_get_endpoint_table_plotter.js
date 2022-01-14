//Import AWS
let AWS = require("aws-sdk");

//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

//Authentication details for Plotly
const PLOTLY_USERNAME = 'omerka1';
const PLOTLY_KEY = 'CngH9Ebp1Ee7SKaVJVPY';

//Initialize Plotly with user details.
let plotly = require('plotly')(PLOTLY_USERNAME, PLOTLY_KEY);


//Data that we are going to send to endpoint
//REPLACE THIS WITH YOUR OWN DATA!
let endpointData = {
    "instances":
        [
            {
                "start": "2018-08-16 00:24:51",
                "target": [31401.76,31546.64,31806.3,30847.55,29795.55,32139.48,32299.47,33637.92,34282.56,35369.93,37269.52,39496.69,40030.01,40030.52,42231.83,41474.72,39870.76,39158.53,38189.3,39738.56,40888.18,42852.18,44617.96,43827.75,46292.61,45601.03,45556.69,44425.52,47832.93,47102.03,47015.94,45927.4,44684.43,44714.54,46761.49,49336.45,48867.87,49289.71,49521.06,47690.54,48996.44,46852.22,49088.1,48918.9,48794.26,46993.31,47159.26,48840.01,49280.77,50019.51,49935.29,51784.16,52693.32,46856.31,46073.45,46392.85,44853.1,45166.12,46049.72,44958.56,47129.01,48148.45,47764.47,47297.98,48312.46,47251.76,42925.46,40709.59,43576.15,44893.87,42848.41,42721.91,43201.79,42187.51,41056.79,41539.43,43829.34,48164.35,47669.02,48234.05,49276.91,51504.27,55343.24,53796.22,53949.29,54968.04,54700.24,57498.8,56010.9,57369,57359.21,61684.96,60877.77,61520.54,62038.16,64283.97,66021.02,62283.96,60693.59,61313.09,60863.56,63089.04,60315.68,58464.42,60610.11,62282.5,61891.91,61349.75,60960.98,63260.05,62929.93,61448.47,61019.66,61529.76,63302.78,67549.14,66939.24,64926.06,64820.8,64156.3,64409.56,65509.06,63614.06,60108.9,60365.6,56930.68,58136.22,59769.66,58700.83,56303.06,57566.6,57175.09,58966.99,53788.22,54805.03,57331.41,57839.55,56975.35,57227.97,56522.76,53663.25,49243.39,49465.5,50552.83,50633.01,50513.04,47593.85,47191.14,49398.4,50109.99,46731.03,48387.69,48885.05,47635.92,46164.14,46861.62,46697.13,46913.54,48917.48,48614.97,50830.2,50840.36,50431.63,50790.88,50714.73,47536.39,46471.7,47129.66,46197.31,47737.35,47306.41,46450.79,45824.54,43432.51,43094.54,41543.79,41686.67,41869.6,41832.59]
            }
        ],
    "configuration":
        {
            "num_samples": 50,
            "output_types":["mean","quantiles","samples"],
            "quantiles":["0.1","0.9"]
        }
};

function readCryptoData() {
    const params = {
        TableName: 'CryptoData'
    }
    return ddb.scan(params).promise();
}

function readEndpoint() {
    //Name of endpoint
    //REPLACE THIS WITH THE NAME OF YOUR ENDPOINT
    const endpointName = "synth-1-endpoint";
    //Parameters for calling endpoint
    let params = {
        EndpointName: endpointName,
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    };
    return awsRuntime.invokeEndpoint(params).promise();
}

//Lambda function for plotting real data.
// exports.handler = async (event, context, callback) => {

//     try {
//         let yValues = []; //holds the prices
//         //basic X values for plot
//         let xValues = [];

//         //promise awaiting
//         const Item  = await readCryptoData();
//         Item.Items.forEach(function(item) {
//             yValues.push(item.Price);
//             xValues.push(item.PriceTimeStamp);
//         });

//         // console.log(yValues);
//         // console.log(xValues);

//         var yRealLine = {
//           x: xValues,
//           y: yValues,
//           mode: 'lines',
//           name: 'Real Data'
//         };

//         lines.push(yRealLine);
//     }
//     catch (err) {
//         console.log("ERROR: " + JSON.stringify(err));
//         return {
//             statusCode: 500,
//             body: "Error plotting data for coin: " + err
//         };
//     }
// };

//Handler for Lambda function, PREDICTIONS DATA PLOTTER
exports.handler = async (event, context, callback) => {
    //Holds the original line, mean line, 0.1% quantile line, 0.9% quantile line and the sample line
    let lines = [];

    try {

        //GET real data
        let yValues = []; //holds the prices
        //basic X values for plot
        let xValues = [];

        //promise awaiting
        const Item  = await readCryptoData();
        Item.Items.forEach(function(item) {
            yValues.push(item.Price);
            xValues.push(item.PriceTimeStamp);
        });

        // console.log(yValues);
        // console.log(xValues);

        var yRealLine = {
            x: xValues,
            y: yValues,
            mode: 'lines',
            name: 'Real Data'
        };

        lines.push(yRealLine);

        //GET predictions from sagemaker
        //promise awaiting
        const predictionItem  = await readEndpoint();

        const predictions = JSON.parse(Buffer.from(predictionItem.Body)).predictions;
        const mean = predictions[0]['mean'];
        const lowerQuantile = predictions[0]['quantiles']['0.1'];
        const upperQuantile = predictions[0]['quantiles']['0.9'];
        const samples = predictions[0]['samples'];
        // console.log("MEAN: " + JSON.stringify(mean));
        // console.log("LQ: " + JSON.stringify(lowerQuantile));
        // console.log("UQ: " + JSON.stringify(upperQuantile));
        // console.log("SAMPLES: " + JSON.stringify(samples));

        let yMean = [];
        mean.forEach((value) => {
            yMean.push(value);
        });


        let yLQ = [];
        lowerQuantile.forEach((value) => {
            yLQ.push(value);
        });


        let yUQ = [];
        upperQuantile.forEach((value) => {
            yUQ.push(value);
        });


        let ySample = [];
        samples[0].forEach((value) => {
            ySample.push(value);
        });

        xValues = []; //+=  86400 for 1000 data sets

        for(let xIndex = 1; xIndex <= ySample.length; xIndex++) {
            let timeStamp = 1626480000 + ( 86400 * xIndex);
            xValues[xIndex-1] = (timeStamp);
        }
        console.log("x: " + xValues);

        var yMeanLine = {
            x: xValues,
            y: yMean,
            mode: 'lines',
            name: 'Mean'
        };

        var yLQLine = {
            x: xValues,
            y: yLQ,
            mode: 'lines',
            name: '10% Lower Quantile'
        };

        var yUQLine = {
            x: xValues,
            y: yUQ,
            mode: 'lines',
            name: '90% Upper Quantile'
        };

        var ySampleLine = {
            x: xValues,
            y: ySample,
            mode: 'lines',
            name: 'Sample'
        };

        lines.push(yMeanLine);
        lines.push(yLQLine);
        lines.push(yUQLine);
        lines.push(ySampleLine);
        console.log(lines);

        //Plot data onto Plotly
        plotData("BTC", lines);

        return {
            statusCode: 200,
            body: "Ok"
        };

    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
        };
        return response;
    }
};

//Plots the specified data
async function plotData(categoryName, data){

    let layout = {
        title: "Synthetic Data for: " + categoryName,
        font: {
            size: 25
        },
        xaxis: {
            title: 'Time (millseconds)'
        },
        yaxis: {
            title: 'Price USD'
        }
    };
    let graphOptions = {
        layout: layout,
        filename: "date-axes",
        fileopt: "overwrite"
    };

    return new Promise ( (resolve, reject)=> {

        var layout = {
            title:'Line and Scatter Plot'
        };
        plotly.plot(data, layout);
        plotly.plot(data, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
};
