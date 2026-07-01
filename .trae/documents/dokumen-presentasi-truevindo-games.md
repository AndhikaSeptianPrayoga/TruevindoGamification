# Truevindo Games

Dokumen ini disusun untuk kebutuhan presentasi produk dan solusi. Isinya dibuat lebih ringkas daripada dokumen teknis utama, dengan diagram sederhana, pesan utama per slide, dan poin bicara yang mudah dibawakan saat meeting.

## 1. Ringkasan Presentasi

### Judul Presentasi
**Truevindo Games: Platform Quiz Interaktif Real-Time untuk Event Corporate**

### Tujuan Presentasi
- Menjelaskan masalah yang diselesaikan oleh Truevindo Games.
- Menunjukkan alur penggunaan yang mudah dipahami oleh admin dan partisipan.
- Menjelaskan arsitektur sistem secara sederhana.
- Menunjukkan kesiapan produk untuk event perusahaan, training, dan engagement internal.

### Durasi Presentasi yang Disarankan
- 7 menit untuk versi singkat.
- 10 sampai 12 menit untuk versi lengkap.

## 2. Struktur Slide yang Disarankan

### Slide 1. Opening
**Pesan utama**
Truevindo Games adalah platform kuis live yang interaktif seperti Kahoot, tetapi tampil lebih profesional dan cocok untuk lingkungan perusahaan.

**Poin bicara**
- Fokus pada engagement audiens dalam event corporate.
- Tampilan dibuat premium, bersih, dan presentation-friendly.
- Host dan peserta bergerak dalam flow yang sinkron dan mudah dioperasikan.

### Slide 2. Masalah yang Diselesaikan
**Pesan utama**
Banyak aktivitas interaktif di event perusahaan terasa kurang engaging, atau justru terlalu playful dan tidak sesuai dengan citra brand.

```mermaid
flowchart TD
    A["Event perusahaan butuh audiens yang aktif"] --> B["Tools biasa kurang interaktif"]
    B --> C["Game tools umum terlalu playful"]
    C --> D["Brand corporate terasa tidak konsisten"]
    D --> E["Dibutuhkan platform quiz live yang tetap profesional"]
```

**Poin bicara**
- Event internal sering butuh ice breaking, knowledge check, atau activation.
- Solusi yang terlalu formal membuat audiens pasif.
- Solusi yang terlalu seperti game anak tidak cocok untuk brand perusahaan.
- Truevindo Games mengisi celah tersebut.

### Slide 3. Solusi yang Ditawarkan
**Pesan utama**
Truevindo Games menggabungkan interaksi real-time, kemudahan kontrol host, dan desain visual corporate dalam satu platform.

```mermaid
flowchart LR
    A["Corporate visual"] --> D["Truevindo Games"]
    B["Quiz real-time"] --> D["Truevindo Games"]
    C["Host control yang sederhana"] --> D["Truevindo Games"]
    D --> E["Event lebih hidup dan tetap profesional"]
```

**Poin bicara**
- Partisipan cukup masuk dengan PIN dan nama.
- Host cukup mengikuti alur lurus: waiting room, mulai quiz, hasil jawaban, next, podium.
- Sistem sinkron secara real-time agar semua layar bergerak bersama.

### Slide 4. User Flow End-to-End
**Pesan utama**
Flow aplikasi sengaja dibuat sederhana agar mudah dipahami oleh operator event maupun peserta.

```mermaid
flowchart LR
    A["Admin pilih quiz"] --> B["Buat sesi live"]
    B --> C["PIN dan QR dibagikan"]
    C --> D["Peserta join ke waiting room"]
    D --> E["Host mulai quiz"]
    E --> F["Peserta menjawab"]
    F --> G["Sistem tampilkan hasil"]
    G --> H["Host lanjut ke soal berikutnya"]
    H --> I["Sistem masuk ke podium akhir"]
```

**Poin bicara**
- Tidak ada flow bercabang yang membingungkan.
- Host diarahkan langkah demi langkah.
- Setelah soal terakhir, sistem langsung mengarahkan ke podium.

### Slide 5. Flow Partisipan
**Pesan utama**
Pengalaman partisipan dibuat cepat, ringan, dan nyaman untuk mobile.

```mermaid
flowchart TD
    A["Masukkan PIN"] --> B["Masukkan nama"]
    B --> C["Masuk waiting room"]
    C --> D["Terima pertanyaan secara live"]
    D --> E["Pilih 1 dari 4 jawaban"]
    E --> F["Lihat hasil jawaban"]
    F --> G["Lanjut ke soal berikutnya"]
    G --> H["Lihat hasil akhir"]
```

**Poin bicara**
- Tidak perlu akun untuk partisipan.
- Semua interaksi cukup melalui browser.
- UI dibuat fokus agar cepat dipahami dalam suasana event.

### Slide 6. Flow Admin / Host
**Pesan utama**
Flow host dibuat seperti operator panggung: jelas, linear, dan minim keputusan yang tidak perlu.

```mermaid
flowchart TD
    A["Pilih quiz dari library"] --> B["Masuk waiting room"]
    B --> C["Mulai quiz"]
    C --> D["Pantau jawaban masuk"]
    D --> E["Lihat hasil jawaban"]
    E --> F["Next ke pertanyaan berikutnya"]
    F --> G["Ulangi sampai soal terakhir"]
    G --> H["Masuk otomatis ke podium"]
```

**Poin bicara**
- Host tidak perlu berpikir tentang langkah teknis.
- Tombol aksi dibuat sesuai bahasa operasional admin.
- Sangat cocok untuk MC, trainer, atau game master non-teknis.

### Slide 7. Arsitektur Sistem Sederhana
**Pesan utama**
Sistem terdiri dari frontend web, backend API, realtime gateway, dan database untuk persistence.

```mermaid
flowchart LR
    A["Participant Web"] --> C["Frontend React"]
    B["Admin Host Screen"] --> C["Frontend React"]
    C --> D["REST API"]
    C --> E["Socket.IO Realtime"]
    D --> F["Service Layer"]
    E --> F["Service Layer"]
    F --> G["PostgreSQL / Supabase"]
```

**Poin bicara**
- Frontend menangani tampilan peserta dan admin.
- Backend mengatur quiz, session, scoring, dan orchestration.
- Socket.IO menjaga sinkronisasi live.
- PostgreSQL menyimpan quiz, peserta, jawaban, dan histori sesi.

### Slide 8. Diagram Data yang Mudah Dipahami
**Pesan utama**
Struktur data dirancang sederhana: quiz memiliki pertanyaan, sesi memiliki peserta, dan jawaban tersimpan per peserta.

```mermaid
erDiagram
    QUIZZES ||--|{ QUESTIONS : "memiliki"
    QUIZZES ||--o{ GAME_SESSIONS : "dijalankan menjadi"
    GAME_SESSIONS ||--o{ PARTICIPANTS : "diikuti oleh"
    GAME_SESSIONS ||--o{ ANSWER_SUBMISSIONS : "mengumpulkan"
    QUESTIONS ||--o{ ANSWER_SUBMISSIONS : "dijawab pada"
    PARTICIPANTS ||--o{ ANSWER_SUBMISSIONS : "mengirim"
```

**Poin bicara**
- Quiz adalah template.
- Game session adalah instance live saat quiz dijalankan.
- Jawaban disimpan per peserta dan per pertanyaan.
- Struktur ini mendukung reporting dan analytics setelah event.

### Slide 9. Nilai Bisnis
**Pesan utama**
Truevindo Games bukan hanya alat quiz, tetapi alat engagement untuk acara perusahaan.

```mermaid
flowchart LR
    A["Engagement audiens meningkat"] --> D["Nilai bisnis"]
    B["Knowledge retention lebih tinggi"] --> D["Nilai bisnis"]
    C["Brand event terlihat lebih premium"] --> D["Nilai bisnis"]
```

**Poin bicara**
- Cocok untuk training, onboarding, townhall, sales kick-off, dan activation.
- Menambah partisipasi aktif tanpa mengorbankan image perusahaan.
- Data hasil permainan dapat dipakai untuk evaluasi internal.

### Slide 10. Status Implementasi dan Roadmap
**Pesan utama**
Fondasi produk sudah berjalan, dan roadmap selanjutnya mengarah ke persistence penuh, reporting, dan analytics.

```mermaid
flowchart LR
    A["Phase 1: Realtime quiz flow"] --> B["Phase 2: Database persistence"]
    B --> C["Phase 3: Session history"]
    C --> D["Phase 4: Analytics dashboard"]
    D --> E["Phase 5: Enterprise hardening"]
```

**Poin bicara**
- Realtime flow admin dan partisipan sudah terbentuk.
- Database persistence sedang diaktifkan penuh dengan Prisma dan Supabase.
- Tahap berikutnya fokus pada histori sesi, analytics, dan hardening produksi.

## 3. Ringkasan Diagram Utama

Jika hanya ingin membawa 3 diagram paling penting saat presentasi, gunakan tiga diagram ini:

### Diagram 1. End-to-End Flow
```mermaid
flowchart LR
    A["Pilih quiz"] --> B["Buat sesi"]
    B --> C["Bagikan PIN"]
    C --> D["Peserta join"]
    D --> E["Mulai quiz"]
    E --> F["Jawab soal"]
    F --> G["Lihat hasil"]
    G --> H["Podium akhir"]
```

### Diagram 2. Host Flow
```mermaid
flowchart TD
    A["Waiting room"] --> B["Mulai quiz"]
    B --> C["Pantau jawaban"]
    C --> D["Hasil jawaban"]
    D --> E["Next soal"]
    E --> F["Podium"]
```

### Diagram 3. Arsitektur Sistem
```mermaid
flowchart LR
    A["Frontend"] --> B["API dan Realtime"]
    B --> C["Business Logic"]
    C --> D["Database"]
```

## 4. Script Bicara Singkat

Berikut versi singkat narasi yang bisa langsung dipakai saat presentasi:

> Truevindo Games adalah platform quiz interaktif real-time yang dirancang khusus untuk event perusahaan. Produk ini mengambil kekuatan engagement seperti Kahoot, tetapi dibungkus dengan pengalaman visual yang lebih corporate, lebih rapi, dan lebih mudah dikendalikan oleh host. Dari sisi pengguna, flow-nya sangat sederhana: admin memilih quiz, membuat sesi, membagikan PIN, peserta join, quiz berjalan secara live, hasil jawaban tampil langsung, lalu sesi ditutup dengan podium. Dari sisi teknis, sistem dibangun dengan frontend web, backend realtime berbasis Socket.IO, dan database PostgreSQL agar data quiz, peserta, dan hasil permainan bisa disimpan dan dianalisis. Nilai utamanya adalah engagement yang tinggi tanpa mengorbankan citra profesional perusahaan.

## 5. Tips Membawakan Presentasi

- Gunakan maksimal 1 ide utama per slide.
- Tampilkan diagram terlebih dahulu, lalu jelaskan alur dari kiri ke kanan atau atas ke bawah.
- Saat menjelaskan host flow, tekankan bahwa admin tidak dibuat bingung dengan terlalu banyak tombol.
- Saat menjelaskan arsitektur, cukup fokus pada 4 blok: frontend, API, realtime, database.
- Akhiri dengan nilai bisnis, bukan hanya fitur teknis.

## 6. Rekomendasi Slide Final

Jika ingin dibuat menjadi deck final, urutan yang paling aman adalah:

1. Judul dan positioning produk
2. Masalah
3. Solusi
4. User flow end-to-end
5. Flow admin
6. Flow partisipan
7. Arsitektur sistem
8. Struktur data
9. Nilai bisnis
10. Roadmap
