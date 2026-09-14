import { UIManager } from '../ui/UIManager';

export const BASE_URL = 'https://openapi.izmir.bel.tr/api/ibb/cbs';

export class ApiService {
    static async get(endpoint: string) {
        UIManager.showLoading();
        try { 
            const res = await fetch(BASE_URL + endpoint); 
            const data = await res.json(); 
            UIManager.hideLoading(); 
            return data; 
        } catch (err) { 
            UIManager.hideLoading(); 
            // Endpoint yolunu gostermek yerine kurumsal mesaj eklendi
            UIManager.showToast('Sunucu bağlantısı koptu. Lütfen internetinizi kontrol edin.', true); 
            return null; 
        }
    }

    static async getFull(url: string) {
        UIManager.showLoading();
        try { 
            const res = await fetch(url); 
            const data = await res.json(); 
            UIManager.hideLoading(); 
            return data; 
        } catch (err) { 
            UIManager.hideLoading(); 
            UIManager.showToast('Sunucu bağlantısı koptu. Lütfen internetinizi kontrol edin.', true); 
            return null; 
        }
    }
}
