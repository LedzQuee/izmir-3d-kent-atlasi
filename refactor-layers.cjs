const fs = require('fs');
const path = require('path');

const layersDir = path.join(__dirname, 'src', 'layers');
const files = fs.readdirSync(layersDir).filter(f => f.endsWith('Layer.ts') && !f.includes('OtobusDuraklari'));

files.forEach(file => {
    const fullPath = path.join(layersDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes('createElegantMarker')) return;

    // Replace the import
    content = content.replace(
        /import\s*\{\s*convertGpsToVector\s*\}\s*from\s*'[^']*(?:utils\/coordinates|coordinates)'\s*;/g,
        "import { createElegantMarker } from '../utils/MarkerFactory';"
    );

    // Extract color
    const colorMatch = content.match(/new\s*THREE\.MeshStandardMaterial\(\s*\{\s*color:\s*([^ }]+)[^}]*\}\s*\)/);
    const color = colorMatch ? colorMatch[1] : '0xffffff';

    // Remove old geometry and material definitions
    content = content.replace(/const\s+geometry\s*=\s*new\s+THREE\.SphereGeometry[^;]+;/g, '');
    content = content.replace(/const\s+material\s*=\s*new\s+THREE\.MeshStandardMaterial[^;]+;/g, '');

    // Replace mesh creation logic
    content = content.replace(
        /const\s*\[x,\s*y,\s*z\]\s*=\s*convertGpsToVector\(lat,\s*lng\);\s*const\s*(mesh|sphere)\s*=\s*new\s*THREE\.Mesh\(geometry,\s*material\);\s*\1\.position\.set\(x,\s*y,\s*z\);\s*\1\.userData\s*=\s*\{\s*record,\s*layerName:\s*'([^']+)'\s*\};\s*scene\.add\(\1\);/g,
        (match, varName, layerName) => {
            return `const marker = createElegantMarker(lat, lng, ${color}, '${layerName}', record);
        if (marker) scene.add(marker);`;
        }
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated ' + file);
});
