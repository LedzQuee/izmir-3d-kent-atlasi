const fs = require('fs');
const path = require('path');

const layersDir = path.join(__dirname, 'src', 'layers');
const files = fs.readdirSync(layersDir).filter(f => f.endsWith('.ts'));

console.log("Katmanlar ve UserData (ILCE) Durumlari:");
files.forEach(file => {
    const content = fs.readFileSync(path.join(layersDir, file), 'utf8');
    
    // userData atamasini bulalim
    const userDataMatches = content.match(/userData\s*=\s*\{.*?\}/gs) || [];
    const hasInstanced = content.includes('InstancedMesh');
    
    console.log(`- ${file}:`);
    console.log(`  InstancedMesh var mi: ${hasInstanced}`);
    userDataMatches.forEach(m => {
        let clean = m.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        if(clean.length > 80) clean = clean.substring(0, 80) + '...';
        console.log(`  UserData kodu: ${clean}`);
    });
});
