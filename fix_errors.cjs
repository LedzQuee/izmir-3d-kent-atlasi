const fs = require('fs');

// 1. Sol Menu Isimlerinin Kaybolma Hatasini Cozme (name yerine label okunacak)
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');
legend = legend.replace(/item\.name/g, "(item.label || 'İsimsiz Katman')");
legend = legend.replace(/name:\s*string/g, "label: string");
fs.writeFileSync('src/utils/legend.ts', legend);

// 2. Sag Menudeki Emojiyi (Grafik Isaretini) Silme ve Klasik Ikon (≡) ile Degistirme
let dm = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');
dm = dm.replace(/📊/g, "≡"); // Emojiyi standart HTML karakteriyle degistirir
fs.writeFileSync('src/core/DistrictManager.ts', dm);

