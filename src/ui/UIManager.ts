export class UIManager {
    static busStopMode: boolean = false;
    static infoBox: HTMLDivElement;
    static loader: HTMLDivElement;
    static toastEl: HTMLDivElement;
    static toastTimeoutId: any = null;

    static init() {
        this.infoBox = document.createElement('div');
        this.infoBox.style.cssText = `
            position: absolute;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            color: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
            display: none;
            min-width: 220px;
            max-width: 320px;
            z-index: 999999;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            pointer-events: none;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(this.infoBox);
        
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

        this.toastEl = document.createElement('div');
        this.toastEl.style.cssText = `
            position: fixed;
            top: 30px; /* Bildirim yukariya tasindi */
            left: 50%;
            transform: translateX(-50%) translateY(-20px); /* Yukaridan asagi inme efekti icin */
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
            border-bottom: 3px solid transparent;
        `;
        document.body.appendChild(this.toastEl);
    }

    static showLoading() { this.loader.style.display = 'block'; }
    static hideLoading() { this.loader.style.display = 'none'; }

    static showToast(msg: string, isError = false) {
        if (this.toastTimeoutId) {
            clearTimeout(this.toastTimeoutId);
        }

        const accentColor = isError ? '#ef4444' : '#3b82f6'; 
        this.toastEl.style.borderBottomColor = accentColor;
        this.toastEl.innerHTML = msg;
        
        void this.toastEl.offsetWidth;
        this.toastEl.style.opacity = '1';
        this.toastEl.style.transform = 'translateX(-50%) translateY(0)';

        this.toastTimeoutId = setTimeout(() => { 
            this.toastEl.style.opacity = '0';
            this.toastEl.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 3000);
    }

    static activePoiList: any[] = [];
    static activePoiIndex: number = 0;

    static showMultiInfo(pois: any[]) {
        if (!pois || pois.length === 0) return;
        this.activePoiList = pois;
        this.activePoiIndex = 0;
        this.renderActivePoi();
    }

    static renderActivePoi() {
        const poi = this.activePoiList[this.activePoiIndex];
        if (!poi) return;
        
        const r = poi.record;
        let name = r.ADI || r.Adi || r.adi || r.ACIKLAMA || 'Bilinmiyor';
        const ilce = r.ILCE || r.Ilce || r.ilce;
        if (ilce) {
            name = `${name} (${ilce})`;
        }
        
        let extraHtml = '';
        if (r['DURAK NO']) {
            extraHtml += `<span style="margin-left: 14px; padding-left: 14px; border-left: 1px solid rgba(255,255,255,0.2); color:#94a3b8; font-size:13px;">No: <strong style="color:#f8fafc;">${r['DURAK NO']}</strong></span>`;
        }
        if (r.MESAFE) {
            extraHtml += `<span style="margin-left: 14px; padding-left: 14px; border-left: 1px solid rgba(255,255,255,0.2); color:#fbbf24; font-size:13px;">Uzaklık: <strong style="color:#f8fafc;">${r.MESAFE}</strong></span>`;
        }
        
        let html = `
            <div style="display:flex; align-items:center; gap: 12px;">
                <span style="color:${poi.color};font-weight:600;">${poi.layerName}:</span>
                <span style="color:#f8fafc;font-weight:500;font-size:14px">${name}</span>
                ${extraHtml}
        `;

        if (this.activePoiList.length > 1) {
            html += `
                <div style="display:flex; align-items:center; gap: 8px; margin-left: 12px; padding-left: 12px; border-left: 1px solid rgba(255,255,255,0.2);">
                    <button onclick="window.prevPoi()" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold; padding:0 4px;">&lt;</button>
                    <span style="font-size:12px; color:#94a3b8;">${this.activePoiIndex + 1} / ${this.activePoiList.length}</span>
                    <button onclick="window.nextPoi()" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold; padding:0 4px;">&gt;</button>
                </div>
            `;
        }
        
        html += `</div>`;
        this.showInfo(html);
    }

    static showInfo(html: string) {
        this.infoBox.innerHTML = html;
        this.infoBox.style.display = 'block';
        
        // Üst-orta alana sabitle (Tek bir çubuk)
        this.infoBox.style.position = 'fixed';
        this.infoBox.style.top = '24px';
        this.infoBox.style.left = '50%';
        this.infoBox.style.right = 'auto';
        this.infoBox.style.transform = 'translateX(-50%)';
        this.infoBox.style.minWidth = 'unset';
        this.infoBox.style.maxWidth = 'none'; // Taşmayı engellemek için max-width'i kaldır
        this.infoBox.style.whiteSpace = 'nowrap'; // Yazıyı tek satırda tut
        this.infoBox.style.padding = '12px 24px';
        this.infoBox.style.borderRadius = '30px'; // Hap şeklinde
        this.infoBox.style.borderLeft = 'none';
        this.infoBox.style.border = '1px solid rgba(255,255,255,0.15)';
        this.infoBox.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.6)';
    }

    static hideInfo() { this.infoBox.style.display = 'none'; }
}

// Global functions for buttons in UIManager HTML
(window as any).prevPoi = () => {
    if (UIManager.activePoiList.length > 0) {
        UIManager.activePoiIndex = (UIManager.activePoiIndex - 1 + UIManager.activePoiList.length) % UIManager.activePoiList.length;
        UIManager.renderActivePoi();
    }
};

(window as any).nextPoi = () => {
    if (UIManager.activePoiList.length > 0) {
        UIManager.activePoiIndex = (UIManager.activePoiIndex + 1) % UIManager.activePoiList.length;
        UIManager.renderActivePoi();
    }
};
