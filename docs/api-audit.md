# İzmir 3D Kent Atlası – API Audit Raporu (Faz 1)

## Genel API Davranışları
- **CORS Davranışı:** Tüm API'ler CORS politikasına açıktır.
- **Response Süresi:** Ortalama yanıt süresi 150ms - 350ms arasındadır.
- **Pagination (Sayfalama):** ?sayfa=N parametresi sunucu tarafından yok sayılmaktadır. API'ler daima sayfa 1'i döndürmektedir.
- **API Hata Davranışı:** Hatalı parametre gönderildiğinde ise API genelde hata fırlatmamakta, parametreyi yok sayıp default sonucu (sayfa 1) dönmektedir.

## Veri Seti Kalite Özetleri

**Dataset: İzBB Hizmet Noktaları**
- Toplam kayıt: 269
- Geçerli koordinat: 269
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Afet ve Acil Durum Toplanma Alanları**
- Toplam kayıt: 2380
- Geçerli koordinat: 2380
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Taksi Durakları**
- Toplam kayıt: 406
- Geçerli koordinat: 406
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 5+ 
- Durum: GOOD

**Dataset: Plajlar**
- Toplam kayıt: 35
- Geçerli koordinat: 35
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 3 
- Durum: PARTIAL

**Dataset: Meydanlar**
- Toplam kayıt: 96
- Geçerli koordinat: 96
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 8+ 
- Durum: GOOD

**Dataset: Kaplıcalar**
- Toplam kayıt: 3
- Geçerli koordinat: 3
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Havaalanları**
- Toplam kayıt: 5
- Geçerli koordinat: 5
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 2
- Durum: GOOD

**Dataset: Şehir İçi / Şehirler Arası Terminaller**
- Toplam kayıt: 20
- Geçerli koordinat: 20
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 2
- Durum: GOOD

**Dataset: Huzurevleri**
- Toplam kayıt: 64
- Geçerli koordinat: 64
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: PROBLEMATIC

**Dataset: Çocuk ve Gençlik Merkezleri**
- Toplam kayıt: 15
- Geçerli koordinat: 15
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Toplum Merkezleri**
- Toplam kayıt: 51
- Geçerli koordinat: 51
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Yetiştirme Yurtları**
- Toplam kayıt: 5
- Geçerli koordinat: 5
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

**Dataset: Aile Dayanışma Merkezleri**
- Toplam kayıt: 2
- Geçerli koordinat: 2
- Eksik koordinat (lat=0, lng=0): 0
- Eksik isim (null/boş): 0
- Duplicate: 0
- Durum: GOOD

## Detaylı Analiz: Noktaya Yakın Otobüs Durakları API’si
- x hangi koordinat?: Boylam (Longitude)
- y hangi koordinat?: Enlem (Latitude)
- inCoordSys nedir?: Girilen koordinatın sistemi (Örn: WGS84 için 4326)
- outCoordSys nedir?: Dönen yanıtın koordinat sistemi
- Hangi koordinat sistemleri destekleniyor?: EPSG:4326 (WGS84) ve EPSG:32635 (UTM)
- Response'da durak ID var mı?: EVET (DURAKID)
- Durak adı var mı?: EVET (ADI)
- Koordinat var mı?: EVET (X ve Y olarak dönüyor)
- Mesafe var mı?: EVET (MESAFE)
- Mesafe hangi birimde?: Metre

**Gerçek Koordinat Testleri (Konak, Karşıyaka, Bostanlı):**
Tüm testlerde inCoordSys=4326&outCoordSys=4326 gönderilmiştir. Ancak API WGS84 değerlerini metrik olarak algıladığı için tüm sonuçlarda en yakın durak 4.223.613 metre uzaklıktaki "Gökçealan Tarla" durağı çıkmıştır. Faz 4'te proj4js kütüphanesi ile dönüşüm yapılacaktır.
