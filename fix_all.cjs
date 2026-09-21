const fs = require('fs');

// 1. Fix legend.ts UTF-8 corruption
let legend = fs.readFileSync('src/utils/legend.ts', 'utf8');
legend = legend.replace(/Harita Katmanlar[^<]*/, 'Harita Katmanları');
legend = legend.replace(/[^>]*simsiz Katman/, 'İsimsiz Katman');
legend = legend.replace(/Hepsini Gizle/, 'Hepsini Gizle'); // just in case
fs.writeFileSync('src/utils/legend.ts', legend, 'utf8');

// 2. Fix main.ts UTF-8 corruption
let main = fs.readFileSync('src/main.ts', 'utf8');
main = main.replace(/Havaalanlar\s*\(\d+\)/, 'Havaalanları (5)');
main = main.replace(/Kaplcalar\s*\(\d+\)/, 'Kaplıcalar (3)');
main = main.replace(/Yetitirme Yurtlar\s*\(\d+\)/, 'Yetiştirme Yurtları (5)');
main = main.replace(/ocuk\/Genlik Merkezleri\s*\(\d+\)/, 'Çocuk/Gençlik Merkezleri (15)');
main = main.replace(/Aile Dayanma Merkezleri\s*\(\d+\)/, 'Aile Dayanışma Merkezleri (2)');
main = main.replace(/zBB Hizmet Noktalar\s*\(\d+\)/, 'İzBB Hizmet Noktaları (269)');
main = main.replace(/Taksi Duraklar\s*\(\d+\)/, 'Taksi Durakları (406)');
main = main.replace(/Afet Toplanma Alanlar\s*\(\d+\)/, 'Afet Toplanma Alanları (2380)');
main = main.replace(/Yakn Otobs Duraklar\s*\(Haritaya Tklayn\)/, 'Yakın Otobüs Durakları (Haritaya Tıklayın)');
fs.writeFileSync('src/main.ts', main, 'utf8');

// 3. Fix Missing Points (Frustum Culling + Matrix fix)
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Change how camera matrix is applied. Instead of modifying projectionMatrix with l, modify scene.matrix!
const newRenderLogic = `
                engine.scene.traverse((obj: any) => { obj.frustumCulled = false; }); // Frustum culling kapat (Garantili gorunurluk)
                
                engine.scene.matrixAutoUpdate = false;
                engine.scene.matrix = l; // Model transformunu direkt sahneye uygula
                
                engine.camera.position.set(0,0,0);
                engine.camera.quaternion.set(0,0,0,1);
                engine.camera.updateMatrixWorld(true);
                
                engine.camera.projectionMatrix = m; // Saf MapLibre kamerasi
                
                engine.renderer.render(engine.scene, engine.camera);
                engine.map!.triggerRepaint();
`;

// Replace the old render logic
engine = engine.replace(/engine\.camera\.projectionMatrix = m\.multiply\(l\);[\s\S]*?engine\.map!\.triggerRepaint\(\);/m, newRenderLogic);

// Remove the camera.position.y = oldY logic that I added earlier, since it's now handled correctly
engine = engine.replace(/const oldY = engine\.camera\.position\.y;[\s\S]*?engine\.camera\.position\.y = oldY;/m, 
    "engine.camera.position.set(0,0,0);\n                engine.camera.quaternion.set(0,0,0,1);\n                engine.camera.updateMatrixWorld(true);\n                engine.camera.projectionMatrix = m;\n                engine.renderer.render(engine.scene, engine.camera);");

fs.writeFileSync('src/core/Engine.ts', engine, 'utf8');

// 4. Improve Right Sidebar Aesthetics
let dm = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Disable LOD temporarily to guarantee everything is visible
dm = dm.replace('const shouldShowPoints = altitude < SHOW_POINTS_THRESHOLD;', 'const shouldShowPoints = true; // LOD disabled temporarily');

// Enhance Sidebar UI
const oldToggleStyle = `
        toggleBtn.style.cssText = \`
            position: absolute;
            left: -32px;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 48px;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-right: none;
            border-radius: 8px 0 0 8px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            box-shadow: -4px 0 15px rgba(0,0,0,0.3);
        \`;
`;

const newToggleStyle = `
        toggleBtn.style.cssText = \`
            position: absolute;
            left: -40px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 60px;
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-right: none;
            border-radius: 12px 0 0 12px;
            color: #93c5fd;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: -4px 0 20px rgba(0,0,0,0.5);
            transition: all 0.2s ease;
        \`;
        toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
        
        toggleBtn.onmouseover = () => { toggleBtn.style.background = 'rgba(51, 65, 85, 0.95)'; toggleBtn.style.color = '#fff'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.background = 'rgba(30, 41, 59, 0.95)'; toggleBtn.style.color = '#93c5fd'; };
`;

dm = dm.replace(oldToggleStyle, newToggleStyle);

// Make the sidebar itself better
const oldSidebarStyle = `
        sidebar.style.cssText = \`
            position: fixed;
            right: -300px; /* Kapali durumu */
            top: 0;
            width: 300px;
            height: 100vh;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            color: #f8fafc;
            transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
        \`;
`;

const newSidebarStyle = `
        sidebar.style.cssText = \`
            position: fixed;
            right: -320px;
            top: 20px;
            width: 320px;
            height: calc(100vh - 40px);
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-right: none;
            border-radius: 20px 0 0 20px;
            color: #f8fafc;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: -15px 0 40px rgba(0, 0, 0, 0.6);
        \`;
`;

dm = dm.replace(oldSidebarStyle, newSidebarStyle);
dm = dm.replace("right: 0;", "right: 0;"); // To keep it compatible

fs.writeFileSync('src/core/DistrictManager.ts', dm, 'utf8');

