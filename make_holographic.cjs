const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Holografik Sutun (Pillar) mantigini entegre etmek icin buildBrownSpheres fonksiyonunu degistiriyoruz
const newVisuals = `
    private buildBrownSpheres() {
        this.districtGroup.clear();
        
        // Profesyonel Holografik Sutun Materyali (Dijital Ikiz Konsepti)
        const mat = new THREE.MeshPhysicalMaterial({ 
            color: 0x00f0ff,       // Neon Mavi/Cyan
            emissive: 0x0044ff,    // Icten gelen parlama
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.4,          // Arkasini gosterir
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.5,     // Cam etkisi
            side: THREE.DoubleSide
        });

        // Taban icin ince, parlayan radar halkasi materyali
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.districtsData.forEach(d => {
            const count = this.apiDistrictCounts.get(d.name) || 0;
            if (count === 0) return;
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z };

            // 1. Veri Sutunu (Yukseklik = veri sayisi * carpan)
            const height = Math.max(100, count * 2.5); // Minimum 100 birim yukseklik
            const geo = new THREE.CylinderGeometry(60, 60, height, 32);
            const mesh = new THREE.Mesh(geo, mat);
            // Silindirin alt kismi tam yere (y=0) degmesi icin yuksekliginin yarisi kadar yariçapa kaldiriyoruz
            mesh.position.set(x, height / 2, z);
            mesh.userData = targetData;
            this.districtGroup.add(mesh);

            // 2. Yerdeki Radar Halkasi (Zemin Vurgusu)
            const ringGeo = new THREE.RingGeometry(65, 80, 32);
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2; // Yere yatir
            ring.position.set(x, 5, z); // Yerden cok az yukarida
            this.districtGroup.add(ring);

            // 3. Havada Asili Modern Etiket (Sutunun tam tepesinde)
            const label = \`\${d.name} (\${count})\`;
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.getTextTexture(label) }));
            sprite.position.set(x, height + 80, z); // Sutunun 80 birim uzerinde
            sprite.scale.set(1600, 400, 1);
            sprite.userData = targetData;
            this.districtGroup.add(sprite);
        });
    }
`;

// Eski buildBrownSpheres fonksiyonunu degistir
code = code.replace(/private buildBrownSpheres\(\) \{[\s\S]*?private updateSidebarUIFromApi/m, newVisuals + "\n\n    private updateSidebarUIFromApi");

// Text dokusunu (Sprite) daha modern hale getirelim (Neon cerceveli siyah arkaplan)
const modernTextTexture = `
    private getTextTexture(text: string) {
        if (this.textureCache.has(text)) return this.textureCache.get(text)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1600; canvas.height = 400;
        const ctx = canvas.getContext('2d')!;
        
        // Modern Kapsul (Pill) Arkaplani
        ctx.fillStyle = 'rgba(0, 10, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(100, 50, 1400, 300, 150); // Koseleri tam yuvarlak
        ctx.fill();
        
        // Neon Cerceve
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Yazi Ayarlari
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Yazi Parlamasi
        ctx.shadowColor = 'rgba(0, 240, 255, 1)';
        ctx.shadowBlur = 30;
        
        ctx.fillText(text, 800, 210);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }
`;

code = code.replace(/private getTextTexture\([\s\S]*?\}\n\}/m, modernTextTexture + "\n}");

fs.writeFileSync('src/core/DistrictManager.ts', code);
