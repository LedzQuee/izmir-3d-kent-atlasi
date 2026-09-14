const https = require('https');
https.get('https://openapi.izmir.bel.tr/api/ibb/cbs/taksiduraklari', (res) => {
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    const data = JSON.parse(body);
    const records = data.onemliyer || [];
    const seen = new Set();
    let exactDupes = 0;
    records.forEach(r => {
      const lat = parseFloat(r.ENLEM || r.enlem);
      const lng = parseFloat(r.BOYLAM || r.boylam);
      const c = lat.toFixed(6) + "," + lng.toFixed(6);
      if (seen.has(c)) exactDupes++;
      seen.add(c);
    });
    console.log("Taksi Toplam Kayit: " + records.length);
    console.log("Birebir Ayni Koordinat: " + exactDupes);
    console.log("Benzersiz Nokta: " + seen.size);
  });
});
