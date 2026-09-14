const fs = require('fs');
let districtManager = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Turkce karakter sorununu kokten cozelim
districtManager = districtManager.replace(
    "return val.toUpperCase().trim();",
    "return val.toLocaleUpperCase('tr-TR').trim();"
);

fs.writeFileSync('src/core/DistrictManager.ts', districtManager);
