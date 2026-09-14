const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

const missingLODFunctions = `
    private setAllOriginalsVisible(visible: boolean) {
        // Tum sahneyi tarayip Mesh ve InstancedMesh nesnelerini (ilce etiketleri haric) gizle veya goster
        this.scene.traverse(node => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            if (node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.records || node.userData.record)) {
                if (node.type === 'Mesh') {
                    node.visible = visible;
                } else if (node.type === 'InstancedMesh') {
                    // InstancedMesh'lerin kendisini gorunur/gorunmez yapmak en performanslisidir
                    node.visible = visible;
                }
            }
        });
    }
`;

// Sınıfın içine ekle (örneğin initSidebarUI'dan hemen önce)
code = code.replace(/private initSidebarUI\(\)/, missingLODFunctions + "\n\n    private initSidebarUI()");
fs.writeFileSync('src/core/DistrictManager.ts', code);
