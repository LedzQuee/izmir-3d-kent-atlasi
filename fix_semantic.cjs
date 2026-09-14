const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Coğrafi hesaplamalari kaldirip, kesin metin (ILCE) okuma mantigini geri getirelim
const getIlceFunc = `
    private getIlceFromRecord(rec: any): string {
        if (!rec) return 'İZMİR (GENEL)';
        
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
        
        // Eger ilce kutucugu bos birakildiysa ama isminde ilce geciyorsa (Yapay Zeka Kurtarmasi)
        if (!val && rec.ADI) {
            const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
            const ilceler = ['ALİAĞA', 'BALÇOVA', 'BAYINDIR', 'BAYRAKLI', 'BERGAMA', 'BEYDAĞ', 'BORNOVA', 'BUCA', 'ÇEŞME', 'ÇİĞLİ', 'DİKİLİ', 'FOÇA', 'GAZİEMİR', 'GÜZELBAHÇE', 'KARABAĞLAR', 'KARABURUN', 'KARŞIYAKA', 'KEMALPAŞA', 'KINIK', 'KİRAZ', 'KONAK', 'MENDERES', 'MENEMEN', 'NARLIDERE', 'ÖDEMİŞ', 'SEFERİHİSAR', 'SELÇUK', 'TİRE', 'TORBALI', 'URLA'];
            for(let i=0; i<ilceler.length; i++) {
                if (ad.includes(ilceler[i])) return ilceler[i];
            }
        }
        
        if (typeof val !== 'string') return 'İZMİR (GENEL)';
        val = val.toLocaleUpperCase('tr-TR').trim();
        
        // Belediye verilerindeki kronik yazim hatalarini kesin olarak duzelt
        if (val.includes('KARŞI')) return 'KARŞIYAKA';
        if (val.includes('KARABA')) return 'KARABAĞLAR';
        if (val.includes('KEMALPA')) return 'KEMALPAŞA';
        if (val.includes('GÜZELBA')) return 'GÜZELBAHÇE';
        if (val.includes('BALÇOV')) return 'BALÇOVA';
        if (val.includes('MENDER')) return 'MENDERES';
        if (val.includes('SEFERİH')) return 'SEFERİHİSAR';
        
        return val;
    }

    private extractPoints() {
`;

// getNearestDistrict fonksiyonlarinin baslangicindan extractPoints'e kadar olan kismi degistir
code = code.replace(/private districtsData[\s\S]*?private extractPoints\(\) \{/, getIlceFunc);

// extractPoints icindeki getNearestDistrict cagrilarini getIlceFromRecord ile degistir
code = code.replace(/const ilce = this\.getNearestDistrict\(worldPos\.x, worldPos\.z\);/g, "const ilce = this.getIlceFromRecord(node.userData.record);");
code = code.replace(/const ilce = this\.getNearestDistrict\(pos\.x, pos\.z\);/g, "const ilce = this.getIlceFromRecord(records ? records[i] : null);");

fs.writeFileSync('src/core/DistrictManager.ts', code);
