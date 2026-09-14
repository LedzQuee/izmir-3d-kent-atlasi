import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export class DistrictManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    public districtGroup: THREE.Group;
    private textureCache: Map<string, THREE.CanvasTexture> = new Map();
    
    private pointCache: { x: number, z: number, mesh: any, index?: number, visible: boolean, ilce: string, layerName: string }[] = [];
    private lastChildrenCount = 0;
    private isZoomedOut = true;
    
    // Sag Cekmece Secimleri
    private selectedDistricts: Set<string> = new Set();
    private allDistrictsSelected = true;

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

        this.initRightToolboxUI();
        
        // Sol menuden katman acilip kapanirsa aninda sayilari guncelle
        window.addEventListener('layerToggled', () => {
            this.recalculateCounts();
        });
    }

    private initRightToolboxUI() {
        const existing = document.getElementById('district-right-toolbox');
        if (existing) existing.remove();

        const toolbox = document.createElement('div');
        toolbox.id = 'district-right-toolbox';
        toolbox.style.cssText = `
            position: fixed; right: 0; top: 0; height: 100vh; width: 25vw; min-width: 300px;
            background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
            box-shadow: -5px 0 20px rgba(0,0,0,0.1); transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 999;
            display: flex; flex-direction: column; font-family: sans-serif;
        `;

        // Ac/Kapa Oku (Arrow Tab)
        const arrowTab = document.createElement('div');
        arrowTab.style.cssText = `
            position: absolute; left: -40px; top: 50%; transform: translateY(-50%);
            width: 40px; height: 80px; background: rgba(255,255,255,0.95);
            border-radius: 10px 0 0 10px; box-shadow: -5px 0 10px rgba(0,0,0,0.1);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 24px; color: #555;
        `;
        arrowTab.innerHTML = '◀';
        
        let isOpen = false;
        arrowTab.onclick = () => {
            isOpen = !isOpen;
            toolbox.style.transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
            arrowTab.innerHTML = isOpen ? '▶' : '◀';
        };
        toolbox.appendChild(arrowTab);

        // Icerik Konteyneri
        const content = document.createElement('div');
        content.style.cssText = 'padding: 20px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;';

        const title = document.createElement('h2');
        title.textContent = 'İlçe Filtreleme';
        title.style.cssText = 'margin: 0 0 15px 0; color: #333; font-size: 18px; border-bottom: 2px solid #ff9900; padding-bottom: 10px;';
        content.appendChild(title);

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'İlçe Ara...';
        searchInput.style.cssText = 'width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 15px; box-sizing: border-box; font-size: 15px; outline: none;';
        content.appendChild(searchInput);

        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Tümünü Seç / Temizle';
        selectAllBtn.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; background: #eee; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; color: #555;';
        selectAllBtn.onclick = () => {
            this.allDistrictsSelected = !this.allDistrictsSelected;
            if (this.allDistrictsSelected) {
                this.districtsData.forEach(d => this.selectedDistricts.add(d.name));
            } else {
                this.selectedDistricts.clear();
            }
            renderCheckboxes(searchInput.value);
            this.recalculateCounts();
        };
        content.appendChild(selectAllBtn);

        const list = document.createElement('div');
        list.style.cssText = 'flex: 1; overflow-y: auto; padding-right: 10px;';
        list.innerHTML = `<style>
            #district-right-toolbox div::-webkit-scrollbar { width: 6px; }
            #district-right-toolbox div::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        </style>`;
        
        // Baslangicta hepsini secili yap
        this.districtsData.forEach(d => this.selectedDistricts.add(d.name));

        const renderCheckboxes = (filter: string) => {
            Array.from(list.children).forEach(c => { if(c.tagName !== 'STYLE') c.remove(); });
            
            this.districtsData.forEach(d => {
                if (d.name.toLowerCase().includes(filter.toLowerCase('tr-TR'))) {
                    const row = document.createElement('label');
                    row.style.cssText = 'display: flex; align-items: center; padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: 0.2s;';
                    row.onmouseover = () => row.style.background = '#fafafa';
                    row.onmouseout = () => row.style.background = 'transparent';

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = this.selectedDistricts.has(d.name);
                    cb.style.cssText = 'margin-right: 10px; transform: scale(1.2); cursor: pointer;';
                    
                    cb.onchange = (e) => {
                        if ((e.target as HTMLInputElement).checked) {
                            this.selectedDistricts.add(d.name);
                        } else {
                            this.selectedDistricts.delete(d.name);
                        }
                        this.allDistrictsSelected = this.selectedDistricts.size === this.districtsData.length;
                        this.recalculateCounts();
                    };

                    const text = document.createElement('span');
                    text.textContent = d.name;
                    text.style.cssText = 'font-size: 15px; color: #444;';

                    row.appendChild(cb);
                    row.appendChild(text);
                    list.appendChild(row);
                }
            });
        };

        renderCheckboxes('');
        searchInput.oninput = (e) => renderCheckboxes((e.target as HTMLInputElement).value);

        content.appendChild(list);
        toolbox.appendChild(content);
        document.body.appendChild(toolbox);
    }

    public update() {
        let currentNodes = 0;
        this.scene.traverse(node => {
            // isDistrict olanlar rozetlerdir, onlari sayma
            if (node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.records || node.userData.record)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') {
                    currentNodes++;
                }
            }
        });

        // Eger haritaya yeni bir katman (veri) eklendiyse taramayi yenile
        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            this.extractPoints();
            this.recalculateCounts();
            this.lastChildrenCount = currentNodes;
        }

        // LOD (Yaklasma / Uzaklasma Gorunurluk Ayari)
        const altitude = this.camera.position.y;
        const ZOOM_THRESHOLD = 2800;

        if (altitude > ZOOM_THRESHOLD) {
            // Uzaktayiz -> Noktalari gizle, Rozetleri (Toplamlari) goster
            if (!this.isZoomedOut) {
                this.districtGroup.visible = true;
                this.setAllOriginalsVisible(false);
                this.isZoomedOut = true;
            }
        } else {
            // Yakindayiz -> Rozetleri gizle, Noktalari goster (Sadece secili ilceler)
            if (this.isZoomedOut) {
                this.districtGroup.visible = false;
                this.setAllOriginalsVisible(true);
                this.isZoomedOut = false;
            }
        }
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

            // Sadece ana grup (Legend tarafindan kontrol edilen grup) visible ise icine gir
            // Eger parent (Grup) gizliyse, noktalari sayma!
            if (node.parent && node.parent.type === 'Group' && node.parent.visible === false) return;
            if (node.visible === false && node.type === 'Group') return;

            if (node.type === 'Mesh' && node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.record)) {
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

    // Sol menuden (Legend) veya Sag menuden (Toolbox) bir sey degistiginde cagirilir
    private recalculateCounts() {
        // Once yeniden cikar (Cunku parent group visible = false olmus olabilir)
        this.extractPoints();

        const activeCounts = new Map<string, number>();
        this.pointCache.forEach(p => {
            // Eger sag menude bu ilce secili degilse, sayma
            if (this.selectedDistricts.size > 0 && !this.selectedDistricts.has(p.ilce)) return;
            activeCounts.set(p.ilce, (activeCounts.get(p.ilce) || 0) + 1);
        });

        this.buildCorporateBadges(activeCounts);
        
        // Eger yakindaysak ve filtre degistiyse, noktalari da gizle/goster
        if (!this.isZoomedOut) {
            this.setAllOriginalsVisible(true);
        }
    }

    private buildCorporateBadges(counts: Map<string, number>) {
        this.districtGroup.clear();
        
        this.districtsData.forEach(d => {
            const count = counts.get(d.name) || 0;
            if (count === 0) return; // Sifirsa rozet cizme
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z };

            // TERTEMİZ, GÖLGESİZ, KURUMSAL BEYAZ KAPSÜL (Sıfır Neon)
            const label = `${d.name}  ${count}`;
            const spriteMat = new THREE.SpriteMaterial({ 
                map: this.getTextTexture(label),
                depthTest: false, // Her zaman binalarin ustunde, pürüzsüz görünür
                transparent: true
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x, 150, z); // Havada hafif suzulur
            sprite.scale.set(1500, 320, 1);
            sprite.userData = targetData;
            
            this.districtGroup.add(sprite);
        });
    }

    private setPointVisible(p: any, visible: boolean) {
        // Sag menude filtre kapatildiysa, noktayi her turlu gizle
        let finalVisible = visible;
        if (visible && this.selectedDistricts.size > 0 && !this.selectedDistricts.has(p.ilce)) {
            finalVisible = false;
        }

        if (p.visible === finalVisible) return;
        p.visible = finalVisible;
        
        if (p.index === undefined) {
            p.mesh.visible = finalVisible;
        } else {
            const inst = p.mesh as THREE.InstancedMesh;
            const mat = new THREE.Matrix4();
            inst.getMatrixAt(p.index, mat);
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(mat);
            
            const dummy = new THREE.Object3D();
            dummy.position.copy(pos);
            dummy.scale.setScalar(finalVisible ? 1 : 0); 
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
}
