import { ApiService } from '../api/ApiService';
﻿import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadAileDayanismaMerkezleri(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/ailedayanismamerkezleri');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xaa00ff }); // Mor

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { record, layerName: 'AileDayanisma' };
        scene.add(sphere);
      }
    });
    console.log("Aile Dayanisma Merkezleri: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Aile Dayanisma cekilemedi:", error);
  }
}



