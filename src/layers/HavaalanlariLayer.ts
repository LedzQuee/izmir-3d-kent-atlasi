import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadHavaalanlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/havaalani');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
    

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);

      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0x00aaff, 'Havaalanlari', record);
        if (marker) scene.add(marker);
      }
    });

    console.log("Havaalanlari: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Havaalanlari cekilemedi:", error);
  }
}



