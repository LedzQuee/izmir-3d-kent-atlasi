import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadMeydanlar(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/meydanlar');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Beyaz

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xffffff, 'Meydanlar', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Meydanlar: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Meydanlar cekilemedi:", error);
  }
}



