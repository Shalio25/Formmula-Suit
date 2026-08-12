/* ==========================================================================
   FIREBASE CONFIG — WAJIB DIISI SENDIRI
   ==========================================================================
   1. Buka https://console.firebase.google.com -> Add project (gratis).
   2. Di project, buka "Build > Realtime Database" -> Create Database
      -> pilih lokasi terdekat -> mode "Start in test mode" (untuk main
      santai sama teman; lihat README.md untuk rules yang direkomendasikan).
   3. Buka "Project settings" (ikon gerigi) -> scroll ke "Your apps"
      -> klik ikon "</>" (Web) -> daftarkan app -> Firebase akan
      menampilkan objek firebaseConfig seperti di bawah ini.
   4. Copy-paste nilai punyamu ke object FIREBASE_CONFIG di bawah,
      GANTIKAN semua nilai "GANTI_..." ini. Simpan file, selesai.
   ========================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAUHReZaWlejxqsJGcwxwS1prGcOw3FJ8U",
  authDomain: "f1racesing.firebaseapp.com",
  databaseURL: "https://f1racesing-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "f1racesing",
  storageBucket: "f1racesing.firebasestorage.app",
  messagingSenderId: "722160512246",
  appId: "1:722160512246:web:ff6b11616878306ae2d0d7",
};

// Jangan diubah di bawah ini — dipakai otomatis oleh script.js
let db = null;
let firebaseReady = false;
try {
  if (typeof firebase !== "undefined" && !FIREBASE_CONFIG.apiKey.startsWith("GANTI")) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    firebaseReady = true;
  }
} catch (err) {
  console.error("Firebase gagal diinisialisasi:", err);
  firebaseReady = false;
}
