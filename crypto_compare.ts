namespace Put {
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

//The structure of a Rates object
    interface FixerRates {
        USD: number,
        JPY: number,
        EUR: number
    }

//The data structure returned in the message body by fixer.io
    interface FixerObject {
        Response: string,
        Message: string,
        HasWarning: boolean,
        Type: number,
        RateLimit: [],
        Data: {
            Aggregated: boolean,
            TimeFrom: number,
            TimeTo: number,
            Data: [
                time: number,
                high: number,
                low: number,
                open: number,
                volumefrom: number,
                volumeto: number,
                close: number,
                conversionType: string,
                conversionSymbol: string
            ]
        }
    }

//The data structure of a fixer.io error
    interface FixerError {
        code: number,
        type: string,
        info: string,
    }

    class SageMakerData {
        start: string;
        target: Array<number>;
    }

    var date = new Date(1605916800);
    var dt = date.getTime();

//Class that wraps fixer.io web service
    export class Fixer {
        //Base URL of fixer.io API ?fsym=BTC&tsym=USD&limit=1000
        baseURL: string = "https://min-api.cryptocompare.com/data/v2/histoday";
        accessKey = "000b9badd6690c6fa779bde8d4133afbdf0701b864691c454d3c349b88f3464d";

        //Returns a Promise that will get the exchange rates for the specified date
        getExchangeRates(): Promise<object> {
            //Build URL for API call
            let url: string = this.baseURL + "?";
            url += "fsym=BTC&tsym=USD&limit=1900";
            url += "&api_key=" + this.accessKey;

            //Output URL and return Promise
            console.log("Building fixer.io Promise with URL: " + url);
            return axios.get(url);
        }
    }


//Gets the historical data for a range of dates.
    async function getHistoricalData() {
        /* You should check that the start date plus the number of days is
        less than the current date*/

        //Create moment date, which will enable us to add days easily.
        // let start = moment(startDate);

        //Create instance of Fixer.io class
        let fixerIo: Fixer = new Fixer();

        //Array to hold promises
        let promiseArray: Array<Promise<object>> = [];

        // //Work forward from start date
        // for (let i: number = 0; i < numDays; ++i) {
        //     //Add axios promise to array
        promiseArray.push(fixerIo.getExchangeRates());

        //     //Increase the number of days
        //     date.add(1, 'days');
        // }

        //Wait for all promises to execute
        try {
            let start = "1970-01-11 16:36:51";
            var sageMakerList = new SageMakerData();
            sageMakerList.start = start;
            var target: Array<number> = [];

            let resultArray: Array<object> = await Promise.all(promiseArray);
            // resultArray = promiseArray['data'];
            console.log(resultArray[0]['data']);
            //Output the data
            //data contains the body of the web service response
            let data: FixerObject = resultArray[0]['data'];

            //Check that API call succeeded.
            if (data.Response != "Success")
                console.log("UNSUCCESSFUL REQUEST" + JSON.stringify(data.Response));

            let cryptoData = data.Data.Data;
            cryptoData.forEach((crypto, index) => {
                console.log(crypto);

                if (data == undefined) {
                    console.log("Error: undefined" + JSON.stringify(data));
                } else {
                    AWS.config.update({
                        region: "us-east-1",
                        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
                        accessKeyId: 'ASIA2ZOJXFRAAUVTPTBS',
                        secretAccessKey: '371USrO7izMH2prtOuXnNUc+Oa+PoyizlYdzkTV6',
                        sessionToken: 'FwoGZXIvYXdzEEAaDOUSbZBecusfx8ca4CLFAbNFCbVpj83BjoGw5rstlDV28V9CouC7Pn6CO0sDzTZmRsx4X0qukdPDcBFZbMplctLxkgMgObwGuyXqLGFNwnV6p+nhZrTAhkQoVWPCXkO76mRSpTH1B3RXPwQ1bZCFtr947JSRH4eJEWymfMAIXo/18XPi/iSz7uAV19Xx8ju1FnmSz6BVwBbIjJqG2ntlHzRld0u1LVEjtypCYu1zIwVlu3FZg2CPchdtI8nNnn9XI31GKQ4rgEzegmHDgHCbxemr/Q0+KKTJ+44GMi3KWc7DZNUSWIh9ZYh3QtYIwjlZHQ/zKr/pe4Ro1U1k8wIlNbiFzy9YpgL21O4='
                    });

//Create date object to get date in UNIX time
                    let date: Date = new Date();

//Create new DocumentClient
                    let documentClient = new AWS.DynamoDB.DocumentClient();
                    let price: number = (crypto.open +  crypto.low + crypto.high) / 3; //takes the average price for the coin
                    let time = crypto.time;

                    //Table name and data for table
                    let params = {
                        TableName: "CryptoData",
                        Item: {
                            PriceTimeStamp: time,//Current time in milliseconds
                            Currency: "BTC",
                            Price: price
                        }
                    };
                    target.push(price);

                    //Store data in DynamoDB and handle errors
                    documentClient.put(params, (err, data) => {
                        if (err) {
                            console.error("Unable to add item", params.Item.Currency);
                            console.error("Error JSON:", JSON.stringify(err));
                        } else {
                            console.log("Currency added to table:", params.Item);
                        }
                    });
                }
            });
            sageMakerList.target = target;
            fs.writeFile('synthetic_data_1_train.json', JSON.stringify(sageMakerList), function (err) {
                if (err) {
                    throw err;
                }
                console.log("JSON data is saved.");
            });
        } catch (error) {
            console.log("Error: " + JSON.stringify(error));
        }
    }

//Call function to get historical data
    getHistoricalData();
}