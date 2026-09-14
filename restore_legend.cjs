const fs = require('fs');
const originalLegend = `
export function createLegend(items: { name: string, color: string, onToggle: (checked: boolean) => void }[]) {
    const existing = document.getElementById('legend-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'legend-container';
    
    // Ilk baştaki KATI, SABIT ve NET OKUNUR tasarim
    container.style.cssText = \`
        position: absolute; left: 20px; top: 20px;
        background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px; padding: 15px; width: 250px;
        color: white; font-family: sans-serif; z-index: 100;
        backdrop-filter: blur(4px); box-sizing: border-box;
    \`;

    const title = document.createElement('h3');
    title.textContent = 'Harita Katmanları';
    title.style.cssText = 'margin-top: 0; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #444; padding-bottom: 10px; color: #ff9900; text-align: center;';
    container.appendChild(title);

    items.forEach(item => {
        const row = document.createElement('label');
        row.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px; cursor: pointer; font-size: 13px;';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.style.marginRight = '10px';
        
        cb.onchange = (e) => {
            item.onToggle((e.target as HTMLInputElement).checked);
            window.dispatchEvent(new CustomEvent('layerToggled'));
        };

        const colorBox = document.createElement('div');
        colorBox.style.cssText = \`width: 14px; height: 14px; background: \${item.color}; border-radius: 3px; margin-right: 8px;\`;

        const span = document.createElement('span');
        span.textContent = item.name;
        span.style.color = '#fff';

        row.appendChild(cb);
        row.appendChild(colorBox);
        row.appendChild(span);
        container.appendChild(row);
    });

    document.body.appendChild(container);
}
`;
fs.writeFileSync('src/utils/legend.ts', originalLegend);
