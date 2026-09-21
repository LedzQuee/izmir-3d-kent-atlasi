
export function createLegend(items: { label: string, color: string, onToggle: (checked: boolean) => void }[]) {
  // Eger eski kutucuklu id'ler kaldiysa onlari sil
  const existing1 = document.getElementById('map-legend');
  const existing2 = document.getElementById('legend-container');
  if (existing1) existing1.remove();
  if (existing2) existing2.remove();

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px; padding: 15px;
    color: white; font-family: sans-serif; font-size: 13px;
    z-index: 100; backdrop-filter: blur(8px); min-width: 250px;
    transition: all 0.3s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;';
  
  const title = document.createElement('div');
  title.textContent = 'Harita Katmanları';
  title.style.cssText = 'font-weight: bold; color: #aad4ff;';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '-';
  toggleBtn.title = "Menüyü Küçült";
  toggleBtn.style.cssText = 'background: none; border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0 5px;';
  
  header.appendChild(title);
  header.appendChild(toggleBtn);
  legend.appendChild(header);

  const content = document.createElement('div');
  content.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
  content.style.overflow = "hidden"; // max-height transition icin lazim, sonuclarda sorun yaratmamasi icin listeyi iceride tutacagiz
  content.style.maxHeight = "600px"; 
  content.style.opacity = "1";

  // Arama Kutusu
  const searchContainer = document.createElement('div');
  searchContainer.style.cssText = 'position: relative; margin-bottom: 12px;';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Nokta/Mekan Ara...';
  searchInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px; border: 1px solid #555; background: #222; color: white; outline: none; font-size: 12px; margin-bottom: 2px;';
  
  const searchResults = document.createElement('div');
  searchResults.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: #2a2a35; border: 1px solid #555; border-radius: 4px; max-height: 200px; overflow-y: auto; display: none; z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
  
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchResults);
  content.appendChild(searchContainer);

  let searchTimeout: any;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }
    
    searchTimeout = setTimeout(() => {
      // @ts-ignore
      const allFeatures = window.allMapLibreFeatures || [];
      const matches = allFeatures.filter((f: any) => f.properties.recordName.toLowerCase().includes(query)).slice(0, 15);
      
      searchResults.innerHTML = '';
      if (matches.length > 0) {
        matches.forEach((f: any) => {
          const div = document.createElement('div');
          div.style.cssText = 'padding: 8px 10px; border-bottom: 1px solid #444; cursor: pointer; font-size: 12px; color: #ddd;';
          div.innerHTML = `<span style="color:${f.properties.color}">\u2022</span> ${f.properties.recordName}`;
          div.onmouseenter = () => div.style.background = '#3a3a45';
          div.onmouseleave = () => div.style.background = 'transparent';
          div.onclick = () => {
             searchResults.style.display = 'none';
             searchInput.value = '';
             // Fly to location
             const coords = f.geometry.coordinates;
             // @ts-ignore
             window.engineInstance?.map?.flyTo({ center: coords, zoom: 18, pitch: 60 });
             // Show info
             // @ts-ignore
             if (window.UIManager) {
                 // @ts-ignore
                 window.UIManager.showMultiInfo([{
                     layerName: f.properties.layerName,
                     color: f.properties.color,
                     record: JSON.parse(f.properties.recordRaw)
                 }]);
             }
          };
          searchResults.appendChild(div);
        });
        searchResults.style.display = 'block';
      } else {
        searchResults.style.display = 'none';
      }
    }, 300);
  });

  // Disari tiklaninca arama sonuclarini gizle
  document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target as Node)) {
          searchResults.style.display = 'none';
      }
  });

  // Hepsini Gizle / Goster Butonu
  const topControls = document.createElement('div');
  topControls.style.cssText = 'display: flex; margin-bottom: 12px;';
  
  const btnToggleAll = document.createElement('button');
  let allVisible = true;
  btnToggleAll.textContent = 'Hepsini Gizle';
  btnToggleAll.style.cssText = 'flex: 1; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer; font-size: 11px; transition: background 0.2s;';
  btnToggleAll.onmouseover = () => btnToggleAll.style.background = '#444';
  btnToggleAll.onmouseout = () => btnToggleAll.style.background = '#333';
  
  topControls.appendChild(btnToggleAll);
  content.appendChild(topControls);

  let isExpanded = true;
  toggleBtn.onclick = () => {
    isExpanded = !isExpanded;
    content.style.maxHeight = isExpanded ? "600px" : "0px";
    content.style.opacity = isExpanded ? "1" : "0";
    toggleBtn.textContent = isExpanded ? '-' : '+';
    legend.style.paddingBottom = isExpanded ? "15px" : "8px"; 
    header.style.marginBottom = isExpanded ? "8px" : "0px";
    header.style.borderBottom = isExpanded ? "1px solid #444" : "none";
  };

  const rowElements: { row: HTMLElement, dot: HTMLElement, item: any, state: { visible: boolean } }[] = [];

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
    const state = { visible: true };
    
    const row = document.createElement('div');
    // Kutucuk yok! Yuvarlakli ve estetik eski tasarim.
    row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin: 8px 0; cursor: pointer; user-select: none; transition: all 0.2s; opacity: 1;';

    const dot = document.createElement('div');
    dot.style.cssText = `width: 14px; height: 14px; border-radius: 50%; background-color: ${item.color}; box-shadow: 0 0 8px ${item.color}; transition: transform 0.2s; transform: scale(1);`;

    const label = document.createElement('span');
    label.textContent = (item.label || 'İsimsiz Katman');

    row.onclick = () => {
      state.visible = !state.visible;
      row.style.opacity = state.visible ? '1' : '0.4';
      dot.style.transform = state.visible ? 'scale(1)' : 'scale(0.5)';
      item.onToggle(state.visible);
      // Dinamik verileri saydir (Konak etiketindeki veriyi dusurur)
      window.dispatchEvent(new CustomEvent('layerToggled'));
      updateToggleBtnState();
    };

    row.appendChild(dot);
    row.appendChild(label);
    content.appendChild(row);
    
    rowElements.push({ row, dot, item, state });
  });

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
    // Tum katmanlar kapandiginda (veya acildiginda) verileri yeniden say
    window.dispatchEvent(new CustomEvent('layerToggled'));
    updateToggleBtnState();
  };

  legend.appendChild(content);
  document.body.appendChild(legend);
}

