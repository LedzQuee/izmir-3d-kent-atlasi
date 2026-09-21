import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { createElegantMarker } from '../utils/MarkerFactory';

export async function loadAfetToplanmaAlanlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/afetaciltoplanmaalani');
    if (!data) return;
    const records = data.onemliyer ?? [];

    
    

    let validCount = 0;
    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = createElegantMarker(lat, lng, 0x00ff00, 'Afet Toplanma Alanı', record);
        if (marker) scene.add(marker);
        validCount++;
      }
    });

    console.log(`Afet Toplanma Alanı: ${validCount} nokta yüklendi.`);
  } catch (error) {
    console.error("Afet Toplanma Alanı yüklenemedi", error);
  }
}


