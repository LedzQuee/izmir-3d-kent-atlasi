const fs = require('fs');
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Dinamik olceklendirme metodunu sinifa ekle
const dynamicScaleMethod = `
  private updateDynamicScaling() {
    // Kamera yuksekligine gore olcek carpani hesapla (1500 birimde 1x)
    let scale = this.camera.position.y / 1500;
    if (scale < 1) scale = 1;
    if (scale > 25) scale = 25; // Maksimum 25 kat buyume limiti
    
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();

    this.scene.children.forEach(child => {
        // Zemin ve yardimci cizgileri (Grid) atla
        if (child.name === 'GroundPlane' || child.type === 'GridHelper' || child.name === 'TargetPin') return;

        // Normal kureleri buyut/kucult
        if (child.type === 'Mesh' && child.geometry && child.geometry.type === 'SphereGeometry') {
            child.scale.set(scale, scale, scale);
        } 
        // 2380 kisilik Afet Toplanma alanlari (InstancedMesh) icin ozel matris hesaplama
        else if (child.type === 'InstancedMesh') {
            const instMesh = child;
            for(let i = 0; i < instMesh.count; i++) {
                instMesh.getMatrixAt(i, matrix);
                position.setFromMatrixPosition(matrix); // Orijinal konumu al
                
                dummy.position.copy(position);
                dummy.scale.set(scale, scale, scale); // Yeni devasa olcegi ver
                dummy.updateMatrix();
                instMesh.setMatrixAt(i, dummy.matrix); // Matrisi geri yukle
            }
            instMesh.instanceMatrix.needsUpdate = true;
            instMesh.computeBoundingSphere(); // Tiklama Hitbox'ini guncelle
        }
        // Grup (Orn: Dinamik Otobus duraklari listesi)
        else if (child.type === 'Group') {
            child.children.forEach(sub => {
                if (sub.name !== 'TargetPin' && sub.type === 'Mesh' && sub.geometry && sub.geometry.type === 'SphereGeometry') {
                    sub.scale.set(scale, scale, scale);
                }
            });
        }
    });
  }
`;

// Sınıfa metodu ekleyelim
if (!engine.includes('updateDynamicScaling')) {
    engine = engine.replace('public start() {', dynamicScaleMethod + '\n\n  public start() {');
}

// Event listener i constructor a ekleyelim (onWindowResize'in altina)
if (!engine.includes('this.updateDynamicScaling();')) {
    engine = engine.replace(
        "window.addEventListener('resize', this.onWindowResize.bind(this));",
        "window.addEventListener('resize', this.onWindowResize.bind(this));\n    this.controls.addEventListener('change', () => this.updateDynamicScaling());\n    setTimeout(() => this.updateDynamicScaling(), 1000);"
    );
}

fs.writeFileSync('src/core/Engine.ts', engine);
