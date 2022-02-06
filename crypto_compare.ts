
// import { apiKeys } from './passwordsHolder';
namespace Put {
    //Holds access keys for APIs
    let pH = require('./passwordsHolder');
    //To coneect to Amazon Web Services DynamoDB database
    let AWS = require("aws-sdk");

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

    const currencies = ["SOL", "LINK", "LUNA", "ATOM", "DOT"];
    const numberOfPricesToGET = 20;

//Class that wraps cryptoCompare web service
    export class cryptoCompare {
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
            /* You should check that the start date plus the number of days is
            less than the current date*/

            //Create moment date, which will enable us to add days easily.
            // let start = moment(startDate);

            //Create instance of cryptoCompare class
            let fixerIo: cryptoCompare = new cryptoCompare();

            //Array to hold promises
            let promiseArray: Array<Promise<object>> = [];

            // //Work forward from start date
            // for (let i: number = 0; i < numDays; ++i) {
            //     //Add axios promise to array
            promiseArray.push(fixerIo.getExchangeRates(currency));

            //     //Increase the number of days
            //     date.add(1, 'days');
            // }

            //Wait for all promises to execute
            try {
                let sageMakerTrain = new SageMakerData();
                let sageMakerEndpoint = new SageMakerData();
                let trainTarget: Array<number> = [];
                let endpointTarget: Array<number> = [];
                let trainTargetIndex = 0;
                let trainLimit = numberOfPricesToGET * 0.8;

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
                let secondsSinceEpochTrain = cryptoData[trainTargetIndex].time;
                let secondsSinceEpochEndpoint = cryptoData[endpointIndex].time;
                let trainStart = convertSecondsToDateAndTime(secondsSinceEpochTrain);
                let endpointStart = convertSecondsToDateAndTime(secondsSinceEpochEndpoint);
                sageMakerTrain.start = trainStart;
                sageMakerEndpoint.start = endpointStart;

                cryptoData.forEach((crypto, index) => {
                    console.log(crypto);

                    if (data == undefined) {
                        console.log("Error: undefined" + JSON.stringify(data));
                    } else {
                        AWS.config.update({
                            region: "us-east-1",
                            endpoint: "https://dynamodb.us-east-1.amazonaws.com",
                            accessKeyId: pH.apiKeys.awsAccessKeyId,
                            secretAccessKey: pH.apiKeys.awsSecretAccessKey,
                            sessionToken: pH.apiKeys.awsSessionToken
                        });

//Create date object to get date in UNIX time
                        let date: Date = new Date();

//Create new DocumentClient
                        let documentClient = new AWS.DynamoDB.DocumentClient();
                        let price: number = (crypto.open + crypto.low + crypto.high) / 3; //takes the average price for the coin
                        let time = crypto.time;

                        //Table name and data for table
                        let params = {
                            TableName: "CryptoData",
                            Item: {
                                PriceTimeStamp: time,//Current time in milliseconds
                                Currency: currency,
                                Price: price
                            }
                        };
                        if(trainTargetIndex++ < trainLimit)
                            trainTarget.push(price);
                        else
                            endpointTarget.push(price);

                        //Store data in DynamoDB and handle errors
                        // documentClient.put(params, (err, data) => {
                        //     if (err) {
                        //         console.error("Unable to add item", params.Item.Currency);
                        //         console.error("Error JSON:", JSON.stringify(err));
                        //     } else {
                        //         console.log("Currency added to table:", params.Item);
                        //     }
                        // });
                    }
                });
                sageMakerTrain.target = trainTarget;
                sageMakerEndpoint.target = endpointTarget;

                //Writes training data
                fs.writeFile('./AWS_BACKUP/s3/cst3130-machine-learning-data/numerical_data_' + currency + '_train.json', JSON.stringify(sageMakerTrain), function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log("JSON data is saved.");
                });

                //Writes endpoint data
                fs.writeFile('./AWS_BACKUP/s3/cst3130-machine-learning-data/numerical_data_' + currency + '.json', JSON.stringify(sageMakerEndpoint), function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log("JSON data is saved.");
                });
            } catch (error) {
                console.log("Error: " + JSON.stringify(error));
            }
        }
    }

//Call function to get historical data
    getHistoricalData();
}