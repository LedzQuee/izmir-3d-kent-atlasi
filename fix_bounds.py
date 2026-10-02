import codecs

with codecs.open('src/core/Engine.ts', 'r', 'utf-8') as f:
    text = f.read()

replacement = """
        this.map.on('load', () => {
            // Zorla sinirlari uygula
            this.map.setMaxBounds([
                [25.8, 37.5], // SW
                [28.8, 39.5]  // NE
            ]);
            this.map.setMinZoom(8);
"""

text = text.replace("this.map.on('load', () => {", replacement)

with codecs.open('src/core/Engine.ts', 'w', 'utf-8') as f:
    f.write(text)
