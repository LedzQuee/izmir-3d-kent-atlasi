const https = require('https');

const endpoints = [
    'havaalanlari', 'kaplicalar', 'yetistirmeyurtlari', 'terminaller',
    'cocukgenclikmerkezleri', 'ailedayanismamerkezleri', 'meydanlar',
    'plajlar', 'huzurevleri', 'toplummerkezleri', 'izbbhizmetnoktalari',
    'taksiduraklari', 'afetaciltoplanmaalani'
];

const targetDistricts = ['BEYDAĞ', 'BORNOVA', 'BUCA', 'ÇEŞME', 'ÇİĞLİ'];
let results = { 'BEYDAĞ': 0, 'BORNOVA': 0, 'BUCA': 0, 'ÇEŞME': 0, 'ÇİĞLİ': 0 };
let completed = 0;

// Ilk gruptan gelen veriler (Sabit)
const group1Sum = 99 + 47 + 78 + 151 + 144; // 519
const TOTAL_EXPECTED = 3311;

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

endpoints.forEach(endpoint => {
    https.get("https://openapi.izmir.bel.tr/api/ibb/cbs/" + endpoint, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const records = parsed.onemliyer || parsed;
                if(Array.isArray(records)) {
                    records.forEach(r => {
                        const ilce = normalizeIlce(r);
                        if (targetDistricts.includes(ilce)) {
                            results[ilce]++;
                        }
                    });
                }
            } catch(e) {}
            
            completed++;
            if (completed === endpoints.length) {
                let currentGroupSum = 0;
                targetDistricts.forEach(d => currentGroupSum += results[d]);
                
                const totalCountedSoFar = group1Sum + currentGroupSum;
                const remaining = TOTAL_EXPECTED - totalCountedSoFar;

                console.log("--- 2. GRUP (B-Ç) KESİN API RAPORU ---");
                targetDistricts.forEach(d => {
                    console.log(` > ${d}: ${results[d]} adet veri`);
                });
                console.log("-----------------------------------------");
                console.log(`>> Su Ana Kadar Sayilan (10 Ilce Toplami): ${totalCountedSoFar}`);
                console.log(`>> Bekleyen (Kalan) Veri Sayisi: ${remaining}`);
                console.log("-----------------------------------------");
            }
        });
    });
});
