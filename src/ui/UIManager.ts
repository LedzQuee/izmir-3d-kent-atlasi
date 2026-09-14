export class UIManager {
    static infoBox: HTMLDivElement;
    static loader: HTMLDivElement;
    
    // Ust uste binmeleri engellemek icin aktif bildirim hafizasi
    static activeToast: HTMLDivElement | null = null;
    static toastTimeoutId: any = null;

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
        // Eger ekranda halihazirda bir bildirim aciksa, suresini beklemeden aninda yok et
        if (this.activeToast) {
            this.activeToast.remove();
            if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;top:30px;left:50%;transform:translateX(-50%);background:rgba(${isError?'220,38,38':'40,160,40'},0.95);color:white;padding:15px 25px;border-radius:8px;font-family:sans-serif;font-size:14px;font-weight:bold;z-index:9999;transition:opacity 0.3s;text-align:center;pointer-events:none;box-shadow:0 4px 15px rgba(0,0,0,0.5);`;
        toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + msg;
        document.body.appendChild(toast);
        
        this.activeToast = toast;

        // 5 Saniye yerine 2.5 saniyede hizlica kaybolsun
        this.toastTimeoutId = setTimeout(() => { 
            toast.style.opacity = '0'; 
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
                if (this.activeToast === toast) this.activeToast = null;
            }, 300); 
        }, 2500);
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
}
