import codecs

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('right: -300px;', "right: 0;")
text = text.replace('let open = false;', 'let open = true;')
text = text.replace("toggleBtn.innerHTML = '&#8249;';", "toggleBtn.innerHTML = '&#8250;';")

with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.write(text)
