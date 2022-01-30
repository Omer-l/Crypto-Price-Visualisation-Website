//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "wss://7dxr2k9a9b.execute-api.us-east-1.amazonaws.com";
let stage = "prod";

exports.handler = async (event) => {
    try {
        //Get Message from event
        const msg = JSON.parse(event.body).data;
        console.log("Message: " + msg);

        //Allocate domain name and stage dynamically
        domainName = event.requestContext.domainName;
        stage = event.requestContext.stage;
        console.log("Domain: " + domainName + " stage: " + stage);

        //Get promises to send messages to connected clients
        let sendMsgPromises = await ws.getSendMessagePromises(msg, domainName, stage);

        //Execute promises
        await Promise.all(sendMsgPromises);
    }
    catch(err){
        return { statusCode: 500, body: "Error: " + JSON.stringify(err) };
    }

    //Success
    return { statusCode: 200, body: "Data sent successfully." };
};