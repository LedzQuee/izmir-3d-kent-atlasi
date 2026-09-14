const fs = require('fs');
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Eski hatali olceklendirme fonksiyonunu sil
engine = engine.replace(/private updateDynamicScaling\(\) \{[\s\S]*?\n  \}\n/g, '');

// Import ekle
if (!engine.includes('ClusterManager')) {
    engine = engine.replace("import { UIManager } from '../ui/UIManager';", "import { UIManager } from '../ui/UIManager';\nimport { ClusterManager } from './ClusterManager';");
}

// Cluster property ekle
if (!engine.includes('private clusterManager')) {
    engine = engine.replace('private pointerDownPos: THREE.Vector2;', 'private pointerDownPos: THREE.Vector2;\n  private clusterManager: ClusterManager;');
}

// Constructor da baslat
if (!engine.includes('this.clusterManager = new ClusterManager')) {
    engine = engine.replace('this.raycaster = new THREE.Raycaster();', 'this.clusterManager = new ClusterManager(this.scene, this.camera);\n    this.raycaster = new THREE.Raycaster();');
}

// Event listener i guncelle
engine = engine.replace("this.controls.addEventListener('change', () => this.updateDynamicScaling());", "this.controls.addEventListener('change', () => this.clusterManager.update());");

// Timeout i guncelle
engine = engine.replace(/setTimeout\(\(\) => this\.updateDynamicScaling\(\), 1000\);/g, "setTimeout(() => this.clusterManager.update(), 1500);");

fs.writeFileSync('src/core/Engine.ts', engine);
