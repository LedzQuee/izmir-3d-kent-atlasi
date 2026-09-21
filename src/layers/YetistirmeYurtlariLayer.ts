import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadYetistirmeYurtlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/yetistirmeyurtlari');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
     // Yesil

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0x00ff88, 'YetistirmeYurtlari', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Yetistirme Yurtlari: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Yetistirme Yurtlari cekilemedi:", error);
  }
}



