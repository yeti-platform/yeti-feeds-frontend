import moment from "moment-timezone";

function formatTimestamp(date, local) {
  if (!date) {
    return "Never";
  }
  let d = moment.utc(date);
  if (local) {
    return d.tz(moment.tz.guess()).format("YYYY-MM-DD HH:mm:ss Z");
  }
  return d.format("YYYY-MM-DD HH:mm:ss");
}

var utils = {
  formatTimestamp: formatTimestamp
};

export default utils;
