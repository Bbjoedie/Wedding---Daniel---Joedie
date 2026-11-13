# 💌 Undangan Digital — Daniel & Joedie

Undangan pernikahan digital (bahasa Inggris) bertema **Korean aesthetic · minimalist · sea waves**
dengan palet **butter yellow – pastel – neutral**.

**Tanggal:** Sabtu, 06 Februari 2027 · **Lokasi:** Roxy Hotel Lawas, Sarawak

## Fitur

- Cover "Open Invitation" → musik latar otomatis berputar (loop) setelah tamu menekan tombol, ada tombol mute/unmute melayang
- Countdown `day : hour : minute : seconds` menuju 06 Feb 2027, 09:00 (waktu Sarawak, UTC+8)
- Detail acara (Holy Matrimony 09.00 am & Reception 11.00 am), tombol **View Map** dan **Add to Calendar**
- Galeri foto prewedding dengan lightbox
- **RSVP** terhubung ke Google Sheet (nama, konfirmasi kehadiran, jumlah tamu, pesan)
- **Wishes wall** — pesan tamu langsung muncul begitu RSVP dikirim, dan pesan tamu lain ikut terlihat
- E-gift dengan tombol **Copy Account Number** + tombol Wedding Registry
- Nama tamu personal lewat link: `...?to=Nama Tamu`

## Isi folder

```
wedding-invitation/
├── index.html              ← halaman undangan (HTML + CSS + JS dalam 1 file)
├── README.md               ← panduan ini
├── apps-script/
│   └── Code.gs             ← kode Google Apps Script (backend RSVP) — TIDAK di-upload ke GitHub, dipasang di Google Sheet
└── assets/
    ├── img/                ← 5 foto (sudah dioptimasi untuk web)
    └── music/
        └── dalam-satu-doa.mp3   ← musik latar (sudah dikompres 128 kbps, ±3,3 MB)
```

> Upload ke GitHub: `index.html`, folder `assets/`, dan `README.md`.
> `Code.gs` boleh ikut di repo sebagai arsip, tapi yang berfungsi adalah salinan yang ditempel di Google Sheet kamu.

---

## LANGKAH 1 — Siapkan Google Sheet

1. Buka <https://sheets.google.com> → **Blank spreadsheet**.
2. Beri nama, misalnya `RSVP Wedding Daniel & Joedie`.

## LANGKAH 2 — Pasang Apps Script

1. Di Google Sheet: menu **Extensions → Apps Script**.
2. Hapus isi file `Code.gs` bawaan, lalu **copy–paste seluruh isi** `apps-script/Code.gs`.
3. Klik ikon 💾 **Save**.
4. Pilih fungsi **`setup`** di dropdown atas, lalu klik **Run ▶**.
5. Muncul permintaan izin → **Review permissions** → pilih akun Google kamu →
   *Advanced* → *Go to project (unsafe)* → **Allow**.
   (Peringatan "unsafe" normal karena script buatan sendiri.)
6. Kembali ke Google Sheet. Sekarang ada 2 tab:
   - **RSVP** — semua jawaban tamu masuk di sini (Timestamp, Name, Attendance, Guests, Message)
   - **Summary** — rekap otomatis (jumlah respons, total tamu, jumlah tamu Holy Matrimony & Reception) untuk keperluan catering/seating

## LANGKAH 3 — Deploy sebagai Web App

1. Di Apps Script: klik **Deploy → New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description:** `RSVP v1`
   - **Execute as:** **Me** (akun kamu)
   - **Who has access:** **Anyone**  ← wajib, supaya tamu tanpa login Google bisa mengirim RSVP
4. Klik **Deploy** → salin **Web app URL** (berbentuk `https://script.google.com/macros/s/AKfycb.../exec`).
5. Tes cepat: tempel URL itu di browser dan tambahkan `?action=wishes` di belakangnya.
   Harus tampil `{"ok":true,"wishes":[]}`.

## LANGKAH 4 — Sambungkan ke undangan

Buka `index.html`, cari blok `CONFIG` di bagian bawah file:

```js
const CONFIG = {
  scriptUrl: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",   // ← tempel URL dari Langkah 3
  weddingDate: "2027-02-06T09:00:00+08:00",
  registryUrl: "",                                       // ← tempel link registry (kalau sudah ada)
  accountNumber: "7066840265"
};
```

- Ganti `scriptUrl` dengan Web app URL kamu.
- Isi `registryUrl` dengan link wedding registry. Selama masih kosong, tombol **Wedding Registry**
  hanya menampilkan notifikasi "Registry link coming soon".

> Selama `scriptUrl` belum diisi, undangan berjalan dalam **preview mode**: form bisa dicoba tapi jawaban tidak disimpan
> (akan ada catatan kuning di bawah tombol Send RSVP). Catatan itu hilang otomatis setelah URL benar.

## LANGKAH 5 — Deploy ke GitHub Pages

1. Buat akun di <https://github.com> (jika belum), lalu **New repository** → nama misalnya `daniel-joedie-wedding` → **Public** → **Create repository**.
2. Klik **uploading an existing file** → drag & drop **`index.html`**, folder **`assets`**, dan **`README.md`** → **Commit changes**.
   (Pastikan folder `assets/img` dan `assets/music` ikut ter-upload. Batas upload via web 25 MB per upload — total proyek ini ±4,3 MB, aman.)
3. Buka **Settings → Pages**.
4. Pada **Build and deployment → Source**: pilih **Deploy from a branch**, Branch: **main**, folder **/ (root)** → **Save**.
5. Tunggu 1–3 menit. Link undangan:
   `https://USERNAME.github.io/daniel-joedie-wedding/`
6. (Opsional tapi disarankan) Supaya preview link di WhatsApp menampilkan foto, di `index.html` ganti
   `<meta property="og:image" content="assets/img/studio-cream.jpg">` menjadi URL lengkap:
   `https://USERNAME.github.io/daniel-joedie-wedding/assets/img/studio-cream.jpg`

### Link personal untuk tiap tamu

Tambahkan `?to=` + nama tamu (spasi jadi `%20`):

```
https://USERNAME.github.io/daniel-joedie-wedding/?to=Aunty%20Mary
https://USERNAME.github.io/daniel-joedie-wedding/?to=Keluarga%20Wong
```

Nama itu muncul di cover ("Dear Aunty Mary") dan otomatis mengisi kolom nama di RSVP.

---

## Cara kerja RSVP

| Field di form | Disimpan di kolom | Nilai |
|---|---|---|
| Your name | **Name** | teks bebas (maks 80 karakter) |
| Will you attend? | **Attendance** | `Yes, Holy Matrimony & Reception` / `Yes, Holy Matrimony only` / `Yes, Reception only` / `Unable to attend either` |
| Number of guests | **Guests** | `0`, `1`, atau `2` (termasuk tamu itu sendiri) |
| Message for the groom & bride | **Message** | teks (maks 300 karakter), boleh kosong |

- Jika tamu memilih *Unable to attend either* → jumlah tamu otomatis **0**. Jika memilih *Yes…* → pilihan 1 atau 2.
- Setelah submit, pesan tamu **langsung muncul** di "Wishes & Messages", dan daftar otomatis menyegarkan diri tiap 45 detik sehingga pesan tamu lain juga terlihat.
- Yang ditampilkan publik hanya **nama, pesan, dan waktu**. Status kehadiran & jumlah tamu hanya ada di Google Sheet kamu.
- Pesan tampil sebagai teks biasa (tidak bisa menyisipkan HTML/script), dan kolom di Sheet berformat teks sehingga input aneh seperti `=FORMULA()` tidak dieksekusi.
- Ada honeypot sederhana untuk mengurangi spam bot.

### Mengecek & tracking RSVP
- Tab **RSVP**: lihat semua jawaban. Bisa dibuat filter (Data → Create a filter), sort, atau diberi warna.
- Tab **Summary**: rekap otomatis, termasuk **Guests at Holy Matrimony** dan **Guests at Reception** untuk hitungan catering.
- Mau menyembunyikan pesan yang tidak pantas? Kosongkan sel **Message** pada baris itu — pesan hilang dari wishes wall di refresh berikutnya.

---

## Kustomisasi cepat (semua di `index.html`)

| Ingin mengubah | Cari / ubah |
|---|---|
| Tanggal & jam countdown | `CONFIG.weddingDate` (format `YYYY-MM-DDTHH:MM:SS+08:00`) |
| Nomor rekening | `CONFIG.accountNumber` (angka yang dicopy) **dan** teks `7066 840 265` di elemen `id="accNo"` |
| Ayat / kutipan | class `verse` (saat ini 1 Korintus 13:13) |
| Teks undangan | class `lead` di section `#invite` |
| Waktu/lokasi acara | section `#event` |
| Durasi di "Add to Calendar" | fungsi "add to calendar" — saat ini Holy Matrimony 09.00–10.30 dan Reception 11.00–14.00 (perkiraan, silakan sesuaikan; waktu ditulis dalam UTC) |
| Warna | variabel di `:root` (`--butter`, `--mist`, `--cream`, …) |
| Ganti foto | timpa file di `assets/img/` dengan nama yang sama (JPG, sisi terpanjang ±1400 px) |
| Ganti musik | timpa `assets/music/dalam-satu-doa.mp3` (disarankan ≤ 4 MB) |

## Update Apps Script setelah deploy

Kalau kamu mengubah `Code.gs` setelah deploy, URL lama **tidak** otomatis memakai kode baru:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL tetap sama.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| RSVP tidak masuk Sheet | Pastikan akses deployment = **Anyone**, `scriptUrl` berakhiran `/exec`, dan `setup` sudah dijalankan + izin disetujui. Tes `…/exec?action=wishes` di browser. |
| Pesan lama tidak muncul di wishes wall | Hanya baris dengan kolom Message terisi yang tampil; maksimal 100 terbaru (`MAX_WISHES` di `Code.gs`). |
| Musik tidak langsung bunyi | Browser (terutama iOS/Safari) hanya mengizinkan audio setelah interaksi — makanya musik mulai saat tamu menekan **Open Invitation**. Jika terblokir, tamu bisa menekan tombol musik di pojok kanan bawah. |
| Foto/musik tidak muncul di GitHub Pages | Nama file bersifat case-sensitive. Pastikan struktur `assets/img/…` dan `assets/music/…` ter-upload persis seperti di atas. |
| Perubahan belum terlihat | GitHub Pages butuh 1–3 menit; lakukan hard refresh (Ctrl/Cmd+Shift+R). |
| Font terlihat berbeda | Font (Cormorant Garamond, Jost, Gowun Batang) dimuat dari Google Fonts — perlu internet. |

## Catatan

- **Hak cipta musik:** lagu "Dalam Satu Doa" (Michela Thea feat. Noven Pratama) dipakai sebagai musik latar pribadi untuk undangan. Pemakaian publik/luas sebaiknya dicek ulang soal lisensi.
- Foto dari fotografer ("mitralidia") masih memuat watermark kecil di beberapa file; pakai versi tanpa watermark bila tersedia.
- Waktu dihitung berdasarkan zona waktu Sarawak (UTC+8), jadi countdown akurat di perangkat tamu di mana pun.

Semoga lancar dan selamat menikah, Daniel & Joedie! 🤍
