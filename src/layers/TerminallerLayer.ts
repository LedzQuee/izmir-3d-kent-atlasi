import { ApiService } from '../api/ApiService';
﻿import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadTerminaller(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/otobusterminalleri');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Sari

    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM);
      const lng = parseFloat(record.BOYLAM);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.userData = { record, layerName: 'Terminaller' };
        scene.add(sphere);
      }
    });
    console.log("Terminaller: " + records.length + " kayit yuklendi.");
  } catch (error) {
    console.error("Terminaller cekilemedi:", error);
  }
}



