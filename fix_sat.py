import codecs

with codecs.open('src/core/Engine.ts', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace(
    "'esri-satellite': {",
    "'google-satellite': {"
)
text = text.replace(
    "tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],",
    "tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],"
)
text = text.replace(
    "maxzoom: 17, // 18 ve ustu zoomlarda Esri map data not available resmi dondurdugu icin 17 de sabitleyip resmi buyuturuz",
    "maxzoom: 21, // Google Satellite yuksek cozunurluk destekler"
)
text = text.replace(
    "attribution: '(c) Esri'",
    "attribution: '(c) Google'"
)
text = text.replace(
    "source: 'esri-satellite',",
    "source: 'google-satellite',"
)

with codecs.open('src/core/Engine.ts', 'w', 'utf-8') as f:
    f.write(text)
