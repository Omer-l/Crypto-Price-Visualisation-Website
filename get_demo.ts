namespace GetDemo {

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

    //Table name and data for table
    let params = {
        TableName: "CryptoData",
        Key: {
            PriceTimeStamp: 1547552396658,
            Currency: "bitcoin"
        }
    };

    //Retrieve data item from DynamoDB and handle errors
    documentClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item", params.Key.PriceTimeStamp);
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Data:", data);
        }
    });

}


