fetch("/contracts/lead_schema.json")
  .then((r) => r.json())
  .then((schema) => {
    console.log("Schema loaded");
  });
