import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadAfetToplanmaAlanlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/afetaciltoplanmaalani');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    let validCount = 0;
    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.userData = { record, layerName: 'Afet Toplanma Alanı' };
        scene.add(mesh);
        validCount++;
      }
    });

    console.log(`Afet Toplanma Alanı: ${validCount} nokta yüklendi.`);
  } catch (error) {
    console.error("Afet Toplanma Alanı yüklenemedi", error);
  }
}


