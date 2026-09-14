export class UIManager {
    static infoBox: HTMLDivElement;
    static loader: HTMLDivElement;
    static activeToast: HTMLDivElement | null = null;
    static toastTimeoutId: any = null;

    static init() {
        // Tıklama Bilgi Kutusu (Modern Cam Efektli Tasarım)
        this.infoBox = document.createElement('div');
        this.infoBox.style.cssText = `
            position: absolute;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            color: #f8fafc;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: none;
            min-width: 220px;
            max-width: 320px;
            z-index: 100;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            pointer-events: none;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(this.infoBox);
        
        // Yükleniyor Göstergesi (Modern Tasarım)
        this.loader = document.createElement('div');
        this.loader.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.85);
            color: #3b82f6;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 600;
            font-size: 14px;
            display: none;
            z-index: 9999;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(59, 130, 246, 0.3);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        `;
        this.loader.innerHTML = 'Veriler Yükleniyor...';
        document.body.appendChild(this.loader);
    }

    static showLoading() { this.loader.style.display = 'block'; }
    static hideLoading() { this.loader.style.display = 'none'; }

    static showToast(msg: string, isError = false) {
        if (this.activeToast) {
            this.activeToast.remove();
            if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
        }

        const toast = document.createElement('div');
        // Hata ise kirmizi vurgu, degilse mavi vurgu
        const accentColor = isError ? '#ef4444' : '#3b82f6'; 
        
        // Asagidan suzulerek gelen modern Toast CSS'i
        toast.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #f8fafc;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            z-index: 9999;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: center;
            pointer-events: none;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05);
            border-bottom: 3px solid ${accentColor};
        `;
        
        // Icerigi bas (Emoji yok, saf kurumsal metin)
        toast.innerHTML = msg;
        
        document.body.appendChild(toast);
        
        // Animasyonu tetiklemek icin reflow beklemesi
        void toast.offsetWidth;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        
        this.activeToast = toast;

        this.toastTimeoutId = setTimeout(() => { 
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
                if (this.activeToast === toast) this.activeToast = null;
            }, 400); 
        }, 3500);
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
