import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import { UIManager } from '../ui/UIManager';
import { fetchNearestStops } from '../layers/OtobusDuraklariLayer';
import { convertGpsToVector } from '../utils/coordinates';
import { KONAK_CENTER } from '../utils/coordinates';
import { DistrictManager } from './DistrictManager';

export class Engine {
    public scene: THREE.Scene;
    public camera: THREE.Camera;
    public renderer: THREE.WebGLRenderer | null = null;
    public map: maplibregl.Map | null = null;
    public districtManager: DistrictManager | null = null;

    constructor(canvas: HTMLCanvasElement) {
        UIManager.init();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000); // MapLibre layer'da projection matrix ile ezilecek
        
        // Aydinlatma
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1000, 3000, 1000);
        this.scene.add(dirLight);

        // MapLibre icin DOM hazirligi (Canvas'i gizleyip div ekliyoruz)
        if (canvas) canvas.style.display = 'none';
        else {
            const existingCanvas = document.querySelector('canvas');
            if (existingCanvas) existingCanvas.style.display = 'none';
        }
        const mapDiv = document.createElement('div');
        mapDiv.id = 'map-container';
        mapDiv.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
        document.body.appendChild(mapDiv);

        this.initMapLibre(mapDiv);
        this.districtManager = new DistrictManager(this.scene, this.camera as THREE.PerspectiveCamera);

        // FlyTo eventi
        window.addEventListener('flyToDistrict', (e: any) => {
            const { lat, lng } = e.detail; 
            if (this.map && lat && lng) {
                this.map.flyTo({ center: [lng, lat], zoom: 15, pitch: 60 });
            }
        });
    }

    private initMapLibre(container: HTMLDivElement) {
        const pureStyle = {
            "version": 8,
            "sources": {
                "esri-satellite": {
                    "type": "raster",
                    "tiles": ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                    "tileSize": 256,
                    "maxzoom": 19,
                    "attribution": "© Esri"
                },
                "openfreemap-vector": {
                    "type": "vector",
                    "url": "https://tiles.openfreemap.org/planet"
                }
            },
            "layers": [
                {
                    "id": "background-layer",
                    "type": "background",
                    "paint": { "background-color": "#f2efe6" }
                },
                {
                    "id": "esri-satellite-layer",
                    "type": "raster",
                    "source": "esri-satellite",
                    "paint": { "raster-opacity": 1.0 }
                },
                {
                    "id": "3d-buildings",
                    "type": "fill-extrusion",
                    "source": "openfreemap-vector",
                    "source-layer": "building",
                    "minzoom": 13,
                    "paint": {
                        "fill-extrusion-color": [
                            "interpolate", ["linear"], ["get", "render_height"],
                            0, "#e6ded0", 10, "#dcd3c4", 24, "#d2c9ba", 40, "#c7bfb0"
                        ],
                        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],
                        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                        "fill-extrusion-opacity": 0.8,
                        "fill-extrusion-vertical-gradient": true
                    }
                }
            ]
        };

        this.map = new maplibregl.Map({
            container: container.id,
            style: pureStyle as any,
            center: [KONAK_CENTER.lng, KONAK_CENTER.lat] as [number, number] as [number, number],
            zoom: 13,
            pitch: 60,
            bearing: -20,
            maxPitch: 85,
            // antialias: true
        });

        this.map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

        this.map.on('style.load', () => {
            this.addThreeJSLayer();
            this.setupInteractions();
        });

        // ESHOT Tiklama (Raycaster yerine MapLibre click kullanarak koordinatlari alacagiz)
        this.map.on('click', (e: any) => {
            if (UIManager && UIManager.busStopMode) {
                const [x, y, z] = convertGpsToVector(e.lngLat.lat, e.lngLat.lng);
                fetchNearestStops(this.scene, x, z);
            }
        });
        
        // DistrictManager guncellemelerini map render dongusune baglayalim
        this.map.on('render', () => {
            if (this.districtManager) {
                // Kamera irtifasini harita zoom'undan tahmini hesapla (13 -> ~5000m, 17 -> ~500m)
                // LOD icin tahmini bir altitude degeri gonderiyoruz
                const zoom = this.map!.getZoom();
                const fakeAltitude = Math.max(0, (17 - zoom) * 800); 
                
                // DistrictManager icindeki kamera referansina suni bir pozisyon verelim ki LOD calissin
                this.camera.position.y = fakeAltitude;
                this.districtManager.update();
            }
        });
    }

    public start() {}

    private addThreeJSLayer() {
        const engine = this;
        
        const modelOrigin: [number, number] = [KONAK_CENTER.lng, KONAK_CENTER.lat];
        const merc = maplibregl.MercatorCoordinate.fromLngLat(modelOrigin, 0);
        const scale = merc.meterInMercatorCoordinateUnits();

        const customLayer: maplibregl.CustomLayerInterface = {
            id: '3d-model',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function (map: any, gl: WebGLRenderingContext) {
                engine.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    // antialias: true
                });
                engine.renderer.autoClear = false;
            },
            render: function (gl: WebGLRenderingContext, matrix: any) {
                if (!engine.renderer) return;

                const m = new THREE.Matrix4().fromArray(matrix);

                const l = new THREE.Matrix4()
                    .makeTranslation(merc.x, merc.y, merc.z)
                    .scale(new THREE.Vector3(scale, scale, scale));
                
                const axisSwap = new THREE.Matrix4();
                axisSwap.set(
                    1, 0, 0, 0,
                    0, 0, 1, 0,
                    0, 1, 0, 0,
                    0, 0, 0, 1
                );
                l.multiply(axisSwap);

                
                engine.scene.traverse((obj: any) => { obj.frustumCulled = false; }); // Frustum culling kapat (Garantili gorunurluk)
                
                engine.scene.matrixAutoUpdate = false;
                engine.scene.matrix = l; // Model transformunu direkt sahneye uygula
                engine.scene.updateMatrixWorld(true);
                
                engine.camera.position.set(0,0,0);
                engine.camera.quaternion.set(0,0,0,1);
                engine.camera.updateMatrixWorld(true);
                
                engine.camera.projectionMatrix = m; // Saf MapLibre kamerasi
                
                engine.renderer.render(engine.scene, engine.camera);
                engine.map!.triggerRepaint();

            }
        };

        this.map!.addLayer(customLayer);
    }

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private pointerDownPos = new THREE.Vector2();

    private setupInteractions() {
        if (!this.map) return;
        const canvas = this.map.getCanvasContainer();
        
        canvas.addEventListener('pointerdown', (e: any) => {
            this.pointerDownPos.set(e.clientX, e.clientY);
        });

        canvas.addEventListener('pointermove', (e: any) => {
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

        canvas.addEventListener('pointerup', (e: any) => {
            const distance = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
            if (distance > 5) return;
            
            
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
                        const html = `
                            <div style="font-size:14px; margin-bottom:5px; color:#ff9900; font-weight:bold;">
                                ${obj.userData.layerName || 'Detay'}
                            </div>
                            <div style="font-size:12px;">${record.ADI || record.Adi || 'Bilinmeyen'}</div>
                        `;
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
                    const html = `
                        <div style="font-size:14px; margin-bottom:5px; color:#ff9900; font-weight:bold;">
                            ${obj.userData.layerName || 'Detay'}
                        </div>
                        <div style="font-size:12px;">${record.ADI || record.Adi || 'Bilinmeyen'}</div>
                    `;
                    UIManager.showInfo(html, e as MouseEvent);
                }
            } else {
                UIManager.hideInfo();
            }
        });
    }

}
