import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadCocukGenclikMerkezleri(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/cocukvegenclikmerkezleri');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Pembe

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xff66cc, 'CocukGenclik', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Cocuk/Genclik Merkezleri: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Cocuk/Genclik cekilemedi:", error);
  }
}



