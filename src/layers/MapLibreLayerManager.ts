import { ApiService } from '../api/ApiService';
import * as maplibregl from 'maplibre-gl';
import { Engine } from '../core/Engine';
import { HTMLMarkerManager } from './HTMLMarkerManager';

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
    static markerManager: HTMLMarkerManager | null = null;

    static async init(engine: Engine) {
        this.engine = engine;
        this.map = engine.map;
        if (!this.map) return;
        
        this.markerManager = new HTMLMarkerManager(engine);

        // Butun endpoint'lerden veri cek
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
        
        // Sadece aktif olan layerId'lere ait verileri filtrele
        const filteredFeatures = this.allFeatures.filter(f => this.activeLayerIds.has(f.properties.layerId));
        
        if (this.markerManager) {
            this.markerManager.updateData(filteredFeatures);
        }
        
        // DistrictManager'a bildir
        window.dispatchEvent(new CustomEvent('poiDataUpdated', {
            detail: { features: filteredFeatures }
        }));
    }
}
