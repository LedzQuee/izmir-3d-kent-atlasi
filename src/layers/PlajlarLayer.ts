import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadPlajlar(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/plajlar');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Turkuaz

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0x00ffff, 'Plajlar', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Plajlar: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Plajlar cekilemedi:", error);
  }
}



