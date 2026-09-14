const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

const getIlceNew = `
    private getIlce(rec: any): string {
        if (!rec) return 'İZMİR (GENEL)';
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid || 'İZMİR (GENEL)';
        if (typeof val !== 'string') return 'İZMİR (GENEL)';
        
        val = val.toLocaleUpperCase('tr-TR').trim();
        
        // Bazi ozel API hatalarini duzeltelim
        if (val.includes('KARŞI')) return 'KARŞIYAKA';
        if (val.includes('KARABA')) return 'KARABAĞLAR';
        if (val.includes('KEMALPA')) return 'KEMALPAŞA';
        if (val.includes('GÜZELBA')) return 'GÜZELBAHÇE';
        if (val.includes('BALÇOV')) return 'BALÇOVA';
        if (val.includes('MENDER')) return 'MENDERES';
        if (val.includes('SEFERİH')) return 'SEFERİHİSAR';
        if (val === 'İZMİR (GENEL)' && rec.ADI) {
            // Eger ilce yoksa ama isminde ilce geciyorsa kurtarmayi deneyelim
            const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
            const ilceler = ['BUCA', 'KONAK', 'BORNOVA', 'KARŞIYAKA', 'ÇİĞLİ', 'BAYRAKLI', 'KARABAĞLAR', 'BALÇOVA', 'GAZİEMİR', 'NARLIDERE', 'GÜZELBAHÇE', 'URLA', 'ÇEŞME', 'KARABURUN', 'SEFERİHİSAR', 'MENDERES', 'SELÇUK', 'TORBALI', 'TİRE', 'ÖDEMİŞ', 'BEYDAĞ', 'KİRAZ', 'BAYINDIR', 'KEMALPAŞA', 'MENEMEN', 'ALİAĞA', 'FOÇA', 'DİKİLİ', 'BERGAMA', 'KINIK'];
            for(let i=0; i<ilceler.length; i++) {
                if (ad.includes(ilceler[i])) return ilceler[i];
            }
        }
        
        return val;
    }
`;

code = code.replace(/private getIlce[\s\S]*?private extractPoints/, getIlceNew + "\n    private extractPoints");
fs.writeFileSync('src/core/DistrictManager.ts', code);
