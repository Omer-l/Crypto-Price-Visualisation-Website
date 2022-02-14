//Axios will handle HTTP requests to web service
const axios = require ('axios');

//The ID of the student's data that I will download
let studentID = 'M00719709';

//URL where student data is available
let url = 'https://m3ijbzm7a4.execute-api.us-east-1.amazonaws.com/dev/';

exports.handler = async (event) => {
    try {
        //Get synthetic data
        let yValues = (await axios.get(url + studentID)).data.target;

        //Add basic X values for plot
        let xValues = [];
        for(let i=0; i<yValues.length; ++i)
            xValues.push(i);


        return {
            statusCode: 200,
            body: "Ok"
        };
    }
    catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data for student ID: " + studentID
        };
    }
};

exports.handler({});