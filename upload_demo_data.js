var UploadDemo;
(function (UploadDemo) {
    var AWS = require("aws-sdk");
    //Set the region and endpoint
    // AWS.config.update({
    //     region: "eu-west-1",
    //     endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
    // });
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com"
    });
    //Create new DocumentClient
    var docClient = new AWS.DynamoDB.DocumentClient();
    //Create Date class so we can obtain a starting timestamp
    var date = new Date();
    var startTimestamp = date.getTime();
    var currencies = [
        { name: "bitcoin", averagePrice: 3800 },
        { name: "ethereum", averagePrice: 128 },
        { name: "litecoin", averagePrice: 31 },
        { name: "tron", averagePrice: 0.03 }
    ];
    var _loop_1 = function (ts) {
        //Add random data for each of the currencies to the database
        currencies.forEach(function (element) {
            //Create parameters holding randomized data
            var params = {
                TableName: "CryptoData",
                Item: {
                    "PriceTimeStamp": startTimestamp + ts,
                    "Currency": element.name,
                    "Price": element.averagePrice * (1 + 0.1 * (Math.random() - 0.5))
                }
            };
            //Add data to database
            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add currency", element.name);
                    console.error("Error JSON:", JSON.stringify(err));
                }
                else {
                    console.log("Currency added to table:", element.name);
                }
            });
        });
    };
    //Add ten lots of dummy data for four currencies
    for (var ts = 0; ts < 10; ++ts) {
        _loop_1(ts);
    }
})(UploadDemo || (UploadDemo = {}));
//# sourceMappingURL=upload_demo_data.js.map