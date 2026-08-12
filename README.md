# 🏁 LIGHTS OUT — F1 Suit Race

**Batu · Gunting · Kertas — 3 lap, satu pemenang, satu janji kelingking yang tidak bisa diingkari.**

Game batu-gunting-kertas bertema Formula 1 (F1) yang dikembangkan dengan HTML, CSS, dan Vanilla JavaScript. Permainan ini berlangsung dalam 3 lap dan mengharuskan pemain membuat *Pinky Promise* (janji kelingking) tentang hukuman/tantangan bagi yang kalah di awal balapan.

## 🎮 Fitur Utama
*   **Kustomisasi Garasi (Garage):** Pemain dapat menyesuaikan warna mobil, compound ban, sayap aerodinamis (aero wing), stiker, hingga livery kustom sebelum balapan dimulai.
*   **Sistem Balapan 3 Lap:** Setiap kemenangan ronde (batu/gunting/kertas) memajukan mobil 1 lap. Hasil seri memajukan kedua mobil 0.5 lap.
*   **Animasi Starting Lights:** Sensasi *lights out* khas formasi start Formula 1 sebelum balapan dimulai.
*   **Sistem Podium & Tagihan Janji:** Hasil balapan akan menampilkan selebrasi podium (lengkap dengan confetti) untuk pemenang dan langsung menagih janji kelingking di layar untuk pemain yang kalah.

## 🕹️ Mode Permainan

Game ini mendukung 2 mode bermain:

1.  **Mode Satu Device (Local Pass & Play):**
    *   Mainkan berdua secara bergantian di satu HP atau laptop.
    *   Terdapat "Privacy Screen" saat pergantian giliran agar lawan tidak bisa mengintip pilihan mobil atau pilihan suit (batu/gunting/kertas).
    *   Langsung main tanpa perlu setup tambahan!

2.  **Mode Online (Kode Room):**
    *   Bermain secara *real-time* di dua perangkat yang berbeda.
    *   Pemain 1 (Host) membuat *room*, lalu membagikan 5 digit kode unik (misal: `X7A9K`).
    *   Pemain 2 bergabung dengan memasukkan kode tersebut.
    *   Setiap pergerakan, status siap di garasi, dan pilihan suit disinkronisasikan menggunakan Firebase Realtime Database.

