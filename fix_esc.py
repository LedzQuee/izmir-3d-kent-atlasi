import codecs

with codecs.open('src/main.ts', 'r', 'utf-8') as f:
    text = f.read()

text2 = """
// ESC tuşu ile kapatma
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ((window as any).closeInfo) (window as any).closeInfo();
    }
});
"""

if "e.key === 'Escape'" not in text:
    text += text2
    with codecs.open('src/main.ts', 'w', 'utf-8') as f:
        f.write(text)
