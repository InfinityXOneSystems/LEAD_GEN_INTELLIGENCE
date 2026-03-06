const { validateLead } = require("../validators/lead_validator");
const { dedupe } = require("./dedupe");

/**
 * Runs the full lead validation pipeline:
 *  1. Validates each lead's fields and formats.
 *  2. Separates valid leads from invalid ones.
 *  3. Deduplicates valid leads by company+city, phone, and email.
 *
 * @param {Object[]} leads - Raw lead objects to process.
 * @returns {{
 *   valid: Object[],
 *   invalid: Object[],
 *   duplicates: Object[],
 *   summary: { total: number, valid: number, invalid: number, unique: number, duplicates: number }
 * }}
 */
function runValidationPipeline(leads) {
  const valid = [];
  const invalid = [];

  for (const lead of leads) {
    const result = validateLead(lead);
    const annotated = Object.assign({}, lead, { _validation: result });
    if (result.valid) {
      valid.push(annotated);
    } else {
      invalid.push(annotated);
    }
  }

  const { unique, duplicates } = dedupe(valid);

  const summary = {
    total: leads.length,
    valid: valid.length,
    invalid: invalid.length,
    unique: unique.length,
    duplicates: duplicates.length,
  };

  console.log("[LeadValidation] Pipeline summary:", summary);

  return { valid: unique, invalid, duplicates, summary };
}

module.exports = { runValidationPipeline };
