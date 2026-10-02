import codecs

with codecs.open('src/ui/UIManager.ts', 'r', 'utf-8') as f:
    code = f.read()

code = code.replace('pointer-events: none;', 'pointer-events: auto;')

old_prev = '(window as any).prevPoi = () => {'
new_prev = '''(window as any).closeInfo = () => {
    UIManager.hideInfo();
    if ((UIManager as any).autoCloseTimeout) clearTimeout((UIManager as any).autoCloseTimeout);
    window.dispatchEvent(new CustomEvent('clearBusStops'));
};

(window as any).prevPoi = () => {'''
code = code.replace(old_prev, new_prev)

old_html = 'html += `</div>`;\n        this.showInfo(html);'
new_html = '''        html += `
            <button onclick="window.closeInfo()" style="margin-left:8px; background:rgba(255,255,255,0.1); border:none; color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; font-weight:bold; line-height:1; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                &times;
            </button>
        </div>`;
        this.showInfo(html);'''
code = code.replace(old_html, new_html)

old_info = 'this.infoBox.innerHTML = html;'
new_info = '''if ((this as any).autoCloseTimeout) clearTimeout((this as any).autoCloseTimeout);
        this.infoBox.innerHTML = html;
        
        (this as any).autoCloseTimeout = setTimeout(() => {
            if ((window as any).closeInfo) (window as any).closeInfo();
        }, 12000);'''
code = code.replace(old_info, new_info)

with codecs.open('src/ui/UIManager.ts', 'w', 'utf-8') as f:
    f.write(code)
