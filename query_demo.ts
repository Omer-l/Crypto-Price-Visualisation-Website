namespace QueryDemo{

    let AWS = require("aws-sdk");

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
    let documentClient = new AWS.DynamoDB.DocumentClient();

    /* Retrieve all items with specified PriceTimeStamp */
    let params = {
        TableName: "CryptoData",
        KeyConditionExpression: "PriceTimeStamp = :ts",
        ExpressionAttributeValues: {
            ":ts" : 1547991078986
        }
    };

    /* Use index to retrieve all items with specified currency */
    // let params = {
    //     TableName: "CryptoData",
    //     IndexName: "Currency-PriceTimeStamp-index",
    //     KeyConditionExpression: "Currency = :curr",
    //     ExpressionAttributeValues: {
    //         ":curr" : "bitcoin"
    //     }
    // };

    /* Use index and expression to retrieve currencies with timestamp
        greater than specified value */
    // let params = {
    //     TableName: "CryptoData",
    //     IndexName: "Currency-PriceTimeStamp-index",
    //     KeyConditionExpression: "Currency = :curr AND PriceTimeStamp > :ts",
    //     ExpressionAttributeValues: {
    //         ":curr" : "bitcoin",
    //         ":ts" : 1547991078991
    //     }
    // };

    /* Retrieves bitcoin items with price greater than 3800
        Price is not an indexed field. */
    // let params = {
    //     TableName: "CryptoData",
    //     KeyConditionExpression: "Currency = :curr",
    //     IndexName: "Currency-PriceTimeStamp-index",
    //     FilterExpression: "Price > :p",
    //     ExpressionAttributeValues: {
    //         ":curr" : "bitcoin",
    //         ":p" : 3800
    //     }
    // };

    /* Retrieves just the prices of the bitcoin items */
    // let params = {
    //     TableName: "CryptoData",
    //     KeyConditionExpression: "Currency = :curr",
    //     IndexName: "Currency-PriceTimeStamp-index",
    //     ProjectionExpression: "Price",
    //     ExpressionAttributeValues: {
    //         ":curr" : "bitcoin",
    //     }
    // };

    //Run query and output result or handle errors
    documentClient.query(params, (err, data) => {
        if (err) {
            console.error("Unable to read item", JSON.stringify(params));
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Data:", data);
        }
    });

}
