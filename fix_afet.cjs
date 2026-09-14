const fs = require('fs');
let afet = fs.readFileSync('src/layers/AfetToplanmaAlanlariLayer.ts', 'utf8');

// Gorunmezlik (GPU Update) hatasini duzeltiyoruz!
if (!afet.includes('needsUpdate = true')) {
    afet = afet.replace("instancedMesh.instanceCount = validCount;", "instancedMesh.instanceCount = validCount;\n    instancedMesh.instanceMatrix.needsUpdate = true;\n    instancedMesh.computeBoundingSphere();");
    fs.writeFileSync('src/layers/AfetToplanmaAlanlariLayer.ts', afet);
}
