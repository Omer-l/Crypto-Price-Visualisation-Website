//Import AWS
let AWS = require("aws-sdk");

//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});


//Data that we are going to send to endpoint
//REPLACE THIS WITH YOUR OWN DATA!
let endpointData = {
    "instances":
        [
            {
                "start": "2018-08-15 16:36:51",
                "target": [31401.76,31546.64,31806.3,30847.55,29795.55,32139.48,32299.47,33637.92,34282.56,35369.93,37269.52,39496.69,40030.01,40030.52,42231.83,41474.72,39870.76,39158.53,38189.3,39738.56,40888.18,42852.18,44617.96,43827.75,46292.61,45601.03,45556.69,44425.52,47832.93,47102.03,47015.94,45927.4,44684.43,44714.54,46761.49,49336.45,48867.87,49289.71,49521.06,47690.54,48996.44,46852.22,49088.1,48918.9,48794.26,46993.31,47159.26,48840.01,49280.77,50019.51,49935.29,51784.16,52693.32,46856.31,46073.45,46392.85,44853.1,45166.12,46049.72,44958.56,47129.01,48148.45,47764.47,47297.98,48312.46,47251.76,42925.46,40709.59,43576.15,44893.87,42848.41,42721.91,43201.79,42187.51,41056.79,41539.43,43829.34,48164.35,47669.02,48234.05,49276.91,51504.27,55343.24,53796.22,53949.29,54968.04,54700.24,57498.8,56010.9,57369,57359.21,61684.96,60877.77,61520.54,62038.16,64283.97,66021.02,62283.96,60693.59,61313.09,60863.56,63089.04,60315.68,58464.42,60610.11,62282.5,61891.91,61349.75,60960.98,63260.05,62929.93,61448.47,61019.66,61529.76,63302.78,67549.14,66939.24,64926.06,64820.8,64156.3,64409.56,65509.06,63614.06,60108.9,60365.6,56930.68,58136.22,59769.66,58700.83,56303.06,57566.6,57175.09,58966.99,53788.22,54805.03,57331.41,57839.55,56975.35,57227.97,56522.76,53663.25,49243.39,49465.5,50552.83,50633.01,50513.04,47593.85,47191.14,49398.4,50109.99,46731.03,48387.69,48885.05,47635.92,46164.14,46861.62,46697.13,46913.54,48917.48,48614.97,50830.2,50840.36,50431.63,50790.88,50714.73,47536.39,46471.7,47129.66,46197.31,47737.35,47306.41,46450.79,45824.54,43432.51,43094.54,41543.79,41686.67,41869.6,41832.59]
            }
        ],
    "configuration":
        {
            "num_samples": 50,
            "output_types":["mean","quantiles","samples"],
            "quantiles":["0.1","0.9"]
        }
};

function readEndpoint() {
    //Name of endpoint
    //REPLACE THIS WITH THE NAME OF YOUR ENDPOINT
    const endpointName = "synth-1-endpoint";
    //Parameters for calling endpoint
    let params = {
        EndpointName: endpointName,
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    };
    return awsRuntime.invokeEndpoint(params).promise();
}


//Handler for Lambda function
exports.handler = async (event, context, callback) => {
    //Call endpoint and handle response
    // awsRuntime.invokeEndpoint(params, (err, data)=>{
    //     if (err) {//An error occurred
    //         console.log(err, err.stack);

    //         //Return error response
    //         const response = {
    //             statusCode: 500,
    //             body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
    //         };
    //         return response;
    //     }
    //     else{//Successful response
    //         //Convert response data to JSON
    //         let responseData = JSON.parse(Buffer.from(data.Body).toString('utf8'));
    //         console.log("DATAAAAA: " + JSON.stringify(responseData));

    //         //TODO: STORE DATA IN PREDICTION TABLE

    //         //Return successful response
    //         const response = {
    //             statusCode: 200,
    //             body: JSON.stringify('Predictions stored.'),
    //         };
    //         return response;
    //     }

    try {

        //promise awaiting
        const Item  = await readEndpoint();

        const predictions = JSON.parse(Buffer.from(Item.Body)).predictions;
        console.log("DATAAAAA: " + JSON.stringify(predictions[0]['quantiles']['0.1'] ));


        return {
            statusCode: 200,
            body: "Ok"
        };

    } catch(err) {
        //Return error response
        const response = {
            statusCode: 500,
            body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
        };
        return response;
    }
}
