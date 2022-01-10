namespace UploadDemo {
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
    let docClient = new AWS.DynamoDB.DocumentClient();

    //Create Date class so we can obtain a starting timestamp
    let date: Date = new Date();
    let startTimestamp = date.getTime();

    let currencies: Array<{ name: string, averagePrice: number }> = [
        {name: "bitcoin", averagePrice: 3800},
        {name: "ethereum", averagePrice: 128},
        {name: "litecoin", averagePrice: 31},
        {name: "tron", averagePrice: 0.03}
    ];

    //Add ten lots of dummy data for four currencies
    for (let ts = 0; ts < 10; ++ts) {
        //Add random data for each of the currencies to the database
        currencies.forEach(element => {

            //Create parameters holding randomized data
            let params = {
                TableName: "CryptoData",
                Item: {
                    "PriceTimeStamp": startTimestamp + ts,
                    "Currency": element.name,
                    "Price": element.averagePrice * (1 + 0.1 * (Math.random() - 0.5))
                }
            };

            //Add data to database
            docClient.put(params, (err, data) =>{
                if (err) {
                    console.error("Unable to add currency", element.name);
                    console.error("Error JSON:", JSON.stringify(err));
                }
                else {
                    console.log("Currency added to table:", element.name);
                }
            });
        });
    }
}
