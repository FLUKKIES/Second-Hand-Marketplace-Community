# Backend API Structure & Documentation

เอกสารนี้สรุปโครงสร้างของ Backend และรายการ API Service ทั้งหมดในโปรเจกต์ เพื่อให้ง่ายต่อการทำความเข้าใจและพัฒนาต่อ

## 📁 Project Structure (โครงสร้างโปรเจกต์)

โปรเจกต์ถูกแบ่งออกเป็น Module หลักๆ ตาม features ดังนี้:

- **`src/common`**: โมดูลส่วนกลางที่ใช้ร่วมกัน เช่น Authentication, File Upload
- **`src/marketplace`**: ฟีเจอร์เกี่ยวกับการซื้อขายสินค้า (Marketplace)
- **`src/social`**: ฟีเจอร์เกี่ยวกับโซเชียลมีเดีย (Community)
- **`src/users`**: การจัดการผู้ใช้งาน (User Management)

---

## 🚀 API Services

รายการ API Endpoint แบ่งตาม Module Controller

### 📌 Common Modules

#### 🔐 Auth Service (`/auth`)
จัดการการยืนยันตัวตน (Authentication)
- `POST /auth/signup` - สมัครสมาชิกใหม่
- `POST /auth/signin` - เข้าสู่ระบบ (Login)
- `GET /auth/google` - Login ด้วย Google
- `GET /auth/google/callback` - Callback จาก Google Login

#### ☁️ Upload Service (`/upload`)
จัดการการอัปโหลดไฟล์รูปภาพ
- `POST /upload/avatar` - อัปโหลดรูปโปรไฟล์
- `POST /upload/post` - อัปโหลดรูปประกอบโพสต์
- `POST /upload/category` - อัปโหลดรูปหมวดหมู่สินค้า
- `POST /upload/product` - อัปโหลดรูปสินค้า
- `POST /upload/slip` - อัปโหลดสลิปโอนเงิน

#### 🔔 Notification Service (`/notifications`)
ระบบแจ้งเตือน
- `GET /notifications` - ดูรายการแจ้งเตือนของฉัน
- `GET /notifications/unread-count` - ดูจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
- `PATCH /notifications/:id/read` - อ่านแจ้งเตือน
- `PATCH /notifications/read-all` - อ่านทั้งหมด

---

### 🛒 Marketplace Modules

#### 📍 Addresses Service (`/addresses`)
จัดการที่อยู่สำหรับการจัดส่ง
- `POST /addresses` - เพิ่มที่อยู่ใหม่
- `GET /addresses/me` - ดูรายการที่อยู่ของฉัน
- `DELETE /addresses/:id` - ลบที่อยู่

#### 💳 Bank Accounts Service (`/bank-accounts`)
จัดการบัญชีธนาคารผู้ขาย
- `POST /bank-accounts` - เพิ่มบัญชีธนาคาร
- `GET /bank-accounts/me` - ดูรายการบัญชีธนาคารของฉัน
- `DELETE /bank-accounts/:id` - ลบบัญชีธนาคาร

#### 🏦 Banks Service (`/banks`)
ข้อมูลรายชื่อธนาคาร
- `GET /banks` - ดูรายชื่อธนาคารทั้งหมดที่ระบบรองรับ

#### 📂 Categories Service (`/categories`)
จัดการหมวดหมู่สินค้า
- `POST /categories` - สร้างหมวดหมู่ (Admin?)
- `GET /categories` - ดูรายการหมวดหมู่ทั้งหมด
- `GET /categories/:id` - ดูรายละเอียดหมวดหมู่
- `PATCH /categories/:id` - แก้ไขหมวดหมู่

#### 🏷️ Offers Service (`/offers`)
ระบบต่อรองราคา
- `POST /offers` - สร้างข้อเสนอราคา (ต่อราคา)
- `PATCH /offers/:id/respond` - ตอบรับ/ปฏิเสธข้อเสนอ
- `GET /offers/incoming` - ดูข้อเสนอที่เข้ามา (สำหรับคนขาย)
- `GET /offers/my-offers` - ดูข้อเสนอที่ส่งไป (สำหรับคนซื้อ)

#### 📦 Orders Service (`/orders`)
ระบบคำสั่งซื้อ
- `POST /orders/create` - สร้างคำสั่งซื้อ
- `GET /orders/buying` - ดูประวัติการซื้อของฉัน
- `GET /orders/selling` - ดูรายการขายของฉัน
- `PATCH /orders/:id/pay` - ผู้ซื้อแจ้งโอนเงิน
- `PATCH /orders/:id/ship` - ผู้ขายแจ้งส่งของ
- `PATCH /orders/:id/receive` - ผู้ซื้อกดรับสินค้า
- `PATCH /orders/:id/cancel` - ยกเลิกคำสั่งซื้อ

#### ⭐ Reviews Service (`/reviews`)
ระบบรีวิวผู้ใช้
- `POST /reviews` - เขียนรีวิวให้ผู้ขาย
- `GET /reviews/user/:userId` - ดูรีวิวทั้งหมดของผู้ใช้คนนั้น

---

### 🌐 Social Modules

#### 💬 Chat Service (`/chat`)
ระบบแชทส่วนตัว
- `GET /chat/rooms` - ดูรายชื่อห้องแชทของฉัน

#### 📝 Comments Service (`/comments`)
ระบบคอมเมนต์ในโพสต์
- `POST /comments` - คอมเมนต์โพสต์
- `GET /comments/post/:postId` - ดูคอมเมนต์ทั้งหมดของโพสต์
- `DELETE /comments/:id` - ลบคอมเมนต์

#### 👥 Groups Service (`/groups`)
กลุ่มคอมมูนิตี้
- `POST /groups` - สร้างกลุ่ม
- `GET /groups` - ค้นหากลุ่ม (filter by categoryId ได้)
- `GET /groups/my-groups` - ดูกลุ่มที่ฉันเข้าร่วม
- `GET /groups/:id` - ดูรายละเอียดกลุ่ม
- `POST /groups/:id/join` - เข้าร่วมกลุ่ม
- `DELETE /groups/:id/leave` - ออกจากกลุ่ม

#### 📰 Posts Service (`/posts`)
โพสต์ทั่วไปและโพสต์ขายของ
- `POST /posts` - สร้างโพสต์
- `GET /posts` - ดูรายการโพสต์ (filter by type, categoryId, groupId)
- `GET /posts/search` - ค้นหาโพสต์
- `GET /posts/:id` - ดูรายละเอียดโพสต์
- `DELETE /posts/:id` - ลบโพสต์

---

### 👤 User Module

#### 🧑 Users Service (`/users`)
จัดการข้อมูลผู้ใช้
- `GET /users/me` - ดูข้อมูลส่วนตัว (My Profile)
- `PATCH /users/me` - แก้ไขข้อมูลส่วนตัว
- `GET /users/:username` - ดูโปรไฟล์สาธารณะของผู้อื่น
