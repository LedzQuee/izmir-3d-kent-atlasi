const fs = require('fs');
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');

const target = "legend.appendChild(content);";

const toolCode = `
  const divider = document.createElement('div');
  divider.style.borderTop = '1px solid #444';
  divider.style.margin = '15px 0 10px 0';
  content.appendChild(divider);

  const busToolRow = document.createElement('div');
  busToolRow.style.cssText = 'padding: 10px; cursor: pointer; display: flex; align-items: center; border-radius: 6px; transition: 0.2s; background: rgba(0,0,0,0.5); color: #fff; font-weight: bold; border: 1px solid #555; justify-content: center; margin-bottom: 5px;';
  busToolRow.innerHTML = 'Yakın Otobüs Durağı Bul (Kapalı)';
  
  import('../ui/UIManager').then(({ UIManager }) => {
      busToolRow.onclick = () => {
          UIManager.busStopMode = !UIManager.busStopMode;
          if (UIManager.busStopMode) {
              busToolRow.style.background = 'rgba(0, 170, 255, 0.4)';
              busToolRow.style.borderColor = '#00aaff';
              busToolRow.innerHTML = 'Yakın Otobüs Durağı Bul (Açık)';
              UIManager.showToast('Otobüs Modu Açık: Lütfen haritada bir noktaya tıklayın.');
          } else {
              busToolRow.style.background = 'rgba(0,0,0,0.5)';
              busToolRow.style.borderColor = '#555';
              busToolRow.innerHTML = 'Yakın Otobüs Durağı Bul (Kapalı)';
              window.dispatchEvent(new CustomEvent('clearBusStops'));
          }
      };
  });
  content.appendChild(busToolRow);
`;

if(!legend.includes('busToolRow')) {
    legend = legend.replace(target, toolCode + '\n  ' + target);
    fs.writeFileSync('src/utils/legend.ts', legend);
}
