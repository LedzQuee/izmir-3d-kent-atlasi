export interface LegendItem {
  id: string;
  color: string;
  label: string;
  initialState: boolean;
  onToggle: (state: boolean) => void;
}

export function createLegend(items: LegendItem[]) {
  const existing = document.getElementById('map-legend');
  if (existing) existing.remove();

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.style.cssText = `
    position: fixed; top: 20px; left: 20px;
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px; padding: 15px;
    color: white; font-family: sans-serif; font-size: 13px;
    z-index: 100; backdrop-filter: blur(8px); min-width: 250px;
    transition: all 0.3s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;`;
  
  const title = document.createElement('div');
  title.textContent = 'İzmir 3D Kent Atlası';
  title.style.cssText = 'font-weight: bold; color: #aad4ff;';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '−';
  toggleBtn.title = "Filtreleri Gizle";
  toggleBtn.style.cssText = `background: none; border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0 5px;`;
  
  header.appendChild(title);
  header.appendChild(toggleBtn);
  legend.appendChild(header);

  const content = document.createElement('div');
  content.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
  content.style.overflow = "hidden";
  content.style.maxHeight = "600px"; 
  content.style.opacity = "1";

  // TEK BUTON
  const topControls = document.createElement('div');
  topControls.style.cssText = `display: flex; margin-bottom: 12px;`;
  
  const btnToggleAll = document.createElement('button');
  let allVisible = true;
  btnToggleAll.textContent = 'Hepsini Gizle';
  btnToggleAll.style.cssText = `flex: 1; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer; font-size: 11px; transition: background 0.2s;`;
  btnToggleAll.onmouseover = () => btnToggleAll.style.background = '#444';
  btnToggleAll.onmouseout = () => btnToggleAll.style.background = '#333';
  
  topControls.appendChild(btnToggleAll);
  content.appendChild(topControls);

  let isExpanded = true;
  toggleBtn.onclick = () => {
    isExpanded = !isExpanded;
    content.style.maxHeight = isExpanded ? "600px" : "0px";
    content.style.opacity = isExpanded ? "1" : "0";
    toggleBtn.textContent = isExpanded ? '−' : '+';
    toggleBtn.title = isExpanded ? "Filtreleri Gizle" : "Filtreleri Goster";
    legend.style.paddingBottom = isExpanded ? "15px" : "8px"; 
    header.style.marginBottom = isExpanded ? "8px" : "0px";
    header.style.borderBottom = isExpanded ? "1px solid #444" : "none";
  };

  const rowElements: { row: HTMLElement, dot: HTMLElement, item: LegendItem, state: { visible: boolean } }[] = [];

  // Duruma gore metni guncelleyen akilli fonksiyon
  const updateToggleBtnState = () => {
    const anyHidden = rowElements.some(r => !r.state.visible);
    if (anyHidden) {
      allVisible = false;
      btnToggleAll.textContent = 'Hepsini Göster';
    } else {
      allVisible = true;
      btnToggleAll.textContent = 'Hepsini Gizle';
    }
  };

  items.forEach(item => {
    const state = { visible: item.initialState };
    
    const row = document.createElement('div');
    row.style.cssText = `display: flex; align-items: center; gap: 10px; margin: 8px 0; cursor: pointer; user-select: none; transition: all 0.2s; opacity: ${state.visible ? '1' : '0.4'};`;

    const dot = document.createElement('div');
    dot.style.cssText = `width: 14px; height: 14px; border-radius: 50%; background-color: ${item.color}; box-shadow: 0 0 8px ${item.color}; transition: transform 0.2s; transform: ${state.visible ? 'scale(1)' : 'scale(0.5)'};`;

    const label = document.createElement('span');
    label.textContent = item.label;

    row.onclick = () => {
      state.visible = !state.visible;
      row.style.opacity = state.visible ? '1' : '0.4';
      dot.style.transform = state.visible ? 'scale(1)' : 'scale(0.5)';
      item.onToggle(state.visible);
      updateToggleBtnState();
    };

    row.appendChild(dot);
    row.appendChild(label);
    content.appendChild(row);
    
    rowElements.push({ row, dot, item, state });
  });

  // Butona tiklandiginda...
  btnToggleAll.onclick = () => {
    const targetState = !allVisible; 
    
    rowElements.forEach(r => {
      if(r.state.visible !== targetState) {
        r.state.visible = targetState;
        r.row.style.opacity = targetState ? '1' : '0.4';
        r.dot.style.transform = targetState ? 'scale(1)' : 'scale(0.5)';
        r.item.onToggle(targetState);
      }
    });
    updateToggleBtnState();
  };

  
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
              UIManager.showToast('Otobüs Arama Modu Kapatıldı.');
              window.dispatchEvent(new CustomEvent('clearBusStops'));
          }
      };
  });
  content.appendChild(busToolRow);

  legend.appendChild(content);
  document.body.appendChild(legend);
}
