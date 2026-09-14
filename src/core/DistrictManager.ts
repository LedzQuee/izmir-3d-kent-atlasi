import * as THREE from 'three';

export class DistrictManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    public districtGroup: THREE.Group;
    private pointCache: { x: number, z: number, mesh: any, index?: number, visible: boolean, ilce: string }[] = [];
    private textureCache: Map<string, THREE.CanvasTexture> = new Map();
    private lastChildrenCount = 0;
    private isZoomedOut = false;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.camera = camera;
        this.districtGroup = new THREE.Group();
        this.districtGroup.name = 'DistrictGroup';
        this.scene.add(this.districtGroup);
    }

    public update() {
        let currentNodes = 0;
        let layerStats: Record<string, number> = {};
        
        this.scene.traverse(node => {
            // Sadece gecerli veri tasiyan Mesh/InstancedMesh katmanlarini say (isDistrict haric)
            if (node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.records || node.userData.record)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') {
                    currentNodes++;
                    const layerName = node.userData.layerName || 'Bilinmeyen';
                    layerStats[layerName] = (layerStats[layerName] || 0) + (node.type === 'InstancedMesh' ? (node as any).count : 1);
                }
            }
        });

        let rebuildNeeded = false;
        // Eger sahneye yeni bir katman eklendiyse (Taksiler, Plajlar asenkron geldiyse)
        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            console.log("--- YENI VERI BULUNDU, SISTEM ZORLA GUNCELLENIYOR ---");
            console.log("Bulunan Katmanlar (Guncel Durum):", layerStats);
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

    private getIlceFromRecord(rec: any): string {
        if (!rec) return 'İZMİR (GENEL)';
        
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
        
        // Eger ilce kutucugu bos birakildiysa ama isminde ilce geciyorsa (Kurtarma)
        if (!val && rec.ADI) {
            const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
            const ilceler = ['ALİAĞA', 'BALÇOVA', 'BAYINDIR', 'BAYRAKLI', 'BERGAMA', 'BEYDAĞ', 'BORNOVA', 'BUCA', 'ÇEŞME', 'ÇİĞLİ', 'DİKİLİ', 'FOÇA', 'GAZİEMİR', 'GÜZELBAHÇE', 'KARABAĞLAR', 'KARABURUN', 'KARŞIYAKA', 'KEMALPAŞA', 'KINIK', 'KİRAZ', 'KONAK', 'MENDERES', 'MENEMEN', 'NARLIDERE', 'ÖDEMİŞ', 'SEFERİHİSAR', 'SELÇUK', 'TİRE', 'TORBALI', 'URLA'];
            for(let i=0; i<ilceler.length; i++) {
                if (ad.includes(ilceler[i])) return ilceler[i];
            }
        }
        
        if (typeof val !== 'string') return 'İZMİR (GENEL)';
        val = val.toLocaleUpperCase('tr-TR').trim();
        
        // Belediye kronik yazim hatalari
        if (val.includes('KARŞI')) return 'KARŞIYAKA';
        if (val.includes('KARABA')) return 'KARABAĞLAR';
        if (val.includes('KEMALPA')) return 'KEMALPAŞA';
        if (val.includes('GÜZELBA')) return 'GÜZELBAHÇE';
        if (val.includes('BALÇOV')) return 'BALÇOVA';
        if (val.includes('MENDER')) return 'MENDERES';
        if (val.includes('SEFERİH')) return 'SEFERİHİSAR';
        
        return val;
    }

    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            // Mesh ve gercek katman kontrolu (Sekil ne olursa olsun)
            if (node.type === 'Mesh' && node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.record)) {
                const worldPos = new THREE.Vector3();
                node.getWorldPosition(worldPos);
                const ilce = this.getIlceFromRecord(node.userData.record);
                this.pointCache.push({ x: worldPos.x, z: worldPos.z, mesh: node, visible: true, ilce });
            } 
            else if (node.type === 'InstancedMesh' && node.userData && !node.userData.isDistrict && node.userData.records) {
                const inst = node as THREE.InstancedMesh;
                const records = inst.userData.records;
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                for(let i=0; i<inst.count; i++) {
                    inst.getMatrixAt(i, mat);
                    pos.setFromMatrixPosition(mat);
                    pos.applyMatrix4(inst.matrixWorld); 
                    const ilce = this.getIlceFromRecord(records ? records[i] : null);
                    this.pointCache.push({ x: pos.x, z: pos.z, mesh: inst, index: i, visible: true, ilce });
                }
            } 
            else if (node.type === 'Group' || node.type === 'Scene') {
                node.children.forEach(child => processNode(child));
            }
        };

        this.scene.updateMatrixWorld(true);
        this.scene.children.forEach(child => processNode(child));
    }

    private buildDistricts() {
        this.districtGroup.clear();
        const districts = new Map<string, any[]>();
        
        this.pointCache.forEach(p => {
            if (!districts.has(p.ilce)) districts.set(p.ilce, []);
            districts.get(p.ilce)!.push(p);
        });

        console.log("----- ILCE DAGILIM RAPORU -----");
        console.log("Toplam Taranan Gecerli Nokta: " + this.pointCache.length);
        let total = 0;
        districts.forEach((points, name) => {
            console.log(name + ": " + points.length + " kayit");
            total += points.length;
        });
        console.log("Beklenen Toplam: " + total);
        console.log("-------------------------------");

        const geo = new THREE.SphereGeometry(180, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0x441100, roughness: 0.2, metalness: 0.5 });

        districts.forEach((points, name) => {
            let ax = 0, az = 0;
            points.forEach(p => { ax += p.x; az += p.z; });
            ax /= points.length;
            az /= points.length;

            const targetData = {
                isDistrict: true,
                name: name,
                count: points.length,
                targetX: ax,
                targetZ: az
            };

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(ax, 100, az);
            mesh.userData = targetData;
            this.districtGroup.add(mesh);

            const label = `${name} (${points.length})`;
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.getTextTexture(label) }));
            sprite.position.set(ax, 380, az);
            sprite.scale.set(2048, 512, 1);
            sprite.userData = targetData; 
            this.districtGroup.add(sprite);
        });
    }

    private setPointVisible(p: any, visible: boolean) {
        if (p.visible === visible) return;
        p.visible = visible;
        
        if (p.index === undefined) {
            p.mesh.visible = visible;
        } else {
            const inst = p.mesh as THREE.InstancedMesh;
            const mat = new THREE.Matrix4();
            inst.getMatrixAt(p.index, mat);
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(mat);
            
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            if (visible) {
                dummy.scale.set(1, 1, 1);
            } else {
                dummy.scale.set(0, 0, 0); 
            }
            dummy.updateMatrix();
            inst.setMatrixAt(p.index, dummy.matrix);
            inst.instanceMatrix.needsUpdate = true;
        }
    }

    private setAllOriginalsVisible(visible: boolean) {
        this.pointCache.forEach(p => this.setPointVisible(p, visible));
    }

    private getTextTexture(text: string) {
        if (this.textureCache.has(text)) return this.textureCache.get(text)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 2048; canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 140px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillText(text, 1024, 256);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }
}
