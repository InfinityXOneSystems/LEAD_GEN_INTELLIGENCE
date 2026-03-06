const schema = require("../contracts/lead_schema.json");

function validateLead(lead) {
  for (let key in schema.Lead) {
    if (!(key in lead)) {
      console.log("Missing field:", key);
    }
  }

  return true;
}

module.exports = validateLead;
