
// import { apiKeys } from './passwordsHolder';
namespace Put {
    //Holds access keys for APIs
    let pH = require('./passwordsHolder');
    //To connect to Amazon Web Services DynamoDB database
    let AWS = require("aws-sdk");

    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: pH.apiKeys.awsAccessKeyId,
        secretAccessKey: pH.apiKeys.awsSecretAccessKey,
        sessionToken: pH.apiKeys.awsSessionToken
    });
//Create new DocumentClient
let dynamoDB = new AWS.DynamoDB({maxRetries: 13, retryDelayOptions: {base: 200}});

//Used to writing to data json file
    const fs = require("fs");

//Time library that we will use to increment dates.
    const moment = require('moment');

//Axios will handle HTTP requests to web service
    const axios = require('axios');

//Reads keys from .env file
    const dotenv = require('dotenv');

//Copy variables in file into environment variables
    dotenv.config();

    interface Crypto {
        time: number,
        high: number,
        low: number,
        open: number,
        volumefrom: number,
        volumeto: number,
        close: number,
        conversionType: string,
        conversionSymbol: string

    }

//The data structure returned in the message body by cryptoCompare
    interface CryptoCompareObject {
        Response: string,
        Message: string,
        HasWarning: boolean,
        Type: number,
        RateLimit: [],
        Data: {
            Aggregated: boolean,
            TimeFrom: number,
            TimeTo: number,
            Data: Array<Crypto>,
        }
    }

//The data structure of a cryptoCompare error
    interface CryptoCompareError {
        code: number,
        type: string,
        info: string,
    }

    class SageMakerData {
        start: string;
        target: Array<number>;
    }

    interface DynamoDBItem {
        PriceTimeStamp: number,//Current time in milliseconds
        Currency: string,
        Price: number
    }

    const currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];
    const numberOfPricesToGET = 30;
    let dynamoDBBatch: Array<DynamoDBItem> = [];

//Class that wraps cryptoCompare web service
    export class cryptoCompareAllData {
        //Base URL of CryptoCompare
        baseURL: string = "https://min-api.cryptocompare.com/data/v2/histoday";
        accessKey = pH.apiKeys.cryptoCompareAccessKey;

        //Returns a Promise that will get the exchange rates for the specified date
        getExchangeRates(currency): Promise<object> {
            //Build URL for API call
            let url: string = this.baseURL + "?";
            url += "fsym=" + currency + "&tsym=USD&limit=" + numberOfPricesToGET;
            url += "&api_key=" + this.accessKey;

            //Output URL and return Promise
            console.log("Building cryptoCompare Promise with URL: " + url);
            return axios.get(url);
        }
    }

//    assigns seconds and date
    function convertSecondsToDateAndTime(secondsSinceEpoch) {
        let date = new Date(secondsSinceEpoch*1000).toISOString().split('T');
        return date[0] + " " + date[1].split('.')[0];
    }

//Gets the historical data for a range of dates.
    async function getHistoricalData() {
        for(let index = 0; index < currencies.length; index++) {
            let currency = currencies[index];

            //Create instance of cryptoCompare class
            let cryptoCompare1: cryptoCompareAllData = new cryptoCompareAllData();

            //Array to hold promises
            let promiseArray: Array<Promise<object>> = [];

            promiseArray.push(cryptoCompare1.getExchangeRates(currency));

            //Wait for all promises to execute
            try {
                let sageMakerTrain = new SageMakerData();
                let sageMakerEndpoint = new SageMakerData();
                let trainTarget: Array<number> = [];
                let endpointTarget: Array<number> = [];
                let trainTargetIndex = 0;
                let trainLimit = Math.ceil(numberOfPricesToGET * 0.5);
                let resultArray: Array<object> = await Promise.all(promiseArray);
                // resultArray = promiseArray['data'];
                console.log(resultArray[0]['data']);
                //Output the data
                //data contains the body of the web service response
                let data: CryptoCompareObject = resultArray[0]['data'];

                //Check that API call succeeded.
                if (data.Response != "Success")
                    console.log("UNSUCCESSFUL REQUEST" + JSON.stringify(data.Response));

                let cryptoData = data.Data.Data;
                let endpointIndex = trainLimit;
                let secondsSinceEpochTrain = cryptoData[endpointIndex].time;
                let secondsSinceEpochEndpoint = cryptoData[trainTargetIndex].time;
                let trainStart = convertSecondsToDateAndTime(secondsSinceEpochTrain);
                let endpointStart = convertSecondsToDateAndTime(secondsSinceEpochEndpoint);
                sageMakerTrain.start = trainStart;
                sageMakerEndpoint.start = trainStart; //both should have the same starting date.

                cryptoData.forEach((crypto, index) => {
                    console.log(crypto);

                    if (data == undefined) {
                        console.log("Error: undefined" + JSON.stringify(data));
                    } else {

//Create date object to get date in UNIX priceTimeStamp
                        let date: Date = new Date();

                        let price: number = (crypto.open + crypto.low + crypto.high) / 3; //takes the average price for the coin
                        let priceTimeStamp = crypto.time;
                        let dynamoDBItem = {
                            PriceTimeStamp : priceTimeStamp,
                            Price : price,
                            Currency : currency
                        };

                        dynamoDBBatch.push(dynamoDBItem);

                        if(trainTargetIndex++ < trainLimit)
                            trainTarget.push(price);
                        else
                            endpointTarget.push(price);
                    }
                });

                //Write to JSON files
                sageMakerTrain.target = trainTarget;
                sageMakerEndpoint.target = endpointTarget;

                //Writes training data
                fs.writeFile('./AWS_BACKUP/s3/cst3130-machine-learning-data/numerical_data_' + currency + '.json', JSON.stringify(sageMakerTrain), function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log("JSON data is saved.");
                });

                //Writes endpoint data
                fs.writeFile('./AWS_BACKUP/s3/cst3130-machine-learning-data/numerical_data_' + currency + '_train.json', JSON.stringify(sageMakerEndpoint), function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log("JSON data is saved.");
                });

            } catch (error) {
                console.log("Error: " + JSON.stringify(error));
            }
        }

        /* Write to DynamoDB table */

        let batchNumber = 0;
        let rowNumber = 25 * batchNumber;
        for(batchNumber = 0; batchNumber < dynamoDBBatch.length && dynamoDBBatch[rowNumber] != undefined; batchNumber++) {
            let batch = [];
            for (rowNumber = 25 * batchNumber; rowNumber < ( (batchNumber + 1) * 25) && dynamoDBBatch[rowNumber] != undefined; rowNumber++) {
                let row = dynamoDBBatch[rowNumber];
                let item = {
                    PutRequest: {
                        Item : {
                            PriceTimeStamp: {N: (row.PriceTimeStamp + "")},
                            Currency: {S: row.Currency},
                            Price: {N: (row.Price + "")},
                        }
                    }
                }
                batch.push(item);
            }

            var params = {
                RequestItems: {
                    "CryptoData": batch
                }
            };


            //Store data in DynamoDB and handle errors
            dynamoDB.batchWriteItem(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Success", data);
                }
            });
        }
    }

//Call function to get historical data
    getHistoricalData();
}