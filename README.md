# Habitnja 💙

**Habit Tracker** modern berbasis web dengan tema soft blue.

Lacak kebiasaan harian, hitung streak, lihat kalender progress, dan kelola data dengan mudah.

![License](https://img.shields.io/badge/license-MIT-blue)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JS-7BA3C9)

---

## ✨ Fitur

- Tambah, edit, dan hapus habit
- Centang habit setiap hari
- Hitung **streak** otomatis
- Progress 7 hari terakhir
- **Kalender bulanan** (heatmap progress)
- **Filter** habit (Semua / Belum / Selesai)
- Statistik (Total, Selesai Hari Ini, Streak Terbaik, Completion Rate)
- Pilih warna untuk setiap habit
- **Dark Mode**
- **Export & Import** data (JSON)
- Data tersimpan di LocalStorage
- Fully responsive (HP & Desktop)
- Pure frontend (tidak butuh backend)

---

## 🚀 Cara Deploy ke GitHub Pages

### 1. Buat Repository Baru di GitHub
1. Buka [github.com/new](https://github.com/new)
2. Repository name: `habitnja`
3. Public
4. **Jangan** centang "Add a README file"
5. Klik **Create repository**

### 2. Upload File
**Cara termudah (tanpa Git):**
1. Di halaman repository yang baru dibuat, klik **uploading an existing file**
2. Drag & drop semua file di folder `habitnja`:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
   - `.gitignore`
3. Commit message: `Initial commit - Habitnja`
4. Klik **Commit changes**

**Atau pakai Git:**
```bash
git init
git add .
git commit -m "Initial commit - Habitnja"
git branch -M main
git remote add origin https://github.com/USERNAME/habitnja.git
git push -u origin main
```

### 3. Aktifkan GitHub Pages
1. Repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → Folder: `/ (root)` → **Save**
4. Tunggu 1–2 menit, buka: `https://USERNAME.github.io/habitnja`

---

## 🛠️ Tech Stack

- HTML5
- CSS3 (Custom Properties + Dark Mode)
- Vanilla JavaScript
- Google Fonts → **Inter**
- LocalStorage

---

## 🎨 Warna Tema

| Nama        | Hex       |
|-------------|-----------|
| Soft Blue   | `#7BA3C9` |
| Teal        | `#7DC4B2` |
| Lavender    | `#C5B8E0` |
| Peach       | `#E8A87C` |
| Coral       | `#E07A7A` |

---

## 📁 Struktur File

```
habitnja/
├── index.html
├── style.css
├── app.js
├── README.md
└── .gitignore
```

---

## 📄 License

MIT License — bebas dipakai dan dimodifikasi.

---

Dibuat dengan 💙 untuk membangun kebiasaan baik.
