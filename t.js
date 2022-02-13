
function getHourSince12Yesterday() {
    let timeNowInMS = new Date();

    let hourNow = timeNowInMS.getHours();
    let hoursSince12Yesterday = hourNow - 12;

    if(hoursSince12Yesterday < 0)
        return 24 + hoursSince12Yesterday;
    else
        return hoursSince12Yesterday;
}

console.log(getHourSince12Yesterday());

function convertSecondsToDateAndTime(secondsSinceEpoch) {
    let date = new Date(secondsSinceEpoch*1000).toISOString().split('T');
    return date[0] + " " + date[1].split('.')[0];
}

console.log(convertSecondsToDateAndTime(1593734400));



//turns a string JSON into an array
function getData(dataString) {
    dataString = dataString.replace('[', '');
    dataString = dataString.replace(']', '');
    let splitData = dataString.split(',');

    let dataToNumbers = [];

    for(let splitDataIndex = 0 ; splitDataIndex < splitData.length; splitDataIndex++) {
        let data = splitData[splitDataIndex];
        dataToNumbers[splitDataIndex] = parseFloat(data);
    }
    return dataToNumbers;
}

let d = "[20.1500301361,21.5340099335,23.7813739777,21.8116054535,20.9796123505,21.0631561279,20.8511657715,20.3601455688,19.1640739441,17.8428688049,22.9169502258,21.5665359497,25.395280838,23.8677272797,21.9081954956,23.6677742004,24.9706287384,21.2475376129,22.4548683167,22.6353397369,28.1096172333,20.3611335754,18.9917755127,21.422662735,23.5411739349,18.55352211,23.1805400848,22.84623909,19.9920253754,22.1508369446,19.7875404358,18.2940349579,19.850736618,20.2385025024,18.7800006866,17.4158401489,17.9304428101,18.3251953125,16.9995307922,17.5218334198,19.2298164368,17.6305408478,17.2201385498,15.771402359,17.9815597534,17.5547466278,17.1908855438,18.2119789124,19.4780864716,19.4486885071]";
console.log(getData(d));