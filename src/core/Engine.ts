import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { fetchNearestStops, clearNearestStops } from '../layers/OtobusDuraklariLayer';
import { UIManager } from '../ui/UIManager';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: MapControls;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private pointerDownPos: THREE.Vector2;

  constructor() {
    // 3. UI TEMIZLIGI: Spagetti DOM'dan kurtulduk. Merkezi UI'i baslatiyoruz.
    UIManager.init();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 200000);
    this.camera.position.set(0, 5000, 5000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false; 
    this.controls.minDistance = 50; 
    this.controls.maxDistance = 50000; 
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1000, 2000, 1000);
    this.scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(200000, 200, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(200000, 200000);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshBasicMaterial({ visible: false });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.name = 'GroundPlane';
    // Tepeler eklendigi icin zemini hafif asagi aliyoruz (klipleme olmamasi icin)
    groundMesh.position.y = -10; 
    this.scene.add(groundMesh);

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.controls.addEventListener('change', () => this.updateDynamicScaling());
    setTimeout(() => this.updateDynamicScaling(), 1000);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();
    window.addEventListener('clearBusStops', () => clearNearestStops(this.scene));

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
  }

  private onPointerDown(event: PointerEvent) {
    this.pointerDownPos.set(event.clientX, event.clientY);
  }

  private onPointerUp(event: PointerEvent) {
    const distance = Math.hypot(event.clientX - this.pointerDownPos.x, event.clientY - this.pointerDownPos.y);
    if (distance > 5) return;
    this.handleClick(event);
  }

  private onPointerMove(event: PointerEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const visibleObjects = this.scene.children.filter(c => c.visible && c.type !== 'GridHelper' && c.name !== 'GroundPlane');
    const intersects = this.raycaster.intersectObjects(visibleObjects, true);

    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  private handleClick(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const visibleObjects = this.scene.children.filter(c => c.visible && c.type !== 'GridHelper');
    const intersects = this.raycaster.intersectObjects(visibleObjects, true);

    if (intersects.length > 0) {
      const hitObj = intersects.find(i => i.object.name !== 'GroundPlane');
      
      if (hitObj) {
        if (hitObj.object.name === 'TargetPin') return;

        const obj = hitObj.object as any;
        let record = null;

        if (obj.isInstancedMesh && obj.userData.records) {
          const idx = hitObj.instanceId;
          if (idx !== undefined) record = obj.userData.records[idx];
        } else {
          record = obj.userData?.record;
        }

        if (record) {
          const name = record.ADI || record.adi || record.AD || record.TesisAdi || "İsimsiz Nokta";
          const type = obj.userData.layerName || "Kayıt";
          const ilce = record.ILCE || record.ilce || record.Ilce || "-";
          
          const html = `
            <div style="font-size: 11px; color: #00aaff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">${type}</div>
            <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">${name}</div>
            <div style="font-size: 12px; color: #ccc;">İlçe/Mesafe: ${ilce}</div>
          `;
          
          UIManager.showInfo(html, event); // Clean UI cagrisi
          return;
        }
      } else {
        const groundHit = intersects.find(i => i.object.name === 'GroundPlane');
        if (groundHit && UIManager.busStopMode) {
          fetchNearestStops(this.scene, groundHit.point.x, groundHit.point.z);
        }
      }
    }
    
    UIManager.hideInfo();
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  
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


  public start() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
