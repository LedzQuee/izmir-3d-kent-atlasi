import codecs
import re

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    text = f.read()

replacement = """header.innerHTML = `
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;margin-bottom:4px">Veri Dağılımı</div>
            <div style="font-size:17px;font-weight:700;color:#f1f5f9;margin-bottom:12px;">İlçe Sıralaması</div>
        `;"""
text = re.sub(
    r'header\.innerHTML = `.*?`;',
    replacement,
    text,
    flags=re.DOTALL
)

with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.write(text)
