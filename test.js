const to = new Date("2021-04-27");
const from = new Date("2021-04-12");

daysOff = [];
var ndays = 1 + Math.round((to - from) / (24 * 3600 * 1000));
let totalDays;

totalDays = daysOff.reduce((total, currentValue, index) => {
  return (
    total + Math.floor((ndays + ((from.getDay() + 6 - currentValue) % 7)) / 7)
  );
}, 0);

console.log(ndays);
console.log(ndays - totalDays);
