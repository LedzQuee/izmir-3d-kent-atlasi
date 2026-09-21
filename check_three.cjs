const fs = require('fs');
const lines = fs.readFileSync('node_modules/.vite/deps/three.module-Bj7iJlUn.js', 'utf8').split('\n');
const start = Math.max(0, 16614 - 10);
const end = Math.min(lines.length, 16614 + 10);
for(let i=start; i<end; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
