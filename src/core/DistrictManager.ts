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


    private getIlce(rec: any): string {
        if (!rec) return 'İZMİR (GENEL)';
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || 'İZMİR (GENEL)';
        if (typeof val !== 'string') return 'İZMİR (GENEL)';
        return val.toLocaleUpperCase('tr-TR').trim();
    }

    
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

    private buildDistricts() {
        this.districtGroup.clear();
        const districts = new Map<string, any[]>();
        
        this.pointCache.forEach(p => {
            if (!districts.has(p.ilce)) districts.set(p.ilce, []);
            districts.get(p.ilce)!.push(p);
        });

        // Ilce Kuresi Materyali
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
            sprite.position.set(ax, 380, az); // Kurenin biraz uzerinde duser
            sprite.scale.set(1500, 375, 1);
            sprite.userData = targetData; // Yaziya tiklanirsa da ucus baslar
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
        canvas.width = 1024; canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 85px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillText(text, 512, 128);
        
        const tex = new THREE.CanvasTexture(canvas);
        this.textureCache.set(text, tex);
        return tex;
    }
}
