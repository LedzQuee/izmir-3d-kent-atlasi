import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { Engine } from '../core/Engine';
import { UIManager } from '../ui/UIManager';

const CLUSTER_MAX_ZOOM = 20;

export class HTMLMarkerManager {
    private map: maplibregl.Map;
    private supercluster: Supercluster;
    private markers: Map<string, maplibregl.Marker> = new Map();
    public currentFeatures: any[] = [];
    private spiderifiedClusterId: number | null = null;
    private activePointId: string | null = null;
    private lowZoomWarningShown: boolean = false;

    constructor(engine: Engine) {
        this.map = engine.map!;
        
        this.supercluster = new Supercluster({
            radius: 75,
            maxZoom: CLUSTER_MAX_ZOOM
        });
        
        this.supercluster.load([]);

        if (!document.getElementById('marker-animations')) {
            const style = document.createElement('style');
            style.id = 'marker-animations';
            style.innerHTML = `
                @keyframes marker-pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    70% { transform: scale(3.5); opacity: 0; }
                    100% { transform: scale(3.5); opacity: 0; }
                }
                .active-pulse::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border-radius: 50%;
                    background: inherit;
                    z-index: -1;
                    animation: marker-pulse 2s infinite ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        this.map.on('move', () => this.updateMarkersSafe());
        this.map.on('moveend', () => this.updateMarkersSafe());
        
        this.map.on('click', () => {
            let needsUpdate = false;
            if (this.spiderifiedClusterId !== null) {
                this.spiderifiedClusterId = null;
                needsUpdate = true;
            }
            if (this.activePointId !== null) {
                this.activePointId = null;
                document.querySelectorAll('.active-pulse').forEach(n => n.classList.remove('active-pulse'));
                // needsUpdate = true; // Sadece class kaldiriyoruz, tam re-render gerekmez
            }
            if (needsUpdate) {
                this.updateMarkersSafe();
            }
        });

        window.addEventListener('poiSelected', (e: any) => {
            this.activePointId = e.detail;
            document.querySelectorAll('.active-pulse').forEach(n => n.classList.remove('active-pulse'));
            
            // Eğer ekranda ise doğrudan sınıfı ekle (Syntax error onlemek icin ID kullaniyoruz)
            const target = document.getElementById(this.activePointId!);
            if (target) {
                target.classList.add('active-pulse');
            }
        });
    }

    public updateData(features: any[]) {
        this.currentFeatures = features;
        this.supercluster.load(features);
        this.spiderifiedClusterId = null;
        this.activePointId = null;
        this.updateMarkersSafe();
    }

    private updateMarkersSafe() {
        try {
            this.updateMarkers();
        } catch (err: any) {
            console.error('Marker guncelleme hatasi:', err);
            // Hata olursa en azindan uygulamayi cokertmemesi icin sessizce yut
        }
    }

    private updateMarkers() {
        if (!this.map) return;

        const zoomObj = this.map.getZoom();
        
        // --- OPTIMIZASYON: Eger haritaya yeterince yaklasilmadiysa DOM marker'lari hic uretme ---
        if (zoomObj < 12.5) {
            if (this.markers.size > 0 || !this.lowZoomWarningShown) {
                for (const [id, marker] of this.markers.entries()) {
                    marker.remove();
                }
                this.markers.clear();
                
                if (!this.lowZoomWarningShown) {
                    UIManager.showToast('Performans için detaylı noktalar gizlendi. Görmek için haritaya yaklaşın.', false);
                    this.lowZoomWarningShown = true;
                }
            }
            return;
        } else {
            this.lowZoomWarningShown = false; // Yaklasinca bayragi sifirla
        }

        const bounds = this.map.getBounds();
        const zoom = Math.floor(zoomObj);
        
        const clusters = this.supercluster.getClusters([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
        ], zoom);

        const newMarkerIds = new Set<string>();

        clusters.forEach(cluster => {
            const isCluster = cluster.properties?.cluster;
            const clusterId = cluster.id as number;
            
            const isSpiderified = isCluster && this.spiderifiedClusterId === clusterId;
            const id = isCluster ? `cluster-${cluster.id}${isSpiderified ? '-spider' : ''}` : `point-${cluster.properties.recordRaw}`;
            newMarkerIds.add(id);

            if (!this.markers.has(id)) {
                const el = document.createElement('div');
                el.style.cursor = 'pointer';

                if (isSpiderified) {
                    // --- CSS SPIDERIFY ---
                    const leaves = this.supercluster.getLeaves(clusterId, 9999);
                    const total = leaves.length;
                    
                    el.style.position = 'relative';
                    el.style.width = '0px';
                    el.style.height = '0px';
                    
                    const centerDot = document.createElement('div');
                    centerDot.style.cssText = 'position:absolute; top:-6px; left:-6px; width:12px; height:12px; border-radius:50%; background:#fff; box-shadow:0 0 5px rgba(0,0,0,0.5); z-index:2;';
                    el.appendChild(centerDot);

                    leaves.forEach((leaf, i) => {
                        const angle = (i / total) * Math.PI * 2;
                        const distance = total <= 10 ? 45 : (total <= 20 ? 65 : 85); 
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        const line = document.createElement('div');
                        line.style.cssText = `position:absolute; top:0; left:0; width:${distance}px; height:2px; background:rgba(255,255,255,0.6); transform-origin:0 50%; transform:rotate(${angle}rad); z-index:1;`;
                        el.appendChild(line);

                        const dot = document.createElement('div');
                        const color = leaf.properties!.color || '#00aaff';
                        const leafId = `point-${leaf.properties!.recordRaw}`;
                        
                        dot.id = leafId;
                        dot.style.cssText = `position:absolute; top:0; left:0; transform:translate(calc(-50% + ${x}px), calc(-50% + ${y}px)); width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.4); z-index:3; transition:transform 0.2s;`;
                        
                        if (this.activePointId === leafId) {
                            dot.classList.add('active-pulse');
                        }

                        dot.onmouseenter = () => { dot.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.3)`; };
                        dot.onmouseleave = () => { dot.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`; };
                        
                        dot.onclick = (e) => {
                            e.stopPropagation();
                            
                            this.activePointId = leafId;
                            document.querySelectorAll('.active-pulse').forEach(n => n.classList.remove('active-pulse'));
                            dot.classList.add('active-pulse');

                            try {
                                const rec = JSON.parse(leaf.properties!.recordRaw);
                                UIManager.showMultiInfo([{
                                    layerName: leaf.properties!.layerName,
                                    color: leaf.properties!.color,
                                    record: rec
                                }]);
                            } catch (err) { console.error(err); }
                        };
                        el.appendChild(dot);
                    });
                } else if (isCluster) {
                    // --- NORMAL KUME ---
                    const count = cluster.properties.point_count;
                    const size = count < 20 ? 40 : count < 100 ? 50 : 60;
                    const bg = count < 20 ? 'rgba(59, 130, 246, 0.9)' : count < 100 ? 'rgba(139, 92, 246, 0.9)' : 'rgba(236, 72, 153, 0.9)';
                    
                    el.style.width = `${size}px`;
                    el.style.height = `${size}px`;
                    el.style.borderRadius = '50%';
                    el.style.background = bg;
                    el.style.border = '2px solid rgba(255,255,255,0.7)';
                    el.style.color = '#fff';
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    el.style.justifyContent = 'center';
                    el.style.fontWeight = 'bold';
                    el.style.fontSize = '14px';
                    el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
                    el.innerText = cluster.properties.point_count_abbreviated;

                    el.onclick = (e) => {
                        e.stopPropagation();
                        try {
                            const currentZoom = this.map.getZoom();
                            const expansionZoom = this.supercluster.getClusterExpansionZoom(clusterId);
                            
                            if (currentZoom >= CLUSTER_MAX_ZOOM || expansionZoom > CLUSTER_MAX_ZOOM || expansionZoom === currentZoom) {
                                const leaves = this.supercluster.getLeaves(clusterId, 9999);
                                
                                if (leaves.length <= 40) {
                                    this.spiderifiedClusterId = clusterId;
                                    this.updateMarkersSafe();
                                } else {
                                    const pois = leaves.map(leaf => ({
                                        layerName: leaf.properties!.layerName,
                                        color: leaf.properties!.color,
                                        record: JSON.parse(leaf.properties!.recordRaw)
                                    }));
                                    UIManager.showMultiInfo(pois);
                                }
                            } else {
                                this.map.flyTo({
                                    center: cluster.geometry.coordinates as [number, number],
                                    zoom: expansionZoom
                                });
                            }
                        } catch (err) { console.error(err); }
                    };
                } else {
                    // --- TEKIL NOKTA ---
                    const color = cluster.properties.color || '#00aaff';
                    
                    el.style.width = '24px';
                    el.style.height = '24px';
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    el.style.justifyContent = 'center';
                    
                    const dot = document.createElement('div');
                    dot.id = id;
                    dot.style.cssText = `
                        width: 16px; height: 16px;
                        border-radius: 50%;
                        background: ${color};
                        border: 2px solid #ffffff;
                        box-shadow: 0 0 8px rgba(0,0,0,0.4);
                        position: relative;
                        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    `;
                    
                    if (this.activePointId === id) {
                        dot.classList.add('active-pulse');
                    }
                    
                    el.appendChild(dot);
                    
                    el.onmouseenter = () => dot.style.transform = 'scale(1.4)';
                    el.onmouseleave = () => dot.style.transform = 'scale(1)';

                    el.onclick = (e) => {
                        e.stopPropagation();
                        
                        this.activePointId = id;
                        document.querySelectorAll('.active-pulse').forEach(n => n.classList.remove('active-pulse'));
                        dot.classList.add('active-pulse');

                        try {
                            const rec = JSON.parse(cluster.properties.recordRaw);
                            UIManager.showMultiInfo([{
                                layerName: cluster.properties.layerName,
                                color: cluster.properties.color,
                                record: rec
                            }]);
                            this.map.flyTo({
                                center: cluster.geometry.coordinates as [number, number],
                                zoom: 18,
                                pitch: 60
                            });
                        } catch (err) { console.error(err); }
                    };
                }

                try {
                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat(cluster.geometry.coordinates as [number, number])
                        .addTo(this.map);
                    this.markers.set(id, marker);
                } catch (err) { console.error(err); }
            }
        });

        for (const [id, marker] of this.markers.entries()) {
            if (!newMarkerIds.has(id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }
    }
}
