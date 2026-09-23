import 'maplibre-gl/dist/maplibre-gl.css';
import { UIManager } from './ui/UIManager';
import { clearNearestStops } from './layers/OtobusDuraklariLayer';

(window as any).UIManager = UIManager;

window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; left:10px; background:red; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'HATA OLUSTU: <br>' + event.message + '<br>Dosya: ' + event.filename + '<br>Satir: ' + event.lineno;
    document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; right:10px; background:darkred; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'PROMISE HATASI: <br>' + (event.reason ? event.reason.toString() : 'Bilinmiyor');
    document.body.appendChild(errorDiv);
});

import * as THREE from 'three';
import './style.css';
import { Engine } from './core/Engine';
import { createLegend } from './utils/legend';

import { MapLibreLayerManager, POI_LAYERS } from './layers/MapLibreLayerManager';

const engine = new Engine();
(window as any).engineInstance = engine;

// Efsaneyi (Legend) dinamik olustur
const legendItems = [
    { label: 'Yakın Otobüs Durakları (Haritaya Tıklayın)', color: '#00ffaa', initialState: false, onToggle: (v: boolean) => {
        UIManager.busStopMode = v;
        if(!v && window.engineInstance) { 
            clearNearestStops(window.engineInstance.scene); 
        }
    }}
];

POI_LAYERS.forEach(config => {
    legendItems.push({
        id: config.id,
        color: config.color,
        label: config.name,
        initialState: false, // Hiz icin kapali gelir
        onToggle: (v: boolean) => {
            MapLibreLayerManager.toggleLayer(config.id, v);
        }
    });
});

createLegend(legendItems as any);

// Engine hazir olunca (style.load tamamlaninca) veri yukle
window.addEventListener('mapReady', (e: any) => {
    MapLibreLayerManager.init(e.detail.engine);
}, { once: true });
