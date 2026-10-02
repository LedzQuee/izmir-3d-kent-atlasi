import codecs
import re

with codecs.open('src/core/DistrictManager.ts', 'r', 'utf-8') as f:
    text = f.read()

replacement = """const container = document.createElement('div');
        container.id = 'district-right-sidebar';
        container.style.cssText = `
            position: fixed;
            right: 0px;
            top: 20px;
            bottom: 20px;
            width: 300px;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 16px 0 0 16px;
            color: #f1f5f9;
            font-family: "Segoe UI", Roboto, sans-serif;
            z-index: 500;
            display: flex;
            flex-direction: column;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -8px 0 32px rgba(0,0,0,0.5);
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.style.cssText = `
            position: absolute;
            left: -44px;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 64px;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.12);
            border-right: none;
            border-radius: 14px 0 0 14px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 22px;
            line-height: 1;
            transition: all 0.2s ease;
            box-shadow: -4px 0 16px rgba(0,0,0,0.4);
        `;
        toggleBtn.innerHTML = '&#8250;';
        toggleBtn.onmouseenter = () => { toggleBtn.style.color = '#fff'; toggleBtn.style.background = 'rgba(30, 41, 59, 0.95)'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.color = '#94a3b8'; toggleBtn.style.background = 'rgba(10, 14, 26, 0.85)'; };

        let open = false;
        toggleBtn.onclick = () => {
            open = !open;
            container.style.right = open ? '0px' : '-300px';
            toggleBtn.innerHTML = open ? '&#8250;' : '&#8249;';
        };
        container.appendChild(toggleBtn);"""

text = re.sub(
    r"const container = document\.createElement\('div'\);\s*container\.id = 'district-right-sidebar';\s*container\.style\.cssText = `.*?container\.appendChild\(toggleBtn\);",
    replacement,
    text,
    flags=re.DOTALL
)

with codecs.open('src/core/DistrictManager.ts', 'w', 'utf-8') as f:
    f.write(text)
