let AWS = require("aws-sdk");

//Import functions for database
let db = require('database');

module.exports.getSendMessagePromises = async (message, domainName, stage, connectionId) => {

    //Create API Gateway management class.
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        endpoint: domainName + '/' + stage
    });

    //Try to send message to connected client
    try{
        console.log("Sending message '" + message + "' to: " + connectionId);

        //Create parameters for API Gateway
        let apiMsg = {
            ConnectionId: connectionId,
            Data: message
        };

        //Wait for API Gateway to execute and log result
        await apigwManagementApi.postToConnection(apiMsg).promise();
        console.log("Message '" + message + "' sent to: " + connectionId);
    }
    catch(err){
        console.log("Failed to send message to: " + connectionId);

        //Delete connection ID from database
        if(err.statusCode == 410) {
            try {
                await db.deleteConnectionId(connectionId);
            }
            catch (err) {
                console.log("ERROR deleting connectionId: " + JSON.stringify(err));
                throw err;
            }
        }
        else{
            console.log("UNKNOWN ERROR: " + JSON.stringify(err));
            throw err;
        }
    }
};