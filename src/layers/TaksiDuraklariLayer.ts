import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';
export async function loadTaksiDuraklari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/taksiduraklari');
    if (!data) return;
    const records = data.onemliyer ?? [];
    
    // Performans icin segment sayisini 32'den 16'ya dusuruyoruz (Cunku 406 tane cizilecek)
    
     // Taksi Sarisi

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0xffcc00, 'TaksiDuraklari', record);
        if (marker) scene.add(marker);
      }
    });
    console.log("Taksi Duraklari: " + records.length + " kayit yuklendi.");
  } catch (e) {
    console.error("Taksiler yuklenemedi", e);
  }
}



