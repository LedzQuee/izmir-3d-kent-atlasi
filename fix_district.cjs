const fs = require('fs');
let engine = fs.readFileSync('src/core/Engine.ts', 'utf8');

// Eski ClusterManager baglantilarini DistrictManager ile degistir
engine = engine.replace("import { ClusterManager } from './ClusterManager';", "import { DistrictManager } from './DistrictManager';");
engine = engine.replace("private clusterManager: ClusterManager;", "private districtManager: DistrictManager;");
engine = engine.replace("this.clusterManager = new ClusterManager(this.scene, this.camera);", "this.districtManager = new DistrictManager(this.scene, this.camera);");
engine = engine.replace("this.clusterManager.update();", "this.districtManager.update();");
engine = engine.replace("this.clusterManager.update(), 1500", "this.districtManager.update(), 1500");

// Ucus Animasyonu (FlyTo) Ekle
if (!engine.includes('private flyTo')) {
    const flyToMethod = `
  private flyTo(targetX: number, targetZ: number, targetY: number) {
      const startX = this.controls.target.x;
      const startZ = this.controls.target.z;
      const startCamX = this.camera.position.x;
      const startCamY = this.camera.position.y;
      const startCamZ = this.camera.position.z;
      
      const endCamX = targetX;
      const endCamZ = targetZ + 600; 
      
      let progress = 0;
      const animateFly = () => {
          progress += 0.025; // Ucus hizi
          if (progress > 1) progress = 1;
          
          const ease = 1 - Math.pow(1 - progress, 3); // Yavaslayarak durma efekti
          
          this.controls.target.x = startX + (targetX - startX) * ease;
          this.controls.target.z = startZ + (targetZ - startZ) * ease;
          
          this.camera.position.x = startCamX + (endCamX - startCamX) * ease;
          this.camera.position.y = startCamY + (targetY - startCamY) * ease;
          this.camera.position.z = startCamZ + (endCamZ - startCamZ) * ease;
          
          this.controls.update(); // Update cagrildigi an DistrictManager da tetiklenir!
          
          if (progress < 1) {
              requestAnimationFrame(animateFly);
          }
      };
      animateFly();
  }
`;
    engine = engine.replace('public start() {', flyToMethod + '\n\n  public start() {');
}

// Tiklama Isleyicisine Ilce Topu Kontrolunu Ekle
const hookRegex = /if \(intersects\.length > 0\) \{\s*const hitObj = intersects\.find\(i => i\.object\.name !== 'GroundPlane'\);/g;
const districtCheck = `if (intersects.length > 0) {
      const hitObj = intersects.find(i => i.object.name !== 'GroundPlane');
      
      // Ilce topuna tiklandiginda ucusa gec
      if (hitObj && hitObj.object.userData?.isDistrict) {
          const ud = hitObj.object.userData;
          this.flyTo(ud.targetX, ud.targetZ, 2500);
          return;
      }
`;
engine = engine.replace(hookRegex, districtCheck);

fs.writeFileSync('src/core/Engine.ts', engine);
