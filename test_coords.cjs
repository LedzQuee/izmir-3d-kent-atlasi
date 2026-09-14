const https = require('https');

function testKeys(endpoint) {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const parsed = JSON.parse(data);
            const records = parsed.onemliyer || parsed;
            if (records && records.length > 0) {
                console.log(`\n--- ${endpoint.toUpperCase()} ---`);
                console.log(`İlk Kaydın Tüm Anahtarları:`, Object.keys(records[0]));
                console.log(`ENLEM var mı:`, records[0].ENLEM || records[0].enlem || 'YOK');
                console.log(`BOYLAM var mı:`, records[0].BOYLAM || records[0].boylam || 'YOK');
            }
        });
    });
}

testKeys('taksiduraklari');
testKeys('plajlar');
