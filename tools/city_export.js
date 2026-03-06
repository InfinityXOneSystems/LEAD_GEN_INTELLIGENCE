const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

// Define cities and their corresponding CSV paths
const cities = {
    'Columbus, OH': 'data/exports/leads_columbus_oh_2026-03-06.csv',
    'Tempe, AZ': 'data/exports/leads_tempe_az_2026-03-06.csv',
    'Rockford, IL': 'data/exports/leads_rockford_il_2026-03-06.csv'
};

// Check for required data files
const leadsFile = path.resolve(__dirname, '..', 'data', 'leads', 'leads.json');
const scoredLeadsFile = path.resolve(__dirname, '..', 'data', 'leads', 'scored_leads.json');

let leads = [];

try {
    leads = require(leadsFile);
} catch {
    try {
        leads = require(scoredLeadsFile);
    } catch (error) {
        console.error("No leads file found.");
        process.exit(1);
    }
}

// Create exports directory if it doesn't exist
const exportDir = path.resolve(__dirname, '..', 'data', 'exports');
if (!fs.existsSync(exportDir)){ 
    fs.mkdirSync(exportDir, { recursive: true });
}

// Filter leads and write CSVs
Object.keys(cities).forEach(city => {
    const filteredLeads = leads.filter(lead => lead.city === city);
    
    // Write CSV
    const csvPath = cities[city];
    const csvWriterInstance = csvWriter({
        path: csvPath,
        header: [
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            // Add other headers as needed
        ]
    });

    csvWriterInstance.writeRecords(filteredLeads).then(() => {
        console.log(`Exported leads for ${city} to ${csvPath}`);
    });

    // Create Markdown summary
    const markdownPath = path.join(exportDir, `summary_${city.split(',')[0].toLowerCase()}.md`);
    const summaryContent = `# Summary for ${city}\n\nTotal leads: ${filteredLeads.length}\n\n`;
    fs.writeFileSync(markdownPath, summaryContent);
});
