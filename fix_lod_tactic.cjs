const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. Guncelleme fonksiyonundaki acip/kapatma (gizleme) mantigini tamamen siliyoruz
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
        }

        // Taktik: NO-CLIPPING (Her Zaman Gorunur, Dogal Ucus)
        // Kullaniciyi rahatsiz eden "yaklasinca kaybolma/uzaklasinca geri gelme" mekanizmasini KALDIRDIK.
        // Yerdeki veriler HER ZAMAN gorunur. (Filtrelenmemisse)
        // Ilce etiketleri HER ZAMAN gorunur.
        // Etiketler havada durdugu icin, yaklastikca zaten dogal olarak tepede kalip kameranin altinda gecer, boylece gorusu kapatmaz.
        
        if (this.isZoomedOut) {
            this.isZoomedOut = false;
            this.districtGroup.visible = true;
            this.setAllOriginalsVisible(true);
        }
    }
`;
code = code.replace(/public update\(\) \{[\s\S]*?private getIlceFromRecord/m, newUpdateLogic + "\n\n    private getIlceFromRecord");

// 2. Etiketleri yere yakin degil, gokyuzune yakin bir yere (y=400) asalim ki noktalarla asagiya inince karismasin
code = code.replace(/sprite\.position\.set\(x, 150, z\);/g, "sprite.position.set(x, 400, z); // Gokyuzunde asili durur (Yerden yuksekte)");

fs.writeFileSync('src/core/DistrictManager.ts', code);
