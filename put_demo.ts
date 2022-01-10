namespace PutDemo {

    let AWS = require("aws-sdk");

    //Set the region and endpoint
    // AWS.config.update({
    //     region: "eu-west-1",
    //     endpoint: "https://dynamodb.eu-west-1.amazonaws.com"
    // });
    AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        accessKeyId: 'ASIAUJIRSHU5WADZMHBH',
        secretAccessKey: 'KpCKhLzZCra3Wd/qyq4CEw4A+BftM4WauQyEtNUT',
        sessionToken: 'FwoGZXIvYXdzEK///////////wEaDFJ7omtrz+SXpMTdPyK8AQoxzXY89auBzLqnkHQROu0tktjO5GVWeUYlgqS8+tLKgdbqDMSe8vdvzoaevTwdeNb7v7zYuIrMi4QsGnAfAIA1HCe4VLiQljwalHXyFv/cU1fiRWdB/YGS23bgau8uw110S0Zg0vYjPdKtFLuFTKCpRl8v8/l/3TXfS1NYGhrsrbLii7MQ+STLTBE19rAGjTzbcY0eUfW3L9B4GCvx+Syw5Cj3fXNJ+ICehG38Az67H6lpFxu5EM0Pq8nXKIfCo44GMi04KRIY6d9PvTxY59BFzom1uq9lKiYITushYhIh2ODvVcyDznPbIhDywgKzPrw='
    });

    //Create date object to get date in UNIX time
    let date: Date = new Date();

    //Create new DocumentClient
    let documentClient = new AWS.DynamoDB.DocumentClient();

    //Table name and data for table
    let params = {
        TableName: "CryptoData",
        Item: {
            PriceTimeStamp: date.getTime(),//Current time in milliseconds
            Currency: "bitcoin",
            Price: 3795.18
        }
    };

    //Store data in DynamoDB and handle errors
    documentClient.put(params, (err, data) => {
        if (err) {
            console.error("Unable to add item", params.Item.Currency);
            console.error("Error JSON:", JSON.stringify(err));
        }
        else {
            console.log("Currency added to table:", params.Item);
        }
    });

}

