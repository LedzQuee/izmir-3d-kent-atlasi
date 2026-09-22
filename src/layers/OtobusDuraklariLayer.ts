import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import { convertVectorToGps, convertGpsToVector } from '../utils/coordinates';
import { ApiService } from '../api/ApiService';
import { UIManager } from '../ui/UIManager';
import { disposeGroup } from '../utils/dispose';

let currentBusStopsGroup: THREE.Group | null = null;
let currentBusMarkers: maplibregl.Marker[] = [];

export async function fetchNearestStops(scene: THREE.Scene, hitX: number, hitZ: number) {
  clearNearestStops(scene);

  const [lat, lng] = convertVectorToGps(hitX, hitZ);

  try {
    const url = `https://openapi.izmir.bel.tr/api/ibb/cbs/noktayayakinduraklar?x=${lng}&y=${lat}&inCoordSys=EPSG:4326&outCoordSys=EPSG:4326`;
    let records = await ApiService.getFull(url);
    if (!records) return;
    
    currentBusStopsGroup = new THREE.Group();
    
    // Tıklanan yere HTML hedef pini koy
    // @ts-ignore
    const map = window.engineInstance?.map;
    if (!map) return;

    const pinEl = document.createElement('div');
    pinEl.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `;
    pinEl.style.cssText = `
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));
    `;
    const pinMarker = new maplibregl.Marker({ element: pinEl, offset: [0, -16] })
        .setLngLat([lng, lat])
        .addTo(map);
    currentBusMarkers.push(pinMarker);

    if (Array.isArray(records) && records.length > 0) {
      records.sort((a, b) => parseFloat(a.mesafe) - parseFloat(b.mesafe));
      
      let stopsToRender = [];
      const closestDistance = Math.round(parseFloat(records[0].mesafe));

      if (closestDistance > 2000) {
        UIManager.showToast(`2 KM yakınınızda durak bulunmamaktadır! En yakın: ${closestDistance}m`, true);
        stopsToRender = [records[0]];
      } else {
        stopsToRender = records.filter(durak => parseFloat(durak.mesafe) <= 2000);
      }

      const color = '#00ffaa'; // ESHOT rengi

      stopsToRender.forEach(durak => {
        const durakLat = parseFloat(durak.enlem);
        const durakLng = parseFloat(durak.boylam);
        
        if (!isNaN(durakLat) && !isNaN(durakLng)) {
          // HTML Marker olustur (Diger noktalarla ayni gorsellik)
          const el = document.createElement('div');
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          
          const dot = document.createElement('div');
          const id = `bus-${durak.durakId}`;
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
          el.appendChild(dot);
          
          el.onmouseenter = () => dot.style.transform = 'scale(1.4)';
          el.onmouseleave = () => dot.style.transform = 'scale(1)';

          el.onclick = (e) => {
              e.stopPropagation();
              
              document.querySelectorAll('.active-pulse').forEach(n => n.classList.remove('active-pulse'));
              dot.classList.add('active-pulse');

              UIManager.showMultiInfo([{
                  layerName: 'Yakın Otobüs Durağı',
                  color: color,
                  record: { ADI: durak.adi, 'DURAK NO': durak.durakId, MESAFE: Math.round(durak.mesafe) + "m" }
              }]);
          };

          const marker = new maplibregl.Marker({ element: el })
              .setLngLat([durakLng, durakLat])
              .addTo(map);
              
          currentBusMarkers.push(marker);
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export function clearNearestStops(scene: THREE.Scene) {
  if (currentBusStopsGroup) {
    disposeGroup(currentBusStopsGroup);
    scene.remove(currentBusStopsGroup);
    currentBusStopsGroup = null;
  }
  currentBusMarkers.forEach(m => m.remove());
  currentBusMarkers = [];
}
