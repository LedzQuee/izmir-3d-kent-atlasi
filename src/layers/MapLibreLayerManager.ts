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
    { id: 'aileDayanisma', endpoint: '/ailedayanismamerkezleri', name: 'Aile Dayanışma Merkezleri', color: '#aa00ff' },
    { id: 'meydanlar', endpoint: '/meydanlar', name: 'Meydanlar', color: '#ffffff' },
    { id: 'plajlar', endpoint: '/plajlar', name: 'Plajlar', color: '#00ffff' },
    { id: 'huzurevleri', endpoint: '/huzurevleri', name: 'Huzurevleri', color: '#ff3333' },
    { id: 'toplum', endpoint: '/toplummerkezleri', name: 'Toplum Merkezleri', color: '#cc8833' },
    { id: 'izbb', endpoint: '/izbbhizmetnoktalari', name: 'İzBB Hizmet Noktaları', color: '#0000aa' },
    { id: 'taksiler', endpoint: '/taksiduraklari', name: 'Taksi Durakları', color: '#ffcc00' },
    { id: 'afet', endpoint: '/afetaciltoplanmaalani', name: 'Afet Toplanma Alanları', color: '#00ff00' }
];

export class MapLibreLayerManager {
    static activeLayerIds: Set<string> = new Set();
    static allFeatures: any[] = [];
    static map: maplibregl.Map | null = null;
    static engine: Engine | null = null;
    static markerManager: HTMLMarkerManager | null = null;

    static async init(engine: Engine) {
        this.engine = engine;
        this.map = engine.map;
        
        this.markerManager = new HTMLMarkerManager(engine);
        // Baslangicta hicbir katman otomatik cekilmiyor (Lazy load edilecek)
    }

    static async loadLayerData(config: LayerConfig) {
        if (this.allFeatures.some(f => f.properties.layerId === config.id)) return; // Onceden yuklendi

        try {
            const res = await ApiService.get(config.endpoint);
            // onemliyer yoksa dizinin kendisi olabilecegini de hesaba katalim (ornek: afet toplanma vs.)
            const records = Array.isArray(res) ? res : (res?.onemliyer ?? []);
            
            const newFeatures = records.map((r: any) => {
                const lat = parseFloat(r.ENLEM || r.enlem);
                const lng = parseFloat(r.BOYLAM || r.boylam);
                if (isNaN(lat) || isNaN(lng)) return null;

                const baseName = r.ADI || r.Adi || r.adi || r.ACIKLAMA || 'Bilinmiyor';
                const ilce = r.ILCE || r.Ilce || r.ilce;
                const finalName = ilce ? `${baseName} (${ilce})` : baseName;

                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: {
                        layerId: config.id,
                        layerName: config.name,
                        color: config.color,
                        recordName: finalName,
                        recordRaw: JSON.stringify(r)
                    }
                };
            }).filter((f: any) => f !== null);

            this.allFeatures = [...this.allFeatures, ...newFeatures];
            (window as any).allMapLibreFeatures = this.allFeatures;
        } catch (err) {
            console.error(`Layer ${config.id} yuklenemedi:`, err);
        }
    }

    static async toggleLayer(layerId: string, visible: boolean) {
        if (visible) {
            this.activeLayerIds.add(layerId);
            const config = POI_LAYERS.find(c => c.id === layerId);
            if (config) {
                await this.loadLayerData(config);
            }
        } else {
            this.activeLayerIds.delete(layerId);
        }
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
