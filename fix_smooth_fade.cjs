const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Update fonksiyonundaki eski (bozuk veya gizlemeyen) mantigi siliyoruz
const newUpdateLogic = `
    public update() {
        let currentNodes = 0;
        this.scene.traverse(node => {
            if (node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.records || node.userData.record)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') {
                    currentNodes++;
                }
            }
        });

        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            this.extractPoints();
            this.recalculateCounts();
            this.lastChildrenCount = currentNodes;
            this.setAllOriginalsVisible(true); // Yerdeki orijinal noktalar her zaman (filtreye gore) gorunur kalsin
        }

        // --- EN IYI TAKTIK: MESAFEYE GORE YUMUSAK SAYDAMLASMA (SMOOTH FADE) ---
        // Kamera etikete yaklastikca etiket yavasca saydamlasir ve kaybolur.
        // Uzaklastikca yavasca geri gelir. 
        
        const FADE_START = 2200; // Bu mesafede saydamlasmaya baslar
        const FADE_END = 1200;   // Bu mesafeden daha yakindaysa tamamen kaybolur

        this.districtGroup.children.forEach(child => {
            if (child.type === 'Sprite') {
                const sprite = child as THREE.Sprite;
                
                // Kamera ile rozet arasindaki 3D mesafeyi olc
                const dist = this.camera.position.distanceTo(sprite.position);

                const material = sprite.material as THREE.SpriteMaterial;

                if (dist > FADE_START) {
                    material.opacity = 1;
                    sprite.visible = true;
                } else if (dist < FADE_END) {
                    material.opacity = 0;
                    sprite.visible = false; // Render performansini artirmak icin gizle
                } else {
                    sprite.visible = true;
                    // Lineer yumusak gecis (0.0 ile 1.0 arasi opacity)
                    const opacity = (dist - FADE_END) / (FADE_START - FADE_END);
                    material.opacity = opacity;
                }
            }
        });
    }
`;

code = code.replace(/public update\(\) \{[\s\S]*?private getIlceFromRecord/m, newUpdateLogic + "\n\n    private getIlceFromRecord");
fs.writeFileSync('src/core/DistrictManager.ts', code);
