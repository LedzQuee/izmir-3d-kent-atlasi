const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// extractPoints icerisindeki Kati 'SphereGeometry' kontrolunu esnetelim
// Sadece Mesh olmasi ve icinde gecerli bir "katman adi" barindirmasi yeterli.
const newExtract = `
    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            // Sarti tamamen genislettik: Mesh veya icinde record tasiyan herhangi bir sey
            if (node.type === 'Mesh' && node.userData && (node.userData.layerName || node.userData.record)) {
                // Konum hesabi icin merkeze (position) bak
                const ilce = this.getNearestDistrict(node.position.x, node.position.z);
                this.pointCache.push({ x: node.position.x, z: node.position.z, mesh: node, visible: true, ilce });
            } 
            else if (node.type === 'InstancedMesh' && node.userData && node.userData.records) {
                const inst = node as THREE.InstancedMesh;
                const records = inst.userData.records;
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                for(let i=0; i<inst.count; i++) {
                    inst.getMatrixAt(i, mat);
                    pos.setFromMatrixPosition(mat);
                    const ilce = this.getNearestDistrict(pos.x, pos.z);
                    this.pointCache.push({ x: pos.x, z: pos.z, mesh: inst, index: i, visible: true, ilce });
                }
            } 
            else if (node.type === 'Group' || node.type === 'Scene') {
                node.children.forEach(child => processNode(child));
            }
        };

        this.scene.children.forEach(child => processNode(child));
    }
`;

code = code.replace(/private extractPoints\(\) \{[\s\S]*?private buildDistricts\(\) \{/, newExtract + "\n    private buildDistricts() {");
fs.writeFileSync('src/core/DistrictManager.ts', code);
