const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

const searchUI = `
    private initSearchUI() {
        // Eski efsane (sol menuyu) gizleyelim
        const oldLegend = document.getElementById('legend-container');
        if (oldLegend) oldLegend.style.display = 'none';
        
        // Eger varsa oncekini temizle
        const existing = document.getElementById('district-search-tab');
        if (existing) existing.remove();

        // Sol kenara yapisik, gizli sekme
        const searchTab = document.createElement('div');
        searchTab.id = 'district-search-tab';
        searchTab.style.cssText = \`
            position: fixed; left: 0; top: 50%; transform: translateY(-50%);
            width: 45px; height: 120px; background: rgba(255,255,255,0.95);
            border-radius: 0 15px 15px 0; box-shadow: 5px 0 15px rgba(0,0,0,0.15);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 200; overflow: hidden;
            backdrop-filter: blur(10px);
        \`;
        
        // Büyüteç ikonu
        const icon = document.createElement('div');
        icon.innerHTML = '🔍';
        icon.style.cssText = 'font-size: 22px; transition: 0.3s; position: absolute; left: 12px;';
        searchTab.appendChild(icon);

        // İçe katlanmis arama paneli
        const searchPanel = document.createElement('div');
        searchPanel.style.cssText = \`
            position: absolute; left: 45px; top: 0; width: 260px; height: 100%;
            padding: 15px; display: flex; flex-direction: column;
            opacity: 0; pointer-events: none; transition: 0.4s; transform: translateX(-20px);
            box-sizing: border-box;
        \`;

        // Arama Kutusu
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'İlçe Ara...';
        input.style.cssText = \`
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;
            font-size: 15px; outline: none; margin-bottom: 15px; box-sizing: border-box;
            background: #f9f9f9; color: #333; font-weight: 500;
        \`;
        
        input.onfocus = () => { input.style.border = '1px solid #ff9900'; };
        input.onblur = () => { input.style.border = '1px solid #ddd'; };
        
        // Ilce Listesi
        const list = document.createElement('div');
        list.style.cssText = 'flex: 1; overflow-y: auto; padding-right: 5px;';
        
        list.innerHTML = \`<style>
            #district-search-tab div::-webkit-scrollbar { width: 4px; }
            #district-search-tab div::-webkit-scrollbar-track { background: transparent; }
            #district-search-tab div::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        </style>\`;
        
        const renderList = (filter: string) => {
            // Sadece listeyi temizle (style etiketini silmeden)
            Array.from(list.children).forEach(c => { if(c.tagName !== 'STYLE') c.remove(); });
            
            this.districtsData.forEach(d => {
                if (d.name.toLowerCase().includes(filter.toLowerCase('tr-TR'))) {
                    const item = document.createElement('div');
                    item.textContent = d.name;
                    item.style.cssText = 'padding: 12px 10px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 14px; color: #444; font-weight: 500; transition: 0.2s; border-radius: 6px;';
                    item.onmouseover = () => { item.style.background = 'rgba(255, 153, 0, 0.1)'; item.style.color = '#ff9900'; };
                    item.onmouseout = () => { item.style.background = 'transparent'; item.style.color = '#444'; };
                    item.onclick = () => {
                        const [x, y, z] = convertGpsToVector(d.lat, d.lng);
                        window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x, z } }));
                    };
                    list.appendChild(item);
                }
            });
        };
        renderList('');

        input.oninput = (e) => renderList((e.target as HTMLInputElement).value);

        searchPanel.appendChild(input);
        searchPanel.appendChild(list);
        searchTab.appendChild(searchPanel);

        // Uzerine gelince (Hover) acilma animasyonu
        searchTab.onmouseenter = () => {
            searchTab.style.width = '320px';
            searchTab.style.height = '450px';
            icon.style.opacity = '0';
            searchPanel.style.opacity = '1';
            searchPanel.style.pointerEvents = 'auto';
            searchPanel.style.transform = 'translateX(0)';
            setTimeout(() => input.focus(), 200);
        };
        
        // Fareden cikinca (Mouse Leave) kapanma animasyonu
        searchTab.onmouseleave = () => {
            searchTab.style.width = '45px';
            searchTab.style.height = '120px';
            icon.style.opacity = '1';
            searchPanel.style.opacity = '0';
            searchPanel.style.pointerEvents = 'none';
            searchPanel.style.transform = 'translateX(-20px)';
            input.value = '';
            renderList('');
            input.blur();
        };

        document.body.appendChild(searchTab);
    }
`;

// Eski initSidebarUI cagirilan yere bunu da ekle
code = code.replace("this.initSidebarUI();", "this.initSidebarUI();\n        this.initSearchUI();");

// Sınıfın sonuna fonksiyonu ekle
code = code.replace(/}\s*$/, searchUI + "\n}");

fs.writeFileSync('src/core/DistrictManager.ts', code);
