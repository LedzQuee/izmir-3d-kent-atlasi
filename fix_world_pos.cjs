const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Nesnelerin gercek dunya pozisyonunu almak icin getWorldPosition kullanalim. (Belki de grup kaymistir)
const newExtract = `
    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            if (node.type === 'Mesh' && node.userData && (node.userData.layerName || node.userData.record)) {
                const worldPos = new THREE.Vector3();
                node.getWorldPosition(worldPos);
                const ilce = this.getNearestDistrict(worldPos.x, worldPos.z);
                this.pointCache.push({ x: worldPos.x, z: worldPos.z, mesh: node, visible: true, ilce });
            } 
            else if (node.type === 'InstancedMesh' && node.userData && node.userData.records) {
                const inst = node as THREE.InstancedMesh;
                const records = inst.userData.records;
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                for(let i=0; i<inst.count; i++) {
                    inst.getMatrixAt(i, mat);
                    pos.setFromMatrixPosition(mat);
                    // InstancedMesh'ler lokal matris tasir, onlari dunya matrisine cevirelim
                    pos.applyMatrix4(inst.matrixWorld); 
                    const ilce = this.getNearestDistrict(pos.x, pos.z);
                    this.pointCache.push({ x: pos.x, z: pos.z, mesh: inst, index: i, visible: true, ilce });
                }
            } 
            else if (node.type === 'Group' || node.type === 'Scene') {
                node.children.forEach(child => processNode(child));
            }
        };

        // Bu islemden once tum matrislerin guncel oldugundan emin olalim
        this.scene.updateMatrixWorld(true);
        this.scene.children.forEach(child => processNode(child));
    }
`;

code = code.replace(/private extractPoints\(\) \{[\s\S]*?private buildDistricts\(\) \{/, newExtract + "\n    private buildDistricts() {");
fs.writeFileSync('src/core/DistrictManager.ts', code);
