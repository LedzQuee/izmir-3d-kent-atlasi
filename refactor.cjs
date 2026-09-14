const fs = require('fs');
const path = require('path');

// 1. Klasörleri Olustur (Mimari Klasorleme)
fs.mkdirSync('src/ui', {recursive: true});
fs.mkdirSync('src/api', {recursive: true});
fs.mkdirSync('src/utils', {recursive: true});

// 2. ApiService Kurulumu (Hata yonetimi ve Loading)
fs.writeFileSync('src/api/ApiService.ts', `import { UIManager } from '../ui/UIManager';
export const BASE_URL = 'https://openapi.izmir.bel.tr/api/ibb/cbs';
export class ApiService {
    static async get(endpoint: string) {
        UIManager.showLoading();
        try { const res = await fetch(BASE_URL + endpoint); const data = await res.json(); UIManager.hideLoading(); return data; }
        catch (err) { UIManager.hideLoading(); UIManager.showToast('Bağlantı koptu: ' + endpoint, true); return null; }
    }
    static async getFull(url: string) {
        UIManager.showLoading();
        try { const res = await fetch(url); const data = await res.json(); UIManager.hideLoading(); return data; }
        catch (err) { UIManager.hideLoading(); UIManager.showToast('Hata oluştu.', true); return null; }
    }
}`);

// 3. UIManager Kurulumu (Spagetti DOM temizligi)
fs.writeFileSync('src/ui/UIManager.ts', `export class UIManager {
    static infoBox: HTMLDivElement; static loader: HTMLDivElement;
    static init() {
        this.infoBox = document.createElement('div');
        this.infoBox.style.cssText = 'position:absolute;background:rgba(0,20,40,0.85);border:1px solid #00aaff;border-radius:8px;padding:15px;color:white;font-family:sans-serif;display:none;min-width:200px;max-width:300px;z-index:100;backdrop-filter:blur(5px);pointer-events:none;';
        document.body.appendChild(this.infoBox);
        this.loader = document.createElement('div');
        this.loader.style.cssText = 'position:fixed;top:20px;right:20px;background:#ffaa00;color:#000;padding:10px 20px;border-radius:20px;font-family:sans-serif;font-weight:bold;display:none;z-index:9999;box-shadow:0 0 10px rgba(255,170,0,0.5);';
        this.loader.innerHTML = 'Veriler Yükleniyor...';
        document.body.appendChild(this.loader);
    }
    static showLoading() { this.loader.style.display = 'block'; }
    static hideLoading() { this.loader.style.display = 'none'; }
    static showToast(msg: string, isError = false) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%);background:rgba('+(isError?'220,38,38':'40,160,40')+',0.95);color:white;padding:15px 25px;border-radius:8px;font-family:sans-serif;font-size:14px;font-weight:bold;z-index:9999;transition:opacity 0.5s;text-align:center;pointer-events:none;';
        toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + msg;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(),500); }, 5000);
    }
    static showInfo(html: string, event: MouseEvent) {
        this.infoBox.innerHTML = html;
        this.infoBox.style.display = 'block';
        let left = event.clientX + 15; let top = event.clientY + 15;
        const rect = this.infoBox.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) left = event.clientX - rect.width - 15;
        if (top + rect.height > window.innerHeight) top = event.clientY - rect.height - 15;
        this.infoBox.style.left = left + 'px'; this.infoBox.style.top = top + 'px';
    }
    static hideInfo() { this.infoBox.style.display = 'none'; }
}`);

// 4. Memory Leak onleyici Dispose Helper
fs.writeFileSync('src/utils/dispose.ts', `export function disposeGroup(group: any) {
    group.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
        }
    });
}`);

// 5. Rakim/Tepe Algoritmasi (Elevation Simulation)
let coords = fs.readFileSync('src/utils/coordinates.ts', 'utf8');
if(!coords.includes('getSimulatedElevation')) {
    coords += `\n// Izmir Dogu ve Guney sirtlari (Buca/Bornova vb.) icin sahte rakim algoritmasi
export function getSimulatedElevation(lat: number, lng: number): number {
    const dLat = (38.4192 - lat) * 1000;
    const dLng = (lng - 27.1287) * 1000;
    let height = (dLat * 30) + (dLng * 40);
    return height > 0 ? height : 0;
}\n`;
    coords = coords.replace('return [x, 0, z];', 'return [x, getSimulatedElevation(lat, lng) + 15, z];');
    fs.writeFileSync('src/utils/coordinates.ts', coords);
}

// 6. Tum Katmanlarin Otomatik Refactor Edilmesi
const layersDir = 'src/layers';
fs.readdirSync(layersDir).forEach(file => {
    if(!file.endsWith('.ts') || file === 'OtobusDuraklariLayer.ts') return;
    let content = fs.readFileSync(path.join(layersDir, file), 'utf8');
    
    // Import ekle
    if (!content.includes('ApiService')) content = "import { ApiService } from '../api/ApiService';\n" + content;
    
    // Fetch mekanizmasini ApiService ile degistir (Hardcoded url iptal)
    content = content.replace(/const res = await fetch\('https:\/\/openapi.izmir.bel.tr\/api\/ibb\/cbs(.*?)'\);\s*const data = await res.json\(\);/g, "const data = await ApiService.get('$1');\n    if (!data) return;");
    
    // Y eksenini almak icin array destructuring update
    content = content.replace(/const\s+\[(.*?)\]\s*=\s*convertGpsToVector/g, (match, p1) => {
        let parts = p1.split(',').map(p=>p.trim());
        if(parts.length===3 && parts[1]==='') return `const [${parts[0]}, y, ${parts[2]}] = convertGpsToVector`;
        return match;
    });
    
    // Sabit 15'i dinamik y rakimina cevir
    content = content.replace(/position\.set\(([^,]+),\s*15,\s*([^)]+)\)/g, 'position.set($1, y, $2)');
    
    fs.writeFileSync(path.join(layersDir, file), content);
});
