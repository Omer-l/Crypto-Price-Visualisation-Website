
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