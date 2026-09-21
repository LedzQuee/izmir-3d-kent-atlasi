import * as THREE from 'three';
import { convertGpsToVector } from './coordinates';

const coordRegistry = new Map<string, number>();

export function createElegantMarker(lat: number, lng: number, color: number | string, layerName: string, record: any): THREE.Group | null {
    if (isNaN(lat) || isNaN(lng)) return null;

    const [x, baseY, z] = convertGpsToVector(lat, lng);
    
    // Aynı koordinata sahip noktaları dikeyde üst üste dizmek için kontrol
    const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
    const stackIndex = coordRegistry.get(coordKey) || 0;
    coordRegistry.set(coordKey, stackIndex + 1);

    // Her çakışan nokta için yüksekliği 15 birim artır
    const yOffset = stackIndex * 15; 
    
    const group = new THREE.Group();
    group.position.set(x, baseY + yOffset, z);

    // 1. İnce ve zarif bir çubuk (Pole)
    if (stackIndex === 0) {
        const poleHeight = 40;
        const poleGeo = new THREE.CylinderGeometry(0.8, 0.8, poleHeight, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = poleHeight / 2;
        group.add(pole);
    } else {
        // Üst üste binenler için sadece aradaki bağlantı çubuğu
        const poleHeight = 15;
        const poleGeo = new THREE.CylinderGeometry(0.8, 0.8, poleHeight, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = poleHeight / 2;
        group.add(pole);
    }

    // 2. Tepe Noktası (Parlak küçük küre)
    const dotHeight = stackIndex === 0 ? 40 : 15;
    const sphereGeo = new THREE.SphereGeometry(6, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.2, 
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = dotHeight;
    group.add(sphere);

    // Tıklanabilirlik için veriyi grup ve alt objelere işle
    const userData = { record, layerName };
    group.userData = userData;
    group.children.forEach(c => c.userData = userData);

    return group;
}
