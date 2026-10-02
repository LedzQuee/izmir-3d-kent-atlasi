import codecs

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace(
    'listArea.style.cssText = `flex:1;overflow-y:auto;padding:10px 14px;`;',
    'listArea.style.cssText = `flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 14px;box-sizing:border-box;`;'
)

text = text.replace(
    'row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:9px 10px;margin-bottom:3px;border-radius:8px;cursor:pointer;transition:background 0.15s;background:rgba(255,255,255,0.04);`;',
    'row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:9px 10px;margin-bottom:3px;border-radius:8px;cursor:pointer;transition:background 0.15s;background:rgba(255,255,255,0.04);box-sizing:border-box;width:100%;`;'
)

text = text.replace(
    'width: 300px; max-width: 300px; min-width: 300px;',
    'width: 300px; max-width: 300px; min-width: 300px; box-sizing: border-box;'
)

with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.write(text)
