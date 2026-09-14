import * as THREE from 'three';

export class ClusterManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private clusterGroup: THREE.Group;
    private pointCache: { x: number, z: number, mesh: any, index?: number, visible: boolean }[] = [];
    private textureCache: Map<number, THREE.CanvasTexture> = new Map();
    private lastChildrenCount = 0;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.camera = camera;
        this.clusterGroup = new THREE.Group();
        this.clusterGroup.name = 'ClusterGroup';
        this.scene.add(this.clusterGroup);
    }

    public update() {
        // Yeni bir katman yuklendiyse listeyi otomatik yenile
        if (this.scene.children.length !== this.lastChildrenCount) {
            this.extractPoints();
            this.lastChildrenCount = this.scene.children.length;
        }

        if (this.pointCache.length === 0) return;

        const alt = this.camera.position.y;
        
        // 2000 metrenin altinda tam detaya (orijinal noktalara) doner ve kumeler dagilir
        if (alt < 2000) {
            this.setAllOriginalsVisible(true);
            this.clusterGroup.clear();
            return;
        }

        // Yukseklige gore dinamik izgara (Grid) hucresi boyutu
        const gridSize = alt / 8; 
        const grid = new Map<string, any[]>();

        // Noktalari Grid icinde grupla
        this.pointCache.forEach(p => {
            const gx = Math.floor(p.x / gridSize);
            const gz = Math.floor(p.z / gridSize);
            const key = `${gx}_${gz}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(p);
        });

        this.clusterGroup.clear();

        grid.forEach(points => {
            if (points.length === 1) {
                // Tek basina kalanlari kumeleme, dogrudan goster
                this.setPointVisible(points[0], true);
            } else {
                // Kumelenenlerin orijinal kurelerini gizle
                points.forEach(p => this.setPointVisible(p, false));

                // Kumenin orta noktasini (Agirlik merkezi) hesapla
                let ax = 0, az = 0;
                points.forEach(p => { ax += p.x; az += p.z; });
                ax /= points.length;
                az /= points.length;

                // Dinamik boyutlu 2D Yazili (Sprite) Kume olustur
                const spriteSize = Math.max(120, alt / 20);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.getTexture(points.length) }));
                sprite.position.set(ax, 100, az); // Havada rahat gorunmesi icin
                sprite.scale.set(spriteSize, spriteSize, 1);
                this.clusterGroup.add(sprite);
            }
        });
    }

    private extractPoints() {
        this.setAllOriginalsVisible(true); 
        this.pointCache = [];
        
        this.scene.children.forEach(child => {
            if (child.name === 'GroundPlane' || child.type === 'GridHelper' || child.name === 'TargetPin' || child.name === 'ClusterGroup') return;

            if (child.type === 'Mesh' && (child as any).geometry?.type === 'SphereGeometry') {
                this.pointCache.push({ x: child.position.x, z: child.position.z, mesh: child, visible: true });
            } else if (child.type === 'InstancedMesh') {
                const inst = child as THREE.InstancedMesh;
                const mat = new THREE.Matrix4();
                const pos = new THREE.Vector3();
                for(let i=0; i<inst.count; i++) {
                    inst.getMatrixAt(i, mat);
                    pos.setFromMatrixPosition(mat);
                    this.pointCache.push({ x: pos.x, z: pos.z, mesh: inst, index: i, visible: true });
                }
            } else if (child.type === 'Group') {
                child.children.forEach(sub => {
                     if (sub.name !== 'TargetPin' && sub.type === 'Mesh' && (sub as any).geometry?.type === 'SphereGeometry') {
                          this.pointCache.push({ x: sub.position.x, z: sub.position.z, mesh: sub, visible: true });
                     }
                });
            }
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
            // Gorunurlugu hizlica matris olcegiyle kontrol ediyoruz
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

    private getTexture(count: number) {
        if (this.textureCache.has(count)) return this.textureCache.get(count)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        
        ctx.beginPath();
        ctx.arc(64, 64, 56, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'; // Modern Mavi Kume
        ctx.fill();
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Kalin Beyaz Cerceve
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count.toString(), 64, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        this.textureCache.set(count, tex);
        return tex;
    }
}
