import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { Engine } from '../core/Engine';
import { UIManager } from '../ui/UIManager';

export class HTMLMarkerManager {
    private map: maplibregl.Map;
    private supercluster: Supercluster;
    private markers: Map<string, maplibregl.Marker> = new Map();
    private currentFeatures: any[] = [];

    constructor(engine: Engine) {
        this.map = engine.map!;
        
        // Supercluster yapilandirmasi
        this.supercluster = new Supercluster({
            radius: 50,
            maxZoom: 16
        });
        
        // Veri gelmeden once harita hareket ederse hata vermemesi icin bos diziyle baslat
        this.supercluster.load([]);

        // Harita hareket ettikce markerlari guncelle
        this.map.on('move', () => this.updateMarkers());
        this.map.on('moveend', () => this.updateMarkers());
    }

    public updateData(features: any[]) {
        this.currentFeatures = features;
        this.supercluster.load(features);
        this.updateMarkers();
    }

    private updateMarkers() {
        if (!this.map) return;

        const bounds = this.map.getBounds();
        const zoom = Math.floor(this.map.getZoom());
        
        // Gorunen bolgedeki kumeleri ve noktalari al
        const clusters = this.supercluster.getClusters([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
        ], zoom);

        const newMarkerIds = new Set<string>();

        clusters.forEach(cluster => {
            const isCluster = cluster.properties?.cluster;
            const id = isCluster ? `cluster-${cluster.id}` : `point-${cluster.properties.recordRaw}`;
            newMarkerIds.add(id);

            if (!this.markers.has(id)) {
                // Yeni marker olustur
                const el = document.createElement('div');
                el.style.cursor = 'pointer';

                if (isCluster) {
                    const count = cluster.properties.point_count;
                    // Kume tasarimi (MapLibre stilindekine benzer)
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

                    el.onclick = () => {
                        const currentZoom = this.map.getZoom();
                        const expansionZoom = this.supercluster.getClusterExpansionZoom(cluster.id as number);
                        
                        // Eger maxZoom'a ulasmissak veya artik zoom genisleyemiyorsa, 
                        // kumenin icindeki tum noktalari cekip < 1 / 3 > seklinde goster
                        if (currentZoom >= this.supercluster.options.maxZoom! || expansionZoom > this.supercluster.options.maxZoom!) {
                            const leaves = this.supercluster.getLeaves(cluster.id as number, Infinity);
                            const pois = leaves.map(leaf => ({
                                layerName: leaf.properties!.layerName,
                                color: leaf.properties!.color,
                                record: JSON.parse(leaf.properties!.recordRaw)
                            }));
                            UIManager.showMultiInfo(pois);
                        } else {
                            // Degilse, yaklas
                            this.map.flyTo({
                                center: cluster.geometry.coordinates as [number, number],
                                zoom: expansionZoom
                            });
                        }
                    };
                } else {
                    // Tekil nokta tasarimi
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.borderRadius = '50%';
                    el.style.background = cluster.properties.color || '#00aaff';
                    el.style.border = '2px solid #ffffff';
                    el.style.boxShadow = '0 0 8px rgba(0,0,0,0.4)';

                    el.onclick = () => {
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

        // Ekranda olmayan markerlari temizle
        for (const [id, marker] of this.markers.entries()) {
            if (!newMarkerIds.has(id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }
    }
}
