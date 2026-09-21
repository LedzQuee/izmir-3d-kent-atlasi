import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { Engine } from '../core/Engine';
import { UIManager } from '../ui/UIManager';

export class HTMLMarkerManager {
    private map: maplibregl.Map;
    private supercluster: Supercluster;
    private markers: Map<string, maplibregl.Marker> = new Map();
    private currentFeatures: any[] = [];
    private spiderifiedClusterId: number | null = null;

    constructor(engine: Engine) {
        this.map = engine.map!;
        
        // Supercluster yapilandirmasi: maxZoom 20'ye cikarildi (daha cok dogal dagilmasi icin)
        this.supercluster = new Supercluster({
            radius: 40,
            maxZoom: 20
        });
        
        this.supercluster.load([]);

        this.map.on('move', () => this.updateMarkers());
        this.map.on('moveend', () => this.updateMarkers());
        
        // Bosa tiklaninca orumcek agini (spiderify) kapat
        this.map.on('click', () => {
            if (this.spiderifiedClusterId !== null) {
                this.spiderifiedClusterId = null;
                this.updateMarkers();
            }
        });
    }

    public updateData(features: any[]) {
        this.currentFeatures = features;
        this.supercluster.load(features);
        this.spiderifiedClusterId = null;
        this.updateMarkers();
    }

    private updateMarkers() {
        if (!this.map) return;

        const bounds = this.map.getBounds();
        const zoom = Math.floor(this.map.getZoom());
        
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
            
            // Spiderify olmus kume mi?
            const isSpiderified = isCluster && this.spiderifiedClusterId === clusterId;
            const id = isCluster ? `cluster-${cluster.id}${isSpiderified ? '-spider' : ''}` : `point-${cluster.properties.recordRaw}`;
            newMarkerIds.add(id);

            if (!this.markers.has(id)) {
                const el = document.createElement('div');
                el.style.cursor = 'pointer';

                if (isSpiderified) {
                    // --- CSS SPIDERIFY (ORUMCEK AGI) GORUNUMU ---
                    const leaves = this.supercluster.getLeaves(clusterId, Infinity);
                    const total = leaves.length;
                    
                    el.style.position = 'relative';
                    el.style.width = '0px';
                    el.style.height = '0px';
                    
                    // Merkez nokta
                    const centerDot = document.createElement('div');
                    centerDot.style.cssText = 'position:absolute; top:-6px; left:-6px; width:12px; height:12px; border-radius:50%; background:#fff; box-shadow:0 0 5px rgba(0,0,0,0.5); z-index:2;';
                    el.appendChild(centerDot);

                    leaves.forEach((leaf, i) => {
                        const angle = (i / total) * Math.PI * 2;
                        // Kalabalikliga gore cap
                        const distance = total <= 10 ? 45 : (total <= 20 ? 65 : 85); 
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        // Baglanti cizgisi
                        const line = document.createElement('div');
                        line.style.cssText = `position:absolute; top:0; left:0; width:${distance}px; height:2px; background:rgba(255,255,255,0.6); transform-origin:0 50%; transform:rotate(${angle}rad); z-index:1;`;
                        el.appendChild(line);

                        // Yaprak (Nokta)
                        const dot = document.createElement('div');
                        const color = leaf.properties!.color || '#00aaff';
                        dot.style.cssText = `position:absolute; top:0; left:0; transform:translate(calc(-50% + ${x}px), calc(-50% + ${y}px)); width:24px; height:24px; border-radius:50%; background:${color}; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.4); z-index:3; transition:transform 0.2s;`;
                        
                        dot.onmouseenter = () => { dot.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.3)`; };
                        dot.onmouseleave = () => { dot.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`; };
                        
                        dot.onclick = (e) => {
                            e.stopPropagation();
                            const rec = JSON.parse(leaf.properties!.recordRaw);
                            UIManager.showMultiInfo([{
                                layerName: leaf.properties!.layerName,
                                color: leaf.properties!.color,
                                record: rec
                            }]);
                        };
                        el.appendChild(dot);
                    });
                } else if (isCluster) {
                    // --- NORMAL KUME GORUNUMU ---
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
                        e.stopPropagation(); // Haritaya tiklamayi engelle
                        const currentZoom = this.map.getZoom();
                        const expansionZoom = this.supercluster.getClusterExpansionZoom(clusterId);
                        
                        // Eger artik yaklasamiyorsak (veya cok kalabaliksa)
                        if (currentZoom >= this.supercluster.options.maxZoom! || expansionZoom > this.supercluster.options.maxZoom! || expansionZoom === currentZoom) {
                            const leaves = this.supercluster.getLeaves(clusterId, Infinity);
                            
                            if (leaves.length <= 40) {
                                // 40'tan azsa CSS ile etrafa sac (Spiderify)
                                this.spiderifiedClusterId = clusterId;
                                this.updateMarkers();
                            } else {
                                // 40'tan coksa cok kalabalik olur, liste halinde goster
                                const pois = leaves.map(leaf => ({
                                    layerName: leaf.properties!.layerName,
                                    color: leaf.properties!.color,
                                    record: JSON.parse(leaf.properties!.recordRaw)
                                }));
                                UIManager.showMultiInfo(pois);
                            }
                        } else {
                            // Hala yaklasabiliyorsak yaklas
                            this.map.flyTo({
                                center: cluster.geometry.coordinates as [number, number],
                                zoom: expansionZoom
                            });
                        }
                    };
                } else {
                    // --- TEKIL NOKTA ---
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.borderRadius = '50%';
                    el.style.background = cluster.properties.color || '#00aaff';
                    el.style.border = '2px solid #ffffff';
                    el.style.boxShadow = '0 0 8px rgba(0,0,0,0.4)';

                    el.onclick = (e) => {
                        e.stopPropagation();
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
                    };
                }

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat(cluster.geometry.coordinates as [number, number])
                    .addTo(this.map);
                
                this.markers.set(id, marker);
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
