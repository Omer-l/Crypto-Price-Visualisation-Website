exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    let record = event.Records[0];
    let priceTimeStamp = record.dynamodb.NewImage.PriceTimeStamp.N;
    let currency = record.dynamodb.NewImage.Currency.S;
    let price = record.dynamodb.NewImage.Price.N;
    console.log(priceTimeStamp);
    console.log(currency);
    console.log(price);

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};