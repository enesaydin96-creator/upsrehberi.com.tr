# Dotvolt kurumsal site

Statik HTML/CSS/JS site. PHP destekli herhangi bir paylaşımlı hostingde çalışır; veritabanı gerekmez.

## Yükleme
1. Bu klasörün içeriğini hostingdeki `public_html` (veya site kök dizini) içine yükleyin.
2. `api/form.php` içindeki `$TO` (formların gideceği adres) ve `$FROM` (aynı alan adında bir gönderici) değerlerini kontrol edin.
3. Formları canlıda bir kez test edin. E-postalar spam'e düşerse SMTP (PHPMailer) kullanın.

## Yayına alma
`build/build.py` içinde `STAGING = True` iken tüm sayfalar `noindex` ve `robots.txt` aramaya kapalıdır. Dotvolt onayladıktan sonra `False` yapıp yeniden derleyin.

## Önizleme
`site/index.html` dosyasını tarayıcıda açın. Formlar yalnızca PHP'li sunucuda e-posta gönderir.

## İngilizce sürüm
`/en/` altında: ana sayfa, ürün kataloğu, 17 ürün sayfası, nereden alınır, kurumsal, iletişim. Metinler `build/i18n.py` içinde. Destek, garanti, servis ve bayi sayfaları şimdilik yalnızca Türkçe.

## Taslak içerik
`servis-paketleri.html` paket yapısı öneridir; `STAGING = True` iken sayfada taslak notu görünür. Dotvolt onayıyla `build/data.py` içindeki `SERVICE_ROWS` / `SERVICE_PACKS` güncellenmeli.

## İçerik güncelleme
Tüm içerik `build/data.py` dosyasında. Düzenledikten sonra:

```
cd build && pip install jinja2 && python3 build.py
```

Sayfalar `site/` klasörüne yeniden üretilir.

- **Bayi ekleme:** `DEALERS` listesine yeni kayıt.
- **Referans ekleme:** `REFERENCES` listesine kayıt. Liste boşken referans alanı sektör yer tutucularını gösterir.
- **Basın:** `PRESS` (röportaj/haber linkleri) ve `EVENTS` (fuar/bayi toplantısı).
- **Ürün:** `SERIES` listesine yeni seri; görseli `assets/img/products/`, PDF'i `assets/docs/` içine koyun.

## Temin edilmesi gerekenler
- Yüksek çözünürlüklü ürün görselleri: Volt RT Plus (rack), Volt TM, Volt LN Gaming, DVR-MN, DVR-T, kombi regülatörü, EV şarj, jeneratörler. Şu an dotvolt.com.tr'deki mevcut görsellere bağlı.
- Datasheet: Volt RT Plus 6–10 kVA, Volt TM (temiz sürüm), DVR-T, EV şarj, jeneratörler, DT 9/12/18/20/26/44/65 Ah aküler.
- Bayi ve servis listesi (il, adres, telefon, hizmet türü).
- Referans projeleri (proje, sektör, il, kapsam, varsa logo).
- Diğer röportaj ve haber bağlantıları.
- Kurumsal gerçek rakamlar (bayi sayısı, ihracat ülkesi vb.), garanti süreleri.
- KVKK metninin hukuk onayı.
- Garanti sorgulama şu an mevcut `dotvolt.tr/garanti` sistemine yönlendiriyor; API verilirse site içinde sonuç gösterilebilir.
