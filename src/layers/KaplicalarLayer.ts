import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadKaplicalar(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/kaplicalar');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Turuncu

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xff6600, 'Kaplicalar', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Kaplicalar: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Kaplicalar cekilemedi:", error);
  }
}



