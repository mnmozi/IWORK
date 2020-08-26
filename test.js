var daysOff = [1, 4, 3, 4];
var data = [];
daysOff.filter((value, index, self) => {
  if (self.indexOf(value) === index && value <= 7) {
    data.push(["nasr", value]);
    return "nasr" + value;
  }
  return false;
});
const date = new Date();
const currentTime =
  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
console.log(currentTime);
console.log(date.getHours());
console.log(date.toDateString());
console.log(date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear());

console.log(date.getMinutes());
