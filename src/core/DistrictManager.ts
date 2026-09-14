import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export class DistrictManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    public districtGroup: THREE.Group;
    private textureCache: Map<string, THREE.CanvasTexture> = new Map();
    
    private isApiLoaded = false;
    private apiDistrictCounts = new Map<string, number>();

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

        this.initSidebarUI();
        this.initializeApiData();
    }

    
    public update() {
        // Harita kameralarinda y ekseni (irtifa) uzakligi belirler
        const altitude = this.camera.position.y;
        const ZOOM_THRESHOLD = 2800; // Etiketlerin kaybolup, verilerin belirecegi sinir

        if (altitude > ZOOM_THRESHOLD) {
            // Kus bakisi (Uzakta) -> Sadece Ilce Rozetlerini Goster
            if (!this.isZoomedOut) {
                this.districtGroup.visible = true;
                this.setAllOriginalsVisible(false);
                this.isZoomedOut = true;
            }
        } else {
            // Yakinlasma (Zoom In) -> Rozetleri Gizle, Altindaki Verileri Erisime Ac
            if (this.isZoomedOut) {
                this.districtGroup.visible = false;
                this.setAllOriginalsVisible(true);
                this.isZoomedOut = false;
            }
        }
    }


    
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


    private initSidebarUI() {
        const existing = document.getElementById('district-sidebar');
        if (existing) existing.remove();

        const sidebar = document.createElement('div');
        sidebar.id = 'district-sidebar';
        sidebar.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 15px; width: 260px;
            color: white; font-family: sans-serif; z-index: 100;
            backdrop-filter: blur(8px); display: flex; flex-direction: column;
            max-height: calc(100vh - 40px);
        `;

        const title = document.createElement('div');
        title.innerHTML = 'İlçe Analiz Raporu <br><span style="font-size:11px; color:#aaa; font-weight:normal;">%100 Kesin API Verileri</span>';
        title.style.cssText = 'font-weight: bold; color: #ff9900; margin-bottom: 15px; text-align: center; font-size: 14px; border-bottom: 1px solid #444; padding-bottom: 10px;';
        sidebar.appendChild(title);

        const listContainer = document.createElement('div');
        listContainer.id = 'district-list';
        listContainer.style.cssText = 'overflow-y: auto; flex: 1; padding-right: 5px;';
        listContainer.innerHTML = `<style>
            #district-list::-webkit-scrollbar { width: 6px; }
            #district-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
            #district-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            #district-list::-webkit-scrollbar-thumb:hover { background: rgba(255,153,0,0.8); }
        </style>`;
        
        sidebar.appendChild(listContainer);
        document.body.appendChild(sidebar);
    }

    public async initializeApiData() {
        if (this.isApiLoaded) return;
        this.isApiLoaded = true;

        const endpoints = [
            'havaalanlari', 'kaplicalar', 'yetistirmeyurtlari', 'terminaller',
            'cocukgenclikmerkezleri', 'ailedayanismamerkezleri', 'meydanlar',
            'plajlar', 'huzurevleri', 'toplummerkezleri', 'izbbhizmetnoktalari',
            'taksiduraklari', 'afetaciltoplanmaalani'
        ];

        this.districtsData.forEach(d => this.apiDistrictCounts.set(d.name, 0));

        let completed = 0;
        endpoints.forEach(ep => {
            fetch("https://openapi.izmir.bel.tr/api/ibb/cbs/" + ep)
                .then(res => res.json())
                .then(data => {
                    const records = data.onemliyer || data;
                    if(Array.isArray(records)) {
                        records.forEach(r => {
                            const ilce = this.getIlceFromRecord(r);
                            if (this.apiDistrictCounts.has(ilce)) {
                                this.apiDistrictCounts.set(ilce, this.apiDistrictCounts.get(ilce)! + 1);
                            }
                        });
                    }
                })
                .catch(() => {})
                .finally(() => {
                    completed++;
                    if (completed === endpoints.length) {
                        this.buildBrownSpheres();
                        this.updateSidebarUIFromApi();
                    }
                });
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

    
    
    private isZoomedOut = true;

    private buildBrownSpheres() {
        this.districtGroup.clear();

        this.districtsData.forEach(d => {
            const count = this.apiDistrictCounts.get(d.name) || 0;
            if (count === 0) return;
            
            const [x, y, z] = convertGpsToVector(d.lat, d.lng);
            const targetData = { isDistrict: true, name: d.name, count: count, targetX: x, targetZ: z };

            // Sade, derinlik testinden muaf (her zaman ustte gorunen) kurumsal etiket
            const label = `${d.name}  ${count}`;
            const spriteMat = new THREE.SpriteMaterial({ 
                map: this.getTextTexture(label),
                depthTest: false, // Binalarin veya yerin icine girmesini engeller, hep ustte kalir
                transparent: true
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x, 150, z); 
            sprite.scale.set(1600, 350, 1);
            sprite.userData = targetData;
            
            // Etiketler districtGroup icinde toplanir, zoom yapilinca hepsi gizlenir
            this.districtGroup.add(sprite);
        });
        
        // Ilk acilista harita uzakta oldugu icin verileri (orijinal noktalari) gizleyelim
        this.setAllOriginalsVisible(false);
    }


    private updateSidebarUIFromApi() {
        const listContainer = document.getElementById('district-list');
        if (!listContainer) return;

        const styleHtml = listContainer.querySelector('style')?.outerHTML || '';
        listContainer.innerHTML = styleHtml;

        const sorted = Array.from(this.apiDistrictCounts.entries()).sort((a, b) => b[1] - a[1]);
        let totalCount = 0;

        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            totalCount += count;
            const row = document.createElement('div');
            row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;`;
            row.onmouseover = () => { row.style.background = 'rgba(255, 153, 0, 0.2)'; row.style.borderColor = 'rgba(255,153,0,0.5)'; };
            row.onmouseout = () => { row.style.background = 'rgba(255,255,255,0.05)'; row.style.borderColor = 'transparent'; };
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    const [x, y, z] = convertGpsToVector(target.lat, target.lng);
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x, z } }));
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
            listContainer.appendChild(row);
        });
        
        const totalRow = document.createElement('div');
        totalRow.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; text-align: center; color: #fff; font-size: 12px;';
        totalRow.innerHTML = `API'den Çekilen Net Toplam: <b>${totalCount}</b>`;
        listContainer.appendChild(totalRow);
    }

    
    private getTextTexture(text: string) {
        if (this.textureCache.has(text)) return this.textureCache.get(text)!;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1600; canvas.height = 400;
        const ctx = canvas.getContext('2d')!;
        
        // Modern Kapsul (Pill) Arkaplani
        ctx.fillStyle = 'rgba(0, 10, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(100, 50, 1400, 300, 150); // Koseleri tam yuvarlak
        ctx.fill();
        
        // Neon Cerceve
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Yazi Ayarlari
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Yazi Parlamasi
        ctx.shadowColor = 'rgba(0, 240, 255, 1)';
        ctx.shadowBlur = 30;
        
        ctx.fillText(text, 800, 210);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        this.textureCache.set(text, tex);
        return tex;
    }

}
