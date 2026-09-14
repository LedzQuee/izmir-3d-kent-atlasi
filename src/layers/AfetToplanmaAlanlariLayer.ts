import { ApiService } from '../api/ApiService';
﻿import * as THREE from 'three';
import { convertGpsToVector } from '../utils/coordinates';

export async function loadAfetToplanmaAlanlari(scene: THREE.Object3D) {
  try {
    const data = await ApiService.get('/afetaciltoplanmaalani');
    if (!data) return;
    const records = data.onemliyer ?? [];

    const geometry = new THREE.SphereGeometry(15, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, records.length);
    const dummy = new THREE.Object3D();
    const validRecords: any[] = [];

    let validCount = 0;
    records.forEach((record: any) => {
      const lat = parseFloat(record.ENLEM || record.enlem);
      const lng = parseFloat(record.BOYLAM || record.boylam);
      if (!isNaN(lat) && !isNaN(lng)) {
        const [x, y, z] = convertGpsToVector(lat, lng);
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(validCount, dummy.matrix);
        validRecords.push(record); // Her instance'in verisini sirasiyla sakliyoruz
        validCount++;
      }
    });

    instancedMesh.instanceCount = validCount;
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingSphere();
    // Veriyi InstancedMesh icine gomuyoruz
    instancedMesh.userData = { records: validRecords, layerName: 'Afet Toplanma Alanı' };
    scene.add(instancedMesh);
  } catch (error) {}
}


