const fs = require('fs');
let main = fs.readFileSync('src/main.ts', 'utf8');

const catcher = `
window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; left:10px; background:red; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'HATA OLUSTU: <br>' + event.message + '<br>Dosya: ' + event.filename + '<br>Satir: ' + event.lineno;
    document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; right:10px; background:darkred; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'PROMISE HATASI: <br>' + (event.reason ? event.reason.toString() : 'Bilinmiyor');
    document.body.appendChild(errorDiv);
});
`;

if (!main.includes('HATA OLUSTU')) {
    main = catcher + '\n' + main;
    fs.writeFileSync('src/main.ts', main);
}
