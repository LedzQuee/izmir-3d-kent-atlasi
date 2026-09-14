const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

const debugLog = `
        console.log("----- ILCE DAGILIM RAPORU -----");
        console.log("Toplam Taranan Gecerli Nokta: " + this.pointCache.length);
        let total = 0;
        districts.forEach((points, name) => {
            console.log(name + ": " + points.length + " kayit");
            total += points.length;
        });
        console.log("-------------------------------");
`;

if (!code.includes('----- ILCE DAGILIM RAPORU -----')) {
    code = code.replace(
        "const geo = new THREE.SphereGeometry(180, 32, 32);",
        debugLog + "\n        const geo = new THREE.SphereGeometry(180, 32, 32);"
    );
    fs.writeFileSync('src/core/DistrictManager.ts', code);
}
