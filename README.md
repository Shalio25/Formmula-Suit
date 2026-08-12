# LIGHTS OUT — F1 Suit Race

Game batu-gunting-kertas bertema F1, 3 lap, dua mode main:
- **Satu Device** — pass & play, langsung jalan tanpa setup apa pun.
- **Online (Kode Room)** — dua device berbeda, real-time, pakai Firebase Realtime Database.

## Cara pakai cepat (mode Satu Device saja)
Cukup buka `index.html` di browser. Selesai, tidak perlu setup apa pun.

## Cara aktifkan mode Online (kode room)

Mode online butuh Firebase Realtime Database sebagai "jembatan" data antar device (gratis, tanpa perlu bikin server sendiri).

1. Buka https://console.firebase.google.com → **Add project** → beri nama bebas → selesaikan wizard (boleh matikan Google Analytics).
2. Di sidebar kiri project, buka **Build → Realtime Database** → **Create Database**.
   - Pilih lokasi server terdekat (misalnya `asia-southeast1`).
   - Pilih **Start in test mode** untuk sementara (supaya cepat dicoba bareng teman).
3. Setelah database dibuat, buka tab **Rules** dan pastikan isinya seperti ini (mode test biasanya sudah otomatis begini, expired dalam 30 hari — perpanjang atau ganti manual jika perlu):
   ```json
   {
     "rules": {
       "rooms": {
         "$code": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```
   ⚠️ Catatan: rules ini terbuka (siapa saja yang tahu URL project bisa baca/tulis). Cukup aman untuk main santai berdua teman, karena kode room bersifat acak dan hanya dibagikan manual. Jangan pakai untuk data sensitif.
4. Kembali ke **Project settings** (ikon gerigi di pojok kiri atas) → scroll ke bagian **Your apps** → klik ikon **`</>`** (Web) → daftarkan app dengan nama bebas → Firebase akan menampilkan blok kode `firebaseConfig`.
5. Buka file `firebase-config.js` di folder ini, ganti semua nilai `"GANTI_..."` dengan nilai asli dari `firebaseConfig` yang tadi ditampilkan Firebase. Simpan.
6. Buka `index.html` lagi (boleh dari device manapun yang sudah punya file yang sama). Pilih **Online — Kode Room**:
   - Salah satu pemain klik **Buat Room Baru** → dapat kode 5 karakter → kirim kode itu ke teman (lewat chat/WA, dll).
   - Pemain lain klik **Gabung Room**, masukkan kode yang sama, klik **Gabung**.
   - Begitu berdua terhubung, permainan otomatis lanjut ke fase Pinky Promise → Garasi → Starting Lights → Balapan, semuanya real-time.

## Struktur file
- `index.html` — struktur & semua layar (mode select, lobby, promise, garasi, lights, race, finish).
- `style.css` — desain responsif bertema F1.
- `script.js` — semua logika game (lokal & online).
- `firebase-config.js` — **kamu isi sendiri** dengan config project Firebase-mu.

## Keterbatasan yang perlu diketahui
- Jika salah satu device me-refresh halaman di tengah permainan online, koneksi ke room akan putus (perlu buat/gabung room baru). Ini sengaja dibuat sederhana agar kode tetap ringan dan mudah dipahami — bisa dikembangkan lagi dengan menyimpan kode room di `localStorage` bila kamu mau menambahkannya sendiri.
- Firebase free tier (Spark plan) lebih dari cukup untuk main santai; tidak perlu kartu kredit.
