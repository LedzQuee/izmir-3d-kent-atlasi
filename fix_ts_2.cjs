const fs = require('fs');

// Fix legend.ts
let leg = fs.readFileSync('src/utils/legend.ts', 'utf8');
if (!leg.includes('id?: string')) {
    leg = leg.replace(/export interface LegendItem\s*{/, 'export interface LegendItem { id?: string;');
    fs.writeFileSync('src/utils/legend.ts', leg);
}

// Fix Engine.ts
let eng = fs.readFileSync('src/core/Engine.ts', 'utf8');
eng = eng.replace(/center:\s*\[KONAK_CENTER\.lng,\s*KONAK_CENTER\.lat\]/, 'center: [KONAK_CENTER.lng, KONAK_CENTER.lat] as [number, number]');
eng = eng.replace(/const modelOrigin\s*=\s*\[KONAK_CENTER\.lng,\s*KONAK_CENTER\.lat\];/, 'const modelOrigin: [number, number] = [KONAK_CENTER.lng, KONAK_CENTER.lat];');
fs.writeFileSync('src/core/Engine.ts', eng);

// Fix main.ts
let main = fs.readFileSync('src/main.ts', 'utf8');
main = main.replace(/name:\s*'Yakın/, "label: 'Yakın");
main = main.replace(/window\.engineInstance\s*=\s*engine;/g, "(window as any).engineInstance = engine;");
main = main.replace(/engine\.start\(\);/g, "engine.start(); // @ts-ignore");
fs.writeFileSync('src/main.ts', main);

