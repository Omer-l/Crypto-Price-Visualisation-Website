namespace Put {
    let AWS = require("aws-sdk");

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


//Class that wraps fixer.io web service
    export class Fixer {
        //Base URL of fixer.io API ?fsym=BTC&tsym=USD&limit=1000
        baseURL: string = "https://min-api.cryptocompare.com/data/v2/histoday";
        accessKey = "000b9badd6690c6fa779bde8d4133afbdf0701b864691c454d3c349b88f3464d";

        //Returns a Promise that will get the exchange rates for the specified date
        getExchangeRates(date: string): Promise<object> {
            //Build URL for API call
            let url: string = this.baseURL + "?";
            url += "fsym=BTC&tsym=USD&limit=1000";
            url += "&api_key=" + this.accessKey;

            //Output URL and return Promise
            console.log("Building fixer.io Promise with URL: " + url);
            return axios.get(url);
        }
    }


//Gets the historical data for a range of dates.
    async function getHistoricalData(startDate: string, numDays: number) {
        /* You should check that the start date plus the number of days is
        less than the current date*/

        //Create moment date, which will enable us to add days easily.
        let date = moment(startDate);

        //Create instance of Fixer.io class
        let fixerIo: Fixer = new Fixer();

        //Array to hold promises
        let promiseArray: Array<Promise<object>> = [];

        // //Work forward from start date
        // for (let i: number = 0; i < numDays; ++i) {
        //     //Add axios promise to array
        promiseArray.push(fixerIo.getExchangeRates(date.format("YYYY-MM-DD")));

        //     //Increase the number of days
        //     date.add(1, 'days');
        // }

        //Wait for all promises to execute
        try {
            let resultArray: Array<object> = await Promise.all(promiseArray);
            // resultArray = promiseArray['data'];
            console.log(resultArray[0]['data']);
            //Output the data
            //data contains the body of the web service response
            let data: FixerObject = resultArray[0]['data'];

            if(data.Response != "Success")
                console.log("UNSUCCESSFUL REQUEST");

            let cryptoData = data.Data.Data;
            cryptoData.forEach((crypto, index) => {
                console.log(crypto);
                //Check that API call succeeded.
                // if(data.success != true){
                if (data == undefined) {
                    // console.log("Error: " + JSON.stringify(data.error));
                    console.log("Error: undefined" + JSON.stringify(data));
                } else {
                    //Output the result - you should put this data in the database
                    console.log(
                        // " USD: " + data.open +
                        // " Time: " + data.time
                    );

//Set the region and endpoint
// AWS.config.update({
//     region: "eu-west-1",
//     endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
// });
                    AWS.config.update({
                        region: "us-east-1",
                        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
                        accessKeyId: 'ASIA2ZOJXFRADRAXMC7C',
                        secretAccessKey: 'GRQl/ZaTMEEQld7sd4UtwLSD2kC45UcN8isPYA70',
                        sessionToken: 'FwoGZXIvYXdzEBcaDNFZYu+U4T7GlK+heCLFAdN2ZKy3jgqdqhCRztvmYcosh4BrWxWbgiJAGQkyGgBP0E5BuhJ5cK168e2EMMZPbja3pphguy+0b/14E20I+UgWsLBB012zt3jh2iTEGsWfenh+Xz6bI0JUcbB46S/pVtoTOISD2ekZDa7nw0QDHGGZ7fuKOIcsd1IFG3RfeORVEcwTQgpNfAppKXEV0DqILM26fzui7BYlBlLMq+i+hUugW5UMWDE2rVjHEYL6/Y6tKjczuaxpy9NnClfQx/Pcskhrm46YKLjV8o4GMi2PLWbx/CStvbJSgcQpdmHdKYQLKrTUM+8fO81nbrsVXObE8aDoYJOSVzr1cpU='
                    });

//Create date object to get date in UNIX time
                    let date: Date = new Date();

//Create new DocumentClient
                    let documentClient = new AWS.DynamoDB.DocumentClient();

                    //Table name and data for table
                    let params = {
                        TableName: "CryptoData",
                        Item: {
                            PriceTimeStamp: crypto.time,//Current time in milliseconds
                            Currency: "bitcoin",
                            Price: crypto.open
                        }
                    };

                    //Store data in DynamoDB and handle errors
                    console.log("ATTEMPTING TO SEND");
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
        } catch (error) {
            console.log("Error: " + JSON.stringify(error));
        }
    }

//Call function to get historical data
    getHistoricalData('2015-12-24', 10);
}