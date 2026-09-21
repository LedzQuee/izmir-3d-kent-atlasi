import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadAileDayanismaMerkezleri(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/ailedayanismamerkezleri');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Mor

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xaa00ff, 'AileDayanisma', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Aile Dayanisma Merkezleri: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Aile Dayanisma cekilemedi:", error);
  }
}



