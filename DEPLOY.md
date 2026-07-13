# Deploy qo'llanmasi (Render + Neon, hammasi tekin)

Arxitektura:

- **Backend** — Render Web Service (Node, free tier)
- **Frontend** — Render Static Site (tekin)
- **Baza** — Neon Postgres (free tier, ~512 MB)
- **Rasm/video/hujjatlar** — diskda emas, **to'g'ridan-to'g'ri Neon bazasida** (`files` jadvali, `bytea`).
  Render free tierda doimiy disk yo'q — har deploy'da fayllar o'chib ketardi, shuning uchun fayllar bazaga yoziladi.

---

## 1. Neon — baza yaratish

1. [neon.tech](https://neon.tech) da ro'yxatdan o'ting, yangi **Project** yarating.
2. Dashboard'dan **Connection string** ni oling (**Pooled connection** variantini tanlang).
   U taxminan shunday ko'rinadi:
   ```
   postgresql://user:parol@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Shu satrni saqlab qo'ying — bu `DATABASE_URL` bo'ladi.

## 2. Kodni GitHub'ga chiqarish

```bash
cd C:\Users\ERNAZAR\Desktop\NMPI
git init
git add .
git commit -m "Deploy uchun tayyorlandi"
# GitHub'da bo'sh repo yarating, keyin:
git remote add origin https://github.com/SIZNING_LOGIN/nmpi.git
git push -u origin main
```

`.env` fayllar `.gitignore`da — ular GitHub'ga chiqmaydi (chiqmasligi ham kerak).

## 3. Render — Blueprint orqali (tavsiya)

Repo ildizida `render.yaml` bor, shundan foydalanamiz:

1. [render.com](https://render.com) da ro'yxatdan o'ting.
2. **New → Blueprint** → GitHub repo'ni ulang.
3. Render ikkita servis taklif qiladi: `nmpi-backend` va `nmpi-frontend`. Yaratishda so'raladigan qiymatlar:

   **nmpi-backend:**
   | O'zgaruvchi | Qiymat |
   |---|---|
   | `DATABASE_URL` | Neon'dan olingan pooled connection string |
   | `ADMIN_LOGIN` | admin login (o'zingiz tanlang) |
   | `ADMIN_PASSWORD` | kuchli parol |
   | `FRONTEND_URL` | hozircha bo'sh qoldiring, frontend chiqqach to'ldirasiz |
   | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Render o'zi generatsiya qiladi |

   **nmpi-frontend:**
   | O'zgaruvchi | Qiymat |
   |---|---|
   | `VITE_API_URL` | `https://nmpi-backend.onrender.com/api` (backend URL + `/api`) |

4. Backend deploy bo'lgach uning URL'ini (masalan `https://nmpi-backend.onrender.com`) frontend'ning `VITE_API_URL`iga, frontend URL'ini esa backend'ning `FRONTEND_URL`iga yozing va ikkalasini **Manual Deploy → Clear cache & deploy** qiling.

   > Servis nomlari band bo'lsa Render boshqa nom taklif qiladi — URLlarni shunga mos yozing.

Migratsiyalar avtomatik: backend build paytida `npx prisma migrate deploy` ishlaydi (`render.yaml`da yozilgan).

## 4. Boshlang'ich ma'lumotlar (seed)

Render free tierda shell yo'q, shuning uchun seed'ni lokal kompyuterdan Neon'ga qarshi ishlatamiz:

```bash
cd backend
# .env dagi DATABASE_URL ni vaqtincha Neon'nikiga almashtiring, keyin:
npm run db:seed
# tugagach .env ni lokalga qaytaring
```

## 5. Tekshirish

- `https://nmpi-backend.onrender.com/api/health` → `{"status":"ok"}`
- Frontend'ni oching, admin bilan kiring, rasm yuklab ko'ring — URL `.../api/files/<id>` ko'rinishida bo'ladi va fayl bazada saqlanadi.

---

## Muhim cheklovlar (free tier)

- **Neon 512 MB**: fayl yuklash chegarasi `MAX_FILE_SIZE_MB=25`. Rasmlar bemalol sig'adi, lekin **katta videolarni bazaga yuklamang** — 512 MB tez to'ladi. Video uchun eng yaxshi yechim: YouTube'ga yuklab, havolasini material sifatida qo'shish. Keraksiz fayllarni `DELETE /api/files/:id` (admin) bilan o'chirish mumkin.
- **Render free "uxlaydi"**: 15 daqiqa trafik bo'lmasa backend uyquga ketadi, birinchi so'rov ~50 soniya kutilishi mumkin. Bu normal.
- **Eski lokal fayllar**: `backend/uploads/` dagi fayllar deployga chiqmaydi. Lokal bazadagi kontent ham Neon'ga avtomatik o'tmaydi — deploydan keyin materiallarni admin panel orqali qayta yuklang.
