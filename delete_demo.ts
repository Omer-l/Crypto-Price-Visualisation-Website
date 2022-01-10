namespace DeleteDemo {

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

    /* Deletes a single item.*/
    let params = {
        TableName: "CryptoData",
        Key: {
            PriceTimeStamp: 1547991078988,
            Currency: "bitcoin"
        }
    };

    //Deletes the specified item
    documentClient.delete(params, (err, data) => {
        if (err) {
            console.error("Unable to delete item: ", JSON.stringify(params.Key));
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Successful delete of item: " + JSON.stringify(params.Key));
        }
    });

}

