const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Bozulan kismi (update metodunu) tamamen kesip temiz bir sekilde yerine koyalim
const cleanUpdate = `
    public update() {
        let currentNodes = 0;
        let layerStats: Record<string, number> = {};
        
        this.scene.traverse(node => {
            if (node.userData && (node.userData.layerName || node.userData.records)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') {
                    currentNodes++;
                    const layerName = node.userData.layerName || 'Bilinmeyen Katman';
                    layerStats[layerName] = (layerStats[layerName] || 0) + (node.type === 'InstancedMesh' ? (node as any).count : 1);
                }
            }
        });

        let rebuildNeeded = false;
        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            console.log("--- YENI VERI BULUNDU, SISTEM ZORLA GUNCELLENIYOR ---");
            console.log("Bulunan Katmanlar:", layerStats);
            this.extractPoints();
            this.buildDistricts();
            this.lastChildrenCount = currentNodes;
            rebuildNeeded = true;
        }

        if (this.pointCache.length === 0) return;

        const alt = this.camera.position.y;
        const threshold = 3500; 
        
        if (alt < threshold) {
            if (this.isZoomedOut || rebuildNeeded) {
                this.setAllOriginalsVisible(true);
                this.districtGroup.visible = false;
                this.isZoomedOut = false;
            }
        } else {
            if (!this.isZoomedOut || rebuildNeeded) {
                this.setAllOriginalsVisible(false);
                this.districtGroup.visible = true;
                this.isZoomedOut = true;
            }
        }
    }
`;

// Eski bozuk update'i bulmak icin Regex (public update()'den baslayip extractPoints'e kadar olan kisim)
code = code.replace(/public update\(\) \{[\s\S]*?private extractPoints\(\) \{/, cleanUpdate + "\n\n    private extractPoints() {");
fs.writeFileSync('src/core/DistrictManager.ts', code);
