//Gets hours from 00:00 to next day 00:00
function getHourSince00() {
    let timeNowInMS = new Date();
    let hourNow = timeNowInMS.getHours();
    return hourNow;
}
console.log(getHourSince00());