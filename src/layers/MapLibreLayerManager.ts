import { ApiService } from '../api/ApiService';
import * as maplibregl from 'maplibre-gl';
import { Engine } from '../core/Engine';

export interface LayerConfig {
    id: string;
    endpoint: string;
    name: string;
    color: string;
    dataKey?: string; 
}

export const POI_LAYERS: LayerConfig[] = [
    { id: 'havaalanlari', endpoint: '/havaalani', name: 'Havaalanları', color: '#00aaff' },
    { id: 'kaplicalar', endpoint: '/kaplicalar', name: 'Kaplıcalar', color: '#ff6600' },
    { id: 'yetistirme', endpoint: '/yetistirmeyurtlari', name: 'Yetiştirme Yurtları', color: '#00ff88' },
    { id: 'terminaller', endpoint: '/terminaller', name: 'Terminaller', color: '#ffff00' },
    { id: 'cocukGenclik', endpoint: '/cocukgenclikmerkezi', name: 'Çocuk/Gençlik Merkezleri', color: '#ff66cc' },
    { id: 'aileDayanisma', endpoint: '/ailedayanismamerkezi', name: 'Aile Dayanışma Merkezleri', color: '#aa00ff' },
    { id: 'meydanlar', endpoint: '/meydanlar', name: 'Meydanlar', color: '#ffffff' },
    { id: 'plajlar', endpoint: '/plajlar', name: 'Plajlar', color: '#00ffff' },
    { id: 'huzurevleri', endpoint: '/huzurevi', name: 'Huzurevleri', color: '#ff3333' },
    { id: 'toplum', endpoint: '/toplummerkezi', name: 'Toplum Merkezleri', color: '#cc8833' },
    { id: 'izbb', endpoint: '/izmirbuyuksehirbelediyesihizmetnoktalari', name: 'İzBB Hizmet Noktaları', color: '#0000aa' },
    { id: 'taksiler', endpoint: '/taksiduraklari', name: 'Taksi Durakları', color: '#ffcc00' },
    { id: 'afet', endpoint: '/afetaciltoplanmaalani', name: 'Afet Toplanma Alanları', color: '#00ff00' }
];

export class MapLibreLayerManager {
    static activeLayerIds = new Set<string>();
    static allFeatures: any[] = [];
    static map: maplibregl.Map | null = null;
    static engine: Engine | null = null;

    static async init(engine: Engine) {
        this.engine = engine;
        this.map = engine.map;
        if (!this.map) return;

        // Add layers IMMEDIATELY so they are registered before Three.js corrupts the render loop sequence
        if (!this.map.getSource('izmir-pois')) {
            this.addMapLibreLayers();
        }

        // Bütün layer'lari topla
        const featurePromises = POI_LAYERS.map(async (config) => {
            this.activeLayerIds.add(config.id);
            try {
                const res = await ApiService.get(config.endpoint);
                const records = res?.onemliyer ?? [];
                
                return records.map((r: any) => {
                    const lat = parseFloat(r.ENLEM || r.enlem);
                    const lng = parseFloat(r.BOYLAM || r.boylam);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lng, lat] },
                        properties: {
                            layerId: config.id,
                            layerName: config.name,
                            color: config.color,
                            recordName: r.ADI || r.Adi || r.adi || r.ACIKLAMA || 'Bilinmiyor',
                            // Store the raw record as a JSON string to retrieve it later when clicked
                            recordRaw: JSON.stringify(r)
                        }
                    };
                }).filter((f: any) => f !== null);
            } catch (err) {
                console.error(`Layer ${config.id} yuklenemedi:`, err);
                return [];
            }
        });

        const featureArrays = await Promise.all(featurePromises);
        this.allFeatures = featureArrays.flat();

        this.updateData();
    }

    static toggleLayer(layerId: string, visible: boolean) {
        if (visible) this.activeLayerIds.add(layerId);
        else this.activeLayerIds.delete(layerId);
        this.updateData();
    }

    static updateData() {
        if (!this.map) return;
        const source = this.map.getSource('izmir-pois') as maplibregl.GeoJSONSource;
        
        // Sadece aktif olan layerId'lere ait verileri filtrele
        const filteredFeatures = this.allFeatures.filter(f => this.activeLayerIds.has(f.properties.layerId));
        
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: filteredFeatures
            });
        }
        
        // CustomEvent at, böylece DistrictManager raw data güncellendiğini anlar
        window.dispatchEvent(new CustomEvent('poiDataUpdated', {
            detail: { features: filteredFeatures }
        }));
    }

    static addMapLibreLayers() {
        if (!this.map) return;

        this.map.addSource('izmir-pois', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 16, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster
        });

        // Kümeler (Clusters)
        this.map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'izmir-pois',
            filter: ['has', 'point_count'],
            paint: {
                // Point count yoğunluğuna göre renk
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    'rgba(59, 130, 246, 0.8)', // 1-20
                    20,
                    'rgba(139, 92, 246, 0.8)', // 20-100
                    100,
                    'rgba(236, 72, 153, 0.8)'  // 100+
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,  // boyut 20px
                    20,  
                    25,  // > 20 ise boyut 25px
                    100, 
                    30   // > 100 ise boyut 30px
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': 'rgba(255, 255, 255, 0.5)'
            }
        }, 'three-js-layer');

        // Küme içi Sayılar
        this.map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'izmir-pois',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 14
            },
            paint: {
                'text-color': '#ffffff'
            }
        }, 'three-js-layer');

        // Tekil Noktalar (Kümelenmemiş)
        this.map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'izmir-pois',
            filter: ['!', ['has', 'point_count']],
            paint: {
                // Rengini özelliklerden al
                'circle-color': ['get', 'color'],
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': 'rgba(255, 255, 255, 0.5)'
            }
        }, 'three-js-layer');
    }
}
