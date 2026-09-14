const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. Guncelleme kuralini daha agresif yapalim ve hangi katmanlarin yutuldugunu console'a basalim
const updateFix = `
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

        // Her defasinda eksik var mi diye kontrol edip zorla yenile (Agresif entegrasyon)
        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            console.log("--- YENI VERI BULUNDU, SISTEM ZORLA GUNCELLENIYOR ---");
            console.log("Bulunan Katmanlar:", layerStats);
            
            this.extractPoints();
            this.buildDistricts();
            this.lastChildrenCount = currentNodes;
        }

        if (this.pointCache.length === 0) return;

        const alt = this.camera.position.y;
        const threshold = 3500; 
        
        if (alt < threshold) {
            if (this.isZoomedOut) {
                this.setAllOriginalsVisible(true);
                this.districtGroup.visible = false;
                this.isZoomedOut = false;
            }
        } else {
            if (!this.isZoomedOut) {
                this.setAllOriginalsVisible(false);
                this.districtGroup.visible = true;
                this.isZoomedOut = true;
            }
        }
    }
`;

code = code.replace(/public update\(\) \{[\s\S]*?if \(this\.pointCache\.length === 0\) return;/, updateFix + "\n\n        if (this.pointCache.length === 0) return;");

fs.writeFileSync('src/core/DistrictManager.ts', code);
