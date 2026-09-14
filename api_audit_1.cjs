const https = require('https');

const endpoints = [
    'havaalanlari', 'kaplicalar', 'yetistirmeyurtlari', 'terminaller',
    'cocukgenclikmerkezleri', 'ailedayanismamerkezleri', 'meydanlar',
    'plajlar', 'huzurevleri', 'toplummerkezleri', 'izbbhizmetnoktalari',
    'taksiduraklari', 'afetaciltoplanmaalani'
];

const targetDistricts = ['ALİAĞA', 'BALÇOVA', 'BAYINDIR', 'BAYRAKLI', 'BERGAMA'];
let results = { 'ALİAĞA': 0, 'BALÇOVA': 0, 'BAYINDIR': 0, 'BAYRAKLI': 0, 'BERGAMA': 0, 'DİĞER': 0 };
let completed = 0;
let totalApiRecords = 0;

function normalizeIlce(rec) {
    if (!rec) return 'DİĞER';
    let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
    
    if (!val && rec.ADI) {
        const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
        for (let d of targetDistricts) {
            if (ad.includes(d)) return d;
        }
    }
    
    if (typeof val !== 'string') return 'DİĞER';
    val = val.toLocaleUpperCase('tr-TR').trim();
    if (val.includes('KARŞI')) return 'KARŞIYAKA';
    if (val.includes('KARABA')) return 'KARABAĞLAR';
    if (val.includes('KEMALPA')) return 'KEMALPAŞA';
    if (val.includes('GÜZELBA')) return 'GÜZELBAHÇE';
    if (val.includes('BALÇOV')) return 'BALÇOVA';
    if (val.includes('MENDER')) return 'MENDERES';
    if (val.includes('SEFERİH')) return 'SEFERİHİSAR';
    
    return val;
}

console.log("API'lerden ham veriler cekiliyor...");

endpoints.forEach(endpoint => {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const records = parsed.onemliyer || parsed;
                if(Array.isArray(records)) {
                    totalApiRecords += records.length;
                    records.forEach(r => {
                        const ilce = normalizeIlce(r);
                        if (targetDistricts.includes(ilce)) {
                            results[ilce]++;
                        } else {
                            results['DİĞER']++;
                        }
                    });
                }
            } catch(e) {}
            
            completed++;
            if (completed === endpoints.length) {
                console.log("\n--- İLK 5 İLÇE (A-B) KESİN API RAPORU ---");
                console.log(`Taranan Toplam Ham Veri (13 API): ${totalApiRecords}`);
                targetDistricts.forEach(d => {
                    console.log(` > ${d}: ${results[d]} adet veri`);
                });
                console.log("-----------------------------------------");
            }
        });
    });
});
