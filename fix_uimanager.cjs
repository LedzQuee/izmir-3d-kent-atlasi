const fs = require('fs');
let code = fs.readFileSync('src/core/Engine.ts', 'utf8');

code = code.replace(
    'constructor(canvas: HTMLCanvasElement) {',
    'constructor(canvas: HTMLCanvasElement) {\n        UIManager.init();'
);

fs.writeFileSync('src/core/Engine.ts', code);
