import codecs

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    text = f.read()

# Fix Turkish chars in header (which are currently mangled as Veri DaYlm etc.)
text = text.replace('Veri DaYlm', 'Veri Dağılımı')
text = text.replace('le Sralamas', 'İlçe Sıralaması')

# Fix container width expansion by enforcing max-width
text = text.replace(
    'width: 300px;',
    'width: 300px; max-width: 300px; min-width: 300px;'
)

# Open by default so the user sees it immediately
text = text.replace(
    'let open = false;',
    'let open = true;'
)
text = text.replace(
    'right: -300px;',
    'right: 0;'
)
text = text.replace(
    "toggleBtn.innerHTML = '&#8249;';",
    "toggleBtn.innerHTML = '&#8250;';"
)

# Fix text overflow for district names
text = text.replace(
    "nameEl.style.cssText = 'font-size:12px;color:#cbd5e1;font-weight:500;';",
    "nameEl.style.cssText = 'font-size:12px;color:#cbd5e1;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;';"
)

with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.write(text)
