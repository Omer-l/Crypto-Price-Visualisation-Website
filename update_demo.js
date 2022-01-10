var UpdateDemo;
(function (UpdateDemo) {
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
    var documentClient = new AWS.DynamoDB.DocumentClient();
    /* Updates a single item.*/
    var params = {
        TableName: "CryptoData",
        Key: {
            PriceTimeStamp: 1547991078988,
            Currency: "bitcoin",
        },
        UpdateExpression: "SET Price = :pr",
        ExpressionAttributeValues: {
            ':pr': 1000
        }
    };
    //Update the specified item
    documentClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to scan table: ", params.TableName);
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Sucessful update  to table: " + params.TableName);
        }
    });
})(UpdateDemo || (UpdateDemo = {}));
//# sourceMappingURL=update_demo.js.map