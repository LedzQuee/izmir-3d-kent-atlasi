import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadYetistirmeYurtlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/yetistirmeyurtlari');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 }); // Yesil

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { record, layerName: 'YetistirmeYurtlari' };
        scene.add(sphere);
      }
    });
    console.log("Yetistirme Yurtlari: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Yetistirme Yurtlari cekilemedi:", error);
  }
}



