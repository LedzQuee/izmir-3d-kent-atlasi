const fs = require('fs');
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Unutulmus clusterManager cagrisini bul ve temizle
engine = engine.replace(/this\.clusterManager\.update\(\)/g, "this.districtManager.update()");

// districtManager baslatma kodunu event listenerlardan ONCEYE tasi (Crash'i onlemek icin)
const initLine = "this.districtManager = new DistrictManager(this.scene, this.camera);";
engine = engine.replace(initLine, ""); // Eskisini sil
engine = engine.replace(
    "window.addEventListener('resize'", 
    initLine + "\n    window.addEventListener('resize'"
);

fs.writeFileSync('src/core/Engine.ts', engine);
