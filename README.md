# Izmir 3D Kent Atlasi

Izmir Buyuksehir Belediyesi Acik Veri Portali API'leri kullanilarak gelistirilen, sehrin 14 farkli veri katmanini 3 boyutlu (3D) uzayda gorsellestiren ve interaktif sorgulama yapilmasina olanak taniyan performans odakli web projesidir. (Staj Projesi)

## Ozellikler
- 13 Statik Acik Veri Katmani: Taksi duraklarindan afet toplanma alanlarina (2380 kayit) kadar tum verilerin GPS koordinatlari 3D uzaya (Three.js) donusturulmustur.
- Dinamik Otobus Duragi Algoritmasi: Haritaya tiklanan (WGS-84) herhangi bir noktanin 2 KM capi icindeki en yakin otobus duraklari anlik olarak API'den (UTM anomali duzeltmesiyle) cekilip cizdirilir.
- Clean Architecture ve Optimizasyon: Vanilla TypeScript ile kurulan projede Merkezi API Service, UIManager ve Memory Leak (Bellek Sizintisi) onleyici ozel 'dispose' mimarileri kullanilmistir.
- 60 FPS Performans: Binlerce 3D obje THREE.InstancedMesh (Single Draw Call) yontemiyle render edilerek performans kayiplari onlenmistir.
- Akilli Arayuz (Tooltip): Tiklanan noktalarin bilgileri, ekran sinirlarini (Boundary Detection) hesaplayip disari tasmayi onleyecek akilli bir yon bulma algoritmasi ile acilir.

## Teknolojiler
- Dil: TypeScript (Strict Mode)
- 3D Motoru: Three.js (MapControls)
- Build Araci: Vite

## Kurulum ve Calistirma
```bash
npm install
npm run dev
```
