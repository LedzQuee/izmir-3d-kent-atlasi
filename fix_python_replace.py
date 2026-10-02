import codecs

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'private initRightHoverSidebar()' in line:
        start_idx = i
        break

end_idx = len(lines)

new_content = """    private initRightHoverSidebar() {
        const existing = document.getElementById('district-right-wrapper');
        if (existing) existing.remove();

        const oldSidebar = document.getElementById('district-right-sidebar');
        if (oldSidebar) oldSidebar.remove();

        const wrapper = document.createElement('div');
        wrapper.id = 'district-right-wrapper';
        wrapper.style.cssText = `
            position: fixed;
            right: 0px;
            top: 20px;
            bottom: 20px;
            width: 320px;
            z-index: 500;
            display: flex;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            transform: translateX(0);
        `;

        const container = document.createElement('div');
        container.id = 'district-right-sidebar';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 16px 0 0 16px;
            color: #f1f5f9;
            font-family: "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            box-shadow: -8px 0 32px rgba(0,0,0,0.5);
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.style.cssText = `
            position: absolute;
            left: -44px;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 64px;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 14px 0 0 14px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 22px;
            line-height: 1;
            transition: all 0.2s ease;
            box-shadow: -4px 0 16px rgba(0,0,0,0.4);
            border-left: 2px solid rgba(255,255,255,0.2);
        `;
        toggleBtn.innerHTML = '&#8250;';
        toggleBtn.onmouseenter = () => { toggleBtn.style.color = '#fff'; toggleBtn.style.background = 'rgba(30, 41, 59, 0.95)'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.color = '#94a3b8'; toggleBtn.style.background = 'rgba(10, 14, 26, 0.85)'; };

        let open = true;
        toggleBtn.onclick = () => {
            open = !open;
            wrapper.style.transform = open ? 'translateX(0)' : 'translateX(320px)';
            toggleBtn.innerHTML = open ? '&#8250;' : '&#8249;';
        };
        
        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(container);
        document.body.appendChild(wrapper);

        const header = document.createElement('div');
        header.style.cssText = `padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;`;
        header.innerHTML = `
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;margin-bottom:4px">Veri Dağılımı</div>
            <div style="font-size:17px;font-weight:700;color:#f1f5f9;margin-bottom:12px;">İlçe Sıralaması</div>
        `;
        container.appendChild(header);

        // --- ARAMA KUTUSU ---
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = 'position: relative; margin-top: 10px;';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Nokta/Mekan Ara...';
        searchInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: white; outline: none; font-size: 13px;';
        
        const searchResults = document.createElement('div');
        searchResults.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; max-height: 250px; overflow-y: auto; display: none; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-top: 4px;';
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchResults);
        header.appendChild(searchContainer);

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
                
                // @ts-ignore
                const map = window.engineInstance?.map;
                const zoom = map ? map.getZoom() : 0;
                const bounds = map ? map.getBounds() : null;

                const matches = allFeatures.filter((f: any) => {
                    if (!f.properties.recordName.toLowerCase().includes(query)) return false;
                    if (bounds && zoom >= 12.5) {
                        const [lng, lat] = f.geometry.coordinates;
                        if (lng < bounds.getWest() || lng > bounds.getEast() ||
                            lat < bounds.getSouth() || lat > bounds.getNorth()) {
                            return false;
                        }
                    }
                    return true;
                });
                
                matches.sort((a: any, b: any) => {
                    const nameA = a.properties.recordName.toLowerCase();
                    const nameB = b.properties.recordName.toLowerCase();
                    const startsA = nameA.startsWith(query);
                    const startsB = nameB.startsWith(query);
                    if (startsA && !startsB) return -1;
                    if (!startsA && startsB) return 1;
                    const wordRegex = new RegExp(`(^|\\\\s|\\\\W)${query}(\\\\s|\\\\W|$)`);
                    const wordA = wordRegex.test(nameA);
                    const wordB = wordRegex.test(nameB);
                    if (wordA && !wordB) return -1;
                    if (!wordA && wordB) return 1;
                    return nameA.localeCompare(nameB, 'tr-TR', { numeric: true });
                });
                
                const topMatches = matches.slice(0, 15);
                
                searchResults.innerHTML = '';
                if (topMatches.length > 0) {
                    topMatches.forEach((f: any) => {
                        const div = document.createElement('div');
                        div.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; font-size: 12px; color: #cbd5e1; display:flex; align-items:center; gap:8px; line-height: 1.3;';
                        div.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${f.properties.color};flex-shrink:0;"></div> <span>${f.properties.recordName}</span>`;
                        div.onmouseenter = () => div.style.background = 'rgba(255,255,255,0.08)';
                        div.onmouseleave = () => div.style.background = 'transparent';
                        div.onclick = () => {
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                            const coords = f.geometry.coordinates;
                            const recordRaw = f.properties.recordRaw;
                            const id = `point-${recordRaw}`;
                            window.dispatchEvent(new CustomEvent('poiSelected', { detail: id }));
                            // @ts-ignore
                            window.engineInstance?.map?.flyTo({ center: coords, zoom: 18, pitch: 60 });
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

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target as Node)) {
                searchResults.style.display = 'none';
            }
        });
        // --- ARAMA KUTUSU BITIS ---

        const listArea = document.createElement('div');
        listArea.id = 'district-rows';
        listArea.style.cssText = `flex:1; overflow-y:auto; overflow-x:hidden; padding:10px 14px;`;
        listArea.innerHTML = `<style>#district-rows::-webkit-scrollbar{width:4px}#district-rows::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:4px}</style>`;
        container.appendChild(listArea);
    }

    private updateRightSidebarUI(counts: Map<string, number>) {
        const rowsContainer = document.getElementById('district-rows');
        if (!rowsContainer) return;
        const styleEl = rowsContainer.querySelector('style');
        rowsContainer.innerHTML = '';
        if (styleEl) rowsContainer.appendChild(styleEl);

        const sorted = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr-TR'));

        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            const row = document.createElement('div');
            row.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:9px 10px; margin-bottom:3px; border-radius:8px; cursor:pointer; transition:background 0.15s; background:rgba(255,255,255,0.04); width:100%; box-sizing:border-box; overflow:hidden;`;
            row.onmouseenter = () => { row.style.background = 'rgba(99,179,237,0.12)'; };
            row.onmouseleave = () => { row.style.background = 'rgba(255,255,255,0.04)'; };
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { lat: target.lat, lng: target.lng } }));
                }
            };
            
            const nameEl = document.createElement('span');
            nameEl.textContent = name;
            nameEl.style.cssText = 'font-size:13px; color:#cbd5e1; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; margin-right:8px;';
            
            const badge = document.createElement('span');
            badge.textContent = String(count);
            badge.style.cssText = `background:rgba(99,179,237,0.15); color:#93c5fd; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; border:1px solid rgba(99,179,237,0.25); min-width:32px; text-align:center; flex-shrink:0;`;
            
            row.appendChild(nameEl);
            row.appendChild(badge);
            rowsContainer.appendChild(row);
        });
    }
}
"""

lines = lines[:start_idx] + [new_content]
with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.writelines(lines)
