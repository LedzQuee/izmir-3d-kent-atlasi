const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// 1. Yazilarin kalitesini (Piksel sorununu) cozme (4K Canvas ve Linear Filter)
const textureMethod = `
    private getTextTexture(text: string) {
        if (this.textureCache.has(text)) return this.textureCache.get(text)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 2048; // Ultra HD genislik
        canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Daha belirgin ve profesyonel golgelendirme
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillText(text, 1024, 128);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }
`;

// Eski getTextTexture'u degistir
code = code.replace(/private getTextTexture[\s\S]*?\}\n    \}/, textureMethod + "\n}");

// 2. Eksik veri yutulmasini cozme (Scene guncelleme mantigi)
// Extract points kisminda Group icindeki InstancedMesh'leri de taramaliyiz! (Spagetti layerlari korumak icin)
const extractMethod = `
    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            if (node.type === 'Mesh' && (node as any).geometry?.type === 'SphereGeometry') {
                const ilce = this.getIlce(node.userData?.record);
                this.pointCache.push({ x: node.position.x, z: node.position.z, mesh: node, visible: true, ilce });
            } 
            else if (node.type === 'InstancedMesh') {
                const inst = node as THREE.InstancedMesh;
                const records = inst.userData?.records;
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                // InstancedMesh icindeki GERCEK gecerli veri sayisi (count) kadar don
                for(let i=0; i<inst.count; i++) {
                    inst.getMatrixAt(i, mat);
                    pos.setFromMatrixPosition(mat);
                    const ilce = this.getIlce(records ? records[i] : null);
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

code = code.replace(/private extractPoints\(\) \{[\s\S]*?private buildDistricts\(\) \{/, extractMethod + "\n    private buildDistricts() {");


// 3. Zoom Out durumundayken yeni veri gelirse aninda gizle
const updateMethod = `
    public update() {
        let rebuildNeeded = false;
        
        // Scene icindeki aktif mesh sayisini derinlemesine say (Sadece child degil)
        let currentNodes = 0;
        this.scene.traverse(node => {
            if (node.type === 'Mesh' || node.type === 'InstancedMesh') currentNodes++;
        });

        if (currentNodes !== this.lastChildrenCount) {
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
code = code.replace(/public update\(\) \{[\s\S]*?private getIlce/, updateMethod + "\n\n    private getIlce");


fs.writeFileSync('src/core/DistrictManager.ts', code);
