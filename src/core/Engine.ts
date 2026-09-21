import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import { UIManager } from '../ui/UIManager';
import { fetchNearestStops } from '../layers/OtobusDuraklariLayer';
import { convertGpsToVector, KONAK_CENTER } from '../utils/coordinates';
import { DistrictManager } from './DistrictManager';

export class Engine {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer | null = null;
    public map: maplibregl.Map | null = null;
    public districtManager: DistrictManager | null = null;

    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private pointerDownPos = new THREE.Vector2();

    constructor() {
        UIManager.init();

        this.scene = new THREE.Scene();
        // PerspectiveCamera — projection matrix MapLibre tarafindan her frame ezilecek
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e8);

        // Isik
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(1000, 3000, 1000);
        this.scene.add(dir);

        // Eski canvas varsa gizle, MapLibre kendi canvas'ini olusturacak
        const oldCanvas = document.querySelector('canvas');
        if (oldCanvas) oldCanvas.style.display = 'none';

        // MapLibre icin konteyner
        const mapDiv = document.createElement('div');
        mapDiv.id = 'map-container';
        mapDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        document.body.appendChild(mapDiv);

        this.initMapLibre(mapDiv);
        this.districtManager = new DistrictManager(this.scene, this.camera);

        window.addEventListener('flyToDistrict', (e: any) => {
            const { lat, lng } = e.detail;
            if (this.map && lat && lng) {
                this.map.flyTo({ center: [lng, lat] as [number, number], zoom: 15, pitch: 60, duration: 1500 });
            }
        });
    }

    public start() { /* MapLibre event loop ile yonetiliyor */ }

    private initMapLibre(container: HTMLDivElement) {
        const style: any = {
            version: 8,
            sources: {
                'esri-satellite': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256,
                    maxzoom: 19,
                    attribution: '© Esri'
                },
                'ofm': {
                    type: 'vector',
                    url: 'https://tiles.openfreemap.org/planet'
                }
            },
            layers: [
                { id: 'bg', type: 'background', paint: { 'background-color': '#1a1a2e' } },
                { id: 'satellite', type: 'raster', source: 'esri-satellite', paint: { 'raster-opacity': 1 } },
                {
                    id: '3d-buildings',
                    type: 'fill-extrusion',
                    source: 'ofm',
                    'source-layer': 'building',
                    minzoom: 13,
                    paint: {
                        'fill-extrusion-color': [
                            'interpolate', ['linear'], ['get', 'render_height'],
                            0, '#e6ded0', 10, '#dcd3c4', 24, '#d2c9ba', 40, '#c7bfb0'
                        ],
                        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
                        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
                        'fill-extrusion-opacity': 0.85,
                        'fill-extrusion-vertical-gradient': true
                    }
                }
            ]
        };

        this.map = new (maplibregl.Map as any)({
            container: container.id,
            style,
            center: [KONAK_CENTER.lng, KONAK_CENTER.lat] as [number, number],
            zoom: 12.5,
            pitch: 60,
            bearing: -20,
            maxPitch: 85,
            antialias: true
        });

        this.map!.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

        this.map!.on('style.load', () => {
            this.addThreeJSLayer();
            this.setupInteractions();
        });

        // ESHOT tiklama modunda haritaya tiklayinca en yakin duraklar
        this.map!.on('click', (e: any) => {
            if (UIManager.busStopMode) {
                const [x, , z] = convertGpsToVector(e.lngLat.lat, e.lngLat.lng);
                fetchNearestStops(this.scene, x, z);
            }
        });

        // Her render'da DistrictManager guncelle
        this.map!.on('render', () => {
            if (!this.districtManager) return;
            const zoom = this.map!.getZoom();
            // Zoom'dan yaklasik irtifa: zoom 13 ~4000m, zoom 17 ~250m
            this.camera.position.y = Math.max(0, (17 - zoom) * 800);
            this.districtManager.update();
        });
    }

    private addThreeJSLayer() {
        const engine = this;
        const origin: [number, number] = [KONAK_CENTER.lng, KONAK_CENTER.lat];

        const merc = maplibregl.MercatorCoordinate.fromLngLat(origin, 0);
        const scale = merc.meterInMercatorCoordinateUnits();
        const mz = (merc as any).z ?? 0;

        // Dogru eksen donusumu:
        // Three.js: X=dogu(m), Y=yukari(m), Z=guney(m)
        // Mercator : X=dogu,   Y=guney,     Z=yukari
        // Yani: MercX = ThreeX*s, MercY = ThreeZ*s, MercZ = ThreeY*s
        // Matris (satir-major): [row0, row1, row2, row3]
        const modelMatrix = new THREE.Matrix4();
        modelMatrix.set(
            scale, 0,     0,     merc.x,
            0,     0,     scale, merc.y,
            0,     scale, 0,     mz,
            0,     0,     0,     1
        );

        const customLayer: maplibregl.CustomLayerInterface = {
            id: 'three-js-layer',
            type: 'custom',
            renderingMode: '3d',

            onAdd(_map: any, gl: WebGLRenderingContext) {
                engine.renderer = new THREE.WebGLRenderer({
                    canvas: _map.getCanvas(),
                    context: gl,
                    antialias: true
                });
                engine.renderer.autoClear = false;
            },

            render(_gl: any, matrix: any) {
                if (!engine.renderer) return;

                // viewProjection * modelMatrix
                const vp = new THREE.Matrix4().fromArray(matrix);
                engine.camera.projectionMatrix = vp.multiply(modelMatrix);
                engine.camera.matrixWorldInverse.identity();
                engine.camera.matrixWorld.identity();

                engine.scene.traverse((obj: any) => { obj.frustumCulled = false; });

                engine.renderer.resetState();
                engine.renderer.render(engine.scene, engine.camera);
                engine.map!.triggerRepaint();
            }
        };

        this.map!.addLayer(customLayer);
    }

    private setupInteractions() {
        if (!this.map) return;
        const canvas = this.map.getCanvasContainer();

        canvas.addEventListener('pointerdown', (e: any) => {
            this.pointerDownPos.set(e.clientX, e.clientY);
        });

        canvas.addEventListener('pointermove', (e: any) => {
            this.updateMouseRay(e);
            const hits = this.raycaster.intersectObjects(this.getInteractableObjects(), true);
            canvas.style.cursor = hits.length > 0 ? 'pointer' : '';
        });

        canvas.addEventListener('pointerup', (e: any) => {
            const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
            if (dist > 5) return;

            this.updateMouseRay(e);
            const hits = this.raycaster.intersectObjects(this.getInteractableObjects(), true);

            if (hits.length === 0) { UIManager.hideInfo(); return; }

            const hit = hits[0];
            const obj = hit.object as any;

            if (obj.userData?.isDistrict) {
                window.dispatchEvent(new CustomEvent('flyToDistrict', {
                    detail: { lat: obj.userData.lat, lng: obj.userData.lng }
                }));
            } else if (obj.userData?.record) {
                const r = obj.userData.record;
                const name = r.ADI || r.Adi || r.adi || 'Bilinmiyor';
                UIManager.showInfo(`
                    <div style="font-weight:600;color:#93c5fd;margin-bottom:6px">${obj.userData.layerName || ''}</div>
                    <div style="font-size:13px">${name}</div>
                `, e as MouseEvent);
            } else if (obj.type === 'InstancedMesh' && obj.userData?.records) {
                const r = obj.userData.records[hit.instanceId!];
                if (r) {
                    UIManager.showInfo(`
                        <div style="font-weight:600;color:#93c5fd;margin-bottom:6px">${obj.userData.layerName || ''}</div>
                        <div style="font-size:13px">${r.ADI || r.Adi || 'Bilinmiyor'}</div>
                    `, e as MouseEvent);
                }
            }
        });
    }

    private updateMouseRay(e: PointerEvent) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
    }

    private getInteractableObjects(): THREE.Object3D[] {
        return this.scene.children.filter(c =>
            c.visible && c.type !== 'GridHelper' && c.name !== 'GroundPlane'
        );
    }
}
