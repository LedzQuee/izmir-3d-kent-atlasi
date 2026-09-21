import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';
export async function loadHuzurevleri(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/huzurevleri');
    if (!data) return;
    const records = data.onemliyer ?? [];
    
    
    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xff3333, 'Huzurevleri', record);
        if (marker) scene.add(marker);
      }
    });
  } catch (e) {}
}



