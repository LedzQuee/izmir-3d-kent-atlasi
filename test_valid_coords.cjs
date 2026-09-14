const https = require('https');

function testValid(endpoint, name) {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const parsed = JSON.parse(data);
            const records = parsed.onemliyer || parsed;
            if (records && records.length > 0) {
                let validCount = 0;
                let nullCount = 0;
                let stringCount = 0;
                
                records.forEach(r => {
                    const lat = parseFloat(r.ENLEM || r.enlem || r.Enlem || r.Y);
                    const lng = parseFloat(r.BOYLAM || r.boylam || r.Boylam || r.X);
                    
                    if (!isNaN(lat) && !isNaN(lng) && lat > 0 && lng > 0) {
                        validCount++;
                    } else {
                        nullCount++;
                    }
                });
                
                console.log(`${name.toUpperCase()}:`);
                console.log(` -> API'den Gelen Toplam Veri: ${records.length}`);
                console.log(` -> Gecerli Koordinati (Haritada Cizilebilir) Olanlar: ${validCount}`);
                console.log(` -> Koordinati BOZUK veya BOS olanlar (Cope Atilan): ${nullCount}`);
                console.log('-----------------------------------');
            }
        });
    });
}

testValid('afetaciltoplanmaalani', 'Afet Toplanma Alanlari');
testValid('izbbhizmetnoktalari', 'IzBB Hizmet Noktalari');
testValid('taksiduraklari', 'Taksi Duraklari');
testValid('meydanlar', 'Meydanlar');
