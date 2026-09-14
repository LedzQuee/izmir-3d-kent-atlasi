const fs = require('fs');

// 1. UIManager'a state ekle
let ui = fs.readFileSync('src/ui/UIManager.ts', 'utf8');
if (!ui.includes('busStopMode')) {
    ui = ui.replace('export class UIManager {', 'export class UIManager {\n    static busStopMode: boolean = false;');
    fs.writeFileSync('src/ui/UIManager.ts', ui);
}

// 2. OtobusDuraklariLayer'a temizleme fonksiyonu ekle
let otobus = fs.readFileSync('src/layers/OtobusDuraklariLayer.ts', 'utf8');
if (!otobus.includes('clearNearestStops')) {
    otobus += `\nexport function clearNearestStops(scene: THREE.Scene) {
  if (currentBusStopsGroup) {
    disposeGroup(currentBusStopsGroup);
    scene.remove(currentBusStopsGroup);
    currentBusStopsGroup = null;
  }
}\n`;
    fs.writeFileSync('src/layers/OtobusDuraklariLayer.ts', otobus);
}

// 3. Engine.ts'e guvenlik kilidi (busStopMode) ekle
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');
if (!engine.includes('clearNearestStops')) {
    engine = engine.replace(/import \{ fetchNearestStops \} from '\.\.\/layers\/OtobusDuraklariLayer';/, "import { fetchNearestStops, clearNearestStops } from '../layers/OtobusDuraklariLayer';");
    engine = engine.replace(/this\.pointerDownPos = new THREE\.Vector2\(\);/, `this.pointerDownPos = new THREE.Vector2();\n    window.addEventListener('clearBusStops', () => clearNearestStops(this.scene));`);
    engine = engine.replace(/if \(groundHit\) \{\s*fetchNearestStops\(this\.scene, groundHit\.point\.x, groundHit\.point\.z\);\s*\}/, 
    `if (groundHit && UIManager.busStopMode) {\n          fetchNearestStops(this.scene, groundHit.point.x, groundHit.point.z);\n        }`);
    fs.writeFileSync('src/core/Engine.ts', engine);
}

// 4. Legend (Arayuz) kismina Buton Ekle
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');
if (!legend.includes('busToolRow')) {
    const appendTarget = "document.body.appendChild(container);";
    const toolCode = `
  const divider = document.createElement('div');
  divider.style.borderTop = '1px solid #444';
  divider.style.margin = '15px 0 10px 0';
  container.appendChild(divider);

  const busToolRow = document.createElement('div');
  busToolRow.style.cssText = 'padding: 10px; cursor: pointer; display: flex; align-items: center; border-radius: 6px; transition: 0.2s; background: rgba(0,0,0,0.5); color: #fff; font-weight: bold; border: 1px solid #555; justify-content: center;';
  busToolRow.innerHTML = '<span style="margin-right: 8px;">📍</span> Yakın Otobüs Durağı Bul (Kapalı)';
  
  import('../ui/UIManager').then(({ UIManager }) => {
      busToolRow.onclick = () => {
          UIManager.busStopMode = !UIManager.busStopMode;
          if (UIManager.busStopMode) {
              busToolRow.style.background = 'rgba(0, 170, 255, 0.4)';
              busToolRow.style.borderColor = '#00aaff';
              busToolRow.innerHTML = '<span style="margin-right: 8px;">📍</span> Yakın Otobüs Durağı Bul (Açık)';
              UIManager.showToast('Otobüs Modu Açık: Lütfen haritada bir noktaya tıklayın.');
          } else {
              busToolRow.style.background = 'rgba(0,0,0,0.5)';
              busToolRow.style.borderColor = '#555';
              busToolRow.innerHTML = '<span style="margin-right: 8px;">📍</span> Yakın Otobüs Durağı Bul (Kapalı)';
              window.dispatchEvent(new CustomEvent('clearBusStops')); // Ekrani temizle
          }
      };
  });
  container.appendChild(busToolRow);
`;
    legend = legend.replace(appendTarget, toolCode + '\n  ' + appendTarget);
    fs.writeFileSync('src/utils/legend.ts', legend);
}
