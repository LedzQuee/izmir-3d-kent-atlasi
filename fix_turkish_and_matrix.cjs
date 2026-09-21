const fs = require('fs');

let mainCode = fs.readFileSync('src/main.ts', 'utf8');

// Fix Turkish characters in createLegend
mainCode = mainCode.replace(/label: 'Havaalanlar \(5\)'/, "label: 'Havaalanları (5)'");
mainCode = mainCode.replace(/label: 'Kaplcalar \(3\)'/, "label: 'Kaplıcalar (3)'");
mainCode = mainCode.replace(/label: 'Yetitirme Yurtlar \(5\)'/, "label: 'Yetiştirme Yurtları (5)'");
mainCode = mainCode.replace(/label: 'ocuk\/Genlik Merkezleri \(15\)'/, "label: 'Çocuk/Gençlik Merkezleri (15)'");
mainCode = mainCode.replace(/label: 'Aile Dayanma Merkezleri \(2\)'/, "label: 'Aile Dayanışma Merkezleri (2)'");
mainCode = mainCode.replace(/label: 'zBB Hizmet Noktalar \(269\)'/, "label: 'İzBB Hizmet Noktaları (269)'");
mainCode = mainCode.replace(/label: 'Taksi Duraklar \(406\)'/, "label: 'Taksi Durakları (406)'");
mainCode = mainCode.replace(/label: 'Afet Toplanma Alanlar \(2380\)'/, "label: 'Afet Toplanma Alanları (2380)'");
mainCode = mainCode.replace(/label: 'Yakn Otobs Duraklar \(Haritaya Tklayn\)'/, "label: 'Yakın Otobüs Durakları (Haritaya Tıklayın)'");
// Fix any remaining ones that might have slightly different matches
mainCode = mainCode.replace(/label: 'zBB Hizmet Noktaları \(269\)'/, "label: 'İzBB Hizmet Noktaları (269)'");
mainCode = mainCode.replace(/label: 'Taksi Durakları \(406\)'/, "label: 'Taksi Durakları (406)'");

fs.writeFileSync('src/main.ts', mainCode);

// Fix the Matrix issue where camera.position.y caused points to disappear
let engineCode = fs.readFileSync('src/core/Engine.ts', 'utf8');
engineCode = engineCode.replace(
    'engine.renderer.render(engine.scene, engine.camera);',
    'const oldY = engine.camera.position.y;\n                engine.camera.position.set(0,0,0);\n                engine.camera.updateMatrixWorld();\n                engine.renderer.render(engine.scene, engine.camera);\n                engine.camera.position.y = oldY;'
);

// Also remove depthTest from sprites so they don't get hidden behind buildings unnecessarily?
// Or we just leave it for now. Let's see if this fixes the missing points!

fs.writeFileSync('src/core/Engine.ts', engineCode);
