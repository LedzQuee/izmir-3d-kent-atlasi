import * as THREE from 'three';
import { convertVectorToGps, convertGpsToVector } from '../utils/coordinates';
import { ApiService } from '../api/ApiService';
import { UIManager } from '../ui/UIManager';
import { disposeGroup } from '../utils/dispose';

let currentBusStopsGroup: THREE.Group | null = null;

export async function fetchNearestStops(scene: THREE.Scene, hitX: number, hitZ: number) {
  if (currentBusStopsGroup) {
    // 1. MEMORY LEAK COZUMU: Silerken objelerin bellekteki izlerini de (dispose) yokediyoruz
    disposeGroup(currentBusStopsGroup);
    scene.remove(currentBusStopsGroup);
    currentBusStopsGroup = null;
  }

  const [lat, lng] = convertVectorToGps(hitX, hitZ);

  try {
    const url = `https://openapi.izmir.bel.tr/api/ibb/cbs/noktayayakinduraklar?x=${lng}&y=${lat}&inCoordSys=EPSG:4326&outCoordSys=EPSG:4326`;
    // 2. API SERVICE KULLANIMI VE HATA YONETIMI
    let records = await ApiService.getFull(url);
    if (!records) return;
    
    currentBusStopsGroup = new THREE.Group();
    
    const geometry = new THREE.SphereGeometry(35, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x004422 });

    // 5. RAKIM YONETIMI ICIN PINI TEPELERE GORE YERLESTIRME
    const [, yCenter, ] = convertGpsToVector(lat, lng);

    const pinGeo = new THREE.ConeGeometry(15, 80, 8);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(hitX, yCenter + 25, hitZ);
    pin.rotation.x = Math.PI; 
    pin.name = 'TargetPin'; 
    currentBusStopsGroup.add(pin);

    if (Array.isArray(records) && records.length > 0) {
      records.sort((a, b) => parseFloat(a.mesafe) - parseFloat(b.mesafe));
      
      let stopsToRender = [];
      const closestDistance = Math.round(parseFloat(records[0].mesafe));

      if (closestDistance > 2000) {
        // 4. MERKEZI UI MANAGER ILE TOAST BILDIRIMI
        UIManager.showToast(`2 KM yakınınızda durak bulunmamaktadır! En yakın: ${closestDistance}m`, true);
        stopsToRender = [records[0]];
      } else {
        stopsToRender = records.filter(durak => parseFloat(durak.mesafe) <= 2000);
      }

      stopsToRender.forEach(durak => {
        const durakLat = parseFloat(durak.enlem);
        const durakLng = parseFloat(durak.boylam);
        
        if (!isNaN(durakLat) && !isNaN(durakLng)) {
          // 5. RAKIM YONETIMI: 'sy' degiskeni artik gercek rakim donduruyor
          const [sx, sy, sz] = convertGpsToVector(durakLat, durakLng);
          
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(sx, sy, sz);
          sphere.userData = {
            record: { ADI: durak.adi, ILCE: "Mesafe: " + Math.round(durak.mesafe) + "m" },
            layerName: 'Yakın Otobüs Durağı'
          };
          currentBusStopsGroup!.add(sphere);
        }
      });
    }
    scene.add(currentBusStopsGroup);
  } catch (error) {
    console.error(error);
  }
}
