import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadTerminaller(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/otobusterminalleri');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Sari

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xffff00, 'Terminaller', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Terminaller: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Terminaller cekilemedi:", error);
  }
}



