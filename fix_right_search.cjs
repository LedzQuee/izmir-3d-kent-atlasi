const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Sag paneli olusturan fonksiyonda arama cubugu ekleyelim
const newRightSidebar = `
    private initRightHoverSidebar() {
        const existing = document.getElementById('district-right-sidebar');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'district-right-sidebar';
        container.style.cssText = \`
            position: fixed; right: 0; top: 15%;
            width: 50px; max-height: 80vh; height: 600px;
            background: rgba(20, 25, 30, 0.4); backdrop-filter: blur(8px);
            border-radius: 15px 0 0 15px; border: 1px solid rgba(255,255,255,0.1);
            border-right: none; box-shadow: -5px 5px 20px rgba(0,0,0,0.3);
            color: white; font-family: "Segoe UI", Roboto, sans-serif;
            z-index: 100; overflow: hidden; 
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            display: flex; flex-direction: column;
        \`;

        // Kapaliyken Gorunen Ikon
        const iconDiv = document.createElement('div');
        iconDiv.innerHTML = ' 📊 '; 
        iconDiv.style.cssText = \`
            position: absolute; right: 0; top: 0;
            width: 50px; height: 50px; display: flex;
            align-items: center; justify-content: center; font-size: 22px;
            cursor: pointer; opacity: 1; transition: 0.3s;
        \`;
        container.appendChild(iconDiv);

        const content = document.createElement('div');
        content.id = 'district-list-content';
        content.style.cssText = \`
            width: 320px; opacity: 0; transition: opacity 0.3s, transform 0.4s;
            padding: 20px; pointer-events: none; overflow-y: hidden; height: 100%;
            transform: translateX(20px); box-sizing: border-box; display: flex; flex-direction: column;
        \`;
        
        content.innerHTML = \`<style>
            #district-rows::-webkit-scrollbar { width: 5px; }
            #district-rows::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 5px; }
        </style>
        <h3 style="margin: 0 0 10px 0; color: #ff9900; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">İlçe Veri Sıralaması</h3>
        <input type="text" id="district-search-input" placeholder="Listede ilçe ara..." style="width:100%; padding: 8px; border-radius: 4px; border: 1px solid #555; background: rgba(255,255,255,0.1); color: white; margin-bottom: 10px; outline: none; box-sizing: border-box;">
        <div id="district-rows" style="flex: 1; overflow-y: auto; padding-right: 5px;"></div>
        \`;

        container.appendChild(content);
        document.body.appendChild(container);

        // Arama yapildiginda mevcut HTML elemanlarini gizle/goster
        const searchInput = document.getElementById('district-search-input');
        if(searchInput) {
            searchInput.oninput = (e) => {
                const val = (e.target as HTMLInputElement).value.toLocaleLowerCase('tr-TR');
                const rows = document.getElementById('district-rows');
                if(rows) {
                    Array.from(rows.children).forEach((child: any) => {
                        const name = child.getAttribute('data-name');
                        if (name && name.toLocaleLowerCase('tr-TR').includes(val)) {
                            child.style.display = 'flex';
                        } else {
                            child.style.display = 'none';
                        }
                    });
                }
            };
        }

        container.onmouseenter = () => {
            container.style.width = '320px';
            container.style.background = 'rgba(20, 25, 30, 0.85)';
            iconDiv.style.opacity = '0';
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
            content.style.transform = 'translateX(0)';
        };
        
        container.onmouseleave = () => {
            container.style.width = '50px';
            container.style.background = 'rgba(20, 25, 30, 0.4)';
            iconDiv.style.opacity = '1';
            content.style.opacity = '0';
            content.style.pointerEvents = 'none';
            content.style.transform = 'translateX(20px)';
            
            // Fareden cikinca aramayi temizle
            const searchInput = document.getElementById('district-search-input') as HTMLInputElement;
            if(searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.blur();
            }
        };
    }

    private updateRightSidebarUI(counts: Map<string, number>) {
        const rowsContainer = document.getElementById('district-rows');
        if (!rowsContainer) return;
        
        // Yeniden render ediyoruz, ama eger kullanici bir sey yazdiysa anlik gitsin diye
        const searchInput = document.getElementById('district-search-input') as HTMLInputElement;
        const filterVal = searchInput ? searchInput.value.toLocaleLowerCase('tr-TR') : '';

        rowsContainer.innerHTML = '';
        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        
        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            const row = document.createElement('div');
            // Veriyi kaydet, filtreleme isine yarar
            row.setAttribute('data-name', name);
            
            row.style.cssText = \`display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;\`;
            
            if (filterVal && !name.toLocaleLowerCase('tr-TR').includes(filterVal)) {
                row.style.display = 'none';
            }

            row.onmouseover = () => { row.style.background = 'rgba(255, 153, 0, 0.2)'; row.style.borderColor = 'rgba(255,153,0,0.5)'; };
            row.onmouseout = () => { row.style.background = 'rgba(255,255,255,0.05)'; row.style.borderColor = 'transparent'; };
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    const [x, y, z] = convertGpsToVector(target.lat, target.lng);
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x, z } }));
                }
            };

            const nameEl = document.createElement('span');
            nameEl.textContent = name;
            nameEl.style.cssText = 'font-size: 13px; font-weight: bold; color: #ddd;';

            const countEl = document.createElement('span');
            countEl.textContent = count.toString();
            countEl.style.cssText = 'background: #ff9900; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 900;';

            row.appendChild(nameEl);
            row.appendChild(countEl);
            rowsContainer.appendChild(row);
        });
    }
`;

code = code.replace(/private initRightHoverSidebar\(\) \{[\s\S]*?private getIlceFromRecord/m, newRightSidebar + "\n\n    private getIlceFromRecord");

fs.writeFileSync('src/core/DistrictManager.ts', code);
