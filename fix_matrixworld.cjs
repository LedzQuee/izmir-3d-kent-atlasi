const fs = require('fs');
let code = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Matrisi sahneye basinca dunya matrisini guncellemeye zorla
code = code.replace(
    'engine.scene.matrix = l; // Model transformunu direkt sahneye uygula',
    'engine.scene.matrix = l; // Model transformunu direkt sahneye uygula\n                engine.scene.updateMatrixWorld(true);'
);

fs.writeFileSync('src/core/Engine.ts', code);
