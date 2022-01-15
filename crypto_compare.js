var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Put;
(function (Put) {
    //To coneect to Amazon Web Services DynamoDB database
    var AWS = require("aws-sdk");
    //Used to writing to data json file
    var fs = require("fs");
    //Time library that we will use to increment dates.
    var moment = require('moment');
    //Axios will handle HTTP requests to web service
    var axios = require('axios');
    //Reads keys from .env file
    var dotenv = require('dotenv');
    //Copy variables in file into environment variables
    dotenv.config();
    var SageMakerData = /** @class */ (function () {
        function SageMakerData() {
        }
        return SageMakerData;
    }());
    var date = new Date(1605916800);
    var dt = date.getTime();
    //Class that wraps fixer.io web service
    var Fixer = /** @class */ (function () {
        function Fixer() {
            //Base URL of fixer.io API ?fsym=BTC&tsym=USD&limit=1000
            this.baseURL = "https://min-api.cryptocompare.com/data/v2/histoday";
            this.accessKey = "000b9badd6690c6fa779bde8d4133afbdf0701b864691c454d3c349b88f3464d";
        }
        //Returns a Promise that will get the exchange rates for the specified date
        Fixer.prototype.getExchangeRates = function () {
            //Build URL for API call
            var url = this.baseURL + "?";
            url += "fsym=BTC&tsym=USD&limit=1900";
            url += "&api_key=" + this.accessKey;
            //Output URL and return Promise
            console.log("Building fixer.io Promise with URL: " + url);
            return axios.get(url);
        };
        return Fixer;
    }());
    Put.Fixer = Fixer;
    //Gets the historical data for a range of dates.
    function getHistoricalData() {
        return __awaiter(this, void 0, void 0, function () {
            var fixerIo, promiseArray, start, sageMakerList, target, resultArray, data_1, cryptoData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fixerIo = new Fixer();
                        promiseArray = [];
                        // //Work forward from start date
                        // for (let i: number = 0; i < numDays; ++i) {
                        //     //Add axios promise to array
                        promiseArray.push(fixerIo.getExchangeRates());
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        start = "1970-01-11 16:36:51";
                        sageMakerList = new SageMakerData();
                        sageMakerList.start = start;
                        target = [];
                        return [4 /*yield*/, Promise.all(promiseArray)];
                    case 2:
                        resultArray = _a.sent();
                        // resultArray = promiseArray['data'];
                        console.log(resultArray[0]['data']);
                        data_1 = resultArray[0]['data'];
                        //Check that API call succeeded.
                        if (data_1.Response != "Success")
                            console.log("UNSUCCESSFUL REQUEST" + JSON.stringify(data_1.Response));
                        cryptoData = data_1.Data.Data;
                        cryptoData.forEach(function (crypto, index) {
                            console.log(crypto);
                            if (data_1 == undefined) {
                                console.log("Error: undefined" + JSON.stringify(data_1));
                            }
                            else {
                                AWS.config.update({
                                    region: "us-east-1",
                                    endpoint: "https://dynamodb.us-east-1.amazonaws.com",
                                    accessKeyId: 'ASIA2ZOJXFRAAUVTPTBS',
                                    secretAccessKey: '371USrO7izMH2prtOuXnNUc+Oa+PoyizlYdzkTV6',
                                    sessionToken: 'FwoGZXIvYXdzEEAaDOUSbZBecusfx8ca4CLFAbNFCbVpj83BjoGw5rstlDV28V9CouC7Pn6CO0sDzTZmRsx4X0qukdPDcBFZbMplctLxkgMgObwGuyXqLGFNwnV6p+nhZrTAhkQoVWPCXkO76mRSpTH1B3RXPwQ1bZCFtr947JSRH4eJEWymfMAIXo/18XPi/iSz7uAV19Xx8ju1FnmSz6BVwBbIjJqG2ntlHzRld0u1LVEjtypCYu1zIwVlu3FZg2CPchdtI8nNnn9XI31GKQ4rgEzegmHDgHCbxemr/Q0+KKTJ+44GMi3KWc7DZNUSWIh9ZYh3QtYIwjlZHQ/zKr/pe4Ro1U1k8wIlNbiFzy9YpgL21O4='
                                });
                                //Create date object to get date in UNIX time
                                var date_1 = new Date();
                                //Create new DocumentClient
                                var documentClient = new AWS.DynamoDB.DocumentClient();
                                var price = (crypto.open + crypto.low + crypto.high) / 3; //takes the average price for the coin
                                var time = crypto.time;
                                //Table name and data for table
                                var params = {
                                    TableName: "CryptoData",
                                    Item: {
                                        PriceTimeStamp: time,
                                        Currency: "BTC",
                                        Price: price
                                    }
                                };
                                target.push(price);
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
                        sageMakerList.target = target;
                        fs.writeFile('synthetic_data_1_train.json', JSON.stringify(sageMakerList), function (err) {
                            if (err) {
                                throw err;
                            }
                            console.log("JSON data is saved.");
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.log("Error: " + JSON.stringify(error_1));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    //Call function to get historical data
    getHistoricalData();
})(Put || (Put = {}));
//# sourceMappingURL=crypto_compare.js.map