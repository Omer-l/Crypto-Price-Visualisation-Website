namespace ScanDemo {

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

    /* A simple scan only requires the table name */
    // let params = {
    //     TableName: "CryptoData"
    // };

    /* Filters out items whose price is less than 1 */
    let params = {
        TableName: "CryptoData",
        FilterExpression : 'Price > :pr',
        ExpressionAttributeValues : {
            ':pr' : 1
        }
    };

    //Scan table to retrieve all data
    documentClient.scan(params, (err, data) => {
        if (err) {
            console.error("Unable to scan table: ", params.TableName);
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Data from table: " + JSON.stringify(data));
        }
    });

}

