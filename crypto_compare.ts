//Time library that we will use to increment dates.
const moment = require('moment');

//Axios will handle HTTP requests to web service
const axios = require ('axios');

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
    // success: boolean,
    // error?: FixerError,
    // timestamp: number,
    // historical: boolean,
    // base: string,
    // date: string,
    USD: number,
    JPY: number,
    EUR: number
}

//The data structure of a fixer.io error
interface FixerError{
    code: number,
    type: string,
    info: string,
}


//Class that wraps fixer.io web service
export class Fixer {
    //Base URL of fixer.io API
    baseURL: string = "https://min-api.cryptocompare.com/data/price";
    accessKey = "000b9badd6690c6fa779bde8d4133afbdf0701b864691c454d3c349b88f3464d";
    //Returns a Promise that will get the exchange rates for the specified date
    getExchangeRates(date: string): Promise<object> {
        //Build URL for API call
        let url:string = this.baseURL + "?";
        url += "fsym=BTC&tsyms=USD,JPY,EUR";
        url += "&api_key=" + this.accessKey;
        // url += "&api_key=" + process.env.FIXERIO_API_KEY;

        //Output URL and return Promise
        console.log("Building fixer.io Promise with URL: " + url);
        return axios.get(url);
    }
}


//Gets the historical data for a range of dates.
async function getHistoricalData(startDate: string, numDays: number){
    /* You should check that the start date plus the number of days is
    less than the current date*/

    //Create moment date, which will enable us to add days easily.
    let date = moment(startDate);

    //Create instance of Fixer.io class
    let fixerIo: Fixer = new Fixer();

    //Array to hold promises
    let promiseArray: Array<Promise<object>> = [];

    //Work forward from start date
    for(let i: number =0; i<numDays; ++i){
        //Add axios promise to array
        promiseArray.push(fixerIo.getExchangeRates(date.format("YYYY-MM-DD")));

        //Increase the number of days
        date.add(1, 'days');
    }

    //Wait for all promises to execute
    try {
        let resultArray: Array<object> = await Promise.all(promiseArray);
        bitcoins: Array<FixerObject>();


        //Output the data
        resultArray.forEach((result)=>{
            console.log(result);
            //data contains the body of the web service response
            let data: FixerObject = result['data'];

            //Check that API call succeeded.
            // if(data.success != true){
            if(data == undefined) {
                // console.log("Error: " + JSON.stringify(data.error));
                console.log("Error: undefined" + JSON.stringify(data));
            }
            else{
                //Output the result - you should put this data in the database
                console.log(
                    " USD: " + data.USD +
                    " JPY: " + data.JPY +
                    " EUR: " + data.EUR
                );
                this.bitcoins.push(data);
            }
        });
    }
    catch(error){
        console.log("Error: " + JSON.stringify(error));
    }
}

//Call function to get historical data
getHistoricalData('2015-12-24', 10);