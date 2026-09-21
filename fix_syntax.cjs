const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Cift tekrar eden degiskenleri regex ile tamamen temizle
code = code.replace(/const FADE_START = 2200;\s*const FADE_END = 1200;\s*\/\/\s*Bu mesafede saydamlasmaya baslar\s*const FADE_END = 1200;\s*\/\/\s*Bu mesafeden daha yakindaysa tamamen kaybolur/g, 
"const FADE_START = 2200; // Bu mesafede saydamlasmaya baslar\n        const FADE_END = 1200; // Bu mesafeden daha yakindaysa tamamen kaybolur");

fs.writeFileSync('src/core/DistrictManager.ts', code);
