var PutDemo;
(function (PutDemo) {
    var AWS = require("aws-sdk");
    //Set the region and endpoint
    // AWS.config.update({
    //     region: "eu-west-1",
    //     endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
    // });
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: 'ASIA2ZOJXFRAOXK2TWXK',
        secretAccessKey: 'wiY3EMgXMGGt478jsHl8sGgBdOnPiMFUjudW+f+u',
        sessionToken: 'FwoGZXIvYXdzEBMaDPkUNJKCVM8FIAm89yLFAY0GAJmRawU5dgOCIh9bX0CzBwQWQaalqqkKYBS/10cNt3QfXZsW7zFqfaAeNKVIlzw6OhTCHB6N/F2WrppLg/B+6QqDfXOrLJ6psYh1rSoL+53NzmdB53S6t5a1ETQTqCNNncaAsAqBM56HyrumAvx7ljSZK+i2VAg0tr0DNfPwqO9fMwEYyWNnKMWKo7qVHivtrducuhHqgAIX5GS1p5rKZXQLsvo8/vkY4R7lLKmNrCLMWTaQq5oGyrI6dgX7RRpjWk3mKK7Y8Y4GMi3nyHhci0LOFkujOwq0S6ayK0VYAyDSyasc4g4l/6PafjtWAKgjuSuirayg+7o='
    });
    //Create date object to get date in UNIX time
    var date = new Date();
    //Create new DocumentClient
    var documentClient = new AWS.DynamoDB.DocumentClient();
    //Table name and data for table
    var params = {
        TableName: "CryptoData",
        Item: {
            PriceTimeStamp: date.getTime(),
            Currency: "bitcoin",
            Price: 3795.18
        }
    };
    //Store data in DynamoDB and handle errors
    documentClient.put(params, function (err, data) {
        if (err) {
            console.error("Unable to add item", params.Item.Currency);
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Currency added to table:", params.Item);
        }
    });
})(PutDemo || (PutDemo = {}));
//# sourceMappingURL=put_demo.js.map