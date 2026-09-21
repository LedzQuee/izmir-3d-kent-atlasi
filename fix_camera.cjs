const fs = require('fs');
let code = fs.readFileSync('src/core/Engine.ts', 'utf8');

code = code.replace(
    'this.camera = new THREE.Camera();',
    'this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);'
);

fs.writeFileSync('src/core/Engine.ts', code);
