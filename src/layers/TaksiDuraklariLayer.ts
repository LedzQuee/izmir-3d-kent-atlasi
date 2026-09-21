import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';
export async function loadTaksiDuraklari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/taksiduraklari');
    if (!data) return;
    const records = data.onemliyer ?? [];
    
    // Performans icin segment sayisini 32'den 16'ya dusuruyoruz (Cunku 406 tane cizilecek)
    const geometry = new THREE.SphereGeometry(15, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffcc00 }); // Taksi Sarisi

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { record, layerName: 'TaksiDuraklari' };
        scene.add(sphere);
      }
    });
    console.log("Taksi Duraklari: " + records.length + " kayit yuklendi.");
  } catch (e) {
    console.error("Taksiler yuklenemedi", e);
  }
}



