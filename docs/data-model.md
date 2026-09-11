# İzmir 3D Kent Atlası - Veri Modelleri ve Mimari (Faz 1)

Bu doküman, projenin farklı ve karmaşık API'lerinden gelen verileri tek bir standart yapıda (Single Source of Truth) birleştirmek için tasarlanan TypeScript veri modellerini ve mimari yaklaşımı içerir.

## 1. Ortak Veri Modeli (CityPoint)

Tüm katmanların (Hizmet noktaları, taksi durakları, meydanlar, afet toplanma alanları vb.) 3D sahnede ve arayüzde standart bir şekilde işlenebilmesi için `CityPoint` interface'i kullanılacaktır.

```typescript
// src/core/models/CityPoint.ts

export type PointCategory = 
  | 'HIZMET_NOKTASI' 
  | 'AFET_ALANI' 
  | 'TAKSI_DURAGI' 
  | 'PLAJ' 
  | 'MEYDAN' 
  | 'KAPLICA' 
  | 'HAVAALANI' 
  | 'TERMINAL';

export interface CityPoint {
  id: string;                  // Benzersiz kimlik (API'den gelmiyorsa üretilecek)
  category: PointCategory;     // Sahnede renk/ikon belirlemek için
  title: string;               // ADI alanından maplenecek
  district: string;            // ILCE alanından maplenecek
  neighborhood: string;        // MAHALLE alanından maplenecek (nullable)
  address: string;             // YOL ve KAPINO birleştirilerek elde edilecek
  description: string;         // ACIKLAMA alanından (varsa)
  lat: number;                 // ENLEM (kesinlikle parse edilmiş number)
  lng: number;                 // BOYLAM (kesinlikle parse edilmiş number)
  
  // Katmana özel ekstra özellikler (Örn: plaja özel mavi bayrak durumu vb. varsa eklenebilir)
  metadata?: Record<string, any>; 
}
```

## 2. Otobüs Durağı Veri Modeli (Faz 4 İçin)

Noktaya yakın duraklar API'si farklı bir yapı ve koordinat sistemi kullandığı için kendi ayrı modeline sahip olacaktır.

```typescript
// src/core/models/BusStop.ts

export interface BusStop {
  stopId: string;       // durakId
  name: string;         // adi
  distanceMeters: number; // mesafe (hesaplanmış metrik uzaklık)
  lat: number;          // WGS84'e (EPSG:4326) geri çevrilmiş enlem
  lng: number;          // WGS84'e (EPSG:4326) geri çevrilmiş boylam
}
```

## 3. Adapter Pattern (Mimari Karar)

API'lerden gelen ham veriler (Örn: `ILCE`, `ENLEM` gibi isimlendirmeler) UI bileşenlerine ve Three.js katmanına geçmeden önce **Adapter Pattern** kullanılarak `CityPoint` modeline dönüştürülecektir.

Örnek Klasör Mimarisi:
```text
src/
├── api/             # Fetch işlemleri, HTTP istekleri
├── adapters/        # Ham veriyi CityPoint'e çeviren fonksiyonlar
│   ├── AfetAdapter.ts
│   ├── TaksiAdapter.ts
│   └── BaseAdapter.ts
├── core/
│   └── models/      # CityPoint.ts, BusStop.ts
├── layers/          # Three.js 3D nokta (Point/Mesh) sınıfları
├── utils/           # EPSG32635 <-> WGS84 Dönüştürücü, proj4js helpers
└── ui/              # HTML/CSS UI kontrol bileşenleri
```

**Örnek Adapter Kullanımı:**
```typescript
// src/adapters/AfetAdapter.ts
import { CityPoint } from '../core/models/CityPoint';

export function parseAfetData(rawData: any[]): CityPoint[] {
  return rawData.map((item, index) => ({
    id: `afet_${index}`,
    category: 'AFET_ALANI',
    title: item.ADI || 'Bilinmeyen Toplanma Alanı',
    district: item.ILCE || 'Belirtilmemiş',
    neighborhood: item.MAHALLE || '',
    address: `${item.YOL || ''} No:${item.KAPINO || ''}`.trim(),
    description: item.ACIKLAMA || 'Afet ve acil durum toplanma alanı.',
    lat: parseFloat(item.ENLEM),
    lng: parseFloat(item.BOYLAM),
  }));
}
```

Bu yapı sayesinde, API'nin yapısı gelecekte değişse bile yalnızca ilgili Adapter dosyası güncellenecek, uygulamanın geri kalanı (3D sahne, UI vb.) değişiklikten etkilenmeyecektir (Separation of Concerns).
