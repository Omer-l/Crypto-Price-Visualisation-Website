//aws-sdk will be used to read the data from dynamodb and make an API request to get CloudWatch's data.
let AWS = require("aws-sdk");
,
// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});
// //Axios will handle HTTP requests to web service
// const axios = require ('axios');

// //The ID of the student's data that I will download
// let studentID = 'M11111111';

// //URL where student data is available
// let url = 'https://80jxhdq0j4.execute-api.us-east-1.amazonaws.com/default/test2';

// Function readCryptoData
// Reads 10 CryptoDatas from the DynamoDb table CryptoData
// Returns promise
function readCryptoData() {
    const params = {
        TableName: 'CryptoData'
    }
    return ddb.scan(params).promise();
}

//Authentication details for Plotly
const PLOTLY_USERNAME = 'omerka1';
const PLOTLY_KEY = 'CngH9Ebp1Ee7SKaVJVPY';

//Initialize Plotly with user details.
let plotly = require('plotly')(PLOTLY_USERNAME, PLOTLY_KEY);

exports.handler = async (event, context, callback) => {

    try {
        let yValues = []; //holds the prices
        //basic X values for plot
        let xValues = [];

        //promise awaiting
        const Item  = await readCryptoData();
        Item.Items.forEach(function(item) {
            yValues.push(item.Price);
            xValues.push(item.PriceTimeStamp);
        });

        console.log(yValues);
        console.log(xValues);
        let plotResult = await plotData("BTC", xValues, yValues);

        // //Get synthetic data FOR READING IN PREDICITIONS
        // // let yValues = (await axios.get(url)).data.target;

        // cryptoData.forEach( (crypto, index) => {
        //     for(let i=0; i<yValues.length; ++i){
        //         xValues.push(i);
        //     }
        // });
        // //Call function to plot data
        // let plotResult = await plotData(cryptoData.currency, xValues, yValues);
        // console.log("Plot for student '" + cryptoData.currency + "' available at: " + plotResult.url);

        return {
            statusCode: 200,
            body: "Ok"
        };
    }
    catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data for coin: " + err
        };
    }
};

//Plots the specified data
async function plotData(categoryName, xValues, yValues){
    //Data structure
    let coinData = {
        x: xValues,
        y: yValues,
        type: "scatter",
        mode: 'line',
        name: categoryName,
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 12
        }
    };
    let data = [coinData];

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
        plotly.plot(data, graphOptions, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
};
