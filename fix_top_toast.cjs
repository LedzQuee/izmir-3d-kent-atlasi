const fs = require('fs');
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');

// Olası eski eklenmis bildirimleri temizleyelim (cift olmamasi icin)
legend = legend.replace(/UIManager\.showToast\('Otobüs.*?Kapatıldı.*?'\);\s*/g, '');

// Kesin çalisacak sekilde dispatchEvent uzerine yerlestirelim
const target = "window.dispatchEvent(new CustomEvent('clearBusStops'));";
const newCode = "UIManager.showToast('Otobüs Arama Modu Kapatıldı.');\n              window.dispatchEvent(new CustomEvent('clearBusStops'));";
legend = legend.replace(target, newCode);

fs.writeFileSync('src/utils/legend.ts', legend);
