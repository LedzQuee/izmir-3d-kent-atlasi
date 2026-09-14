const fs = require('fs');
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');

// Sol menude bir katman acilip kapandiginda, DistrictManager'in sayilari guncellemesi icin event gonder
if (!legend.includes("layerToggled")) {
    legend = legend.replace(/item\.onToggle\(checked\);/g, "item.onToggle(checked);\n            window.dispatchEvent(new CustomEvent('layerToggled'));");
    fs.writeFileSync('src/utils/legend.ts', legend);
}
