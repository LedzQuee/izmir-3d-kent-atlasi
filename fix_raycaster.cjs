const fs = require('fs');
let code = fs.readFileSync('src/core/Engine.ts', 'utf8');

const raycasterLogic = `
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private pointerDownPos = new THREE.Vector2();

    private setupInteractions() {
        if (!this.map) return;
        const canvas = this.map.getCanvasContainer();
        
        canvas.addEventListener('pointerdown', (e) => {
            this.pointerDownPos.set(e.clientX, e.clientY);
        });

        canvas.addEventListener('pointermove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const visibleObjects = this.scene.children.filter(c => c.visible && c.type !== 'GridHelper' && c.name !== 'GroundPlane');
            const intersects = this.raycaster.intersectObjects(visibleObjects, true);

            if (intersects.length > 0) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = '';
            }
        });

        canvas.addEventListener('pointerup', (e) => {
            const distance = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
            if (distance > 5) return;
            
            const { UIManager } = require('../ui/UIManager');
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const visibleObjects = this.scene.children.filter(c => c.visible && c.type !== 'GridHelper' && c.name !== 'GroundPlane');
            const intersects = this.raycaster.intersectObjects(visibleObjects, true);
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                let obj = hit.object;
                
                // InstancedMesh icin
                if (obj.type === 'InstancedMesh' && obj.userData.records) {
                    const inst = obj as THREE.InstancedMesh;
                    const record = inst.userData.records[hit.instanceId!];
                    if (record) {
                        const html = \`
                            <div style="font-size:14px; margin-bottom:5px; color:#ff9900; font-weight:bold;">
                                \${obj.userData.layerName || 'Detay'}
                            </div>
                            <div style="font-size:12px;">\${record.ADI || record.Adi || 'Bilinmeyen'}</div>
                        \`;
                        UIManager.showInfo(html, e as MouseEvent);
                        return;
                    }
                }
                
                // Normal Mesh veya Sprite
                if (obj.userData && obj.userData.isDistrict) {
                    window.dispatchEvent(new CustomEvent('flyToDistrict', { 
                        detail: { lat: obj.userData.lat, lng: obj.userData.lng, x: obj.userData.targetX, z: obj.userData.targetZ } 
                    }));
                } else if (obj.userData && obj.userData.record) {
                    const record = obj.userData.record;
                    const html = \`
                        <div style="font-size:14px; margin-bottom:5px; color:#ff9900; font-weight:bold;">
                            \${obj.userData.layerName || 'Detay'}
                        </div>
                        <div style="font-size:12px;">\${record.ADI || record.Adi || 'Bilinmeyen'}</div>
                    \`;
                    UIManager.showInfo(html, e as MouseEvent);
                }
            } else {
                UIManager.hideInfo();
            }
        });
    }
`;

// Sınıfın içine metotları ekleyelim (en sona, }'den önce)
code = code.replace(/}\s*$/, raycasterLogic + "\n}");

// initMapLibre içinde style.load sonrasına setupInteractions çağrısı ekleyelim
code = code.replace(
    /this\.addThreeJSLayer\(\);/g, 
    "this.addThreeJSLayer();\n            this.setupInteractions();"
);

// Haritanin arka plan gri zeminini silelim cunku artik maplibre uydusu var!
// Ancak projede GroundPlane vs. vardi.
// Baska bir dosya sileriz gerekirse.
fs.writeFileSync('src/core/Engine.ts', code);
