const fs = require('fs');

let code = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Fix canvas issue
code = code.replace(
    "canvas.style.display = 'none';",
    "if (canvas) canvas.style.display = 'none';\n        else {\n            const existingCanvas = document.querySelector('canvas');\n            if (existingCanvas) existingCanvas.style.display = 'none';\n        }"
);

fs.writeFileSync('src/core/Engine.ts', code);
