
export function createLegend(items: { label: string, color: string, onToggle: (checked: boolean) => void }[]) {
  // Eger eski kutucuklu id'ler kaldiysa onlari sil
  const existing1 = document.getElementById('map-legend');
  const existing2 = document.getElementById('legend-container');
  if (existing1) existing1.remove();
  if (existing2) existing2.remove();

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.style.cssText = `
    position: fixed; top: 20px; left: 20px;
    background: rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px; padding: 15px;
    color: white; font-family: sans-serif; font-size: 13px;
    z-index: 100; backdrop-filter: blur(8px); min-width: 250px;
    transition: all 0.3s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 8px; margin-bottom: 8px;';
  
  const title = document.createElement('div');
  title.textContent = 'Harita Katmanları