import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

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

    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            if (node.type === 'Mesh' && (node as any).geometry?.type === 'SphereGeometry') {
                const ilce = this.getNearestDistrict(node.position.x, node.position.z);
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

    private buildDistricts() {
        this.districtGroup.clear();
        const districts = new Map<string, any[]>();
        
        this.pointCache.forEach(p => {
            if (!districts.has(p.ilce)) districts.set(p.ilce, []);
            districts.get(p.ilce)!.push(p);
        });

        // Ilce Kuresi Materyali
        
        console.log("----- ILCE DAGILIM RAPORU -----");
        console.log("Toplam Taranan Gecerli Nokta: " + this.pointCache.length);
        let total = 0;
        districts.forEach((points, name) => {
            console.log(name + ": " + points.length + " kayit");
            total += points.length;
        });
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
