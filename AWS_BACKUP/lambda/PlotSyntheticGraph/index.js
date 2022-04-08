//Axios will handle HTTP requests to web service
const axios = require ('axios');

//The ID of the student's data that I will download
let studentID = 'M00719709';

//URL where student data is available
let url = 'https://kdnuy5xec7.execute-api.us-east-1.amazonaws.com/prod/';

//Authentication details for Plotly
//ADD YOUR OWN AUTHENTICATION DETAILS
const PLOTLY_USERNAME = 'omerka1';
const PLOTLY_KEY = 'qGikouuO1f7GMYeaYmKI';

//Initialize Plotly with user details.
let plotly = require('plotly')(PLOTLY_USERNAME, PLOTLY_KEY);

//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

//reads in the predictions
function readCryptoPredictionData() {
    const params = {
        TableName: 'SyntheticEndpointData',
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
    try {
        let lines = [];
        //Get synthetic data
        let yValues = (await axios.get(url + studentID)).data.target;

        //Add basic X values for plot
        let xValues = [];
        for(let i=0; i<yValues.length; ++i){
            xValues.push(i);
        }
        let realLine = {
            x: xValues,
            y: yValues,
            mode: 'lines',
            name: 'Real Line'
        };

        let allPredictions = await readCryptoPredictionData();
        let prediction = allPredictions.Items[0];

        //assign time series into the x values
        let basicXIndex = xValues[xValues.length - 1];
        let predictionXValues = []; //the time series for the predictions
        let numberOfTimeStampsInPrediction = getData(allPredictions.Items[0].Means).length; //number of data points in prediction
        for(let indexOfTime = 0; indexOfTime < numberOfTimeStampsInPrediction; indexOfTime++)
            predictionXValues[indexOfTime] = basicXIndex++;

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
        //adds to lines array
        lines.push(realLine);
        lines.push(predictionMeanLine);
        lines.push(predictionLowerQuantileLine);
        lines.push(predictionUpperQuantileLine);
        lines.push(predictionSampleLine);
        console.log(JSON.stringify(lines));
        //Call function to plot data
        let plotResult = await plotData(studentID, lines);
        console.log("Plot for student '" + studentID + "' available at: " + plotResult.url);

        return {
            statusCode: 200,
            body: "Ok"
        };
    }
    catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data for student ID: " + studentID
        };
    }
};

//Plots the specified data
async function plotData(studentID, data){

    let layout = {
        title: "Synthetic Data for Student " + studentID,
        font: {
            size: 25
        },
        xaxis: {
            title: 'Time (hours)'
        },
        yaxis: {
            title: 'Value'
        }
    };
    let graphOptions = {
        layout: layout,
        filename: "date-axes",
        fileopt: "overwrite"
    };

    return new Promise ( (resolve, reject)=> {
        plotly.plot(data, graphOptions, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
};

exports.handler({});