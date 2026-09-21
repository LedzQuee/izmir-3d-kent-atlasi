import { ApiService } from '../api/ApiService';
import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadPlajlar(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/plajlar');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff }); // Turkuaz

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { record, layerName: 'Plajlar' };
        scene.add(sphere);
      }
    });
    console.log("Plajlar: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Plajlar cekilemedi:", error);
  }
}



