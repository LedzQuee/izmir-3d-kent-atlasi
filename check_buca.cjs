const https = require('https');

const endpoints = ['taksiduraklari', 'afetaciltoplanmaalani', 'huzurevleri', 'meydanlar', 'bisikletyollari', 'katiatiktesisleri'];
let completed = 0;
let totalBuca = 0;
let totalIzmir = 0;
let bucaVariants = new Set();

endpoints.forEach(endpoint => {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const records = parsed.onemliyer || parsed;
                if(Array.isArray(records)) {
                    totalIzmir += records.length;
                    records.forEach(r => {
                        let ilce = r.ILCE || r.Ilce || r.ilce || r.ILCE_ADI || r.ilce_adi || '';
                        if (typeof ilce === 'string' && ilce.toUpperCase().includes('BUCA')) {
                            totalBuca++;
                            bucaVariants.add(ilce);
                        }
                    });
                }
            } catch(e) {}
            
            completed++;
            if (completed === endpoints.length) {
                console.log(`\n--- BUCA RAPORU ---`);
                console.log(`Toplam İncelenen Kayıt (Tüm İzmir): ${totalIzmir}`);
                console.log(`Buca İlçesine Ait Bulunan Toplam Kayıt: ${totalBuca}`);
                console.log(`Buca Yazım Çeşitleri (API'de nasıl yazılmış?):`, Array.from(bucaVariants));
            }
        });
    });
});
