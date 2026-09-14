const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Arayuzu (Sidebar) silmeden, kahverengi kureleri ve API'den veri cekme mantigini entegre ediyoruz.
const apiIntegration = `
    private isApiLoaded = false;
    private apiDistrictCounts = new Map<string, number>();

    public async initializeApiData() {
        if (this.isApiLoaded) return;
        this.isApiLoaded = true;

        const endpoints = [
            'havaalanlari', 'kaplicalar', 'yetistirmeyurtlari', 'terminaller',
            'cocukgenclikmerkezleri', 'ailedayanismamerkezleri', 'meydanlar',
            'plajlar', 'huzurevleri', 'toplummerkezleri', 'izbbhizmetnoktalari',
            'taksiduraklari', 'afetaciltoplanmaalani'
        ];

        // Tum 30 ilceyi 0 ile baslat
        this.districtsData.forEach(d => this.apiDistrictCounts.set(d.name, 0));

        let completed = 0;
        endpoints.forEach(ep => {
            fetch("https://openapi.izmir.bel.tr/api/ibb/cbs/" + ep)
                .then(res => res.json())
                .then(data => {
                    const records = data.onemliyer || data;
                    if(Array.isArray(records)) {
                        records.forEach(r => {
                            const ilce = this.getIlceFromRecord(r);
                            if (this.apiDistrictCounts.has(ilce)) {
                                this.apiDistrictCounts.set(ilce, this.apiDistrictCounts.get(ilce)! + 1);
                            }
                        });
                    }
                })
                .catch(() => {})
                .finally(() => {
                    completed++;
                    if (completed === endpoints.length) {
                        this.buildBrownSpheres();
                        this.updateSidebarUIFromApi();
                    }
                });
        });
    }

    private buildBrownSpheres() {
        this.districtGroup.clear();
        
        // Kahverengi Kure Materyali (Kullanicinin istedigi gibi)
        const geo = new THREE.SphereGeometry(180, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, emissive: 0x3e1d04, roughness: 0.3, metalness: 0.4 });

        this.districtsData.forEach(d => {
            const count = this.apiDistrictCounts.get(d.name) || 0;
            if (count === 0) return; // Veri yoksa cizme
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z };

            // Kureyi ekle
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 100, z);
            mesh.userData = targetData;
            this.districtGroup.add(mesh);

            // Uzerindeki Yazi
            const label = \`\${d.name} (\${count})\`;
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.getTextTexture(label) }));
            sprite.position.set(x, 380, z);
            sprite.scale.set(2048, 512, 1);
            sprite.userData = targetData;
            this.districtGroup.add(sprite);
        });
    }

    private updateSidebarUIFromApi() {
        const listContainer = document.getElementById('district-list');
        if (!listContainer) return;

        const styleHtml = listContainer.querySelector('style')?.outerHTML || '';
        listContainer.innerHTML = styleHtml;

        const sorted = Array.from(this.apiDistrictCounts.entries()).sort((a, b) => b[1] - a[1]);
        let totalCount = 0;

        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            totalCount += count;
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
            listContainer.appendChild(row);
        });
        
        const totalRow = document.createElement('div');
        totalRow.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; text-align: center; color: #fff; font-size: 12px;';
        totalRow.innerHTML = \`Kesin API Toplamı: <b>\${totalCount}</b>\`;
        listContainer.appendChild(totalRow);
    }
`;

// Initialize fonksiyonunu yapiciya ekle
code = code.replace("this.initSidebarUI();", "this.initSidebarUI();\n        this.initializeApiData();");

// Eski update() vs. kaldirip, yeni fonksiyonlari ekleyelim
code = code.replace(/public update\(\) \{[\s\S]*?private getIlceFromRecord/m, apiIntegration + "\n\n    private getIlceFromRecord");

// Eski updateSidebarUI vs'yi silelim (Extract points'i falan da)
code = code.replace(/private extractPoints\(\) \{[\s\S]*?\}\n\}/m, "}\n}");
code = code.replace(/private updateSidebarUI\(\) \{[\s\S]*?\}\n\}/m, "}\n}");

fs.writeFileSync('src/core/DistrictManager.ts', code);
