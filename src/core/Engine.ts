import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { fetchNearestStops, clearNearestStops } from '../layers/OtobusDuraklariLayer';
import { UIManager } from '../ui/UIManager';
import { DistrictManager } from './DistrictManager';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: MapControls;
  
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private pointerDownPos: THREE.Vector2;
  private districtManager: DistrictManager;

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

    this.districtManager = new DistrictManager(this.scene, this.camera);
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.controls.addEventListener('change', () => this.districtManager.update());
    setInterval(() => this.districtManager.update(), 1000);

    
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
      
      // Ilce topuna tiklandiginda ucusa gec
      if (hitObj && hitObj.object.userData?.isDistrict) {
          const ud = hitObj.object.userData;
          this.flyTo(ud.targetX, ud.targetZ, 2500);
          return;
      }

      
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


  public start() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
