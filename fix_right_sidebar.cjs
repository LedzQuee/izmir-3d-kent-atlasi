const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. RightToolboxUI'i (Arama/Checkbox) komple silip RightHoverSidebar'a (Saydam Siralama Listesi) ceviriyoruz
const rightSidebar = `
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

        // Kapaliyken Gorunen Ikon (Istatistik/Siralama)
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
            width: 280px; opacity: 0; transition: opacity 0.3s, transform 0.4s;
            padding: 20px; pointer-events: none; overflow-y: auto; height: 100%;
            transform: translateX(20px); box-sizing: border-box; display: flex; flex-direction: column;
        \`;
        
        content.innerHTML = \`<style>
            #district-list-content::-webkit-scrollbar { width: 5px; }
            #district-list-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 5px; }
        </style>
        <h3 style="margin: 0 0 15px 0; color: #ff9900; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">İlçe Veri Sıralaması</h3>
        <div id="district-rows" style="flex: 1; overflow-y: auto; padding-right: 5px;"></div>
        \`;

        container.appendChild(content);
        document.body.appendChild(container);

        // Hover (Uzerine Gelme) Animasyonlari
        container.onmouseenter = () => {
            container.style.width = '280px';
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
        };
    }

    private updateRightSidebarUI(counts: Map<string, number>) {
        const rowsContainer = document.getElementById('district-rows');
        if (!rowsContainer) return;
        
        rowsContainer.innerHTML = '';
        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        
        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            const row = document.createElement('div');
            row.style.cssText = \`display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;\`;
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

// Gereksiz degiskenleri sil (Sag panel ilce filtresi mantigini iptal ettigimiz icin)
code = code.replace(/private selectedDistricts: Set<string> = new Set\(\);/, "");
code = code.replace(/private allDistrictsSelected = true;/, "");

// initRightToolboxUI cagrisini degistir
code = code.replace(/this\.initRightToolboxUI\(\);/g, "this.initRightHoverSidebar();");

// Eski initRightToolboxUI fonksiyonunu sil
code = code.replace(/private initRightToolboxUI\(\) \{[\s\S]*?public update\(\) \{/m, "public update() {");

// recalculateCounts icinden sag filtre (selectedDistricts) sorgularini temizle ve updateRightSidebarUI'i cagir
const newRecalculate = `
    private recalculateCounts() {
        this.extractPoints();

        const activeCounts = new Map<string, number>();
        this.pointCache.forEach(p => {
            activeCounts.set(p.ilce, (activeCounts.get(p.ilce) || 0) + 1);
        });

        this.buildCorporateBadges(activeCounts);
        this.updateRightSidebarUI(activeCounts);
        this.setAllOriginalsVisible(true);
    }
`;
code = code.replace(/private recalculateCounts\(\) \{[\s\S]*?private buildCorporateBadges/m, newRecalculate + "\n\n    private buildCorporateBadges");

// setPointVisible icindeki gereksiz selectedDistricts kontrolunu temizle
const newSetPoint = `
    private setPointVisible(p: any, visible: boolean) {
        if (p.visible === visible) return;
        p.visible = visible;
        
        if (p.index === undefined) {
            p.mesh.visible = visible;
        } else {
            const inst = p.mesh as THREE.InstancedMesh;
            const mat = new THREE.Matrix4();
            inst.getMatrixAt(p.index, mat);
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(mat);
            
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            dummy.scale.setScalar(visible ? 1 : 0); 
            dummy.updateMatrix();
            inst.setMatrixAt(p.index, dummy.matrix);
            inst.instanceMatrix.needsUpdate = true;
        }
    }
`;
code = code.replace(/private setPointVisible\([\s\S]*?private setAllOriginalsVisible/m, newSetPoint + "\n\n    private setAllOriginalsVisible");

// Yeni metodlari dosyanin sonuna ekle
code = code.replace(/}\s*$/, rightSidebar + "\n}");

// Silinmesi gereken toolbox div'i (Acilista kalmis olabilir)
code = code.replace(/const existing = document\.getElementById\('district-right-toolbox'\);/g, "const tb = document.getElementById('district-right-toolbox'); if(tb) tb.remove();\n        const existing = document.getElementById('district-right-sidebar');");

fs.writeFileSync('src/core/DistrictManager.ts', code);
