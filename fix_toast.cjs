const fs = require('fs');
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');

// Kapali durumuna uyari mesaji ekleyelim
const targetOld = "busToolRow.innerHTML = 'Yakın Otobüs Durağı Bul (Kapalı)';\n              window.dispatchEvent(new CustomEvent('clearBusStops'));";
const targetNew = "busToolRow.innerHTML = 'Yakın Otobüs Durağı Bul (Kapalı)';\n              UIManager.showToast('Otobüs Modu Kapatıldı. Harita temizlendi.');\n              window.dispatchEvent(new CustomEvent('clearBusStops'));";

legend = legend.replace(targetOld, targetNew);
fs.writeFileSync('src/utils/legend.ts', legend);
