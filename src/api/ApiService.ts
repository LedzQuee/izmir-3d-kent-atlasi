import { UIManager } from '../ui/UIManager';

export const BASE_URL = 'https://openapi.izmir.bel.tr/api/ibb/cbs';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('IzmirAtlasDB', 1);
        req.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('apicache')) {
                db.createObjectStore('apicache');
            }
        };
        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = () => reject('IDB Error');
    });
}

async function getCached(key: string): Promise<any> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction('apicache', 'readonly');
            const store = tx.objectStore('apicache');
            const req = store.get(key);
            req.onsuccess = () => {
                if (req.result && (Date.now() - req.result.timestamp < CACHE_EXPIRY)) {
                    resolve(req.result.data);
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
}

async function setCache(key: string, data: any) {
    try {
        const db = await openDB();
        const tx = db.transaction('apicache', 'readwrite');
        const store = tx.objectStore('apicache');
        store.put({ timestamp: Date.now(), data }, key);
    } catch (e) { console.error(e); }
}

export class ApiService {
    static async get(endpoint: string) {
        UIManager.showLoading();
        try { 
            const url = BASE_URL + endpoint;
            const cached = await getCached(url);
            if (cached) {
                UIManager.hideLoading();
                return cached;
            }

            const res = await fetch(url); 
            const data = await res.json(); 
            
            if (data) {
                await setCache(url, data);
            }

            UIManager.hideLoading(); 
            return data; 
        } catch (err) { 
            UIManager.hideLoading(); 
            UIManager.showToast('Sunucu bağlantısı koptu. Lütfen internetinizi kontrol edin.', true); 
            return null; 
        }
    }

    static async getFull(url: string) {
        UIManager.showLoading();
        try { 
            const cached = await getCached(url);
            if (cached) {
                UIManager.hideLoading();
                return cached;
            }

            const res = await fetch(url); 
            const data = await res.json(); 
            
            if (data) {
                await setCache(url, data);
            }

            UIManager.hideLoading(); 
            return data; 
        } catch (err) { 
            UIManager.hideLoading(); 
            UIManager.showToast('Sunucu bağlantısı koptu. Lütfen internetinizi kontrol edin.', true); 
            return null; 
        }
    }
}
