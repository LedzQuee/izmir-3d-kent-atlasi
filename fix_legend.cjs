const fs = require('fs');

let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');
legend = legend.replace(/Harita KatmanlarÄ±/g, 'Harita Katmanları');
legend = legend.replace(/âˆ’/g, '-');
legend = legend.replace(/MenÃ¼yÃ¼ KÃ¼Ã§Ã¼lt/g, 'Menüyü Küçült');
legend = legend.replace(/Ã°simsiz Katman/g, 'İsimsiz Katman');
legend = legend.replace(/Hepsini Gizle/g, 'Hepsini Gizle');

// Any other weird utf-8 artifacts
legend = legend.replace(/Ã‡/g, 'Ç');
legend = legend.replace(/Ã§/g, 'ç');
legend = legend.replace(/Ä±/g, 'ı');
legend = legend.replace(/Ä°/g, 'İ');
legend = legend.replace(/Ã¶/g, 'ö');
legend = legend.replace(/Ã–/g, 'Ö');
legend = legend.replace(/Ã¼/g, 'ü');
legend = legend.replace(/Ãœ/g, 'Ü');
legend = legend.replace(/ÅŸ/g, 'ş');
legend = legend.replace(/Åž/g, 'Ş');
legend = legend.replace(/ÄŸ/g, 'ğ');
legend = legend.replace(/Äž/g, 'Ğ');

fs.writeFileSync('src/utils/legend.ts', legend, 'utf8');
