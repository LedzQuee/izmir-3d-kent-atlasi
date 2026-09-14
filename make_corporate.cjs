const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. Gereksiz Hologramları silip, Kurumsal Rozetleri olusturan yeni yapi
const cleanVisuals = `
    private isZoomedOut = true;

    private buildBrownSpheres() {
        this.districtGroup.clear();

        this.districtsData.forEach(d => {
            const count = this.apiDistrictCounts.get(d.name) || 0;
            if (count === 0) return;
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z };

            // Sade, derinlik testinden muaf (her zaman ustte gorunen) kurumsal etiket
            const label = \`\${d.name}  \${count}\`;
            const spriteMat = new THREE.SpriteMaterial({ 
                map: this.getTextTexture(label),
                depthTest: false, // Binalarin veya yerin icine girmesini engeller, hep ustte kalir
                transparent: true
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x, 150, z); 
            sprite.scale.set(1600, 350, 1);
            sprite.userData = targetData;
            
            // Etiketler districtGroup icinde toplanir, zoom yapilinca hepsi gizlenir
            this.districtGroup.add(sprite);
        });
        
        // Ilk acilista harita uzakta oldugu icin verileri (orijinal noktalari) gizleyelim
        this.setAllOriginalsVisible(false);
    }
`;

// 2. Kamera yakinligina (Zoom) gore etiketleri gizleyip noktalari acan guncelleme mantigi
const updateLogic = `
    public update() {
        // Harita kameralarinda y ekseni (irtifa) uzakligi belirler
        const altitude = this.camera.position.y;
        const ZOOM_THRESHOLD = 2800; // Etiketlerin kaybolup, verilerin belirecegi sinir

        if (altitude > ZOOM_THRESHOLD) {
            // Kus bakisi (Uzakta) -> Sadece Ilce Rozetlerini Goster
            if (!this.isZoomedOut) {
                this.districtGroup.visible = true;
                this.setAllOriginalsVisible(false);
                this.isZoomedOut = true;
            }
        } else {
            // Yakinlasma (Zoom In) -> Rozetleri Gizle, Altindaki Verileri Erisime Ac
            if (this.isZoomedOut) {
                this.districtGroup.visible = false;
                this.setAllOriginalsVisible(true);
                this.isZoomedOut = false;
            }
        }
    }
`;

// 3. Kurumsal, tertemiz Apple/Google haritalari tarzı Canvas tasarimi
const corporateTexture = `
    private getTextTexture(text: string) {
        if (this.textureCache.has(text)) return this.textureCache.get(text)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1600; canvas.height = 350;
        const ctx = canvas.getContext('2d')!;
        
        // Minimalist Beyaz Kapsul Arkaplan (Kurumsal)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(50, 50, 1500, 250, 125); 
        ctx.fill();
        
        // Zarif Gri Cerceve
        ctx.strokeStyle = 'rgba(200, 200, 200, 1)';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Yazi Ayarlari (Koyu Gri)
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 110px "Segoe UI", Roboto, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sadece yazinin etrafina degil, butun kapsule cok hafif bir golge (Uctugu hissini verir)
        canvas.style.filter = "drop-shadow(0px 10px 20px rgba(0,0,0,0.3))"; // Three.js texture'da calismaz ama canvas ctx ile yapilir
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 8;
        
        ctx.fillText(text, 800, 185);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }
`;

// Regex ile yer degistirmeler
code = code.replace(/private buildBrownSpheres\(\) \{[\s\S]*?private updateSidebarUIFromApi/m, cleanVisuals + "\n\n    private updateSidebarUIFromApi");
code = code.replace(/public update\(\) \{[\s\S]*?private initSidebarUI/m, updateLogic + "\n\n    private initSidebarUI");
code = code.replace(/private getTextTexture\([\s\S]*?\}\n\}/m, corporateTexture + "\n}");

// Ayrica extractPoints'te noktalari yakaladigimiz koda dokunmuyoruz, ancak baslangicta gorunmez olacaklar
fs.writeFileSync('src/core/DistrictManager.ts', code);
