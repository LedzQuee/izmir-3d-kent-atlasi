const fs = require('fs');

// 1. Engine.ts'ye flyTo Event Listener'i ekle
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');
if (!engine.includes('flyToDistrict')) {
    const listener = `
    window.addEventListener('flyToDistrict', (e: any) => {
        this.flyTo(e.detail.x, e.detail.z, 2000);
    });
    `;
    engine = engine.replace("window.addEventListener('clearBusStops'", listener + "\n    window.addEventListener('clearBusStops'");
    fs.writeFileSync('src/core/Engine.ts', engine);
}

// 2. DistrictManager'i bastan yazarak UI Sidebar'a donustur
const managerCode = `import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export class DistrictManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private pointCache: { x: number, z: number, mesh: any, index?: number, visible: boolean, ilce: string }[] = [];
    private lastChildrenCount = 0;
    
    // Ucus merkezleri icin sabit koordinatlar
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
        this.initSidebarUI();
    }

    private initSidebarUI() {
        const existing = document.getElementById('district-sidebar');
        if (existing) existing.remove();

        const sidebar = document.createElement('div');
        sidebar.id = 'district-sidebar';
        sidebar.style.cssText = \`
            position: fixed; top: 20px; right: 20px;
            background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 15px; width: 260px;
            color: white; font-family: sans-serif; z-index: 100;
            backdrop-filter: blur(8px); display: flex; flex-direction: column;
            max-height: calc(100vh - 40px);
        \`;

        const title = document.createElement('div');
        title.innerHTML = 'İlçe Analiz Raporu <br><span style="font-size:11px; color:#aaa; font-weight:normal;">Tüm Katmanlar</span>';
        title.style.cssText = 'font-weight: bold; color: #ff9900; margin-bottom: 15px; text-align: center; font-size: 14px; border-bottom: 1px solid #444; padding-bottom: 10px;';
        sidebar.appendChild(title);

        const listContainer = document.createElement('div');
        listContainer.id = 'district-list';
        listContainer.style.cssText = 'overflow-y: auto; flex: 1; padding-right: 5px;';
        // Custom scrollbar
        listContainer.innerHTML = \`<style>
            #district-list::-webkit-scrollbar { width: 6px; }
            #district-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
            #district-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            #district-list::-webkit-scrollbar-thumb:hover { background: rgba(255,153,0,0.8); }
        </style>\`;
        
        sidebar.appendChild(listContainer);
        document.body.appendChild(sidebar);
    }

    public update() {
        let currentNodes = 0;
        this.scene.traverse(node => {
            if (node.userData && (node.userData.layerName || node.userData.records || node.userData.record)) {
                if (node.type === 'Mesh' || node.type === 'InstancedMesh') currentNodes++;
            }
        });

        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            this.extractPoints();
            this.updateSidebarUI();
            this.lastChildrenCount = currentNodes;
        }
    }

    private getIlceFromRecord(rec: any): string {
        if (!rec) return 'DİĞER / BİLİNMEYEN';
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi || rec.IlceId || rec.ilceid;
        
        if (!val && rec.ADI) {
            const ad = String(rec.ADI).toLocaleUpperCase('tr-TR');
            for (let d of this.districtsData) {
                if (ad.includes(d.name)) return d.name;
            }
        }
        
        if (typeof val !== 'string') return 'DİĞER / BİLİNMEYEN';
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
            if (node.name === 'GroundPlane' || node.type === 'GridHelper' || node.name === 'TargetPin') return;

            if (node.type === 'Mesh' && node.userData && (node.userData.layerName || node.userData.record)) {
                const ilce = this.getIlceFromRecord(node.userData.record);
                this.pointCache.push({ x: node.position.x, z: node.position.z, mesh: node, visible: true, ilce });
            } 
            else if (node.type === 'InstancedMesh' && node.userData && node.userData.records) {
                const inst = node as THREE.InstancedMesh;
                const records = inst.userData.records;
                for(let i=0; i<inst.count; i++) {
                    const ilce = this.getIlceFromRecord(records ? records[i] : null);
                    this.pointCache.push({ x: 0, z: 0, mesh: inst, index: i, visible: true, ilce });
                }
            } 
            else if (node.type === 'Group' || node.type === 'Scene') {
                node.children.forEach(child => processNode(child));
            }
        };

        this.scene.children.forEach(child => processNode(child));
    }

    private updateSidebarUI() {
        const districts = new Map<string, number>();
        let totalCount = 0;
        
        this.pointCache.forEach(p => {
            districts.set(p.ilce, (districts.get(p.ilce) || 0) + 1);
            totalCount++;
        });

        const listContainer = document.getElementById('district-list');
        if (!listContainer) return;

        // Icerigi temizle ama scrollbar stilini tut
        const styleHtml = listContainer.querySelector('style')?.outerHTML || '';
        listContainer.innerHTML = styleHtml;

        // Isme veya sayiya gore sirala
        const sorted = Array.from(districts.entries()).sort((a, b) => b[1] - a[1]);

        sorted.forEach(([name, count]) => {
            const row = document.createElement('div');
            row.style.cssText = \`
                display: flex; justify-content: space-between; align-items: center;
                padding: 8px 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05);
                border-radius: 6px; cursor: pointer; transition: 0.2s; border: 1px solid transparent;
            \`;
            
            row.onmouseover = () => { row.style.background = 'rgba(255, 153, 0, 0.2)'; row.style.borderColor = 'rgba(255,153,0,0.5)'; };
            row.onmouseout = () => { row.style.background = 'rgba(255,255,255,0.05)'; row.style.borderColor = 'transparent'; };
            
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    const [x, y, z] = convertGpsToVector(target.lat, target.lng);
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x, z } }));
                } else {
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { x: 0, z: 0 } })); // Genel merkez
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
        
        // Genel toplam bilgisi eklensin (Opsiyonel)
        const totalRow = document.createElement('div');
        totalRow.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; text-align: center; color: #fff; font-size: 12px;';
        totalRow.innerHTML = \`Haritadaki Toplam Veri: <b>\${totalCount}</b>\`;
        listContainer.appendChild(totalRow);
    }
}
`;
fs.writeFileSync('src/core/DistrictManager.ts', managerCode);
