# 🤖 WhatsApp Auto Order Bot

Bot WhatsApp untuk menjual produk digital (file) secara **otomatis 24 jam**,
mulai dari menampilkan katalog, membuat invoice QRIS via **Xendit**, mengecek
pembayaran, hingga mengirim file produk — semua tanpa admin.

## ✨ Fitur

- `/menu` — menu sambutan + tombol 📦 Lihat Produk & 👤 Owner
- Katalog produk dalam bentuk **Single Select List** (product picker)
- Invoice QRIS otomatis (Xendit) lengkap dengan Order ID & status
- Tombol ✅ Cek Pembayaran + 🔄 Cek Kembali jika belum bayar
- Webhook Xendit untuk pengiriman produk **real-time** begitu dibayar
- Anti pengiriman produk ganda (idempotent)
- `/restock` (reply file) — Owner tambah produk, ID & metadata otomatis
- `/produk`, `/edit`, `/hapus` — manajemen produk khusus Owner
- Database SQLite (produk, order, payment, log aktivitas)
- Struktur modular: `commands/`, `events/`, `database/`, `payments/`, `products/`, `utils/`, `config/`

## 📦 Struktur Folder

```
whatsapp-bot/
├── config/          # Konfigurasi pusat (file control)
├── commands/         # Logic tiap command/menu
├── events/           # Handler pesan, koneksi, webhook
├── database/         # SQLite + models (product, order, payment)
├── payments/          # Integrasi Xendit
├── products/          # Manajemen file produk
├── utils/             # Logger & helper
├── sessions/          # Auth Baileys (auto-generate)
├── storage/products/  # File produk yang di-restock
└── index.js           # Entry point
```

## 🚀 Instalasi Lokal

```bash
npm install
cp .env.example .env
# lalu isi .env: BOT_NAME, OWNER_NUMBERS, PAIRING_NUMBER, XENDIT_API_KEY, dll
npm start
```

Karena `USE_PAIRING_CODE=true`, bot akan menampilkan **Pairing Code** di
terminal. Masukkan kode tersebut di WhatsApp Anda:
**Perangkat Tertaut > Tautkan dengan nomor telepon**.

## ⚙️ Konfigurasi Utama (`.env`)

| Variabel | Keterangan |
|---|---|
| `BOT_NAME` | Nama toko yang muncul di pesan bot |
| `PAIRING_NUMBER` | Nomor WhatsApp bot (untuk pairing code) |
| `OWNER_NUMBERS` | Nomor owner, pisahkan koma jika lebih dari satu |
| `XENDIT_API_KEY` | Secret API Key dari dashboard Xendit |
| `XENDIT_WEBHOOK_TOKEN` | Verification Token webhook Xendit |
| `XENDIT_CALLBACK_URL` | URL publik untuk menerima webhook, contoh: `https://domainanda.com/webhook/xendit` |
| `PORT` | Port server webhook Express |

Daftarkan `XENDIT_CALLBACK_URL` (diakhiri `/webhook/xendit`) di dashboard
Xendit pada bagian **Callback URLs > QR Code**.

## 🛠️ Deploy ke Railway

1. Push project ini ke GitHub.
2. Buat project baru di Railway, hubungkan repo.
3. Isi Environment Variables sesuai `.env.example`.
4. Railway otomatis menjalankan `node index.js` (lihat `railway.json`).
5. Setelah deploy, ambil domain publik Railway untuk `XENDIT_CALLBACK_URL`.

> Catatan: karena Baileys butuh menyimpan sesi login, gunakan **Volume**
> pada Railway agar folder `sessions/` tidak hilang saat redeploy.

## 🛠️ Deploy ke Pterodactyl

1. Gunakan egg **Node.js** (Generic Node.js / Yolks Node 18+).
2. Upload seluruh isi project ke folder server.
3. Startup command: `node index.js` (atau gunakan `ecosystem.config.js` + PM2 jika egg mendukung).
4. Isi variabel environment di tab **Startup** sesuai `.env.example`, atau
   upload file `.env` langsung via file manager.
5. Buka port yang sama dengan `PORT` di `.env` agar webhook Xendit bisa diakses (butuh reverse proxy/domain jika ingin publik).
6. Start server, lalu cek console untuk **Pairing Code**.

## 🔒 Keamanan

- Webhook diverifikasi menggunakan header `x-callback-token` dari Xendit.
- Setiap order hanya bisa dibayar & dikirim **satu kali** (flag `delivered`).
- Semua transaksi & aktivitas penting dicatat ke tabel `logs`.

## 📋 Perintah Owner

| Command | Fungsi |
|---|---|
| Kirim file lalu reply `/restock` | Tambah produk baru otomatis |
| `/produk` | Lihat semua produk |
| `/edit PRD-0001 harga=25000 nama=Nama Baru` | Edit produk |
| `/hapus PRD-0001` | Hapus produk |

---
Dibuat dengan Node.js + Baileys + Xendit. Silakan sesuaikan pesan & branding sesuai kebutuhan toko Anda.
