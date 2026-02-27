# دليل الإعداد السريع

## الخطوات الأساسية

### 1. تثبيت الحزم
```bash
npm run install:all
```

### 2. إعداد قاعدة البيانات

تأكد من أن MongoDB يعمل على جهازك:
```bash
# على macOS باستخدام Homebrew
brew services start mongodb-community

# أو على Linux
sudo systemctl start mongod

# أو استخدم MongoDB Atlas (سحابي)
```

### 3. إعداد متغيرات البيئة

في مجلد `backend`:
```bash
cd backend
cp .env.example .env
```

قم بتعديل ملف `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/omari_studio
JWT_SECRET=your-very-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 4. إنشاء حساب المدير
```bash
cd backend
npm run seed:admin
```

سيتم إنشاء حساب ببيانات:
- البريد: `admin@omari.com`
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

### 5. تشغيل التطبيق

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### 6. الوصول للتطبيق

- **واجهة المستخدم**: http://localhost:3000
- **API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

## استكشاف الأخطاء

### مشكلة في الاتصال بقاعدة البيانات
- تأكد من أن MongoDB يعمل
- تحقق من `MONGODB_URI` في ملف `.env`

### مشكلة في Port
- إذا كان Port 5000 أو 3000 مستخدم، قم بتغييره في:
  - Backend: ملف `.env` (PORT)
  - Frontend: `vite.config.ts` (server.port)

### مشكلة في الحزم
```bash
# احذف node_modules وأعد التثبيت
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## البناء للإنتاج

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# الملفات ستكون في frontend/dist
```
