const fs = require('fs');
let eng = fs.readFileSync('src/core/Engine.ts', 'utf8');
// setTimeout yerine setInterval ile her saniye sahneye yeni gelen veri var mi diye baksin
eng = eng.replace(/setTimeout\(\(\) => this\.districtManager\.update\(\), 1500\);/g, "setInterval(() => this.districtManager.update(), 1000);");
fs.writeFileSync('src/core/Engine.ts', eng);
