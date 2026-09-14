const https = require('https');

function testEndpoint(endpoint) {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const parsed = JSON.parse(data);
            const records = parsed.onemliyer || parsed;
            console.log(`Endpoint: ${endpoint}`);
            console.log(`Total Records Fetched: ${records.length}`);
            if (records.length > 0) {
                console.log("Sample Keys: ", Object.keys(records[0]).filter(k => k.toLowerCase().includes('ilce') || k.toLowerCase().includes('adi') || k.toLowerCase().includes('ad')));
                console.log("Sample District Value: ", records[0].ILCE || records[0].ilce || records[0].ILCE_ADI || records[0].ilce_adi);
            }
            console.log("-----------------------");
        });
    });
}

testEndpoint('taksiduraklari');
testEndpoint('afetaciltoplanmaalani');
testEndpoint('huzurevleri');
testEndpoint('toplanmamerkezleri');
