const https = require('https');

const endpoints = [
    'havaalanlari', 'kaplicalar', 'yetistirmeyurtlari', 'terminaller',
    'cocukgenclikmerkezleri', 'ailedayanismamerkezleri', 'meydanlar',
    'plajlar', 'huzurevleri', 'toplummerkezleri', 'izbbhizmetnoktalari',
    'taksiduraklari', 'afetaciltoplanmaalani'
];

const targetDistricts = ['SEFERİHİSAR', 'SELÇUK', 'TİRE', 'TORBALI', 'URLA'];
const tumIlceler = [
    'ALİAĞA', 'BALÇOVA', 'BAYINDIR', 'BAYRAKLI', 'BERGAMA',
    'BEYDAĞ', 'BORNOVA', 'BUCA', 'ÇEŞME', 'ÇİĞLİ',
    'DİKİLİ', 'FOÇA', 'GAZİEMİR', 'GÜZELBAHÇE', 'KARABAĞLAR',
    'KARABURUN', 'KARŞIYAKA', 'KEMALPAŞA', 'KINIK', 'KİRAZ',
    'KONAK', 'MENDERES', 'MENEMEN', 'NARLIDERE', 'ÖDEMİŞ',
    'SEFERİHİSAR', 'SELÇUK', 'TİRE', 'TORBALI', 'URLA'
];

let results = { 'SEFERİHİSAR': 0, 'SELÇUK': 0, 'TİRE': 0, 'TORBALI': 0, 'URLA': 0 };
let digerCount = 0; // Ilce ismi bos olanlar veya baska sehir yazanlar
let completed = 0;

const previousSum = 2867;
const TOTAL_EXPECTED = 3311;

function normalizeIlce(rec) {
    if (!rec) return 'DİĞER';
    let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
    if (!val && rec.ADI) {
        const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
        for (let d of tumIlceler) {
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
                        } else if (!tumIlceler.includes(ilce)) {
                            digerCount++; // Ilcesi 30 ilceden biri olmayanlar (Bilinmeyen)
                        }
                    });
                }
            } catch(e) {}
            
            completed++;
            if (completed === endpoints.length) {
                let currentGroupSum = 0;
                targetDistricts.forEach(d => currentGroupSum += results[d]);
                
                const totalCountedSoFar = previousSum + currentGroupSum;

                console.log("--- 6. GRUP (S-U) KESİN API RAPORU ---");
                targetDistricts.forEach(d => {
                    console.log(` > ${d}: ${results[d]} adet veri`);
                });
                console.log("-----------------------------------------");
                console.log(`>> 30 İLÇENİN TOPLAM KESİN VERİ SAYISI: ${totalCountedSoFar}`);
                console.log(`>> İlçe Verisi Boş veya Eksik Girilenler (Diğer): ${digerCount}`);
                console.log(`>> GENEL TOPLAM (30 İlçe + Diğer): ${totalCountedSoFar + digerCount}`);
                console.log("-----------------------------------------");
            }
        });
    });
});
