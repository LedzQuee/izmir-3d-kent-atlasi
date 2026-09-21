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

    public start() {
        // MapLibre kendi event loop'u uzerinden calisir.
    }

    private initMapLibre(container: HTMLDivElement) {
        const style: any = {
            version: 8,
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
            // Three.js layer eklendikten SONRA POI katmanlarinin yuklenmesi icin event at.
            // Boylece POI katmanlari Three.js ustunde cizilir.
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('threejsLayerReady', { detail: { engine: this } }));
            }, 0);
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
            this.districtManager.update(zoom);
        });
    }

    private addThreeJSLayer() {
        const engine = this;
        const origin: [number, number] = [KONAK_CENTER.lng, KONAK_CENTER.lat];

        const merc = maplibregl.MercatorCoordinate.fromLngLat(origin, 0);
        const scale = merc.meterInMercatorCoordinateUnits();

        const modelTransform = {
            translateX: merc.x,
            translateY: merc.y,
            translateZ: (merc as any).z || 0,
            scale: scale
        };

        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            Math.PI / 2
        );

        const customLayer: maplibregl.CustomLayerInterface = {
            id: 'three-js-layer',
            type: 'custom',
            renderingMode: '3d',

            onAdd(_map: any, gl: WebGL2RenderingContext) {
                engine.renderer = new THREE.WebGLRenderer({
                    canvas: _map.getCanvas(),
                    context: gl,
                    antialias: true
                });
                engine.renderer.autoClear = false;
            },

            render(gl: WebGL2RenderingContext, args: any) {
                if (!engine.renderer) return;

                let matrixData: any;
                if (args.defaultProjectionData && args.defaultProjectionData.mainMatrix) {
                    matrixData = args.defaultProjectionData.mainMatrix;
                } else if (args.modelViewProjectionMatrix) {
                    matrixData = args.modelViewProjectionMatrix;
                } else if (args.length === 16) {
                    matrixData = args;
                } else {
                    return;
                }

                const m = new THREE.Matrix4().fromArray(matrixData);

                const l = new THREE.Matrix4()
                    .makeTranslation(
                        modelTransform.translateX,
                        modelTransform.translateY,
                        modelTransform.translateZ
                    )
                    .scale(
                        new THREE.Vector3(
                            modelTransform.scale,
                            -modelTransform.scale,
                            modelTransform.scale
                        )
                    )
                    .multiply(rotationX);

                engine.camera.projectionMatrix = m.multiply(l);
                engine.camera.projectionMatrixInverse.copy(engine.camera.projectionMatrix).invert();

                engine.scene.traverse((obj: any) => { obj.frustumCulled = false; });

                engine.renderer.resetState();
                engine.renderer.clearDepth();
                engine.renderer.render(engine.scene, engine.camera);
                // Three.js render'dan sonra WebGL state'ini geri yukle
                // boylece MapLibre sonraki katmanlari (clusters, unclustered-point) cizebilir
                engine.renderer.resetState();
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

            if (hits.length === 0) { 
                UIManager.hideInfo();
                return; 
            }

            const hit = hits[0];
            const obj = hit.object as any;

            if (obj.userData?.isDistrict) {
                UIManager.hideInfo();
                window.dispatchEvent(new CustomEvent('flyToDistrict', {
                    detail: { lat: obj.userData.lat, lng: obj.userData.lng }
                }));
            }
        });

        // MapLibre Küme Tıklama
        this.map.on('click', 'clusters', (e: any) => {
            const features = this.map!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            if (!features.length) return;
            const clusterId = features[0].properties!.cluster_id;
            const source = this.map!.getSource('izmir-pois') as maplibregl.GeoJSONSource;
            source.getClusterExpansionZoom(clusterId).then((zoom) => {
                this.map!.flyTo({
                    center: (features[0].geometry as any).coordinates,
                    zoom: zoom
                });
            });
        });

        this.map.on('mouseenter', 'clusters', () => { this.map!.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', 'clusters', () => { this.map!.getCanvas().style.cursor = ''; });

        // MapLibre Tekil Nokta (veya Üst Üste Binen Noktalar) Tıklama
        this.map.on('click', 'unclustered-point', (e: any) => {
            // Tıklanan yerdeki TÜM çakışan noktaları al
            const features = this.map!.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
            if (!features.length) return;

            // MapLibreLayerManager'dan gelen recordRaw string'ini JSON objesine çevir
            const pois = features.map((f: any) => {
                return {
                    layerName: f.properties!.layerName,
                    color: f.properties!.color,
                    record: JSON.parse(f.properties!.recordRaw)
                };
            });

            // UIManager'e aktar
            UIManager.showMultiInfo(pois);

            // Kamerayı yaklaştır
            const coordinates = (features[0].geometry as any).coordinates.slice();
            this.map!.flyTo({ center: coordinates, zoom: 18, pitch: 60, essential: true, duration: 1500 });
        });

        this.map.on('mouseenter', 'unclustered-point', () => { this.map!.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', 'unclustered-point', () => { this.map!.getCanvas().style.cursor = ''; });
    }

    private updateMouseRay(e: PointerEvent) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Cok Kritik Duzeltme: Normalde Three.js PerspectiveCamera icin ray baslangic noktasini 
        // camera.matrixWorld (bizde 0,0,0) olarak alir. Ancak MapLibre kamerasini kullandigimiz icin 
        // projectionMatrix'i kendimiz uretiyoruz. Bu yuzden ray baslangicini manuel hesaplamaliyiz!
        
        const origin = new THREE.Vector3(this.mouse.x, this.mouse.y, -1); // Near plane
        const target = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);  // Far plane
        
        origin.applyMatrix4(this.camera.projectionMatrixInverse);
        target.applyMatrix4(this.camera.projectionMatrixInverse);
        
        const direction = target.sub(origin).normalize();
        this.raycaster.set(origin, direction);
        
        // Sprite'larin raycast yapabilmesi icin raycaster'a kamerayi bildirmemiz zorunlu.
        // setFromCamera kullanmadigimiz icin bunu manuel set ediyoruz:
        this.raycaster.camera = this.camera;
    }

    private getInteractableObjects(): THREE.Object3D[] {
        return this.scene.children.filter(c =>
            c.visible && c.type !== 'GridHelper' && c.name !== 'GroundPlane'
        );
    }
}
