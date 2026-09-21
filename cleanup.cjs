const fs = require('fs');
let content = fs.readFileSync('src/core/Engine.ts', 'utf8');

const startIdx = content.indexOf("window.addEventListener('pointerup'");
const endIdx = content.indexOf("// MapLibre Küme Tıklama");

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `
        window.addEventListener('pointerup', (e) => {
            if (!this.map || !UIManager.busStopMode) return;
            const coords = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            
            const ray = new THREE.Ray();
            const near = new THREE.Vector3(coords.x, coords.y, -1).unproject(this.camera);
            const far = new THREE.Vector3(coords.x, coords.y, 1).unproject(this.camera);
            ray.origin.copy(near);
            ray.direction.copy(far).sub(near).normalize();
            this.raycaster.set(ray.origin, ray.direction);

            const hits = this.raycaster.intersectObjects(this.getInteractableObjects(), true);
            if (hits.length > 0 && (hits[0].object as any).userData?.isDistrict) {
                window.dispatchEvent(new CustomEvent('flyToDistrict', {
                    detail: { lat: (hits[0].object as any).userData.lat, lng: (hits[0].object as any).userData.lng }
                }));
            }
        });
        
        `;
    
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync('src/core/Engine.ts', content);
    console.log("Successfully cleaned Engine.ts");
}
