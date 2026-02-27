# استوديو العمري - نظام إدارة الاستوديو

نظام إدارة شامل لاستوديو التصوير الفوتوغرافي مع دعم كامل للغة العربية وواجهة RTL.

## المميزات

- ✅ إدارة العملاء
- ✅ إدارة الخدمات (حجز وسريع)
- ✅ إدارة المنتجات والمخزون
- ✅ إدارة الموردين
- ✅ إدارة الحجوزات
- ✅ الخدمات السريعة / المبيعات المباشرة
- ✅ إدارة المصروفات
- ✅ إدارة المشتريات
- ✅ التقارير والتحليلات
- ✅ نظام مصادقة JWT مع صلاحيات (مدير/موظف)
- ✅ واجهة عربية كاملة مع دعم RTL

## التقنيات المستخدمة

### Backend
- Node.js + TypeScript
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Swagger API Documentation

### Frontend
- React + TypeScript
- Vite
- React Router
- React Query
- React Hook Form
- Arabic RTL Support

## التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- MongoDB

### خطوات التثبيت

1. تثبيت جميع الحزم:
```bash
npm run install:all
```

2. إعداد متغيرات البيئة:
```bash
cd backend
cp .env.example .env
# قم بتعديل ملف .env وإضافة إعدادات MongoDB و JWT_SECRET
```

3. إنشاء حساب مدير:
```bash
cd backend
npm run seed:admin
```

4. تشغيل Backend:
```bash
npm run dev:backend
```

5. تشغيل Frontend (في terminal جديد):
```bash
npm run dev:frontend
```

6. الوصول للتطبيق:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## بيانات الدخول الافتراضية

بعد تشغيل `seed:admin`:
- البريد الإلكتروني: `admin@omari.com`
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

## البنية

```
omari-studio/
├── backend/
│   ├── src/
│   │   ├── models/          # نماذج قاعدة البيانات
│   │   ├── routes/          # مسارات API
│   │   ├── middleware/      # Middleware
│   │   ├── services/        # منطق الأعمال
│   │   ├── utils/           # أدوات مساعدة
│   │   └── scripts/         # سكريبتات مساعدة
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # مكونات React
│   │   ├── pages/           # صفحات التطبيق
│   │   ├── contexts/        # React Contexts
│   │   └── utils/           # أدوات مساعدة
│   └── package.json
└── README.md
```

## API Endpoints

جميع الـ endpoints محمية بـ JWT Authentication (ما عدا `/api/auth/login`)

### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - معلومات المستخدم الحالي

### Customers
- `GET /api/customers` - قائمة العملاء
- `GET /api/customers/:id` - تفاصيل عميل
- `POST /api/customers` - إضافة عميل
- `PUT /api/customers/:id` - تحديث عميل
- `DELETE /api/customers/:id` - حذف عميل

### Services
- `GET /api/services` - قائمة الخدمات
- `POST /api/services` - إضافة خدمة
- `PUT /api/services/:id` - تحديث خدمة
- `DELETE /api/services/:id` - حذف خدمة

### Products
- `GET /api/products` - قائمة المنتجات
- `POST /api/products` - إضافة منتج
- `PUT /api/products/:id` - تحديث منتج
- `DELETE /api/products/:id` - حذف منتج

### Suppliers
- `GET /api/suppliers` - قائمة الموردين
- `POST /api/suppliers` - إضافة مورد
- `PUT /api/suppliers/:id` - تحديث مورد
- `DELETE /api/suppliers/:id` - حذف مورد

### Bookings
- `GET /api/bookings` - قائمة الحجوزات
- `POST /api/bookings` - إضافة حجز
- `PUT /api/bookings/:id` - تحديث حجز
- `DELETE /api/bookings/:id` - حذف حجز

### Quick Services
- `GET /api/quick-services` - قائمة الخدمات السريعة
- `POST /api/quick-services` - إضافة خدمة سريعة

### Expenses
- `GET /api/expenses` - قائمة المصروفات
- `POST /api/expenses` - إضافة مصروف
- `PUT /api/expenses/:id` - تحديث مصروف
- `DELETE /api/expenses/:id` - حذف مصروف

### Purchases
- `GET /api/purchases` - قائمة المشتريات
- `POST /api/purchases` - إضافة مشتريات

### Reports
- `GET /api/reports/daily` - تقرير يومي
- `GET /api/reports/monthly` - تقرير شهري
- `GET /api/reports/profit-per-service` - الربح حسب الخدمة
- `GET /api/reports/supplier-statement/:supplierId` - كشف حساب مورد

## التطوير

### Backend
```bash
cd backend
npm run dev    # تشغيل في وضع التطوير
npm run build  # بناء المشروع
npm start      # تشغيل الإنتاج
```

### Frontend
```bash
cd frontend
npm run dev    # تشغيل في وضع التطوير
npm run build  # بناء المشروع
npm preview    # معاينة الإنتاج
```

## الترخيص

ISC
