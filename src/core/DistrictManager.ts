import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export class DistrictManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    public districtGroup: THREE.Group;
    private textureCache: Map<string, THREE.CanvasTexture> = new Map();
    
    private pointCache: { x: number, z: number, mesh: any, index?: number, visible: boolean, ilce: string, layerName: string }[] = [];
    private lastChildrenCount = 0;
    private pointsVisibleForLOD = true;
    private isZoomedOut = true;
    
    // Sag Cekmece Secimleri
    
    

    private districtsData = [
        { name: 'ALİAĞA', lat: 38.7994, lng: 26.9707 }, { name: 'BALÇOVA', lat: 38.3908, lng: 27.0461 },
        { name: 'BAYINDIR', lat: 38.2195, lng: 27.6467 }, { name: 'BAYRAKLI', lat: 38.4633, lng: 27.1691 },
        { name: 'BERGAMA', lat: 39.1215, lng: 27.1772 }, { name: 'BEYDAĞ', lat: 38.0872, lng: 28.2043 },
        { name: 'BORNOVA', lat: 38.4716, lng: 27.2178 }, { name: 'BUCA', lat: 38.3842, lng: 27.1751 },
        { name: 'ÇEŞME', lat: 38.3232, lng: 26.3065 }, { name: 'ÇİĞLİ', lat: 38.4907, lng: 27.0583 },
        { name: 'DİKİLİ', lat: 39.0722, lng: 26.8893 }, { name: 'FOÇA', lat: 38.6675, lng: 26.7554 },
        { name: 'GAZİEMİR', lat: 38.3242, lng: 27.1328 }, { name: 'GÜZELBAHÇE', lat: 38.3614, lng: 26.8837 },
        { name: 'KARABAĞLAR', lat: 38.3752, lng: 27.1189 }, { name: 'KARABURUN', lat: 38.6366, lng: 26.5147 },
        { name: 'KARŞIYAKA', lat: 38.4594, lng: 27.1147 }, { name: 'KEMALPAŞA', lat: 38.4278, lng: 27.4172 },
        { name: 'KINIK', lat: 39.0880, lng: 27.3820 }, { name: 'KİRAZ', lat: 38.2307, lng: 28.2065 },
        { name: 'KONAK', lat: 38.4190, lng: 27.1287 }, { name: 'MENDERES', lat: 38.2526, lng: 27.1352 },
        { name: 'MENEMEN', lat: 38.6019, lng: 27.0694 }, { name: 'NARLIDERE', lat: 38.3892, lng: 26.9930 },
        { name: 'ÖDEMİŞ', lat: 38.2294, lng: 27.9744 }, { name: 'SEFERİHİSAR', lat: 38.1973, lng: 26.8378 },
        { name: 'SELÇUK', lat: 37.9490, lng: 27.3712 }, { name: 'TİRE', lat: 38.0898, lng: 27.7348 },
        { name: 'TORBALI', lat: 38.1517, lng: 27.3601 }, { name: 'URLA', lat: 38.3232, lng: 26.7644 }
    ];

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.camera = camera;
        this.districtGroup = new THREE.Group();
        this.districtGroup.name = 'DistrictGroup';
        this.scene.add(this.districtGroup);

        this.initRightHoverSidebar();
        
        // Sol menuden katman acilip kapanirsa aninda sayilari guncelle
        window.addEventListener('layerToggled', () => {
            this.recalculateCounts();
        });
        
        // Eski bozuk legend eger gizliyse gosterelim (Cunku kullanici sol menuyu kullanmak istiyor)
        const oldLegend = document.getElementById('legend-container');
        if (oldLegend) oldLegend.style.display = 'block';
        
        // Benim az once ekledigim sol arama cubugunu silelim
        const searchTab = document.getElementById('district-search-tab');
        if (searchTab) searchTab.remove();
        
        // Eski sol menudeki sidebar-ui (sol alt liste) varsa silelim
        const sidebar = document.getElementById('district-sidebar');
        if (sidebar) sidebar.remove();
    }

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

        // --- NOKTALARIN YUKSEKLIGE GORE GIZLENMESI ---
        const altitude = this.camera.position.y;
        const SHOW_POINTS_THRESHOLD = 1800; // Yere 1800 birimden fazla yaklasinca veriler belirir

        const shouldShowPoints = true; // LOD disabled temporarily
        if (this.pointsVisibleForLOD !== shouldShowPoints) {
            this.pointsVisibleForLOD = shouldShowPoints;
            this.setAllOriginalsVisible(shouldShowPoints);
        }

        // --- ETIKETLERIN MESAFEYE GORE YUMUSAK SAYDAMLASMASI (SMOOTH FADE) ---
        const FADE_START = 2200; // Bu mesafede saydamlasmaya baslar
        const FADE_END = 1200; // Bu mesafeden daha yakindaysa tamamen kaybolur

        this.districtGroup.children.forEach(child => {
            if (child.type === 'Sprite') {
                const sprite = child as THREE.Sprite;
                
                // Kamera ile rozet arasindaki 3D mesafeyi olc
                const dist = this.camera.position.distanceTo(sprite.position);

                const material = sprite.material as THREE.SpriteMaterial;

                if (dist > FADE_START) {
                    material.opacity = 1;
                    sprite.visible = true;
                } else if (dist < FADE_END) {
                    material.opacity = 0;
                    sprite.visible = false; // Render performansini artirmak icin gizle
                } else {
                    sprite.visible = true;
                    // Lineer yumusak gecis (0.0 ile 1.0 arasi opacity)
                    const opacity = (dist - FADE_END) / (FADE_START - FADE_END);
                    material.opacity = opacity;
                }
            }
        });
    }


    private getIlceFromRecord(rec: any): string {
        if (!rec) return 'DİĞER';
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
        if (!val && rec.ADI) {
            const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
            for (let d of this.districtsData) {
                if (ad.includes(d.name)) return d.name;
            }
        }
        if (typeof val !== 'string') return 'DİĞER';
        val = val.toLocaleUpperCase('tr-TR').trim();
        
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
        this.pointCache = [];
        
        const processNode = (node: THREE.Object3D) => {
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin' || node.name === 'DistrictGroup' || node.name === 'ClusterGroup') return;

            // Eger parent (Grup) gizliyse, noktalari sayma (Sol Menude kapatilmistir)
            if (node.parent && node.parent.type === 'Group' && node.parent.visible === false) return;
            if (node.visible === false && node.type === 'Group') return;

            if (node.type === 'Mesh' && node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.record)) {
                // Sadece kendisi de aciksa (Sol menuden kapatilmamissa) dahil et
                if (node.visible === false && this.isZoomedOut === false) return; 
                
                const ilce = this.getIlceFromRecord(node.userData.record);
                this.pointCache.push({ x: node.position.x, z: node.position.z, mesh: node, visible: true, ilce, layerName: node.userData.layerName || 'Bilinmeyen' });
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
                    this.pointCache.push({ x: pos.x, z: pos.z, mesh: inst, index: i, visible: true, ilce, layerName: node.userData.layerName || 'Bilinmeyen' });
                }
            } 
            else if (node.type === 'Group' || node.type === 'Scene') {
                node.children.forEach(child => processNode(child));
            }
        };

        this.scene.updateMatrixWorld(true);
        this.scene.children.forEach(child => processNode(child));
    }

    
    private recalculateCounts() {
        this.extractPoints();

        const activeCounts = new Map<string, number>();
        this.pointCache.forEach(p => {
            activeCounts.set(p.ilce, (activeCounts.get(p.ilce) || 0) + 1);
        });

        this.buildCorporateBadges(activeCounts);
        this.updateRightSidebarUI(activeCounts);
        this.setAllOriginalsVisible(this.pointsVisibleForLOD);
    }


    private buildCorporateBadges(counts: Map<string, number>) {
        this.districtGroup.clear();
        
        this.districtsData.forEach(d => {
            const count = counts.get(d.name) || 0;
            if (count === 0) return; // Sifirsa rozet cizme
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z, lat: d.lat, lng: d.lng };

            // TERTEMİZ, GÖLGESİZ, KURUMSAL BEYAZ KAPSÜL (Sıfır Neon)
            const label = `${d.name}  ${count}`;
            const spriteMat = new THREE.SpriteMaterial({ 
                map: this.getTextTexture(label),
                depthTest: false,
                transparent: true
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x, 400, z); // Gokyuzunde asili durur (Yerden yuksekte) // Havada hafif suzulur
            sprite.scale.set(1500, 320, 1);
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
            dummy.scale.setScalar(visible ? 1 : 0); 
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
        canvas.width = 1500; canvas.height = 320;
        const ctx = canvas.getContext('2d')!;
        
        // KURUMSAL BEYAZ ZEMİN (NEON YOK)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(10, 10, 1480, 300, 150); 
        ctx.fill();
        
        // ZARİF İNCE GRİ ÇERÇEVE
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // SİYAH MAT METİN
        ctx.fillStyle = '#222222';
        ctx.font = 'bold 120px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(text, 750, 175);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }

    private initRightHoverSidebar() {
        const existing = document.getElementById('district-right-sidebar');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'district-right-sidebar';
        container.style.cssText = `
            position: fixed; right: 0; top: 15%;
            width: 50px; max-height: 80vh; height: 600px;
            background: rgba(20, 25, 30, 0.4); backdrop-filter: blur(8px);
            border-radius: 15px 0 0 15px; border: 1px solid rgba(255,255,255,0.1);
            border-right: none; box-shadow: -5px 5px 20px rgba(0,0,0,0.3);
            color: white; font-family: "Segoe UI", Roboto, sans-serif;
            z-index: 100; overflow: hidden; 
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            display: flex; flex-direction: column;
        `;

        // Kapaliyken Gorunen Ikon (Istatistik/Siralama)
        const iconDiv = document.createElement('div');
        iconDiv.innerHTML = ' ≡ '; 
        iconDiv.style.cssText = `
            position: absolute; right: 0; top: 0;
            width: 50px; height: 50px; display: flex;
            align-items: center; justify-content: center; font-size: 22px;
            cursor: pointer; opacity: 1; transition: 0.3s;
        `;
        container.appendChild(iconDiv);

        const content = document.createElement('div');
        content.id = 'district-list-content';
        content.style.cssText = `
            width: 280px; opacity: 0; transition: opacity 0.3s, transform 0.4s;
            padding: 20px; pointer-events: none; overflow-y: auto; height: 100%;
            transform: translateX(20px); box-sizing: border-box; display: flex; flex-direction: column;
        `;
        
        content.innerHTML = `<style>
            #district-list-content::-webkit-scrollbar { width: 5px; }
            #district-list-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 5px; }
        </style>
        <h3 style="margin: 0 0 15px 0; color: #ff9900; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">İlçe Veri Sıralaması</h3>
        <div id="district-rows" style="flex: 1; overflow-y: auto; padding-right: 5px;"></div>
        `;

        container.appendChild(content);
        document.body.appendChild(container);

        // Hover (Uzerine Gelme) Animasyonlari
        container.onmouseenter = () => {
            container.style.width = '280px';
            container.style.background = 'rgba(20, 25, 30, 0.85)';
            iconDiv.style.opacity = '0';
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
            content.style.transform = 'translateX(0)';
        };
        
        container.onmouseleave = () => {
            container.style.width = '50px';
            container.style.background = 'rgba(20, 25, 30, 0.4)';
            iconDiv.style.opacity = '1';
            content.style.opacity = '0';
            content.style.pointerEvents = 'none';
            content.style.transform = 'translateX(20px)';
        };
    }

    private updateRightSidebarUI(counts: Map<string, number>) {
        const rowsContainer = document.getElementById('district-rows');
        if (!rowsContainer) return;
        
        rowsContainer.innerHTML = '';
        const sorted = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr-TR'));
        
        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            const row = document.createElement('div');
            row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;`;
            row.onmouseover = () => { row.style.background = 'rgba(255, 153, 0, 0.2)'; row.style.borderColor = 'rgba(255,153,0,0.5)'; };
            row.onmouseout = () => { row.style.background = 'rgba(255,255,255,0.05)'; row.style.borderColor = 'transparent'; };
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    const [x, y, z] = convertGpsToVector(target.lat, target.lng);
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x, z, lat: target.lat, lng: target.lng } }));
                }
            };

            const nameEl = document.createElement('span');
            nameEl.textContent = name;
            nameEl.style.cssText = 'font-size: 13px; font-weight: bold; color: #ddd;';

            const countEl = document.createElement('span');
            countEl.textContent = count.toString();
            countEl.style.cssText = 'background: #ff9900; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 900;';

            row.appendChild(nameEl);
            row.appendChild(countEl);
            rowsContainer.appendChild(row);
        });
    }

}

