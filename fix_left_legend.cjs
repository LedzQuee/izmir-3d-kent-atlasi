const fs = require('fs');
const legendCode = `
export function createLegend(items: { name: string, color: string, onToggle: (checked: boolean) => void }[]) {
    const existing = document.getElementById('legend-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'legend-container';
    
    // Baslangicta katlanmis, saydam ve zarif sol kenar tasarimi
    container.style.cssText = \`
        position: fixed; left: 0; top: 10%;
        width: 50px; max-height: 80vh;
        background: rgba(20, 25, 30, 0.4); backdrop-filter: blur(8px);
        border-radius: 0 15px 15px 0; border: 1px solid rgba(255,255,255,0.1);
        border-left: none; box-shadow: 5px 5px 20px rgba(0,0,0,0.3);
        color: white; font-family: "Segoe UI", Roboto, Helvetica, sans-serif;
        z-index: 100; overflow: hidden; 
        transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        display: flex; flex-direction: column;
    \`;

    // Kapaliyken Gorunen Ikon (Katmanlar Ikonu)
    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = ' ☰ '; 
    iconDiv.style.cssText = \`
        min-width: 50px; height: 50px; display: flex;
        align-items: center; justify-content: center; font-size: 22px;
        cursor: pointer; opacity: 1; transition: 0.3s;
    \`;
    container.appendChild(iconDiv);

    // Icerik Konteyneri (Baslangicta saydam ve tiklanamaz)
    const content = document.createElement('div');
    content.style.cssText = \`
        width: 280px; opacity: 0; transition: opacity 0.3s, transform 0.4s;
        padding: 0 20px 20px 20px; pointer-events: none; overflow-y: auto;
        transform: translateX(-20px); box-sizing: border-box;
    \`;
    
    content.innerHTML += \`<style>
        #legend-container div::-webkit-scrollbar { width: 5px; }
        #legend-container div::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 5px; }
    </style>\`;

    const title = document.createElement('h3');
    title.textContent = 'Harita Katmanları';
    title.style.cssText = 'margin: 5px 0 15px 0; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; color: #ff9900;';
    content.appendChild(title);

    items.forEach(item => {
        const row = document.createElement('label');
        row.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; padding: 6px 8px; border-radius: 6px;';
        row.onmouseover = () => { row.style.background = 'rgba(255, 255, 255, 0.1)'; row.style.color = '#ff9900'; };
        row.onmouseout = () => { row.style.background = 'transparent'; row.style.color = '#fff'; };

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.style.cssText = 'margin-right: 12px; accent-color: #ff9900; transform: scale(1.2); cursor: pointer;';
        
        cb.onchange = (e) => {
            item.onToggle((e.target as HTMLInputElement).checked);
            // Sol menuden bir sey degistiginde DistrictManager'i tetikle
            window.dispatchEvent(new CustomEvent('layerToggled'));
        };

        const colorBox = document.createElement('div');
        colorBox.style.cssText = \`width: 14px; height: 14px; background: \${item.color}; border-radius: 50%; margin-right: 10px; border: 1px solid rgba(255,255,255,0.5);\`;

        const span = document.createElement('span');
        span.textContent = item.name;

        row.appendChild(cb);
        row.appendChild(colorBox);
        row.appendChild(span);
        content.appendChild(row);
    });

    container.appendChild(content);
    document.body.appendChild(container);

    // Hover (Uzerine Gelme) Animasyonlari
    container.onmouseenter = () => {
        container.style.width = '280px';
        container.style.background = 'rgba(20, 25, 30, 0.85)';
        iconDiv.style.opacity = '0';
        iconDiv.style.height = '10px';
        content.style.opacity = '1';
        content.style.pointerEvents = 'auto';
        content.style.transform = 'translateX(0)';
    };
    
    container.onmouseleave = () => {
        container.style.width = '50px';
        container.style.background = 'rgba(20, 25, 30, 0.4)';
        iconDiv.style.opacity = '1';
        iconDiv.style.height = '50px';
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
        content.style.transform = 'translateX(-20px)';
    };
}
`;
fs.writeFileSync('src/utils/legend.ts', legendCode);
