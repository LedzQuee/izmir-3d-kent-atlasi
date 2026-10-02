import codecs

with codecs.open('src/main.ts', 'r', 'utf-8') as f:
    text = f.read()

if 'window.addEventListener("clearBusStops"' not in text:
    text += "\nwindow.addEventListener('clearBusStops', () => { if (window.engineInstance) clearNearestStops(window.engineInstance.scene); });\n"

with codecs.open('src/main.ts', 'w', 'utf-8') as f:
    f.write(text)

# Also let's handle "boşluğa tıklama" -> left click on map (maplibregl map)
# Where is map instance available?
# In HTMLMarkerManager maybe, or we can just do it globally:
text2 = """
// Boşluğa (haritaya) tıklanınca bilgi popup'ını ve otobüs duraklarını temizle
window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // Eğer tıklanan şey bir marker veya menü değilse temizle
    if (!target.closest('.maplibregl-marker') && !target.closest('#legend-container') && !target.closest('#info-box') && target.tagName === 'CANVAS') {
        if ((window as any).closeInfo) (window as any).closeInfo();
    }
});
"""
if "target.tagName === 'CANVAS'" not in text:
    text += text2
    with codecs.open('src/main.ts', 'w', 'utf-8') as f:
        f.write(text)
