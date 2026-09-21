const fs = require('fs');

// Fix Engine.ts
let engineCode = fs.readFileSync('src/core/Engine.ts', 'utf8');
engineCode = engineCode.replace("import maplibregl from 'maplibre-gl';", "import * as maplibregl from 'maplibre-gl';\nimport { UIManager } from '../ui/UIManager';\nimport { fetchNearestStops } from '../layers/OtobusDuraklariLayer';\nimport { convertGpsToVector } from '../utils/coordinates';");

// Replace map.on('click')
engineCode = engineCode.replace(/this\.map\.on\('click', \(e\) => \{[\s\S]*?if \(UIManager && UIManager\.busStopMode\)/m, 
    "this.map.on('click', (e: any) => {\n            if (UIManager && UIManager.busStopMode)");

// Replace require calls inside setupInteractions
engineCode = engineCode.replace("const { UIManager } = require('../ui/UIManager');", "");

// Type fixes for map.onAdd and setupInteractions
engineCode = engineCode.replace("onAdd: function (map, gl)", "onAdd: function (map: any, gl: WebGLRenderingContext)");
engineCode = engineCode.replace("render: function (gl, matrix)", "render: function (gl: WebGLRenderingContext, matrix: number[])");
engineCode = engineCode.replace("map.triggerRepaint();", "this.map.triggerRepaint();");
engineCode = engineCode.replace(/canvas\.addEventListener\('pointer/g, "canvas.addEventListener('pointer");
engineCode = engineCode.replace(/\(e\) => {/g, "(e: any) => {");

// Add start method
engineCode = engineCode.replace("private addThreeJSLayer()", "public start() {}\n\n    private addThreeJSLayer()");

fs.writeFileSync('src/core/Engine.ts', engineCode);

// Fix main.ts Legend types and remove invalid chars
let mainCode = fs.readFileSync('src/main.ts', 'utf8');
mainCode = mainCode.replace(/[^\x20-\x7E\n\r\t]/g, '');
mainCode = mainCode.replace(/name: 'Yakın/, "label: 'Yakın");
mainCode = mainCode.replace(/const engine = new Engine\(canvas\);/g, "const engine = new Engine(canvas);\n  (window as any).engineInstance = engine;");
fs.writeFileSync('src/main.ts', mainCode);

