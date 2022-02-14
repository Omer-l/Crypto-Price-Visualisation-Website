//aws-sdk will be used to get DynamoDB
let AWS = require("aws-sdk");
//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

// The database and table are 'in us-east-1'
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

function wipeDDB(tableName) {
    ddb.delete({
        "TableName": tableName,
        "Key" : {
            "Id": 1
        }
    }, function (err, data) {
        if (err) {
            console.log('FAIL:  Error deleting item from dynamodb - ' + err);
        }
        else {
            console.log("DEBUG:  deleteItem worked. ");
        }
    });
}

async function writeEndpointData(currency, means, lowerQuantiles, upperQuantiles, samples) {
//first delete current row
    var tableName = "SyntheticEndpointData";
    await wipeDDB(tableName);
    var params = {
        TableName: tableName,
        Item: {
            'Id' : 1,
            'Means' : means,
            'LowerQuantiles' : lowerQuantiles,
            'UpperQuantiles' :  upperQuantiles,
            'Samples' : samples,
        }
    };
    return ddb.put(params).promise();
}

//Gets end point predictions given an endpoint name
async function readEndpoint(endpointData) {
    //Parameters for calling endpoint
    let params = {
        EndpointName: "synthetic",
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    };
    return awsRuntime.invokeEndpoint(params).promise();
}

async function addCurrencyPredictionsToDynamoDB() {
    //get predictions for ATOM
    let endpointData = {
        instances:
            [
                {
                    start: "2020-04-12 14:00:00",
                    target: [420.81055076397337,419.19564543219997,428.5572409004746,406.6028064216818,426.7996860488288,408.6825313974666,411.7424547142297,418.2113133025357,422.0925525051355,418.67944514526,415.38593778406636,408.2634112140827,381.8811347923145,401.00124850805037,384.691536027679,370.6784450230662,372.0801941108088,384.11874611437327,391.3012587554785,391.7644114301994,383.6069918902464,395.7685888174345,390.43368199508006,429.62735170064417,419.02099610869476,417.06766487739844,419.6297017294662,444.57124365241054,439.2213307006139,421.89892776218954,415.0050528944921,446.78655059506286,440.96356138042376,411.836131401371,412.4039388217862,429.180339639009,412.99410795596384,405.7626683469121,410.8644839531131,391.5617225352526,400.44279003458394,383.2850856729695,383.1536330503413,414.350397205812,400.99443486041804,412.0156784875745,407.0452899602491,442.47536400783196,450.4156564804309,457.8142279620246,442.17712722533344,433.74731987574484,443.9280236499118,458.416580936141,459.16943647688817,446.7057538699361,442.5619205969574,451.9309154743583,423.66288249895837,406.5863713664666,428.4255619200796,397.1760562659572,424.3307137593995,407.12420943594674,407.25794738089684,392.494957825784,414.4305318010574,428.61497325337854,444.36120655011666,426.0959926000769,457.6196143184669,435.0353705875783,457.0439289822248,452.9718649665382,443.3602989415532,453.66710094996427,469.1728320250993,489.2937526683687,482.82415466155965,473.0409683105222,440.26675540109443,467.00770614227486,426.56807219126915,437.99671815073054,416.8491782059582,450.94458855316395,413.51007595156597,440.0398933986376,405.7061471880982,415.9734492518672]
                }
            ],
        configuration:
            {
                num_samples: 50,
                output_types:["mean","quantiles","samples"],
                quantiles:["0.1","0.9"]
            }
    };
    console.log(JSON.stringify(endpointData));
    //GET predictions from sagemaker
    //promise awaiting
    const predictionItem  = await readEndpoint(endpointData);

    const predictions = JSON.parse(Buffer.from(predictionItem.Body)).predictions;
    const means = JSON.stringify(predictions[0]['mean']);
    const lowerQuantiles = JSON.stringify(predictions[0]['quantiles']['0.1']);
    const upperQuantiles = JSON.stringify(predictions[0]['quantiles']['0.9']);
    const samples = JSON.stringify(predictions[0]['samples'][0]);
    console.log(predictions);

    await writeEndpointData(means, lowerQuantiles, upperQuantiles, samples);
}

exports.handler = async (event) => {
    try {
        await addCurrencyPredictionsToDynamoDB();
    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + err),
        };
        return response;
    }
};