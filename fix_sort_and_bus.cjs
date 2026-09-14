const fs = require('fs');

// 1. UIManager'a otobus modu degiskenini ekle
let ui = fs.readFileSync('src/ui/UIManager.ts', 'utf8');
if (!ui.includes('busStopMode')) {
    ui = ui.replace('export class UIManager {', 'export class UIManager {\n    static busStopMode: boolean = false;');
    fs.writeFileSync('src/ui/UIManager.ts', ui);
}

// 2. DistrictManager.ts'de sag taraftaki siralamayi (Sayi degil A'dan Z'ye) yap
let dm = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');
dm = dm.replace(
    /Array\.from\(counts\.entries\(\)\)\.sort\(\(a, b\) => b\[1\] - a\[1\]\);/g, 
    "Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr-TR'));"
);
fs.writeFileSync('src/core/DistrictManager.ts', dm);

// 3. main.ts icindeki legend'a Otobusler katmanini ekle
let main = fs.readFileSync('src/main.ts', 'utf8');

// Once UIManager ve clearNearestStops import edilmis mi kontrol et
if (!main.includes("import { clearNearestStops }")) {
    main = "import { clearNearestStops } from './layers/OtobusDuraklariLayer';\n" + main;
}
if (!main.includes("import { UIManager }")) {
    main = "import { UIManager } from './ui/UIManager';\n" + main;
}

// Sol menuye (legend array) otobus butonunu ekle
const otobusLegendItem = `
    { name: 'Yakın Otobüs Durakları (Haritaya Tıklayın)', color: '#00ffaa', onToggle: v => {
        UIManager.busStopMode = v;
        // Kapatildiginda ekrandaki (varsa) otobus duraklarini sil
        if(!v && window.engineInstance) { 
            clearNearestStops(window.engineInstance.scene); 
        }
    }},`;

// Legend olusturma fonksiyonunu bulup en uste ekleyelim
if (!main.includes("Yakın Otobüs Durakları")) {
    main = main.replace('createLegend([', 'createLegend([\n' + otobusLegendItem);
}

// clearNearestStops icin engine referansini window'a atayalim (main.ts'de const engine = new Engine(..))
if (!main.includes("window.engineInstance")) {
    main = main.replace('const engine = new Engine(canvas);', 'const engine = new Engine(canvas);\n  (window as any).engineInstance = engine;');
}

fs.writeFileSync('src/main.ts', main);
