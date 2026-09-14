const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. Izmir Ilce Koordinatlarini (Enlem/Boylam) Enjekte Et
const imports = `import * as THREE from 'three';\nimport { convertGpsToVector } from '../utils/coordinates';`;
code = code.replace("import * as THREE from 'three';", imports);

const districtCenters = `
    private districtsData = [
        { name: 'ALİAĞA', lat: 38.7994, lng: 26.9707, x: 0, z: 0 },
        { name: 'BALÇOVA', lat: 38.3908, lng: 27.0461, x: 0, z: 0 },
        { name: 'BAYINDIR', lat: 38.2195, lng: 27.6467, x: 0, z: 0 },
        { name: 'BAYRAKLI', lat: 38.4633, lng: 27.1691, x: 0, z: 0 },
        { name: 'BERGAMA', lat: 39.1215, lng: 27.1772, x: 0, z: 0 },
        { name: 'BEYDAĞ', lat: 38.0872, lng: 28.2043, x: 0, z: 0 },
        { name: 'BORNOVA', lat: 38.4716, lng: 27.2178, x: 0, z: 0 },
        { name: 'BUCA', lat: 38.3842, lng: 27.1751, x: 0, z: 0 },
        { name: 'ÇEŞME', lat: 38.3232, lng: 26.3065, x: 0, z: 0 },
        { name: 'ÇİĞLİ', lat: 38.4907, lng: 27.0583, x: 0, z: 0 },
        { name: 'DİKİLİ', lat: 39.0722, lng: 26.8893, x: 0, z: 0 },
        { name: 'FOÇA', lat: 38.6675, lng: 26.7554, x: 0, z: 0 },
        { name: 'GAZİEMİR', lat: 38.3242, lng: 27.1328, x: 0, z: 0 },
        { name: 'GÜZELBAHÇE', lat: 38.3614, lng: 26.8837, x: 0, z: 0 },
        { name: 'KARABAĞLAR', lat: 38.3752, lng: 27.1189, x: 0, z: 0 },
        { name: 'KARABURUN', lat: 38.6366, lng: 26.5147, x: 0, z: 0 },
        { name: 'KARŞIYAKA', lat: 38.4594, lng: 27.1147, x: 0, z: 0 },
        { name: 'KEMALPAŞA', lat: 38.4278, lng: 27.4172, x: 0, z: 0 },
        { name: 'KINIK', lat: 39.0880, lng: 27.3820, x: 0, z: 0 },
        { name: 'KİRAZ', lat: 38.2307, lng: 28.2065, x: 0, z: 0 },
        { name: 'KONAK', lat: 38.4190, lng: 27.1287, x: 0, z: 0 },
        { name: 'MENDERES', lat: 38.2526, lng: 27.1352, x: 0, z: 0 },
        { name: 'MENEMEN', lat: 38.6019, lng: 27.0694, x: 0, z: 0 },
        { name: 'NARLIDERE', lat: 38.3892, lng: 26.9930, x: 0, z: 0 },
        { name: 'ÖDEMİŞ', lat: 38.2294, lng: 27.9744, x: 0, z: 0 },
        { name: 'SEFERİHİSAR', lat: 38.1973, lng: 26.8378, x: 0, z: 0 },
        { name: 'SELÇUK', lat: 37.9490, lng: 27.3712, x: 0, z: 0 },
        { name: 'TİRE', lat: 38.0898, lng: 27.7348, x: 0, z: 0 },
        { name: 'TORBALI', lat: 38.1517, lng: 27.3601, x: 0, z: 0 },
        { name: 'URLA', lat: 38.3232, lng: 26.7644, x: 0, z: 0 }
    ];

    private initializeDistrictCoords() {
        if (this.districtsData[0].x !== 0) return; // Zaten baslatildi
        this.districtsData.forEach(d => {
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            d.x = x;
            d.z = z;
        });
    }

    private getNearestDistrict(px: number, pz: number): string {
        this.initializeDistrictCoords();
        let minDistance = Infinity;
        let nearestName = 'İZMİR (GENEL)';
        
        this.districtsData.forEach(d => {
            const dist = Math.hypot(px - d.x, pz - d.z);
            if (dist < minDistance) {
                minDistance = dist;
                nearestName = d.name;
            }
        });
        
        return nearestName;
    }
`;

code = code.replace(/private getIlce[\s\S]*?private extractPoints/, districtCenters + "\n    private extractPoints");

// 2. Extract Points kisminda artik yazili metin degil, Cografi lokasyon kullanilacak
code = code.replace(/const ilce = this\.getIlce\(node\.userData\?\.record\);/g, "const ilce = this.getNearestDistrict(node.position.x, node.position.z);");
code = code.replace(/const ilce = this\.getIlce\(records \? records\[i\] : null\);/g, "const ilce = this.getNearestDistrict(pos.x, pos.z);");
code = code.replace(/const ilce = this\.getIlce\(sub\.userData\?\.record\);/g, "const ilce = this.getNearestDistrict(sub.position.x, sub.position.z);");

// 3. update metodunu sadece gercek veri katmanlari icin calistiralim (Sonsuz donguyu / gereksiz calismayi onlemek icin)
const updateFix = `
    public update() {
        let rebuildNeeded = false;
        let currentNodes = 0;
        this.scene.traverse(node => {
            // Sadece bizim katmanlarimizdan gelen gecerli meshleri say (District topu ve sprite haric)
            if (node.userData && (node.userData.layerName || node.userData.records)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') currentNodes++;
            }
        });

        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            this.extractPoints();
            this.buildDistricts();
            this.lastChildrenCount = currentNodes;
            rebuildNeeded = true;
        }
`;
code = code.replace(/public update\(\) \{[\s\S]*?if \(this\.pointCache\.length === 0\) return;/, updateFix + "\n        if (this.pointCache.length === 0) return;");

fs.writeFileSync('src/core/DistrictManager.ts', code);
