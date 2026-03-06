const fs = require("fs");

let seen = new Set();

function isDuplicate(name) {
  if (seen.has(name)) return true;

  seen.add(name);

  return false;
}

module.exports = isDuplicate;
