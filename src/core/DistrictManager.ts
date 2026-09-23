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
        
        window.addEventListener('poiDataUpdated', (e: any) => {
            this.extractPointsFromFeatures(e.detail.features);
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

    public update(zoom: number = 13) {
        // Ilce isimlerinin (Sprite) yakinlasinca kaybolmasi
        const FADE_START_ZOOM = 11.5;
        const FADE_END_ZOOM = 12.5;

        this.districtGroup.children.forEach(child => {
            if (child.type === 'Sprite') {
                const sprite = child as THREE.Sprite;
                const material = sprite.material as THREE.SpriteMaterial;

                if (zoom < FADE_START_ZOOM) {
                    material.opacity = 1;
                    sprite.visible = true;
                } else if (zoom > FADE_END_ZOOM) {
                    material.opacity = 0;
                    sprite.visible = false;
                } else {
                    sprite.visible = true;
                    // FADE_START'ta 1, FADE_END'de 0 olmali
                    const progress = (zoom - FADE_START_ZOOM) / (FADE_END_ZOOM - FADE_START_ZOOM);
                    material.opacity = 1 - progress;
                }
            }
        });
    }


    private getIlceFromRecord(rec: any, lat: number, lng: number): string {
        let val = rec.ILCE || rec.Ilce || rec.ilce || rec.ILCE_ADI || rec.IlceAdi || rec.ilce_adi;
        
        if (typeof val === 'string' && val.trim() !== '') {
            val = val.toLocaleUpperCase('tr-TR').trim();
            if (val.includes('KARŞI')) return 'KARŞIYAKA';
            if (val.includes('KARABA')) return 'KARABAĞLAR';
            if (val.includes('KEMALPA')) return 'KEMALPAŞA';
            if (val.includes('GÜZELBA')) return 'GÜZELBAHÇE';
            if (val.includes('BALÇOV')) return 'BALÇOVA';
            if (val.includes('MENDER')) return 'MENDERES';
            if (val.includes('SEFERİH')) return 'SEFERİHİSAR';
            
            const match = this.districtsData.find(d => d.name === val || val.includes(d.name));
            if (match) return match.name;
        }
        
        if (!isNaN(lat) && !isNaN(lng)) {
            let closest = 'DİĞER';
            let minDist = Infinity;
            for (const d of this.districtsData) {
                const dLat = (d.lat - lat) * 111;
                const dLng = (d.lng - lng) * 87;
                const dist = dLat * dLat + dLng * dLng;
                if (dist < minDist) {
                    minDist = dist;
                    closest = d.name;
                }
            }
            return closest;
        }
        return 'DİĞER';
    }

    private extractPointsFromFeatures(features: any[]) {
        const activeCounts = new Map<string, number>();
        features.forEach(f => {
            const lat = f.geometry.coordinates[1];
            const lng = f.geometry.coordinates[0];
            const ilce = this.getIlceFromRecord(JSON.parse(f.properties.recordRaw), lat, lng);
            activeCounts.set(ilce, (activeCounts.get(ilce) || 0) + 1);
        });

        this.buildCorporateBadges(activeCounts);
        this.updateRightSidebarUI(activeCounts);
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
            
            // Gercek arazi yuksekligini sorgula
            const map = (window as any).engineInstance?.map;
            let elevation = 0;
            if (map && map.queryTerrainElevation) {
                elevation = map.queryTerrainElevation([d.lng, d.lat]) || 0;
            }
            // 400 metre + arazinin yuksekligi (dagin icine girmesini onler)
            sprite.position.set(x, 400 + (elevation * 1.5), z);
            
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
            position: fixed;
            right: 0;
            top: 80px;
            width: 300px;
            height: calc(100vh - 160px);
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 16px 0 0 16px;
            color: #f1f5f9;
            font-family: "Segoe UI", Roboto, sans-serif;
            z-index: 500;
            display: flex;
            flex-direction: column;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -8px 0 32px rgba(0,0,0,0.5);
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.style.cssText = `
            position: absolute;
            left: -44px;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 64px;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 14px 0 0 14px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 22px;
            line-height: 1;
            transition: all 0.2s ease;
            box-shadow: -4px 0 16px rgba(0,0,0,0.4);
        `;
        toggleBtn.innerHTML = '&#8250;';
        toggleBtn.onmouseenter = () => { toggleBtn.style.color = '#fff'; toggleBtn.style.background = 'rgba(30, 41, 59, 0.95)'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.color = '#94a3b8'; toggleBtn.style.background = 'rgba(10, 14, 26, 0.85)'; };

        let open = true;
        toggleBtn.onclick = () => {
            open = !open;
            container.style.right = open ? '0' : '-300px';
            toggleBtn.innerHTML = open ? '&#8250;' : '&#8249;';
        };
        container.appendChild(toggleBtn);

        const header = document.createElement('div');
        header.style.cssText = `padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;`;
        header.innerHTML = `
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;margin-bottom:4px">Veri Dağılımı</div>
            <div style="font-size:17px;font-weight:700;color:#f1f5f9;margin-bottom:12px;">İlçe Sıralaması</div>
        `;
        container.appendChild(header);

        // --- ARAMA KUTUSU ---
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = 'position: relative; margin-top: 10px;';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Nokta/Mekan Ara...';
        searchInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: white; outline: none; font-size: 13px;';
        
        const searchResults = document.createElement('div');
        searchResults.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; max-height: 250px; overflow-y: auto; display: none; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-top: 4px;';
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchResults);
        header.appendChild(searchContainer); // Header'in alt kismina ekle

        let searchTimeout: any;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                // @ts-ignore
                const allFeatures = window.allMapLibreFeatures || [];
                
                // --- EKRANA GORE FILTİRELEME (VIEWPORT FILTER) ---
                // Eger zoom > 12.5 ise sadece ekranda gorunen alandaki verileri arar
                // @ts-ignore
                const map = window.engineInstance?.map;
                const zoom = map ? map.getZoom() : 0;
                const bounds = map ? map.getBounds() : null;

                const matches = allFeatures.filter((f: any) => {
                    // Isim eslesmiyor ise direk ele
                    if (!f.properties.recordName.toLowerCase().includes(query)) return false;
                    
                    // Yakindayken Bounding Box kontrolu
                    if (bounds && zoom >= 12.5) {
                        const [lng, lat] = f.geometry.coordinates;
                        if (lng < bounds.getWest() || lng > bounds.getEast() ||
                            lat < bounds.getSouth() || lat > bounds.getNorth()) {
                            return false; // Ekran disinda, ele!
                        }
                    }
                    
                    return true;
                });
                
                // Akilli siralama: Tam eslesenleri veya kelime olarak eslesenleri basa al
                matches.sort((a: any, b: any) => {
                    const nameA = a.properties.recordName.toLowerCase();
                    const nameB = b.properties.recordName.toLowerCase();
                    
                    // 1. Bastan baslama (Exact Prefix)
                    const startsA = nameA.startsWith(query);
                    const startsB = nameB.startsWith(query);
                    if (startsA && !startsB) return -1;
                    if (!startsA && startsB) return 1;
                    
                    // 2. Kelime basi eslesmesi (Orn: ' 5 ' vs '15')
                    // Noktalama isaretlerini de bosluk gibi sayalim
                    const wordRegex = new RegExp(`(^|\\s|\\W)${query}(\\s|\\W|$)`);
                    const wordA = wordRegex.test(nameA);
                    const wordB = wordRegex.test(nameB);
                    if (wordA && !wordB) return -1;
                    if (!wordA && wordB) return 1;
                    
                    // 3. Normal alfabetik/numerik siralama
                    return nameA.localeCompare(nameB, 'tr-TR', { numeric: true });
                });
                
                const topMatches = matches.slice(0, 15);
                
                searchResults.innerHTML = '';
                if (topMatches.length > 0) {
                    topMatches.forEach((f: any) => {
                        const div = document.createElement('div');
                        div.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; font-size: 12px; color: #cbd5e1; display:flex; align-items:center; gap:8px; line-height: 1.3;';
                        div.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${f.properties.color};flex-shrink:0;"></div> <span>${f.properties.recordName}</span>`;
                        div.onmouseenter = () => div.style.background = 'rgba(255,255,255,0.08)';
                        div.onmouseleave = () => div.style.background = 'transparent';
                        div.onclick = () => {
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                            const coords = f.geometry.coordinates;
                            
                            // Arama kismindan secileni vurgulamak (pulse) icin event firlat
                            const recordRaw = f.properties.recordRaw;
                            const id = `point-${recordRaw}`;
                            window.dispatchEvent(new CustomEvent('poiSelected', { detail: id }));

                            // @ts-ignore
                            window.engineInstance?.map?.flyTo({ center: coords, zoom: 18, pitch: 60 });
                            // @ts-ignore
                            if (window.UIManager) {
                                // @ts-ignore
                                window.UIManager.showMultiInfo([{
                                    layerName: f.properties.layerName,
                                    color: f.properties.color,
                                    record: JSON.parse(f.properties.recordRaw)
                                }]);
                            }
                        };
                        searchResults.appendChild(div);
                    });
                    searchResults.style.display = 'block';
                } else {
                    searchResults.style.display = 'none';
                }
            }, 300);
        });

        // Disari tiklaninca sonuclari gizle
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target as Node)) {
                searchResults.style.display = 'none';
            }
        });
        // --- ARAMA KUTUSU BITIS ---

        const listArea = document.createElement('div');
        listArea.id = 'district-rows';
        listArea.style.cssText = `flex:1;overflow-y:auto;padding:10px 14px;`;
        listArea.innerHTML = `<style>#district-rows::-webkit-scrollbar{width:4px}#district-rows::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:4px}</style>`;
        container.appendChild(listArea);
        document.body.appendChild(container);
    }

    private updateRightSidebarUI(counts: Map<string, number>) {
        const rowsContainer = document.getElementById('district-rows');
        if (!rowsContainer) return;
        const styleEl = rowsContainer.querySelector('style');
        rowsContainer.innerHTML = '';
        if (styleEl) rowsContainer.appendChild(styleEl);

        const sorted = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr-TR'));

        sorted.forEach(([name, count]) => {
            if (count === 0) return;
            const row = document.createElement('div');
            row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:9px 10px;margin-bottom:3px;border-radius:8px;cursor:pointer;transition:background 0.15s;background:rgba(255,255,255,0.04);`;
            row.onmouseenter = () => { row.style.background = 'rgba(99,179,237,0.12)'; };
            row.onmouseleave = () => { row.style.background = 'rgba(255,255,255,0.04)'; };
            row.onclick = () => {
                const target = this.districtsData.find(d => d.name === name);
                if (target) {
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { detail: { lat: target.lat, lng: target.lng } }));
                }
            };
            const nameEl = document.createElement('span');
            nameEl.textContent = name;
            nameEl.style.cssText = 'font-size:12px;color:#cbd5e1;font-weight:500;';
            const badge = document.createElement('span');
            badge.textContent = String(count);
            badge.style.cssText = `background:rgba(99,179,237,0.15);color:#93c5fd;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid rgba(99,179,237,0.25);min-width:28px;text-align:center;`;
            row.appendChild(nameEl);
            row.appendChild(badge);
            rowsContainer.appendChild(row);
        });
    }
}
