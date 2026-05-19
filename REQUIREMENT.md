# **Group Mart**

## **หัวข้อโครงงาน (Project Title)**

**ภาษาไทย:** การพัฒนาเว็บแอปพลิเคชันตลาดซื้อขายสินค้ามือสองและคอมมูนิตี้สังคมออนไลน์
**ภาษาอังกฤษ:** Development of a Second Hand Marketplace and Community Web Application

### **1. ที่มาและความสำคัญ (Background and Rationale)**

ในปัจจุบัน การซื้อขายสินค้ามือสองได้รับความนิยมสูง แต่แพลตฟอร์มที่มีอยู่ในตลาดยังมีช่องว่าง กล่าวคือ แพลตฟอร์ม E-marketplace ทั่วไปขาดมิติของ "สังคม (Community)" ที่ผู้ซื้อและผู้ขายสามารถแลกเปลี่ยนความรู้เกี่ยวกับสินค้าได้ ในขณะที่แพลตฟอร์ม Social Media ที่มีการซื้อขายก็ขาดระบบจัดการคำสั่งซื้อ (Order Management) และความปลอดภัยในการชำระเงิน ส่งผลให้เกิดปัญหาการโกงและความยุ่งยากในการตรวจสอบสถานะสินค้า

โครงงานนี้จึงมุ่งเน้นพัฒนาระบบที่ผสานจุดเด่นของ **Social Community** (การรวมกลุ่มตามความสนใจ) เข้ากับ **Marketplace** (ระบบซื้อขายที่มีมาตรฐาน) โดยเน้นระบบการเจรจาต่อรองราคา (Negotiation/Offer) ระบบการค้นหาด้วย AI (AI-Powered Search) และการสร้างความน่าเชื่อถือผ่านระบบรีวิวและระบบโซเชียลกราฟ (Follow System) เพื่อแก้ปัญหาข้างต้น

### **2. วัตถุประสงค์ (Objectives)**

1. เพื่อพัฒนาระบบเว็บแอปพลิเคชันสำหรับซื้อขายสินค้ามือสองที่รองรับการจัดการคำสั่งซื้อและการชำระเงิน
2. เพื่อสร้างพื้นที่คอมมูนิตี้ (Community Groups) ให้ผู้ใช้งานสามารถแลกเปลี่ยนความรู้ โพสต์ถามตอบ และรีวิวสินค้าได้
3. เพื่อพัฒนาระบบเจรจาต่อรองราคา (Offer System) ที่ช่วยให้ผู้ซื้อและผู้ขายตกลงราคากันได้อย่างยืดหยุ่นก่อนเกิดคำสั่งซื้อ
4. เพื่อสร้างระบบความน่าเชื่อถือ (Reliability) ผ่านการตรวจสอบประวัติ ระบบรีวิว และระบบผู้ติดตาม (Follow/Following)
5. เพื่อประยุกต์ใช้เทคโนโลยี AI (Vector Search) ในการเพิ่มประสิทธิภาพการค้นหาสินค้าและโพสต์ที่แม่นยำ

### **3. ขอบเขตของระบบ (System Scope)**

### **3.1 กลุ่มผู้ใช้งาน (User Roles)**

1. **ผู้เยี่ยมชมทั่วไป (Guest):** สามารถดูสินค้า ค้นหา และอ่านโพสต์สาธารณะได้
2. **สมาชิก (Member):** สามารถเป็นได้ทั้ง "ผู้ซื้อ" และ "ผู้ขาย" ในบัญชีเดียว มีระบบโปรไฟล์และสามารถติดตาม (Follow) ผู้ใช้คนอื่นได้
3. **ผู้ดูแลระบบ (Admin):** จัดการหมวดหมู่หลัก (Category), จัดการการรายงานปัญหา (Report & Moderation) และตรวจสอบการใช้งานที่ผิดปกติ (Ban/Warning)

### **3.2 ฟังก์ชันการทำงานหลัก (Functional Requirements)**

**A. ระบบจัดการสมาชิกและความปลอดภัย (Authentication & User Profile)**

- รองรับการลงทะเบียนและเข้าสู่ระบบผ่าน Email/Password และ Google OAuth
- จัดการข้อมูลส่วนตัว (Profile), ข้อมูลบัญชีธนาคาร (Bank/PromptPay) และที่อยู่จัดส่ง
- แสดงคะแนนความน่าเชื่อถือ (Reliability Score) ประวัติการรีวิว และระบบผู้ติดตาม (Follow/Following Graph)

**B. ระบบคอมมูนิตี้และเนื้อหา (Community & Content)**

- **Structure:** จัดโครงสร้างแบบ หมวดหมู่หลัก (Category) -> กลุ่มความสนใจ (Groups) เช่น หมวดกีฬา -> กลุ่มรองเท้าวิ่ง
- **Posts:** รองรับการสร้างโพสต์ 2 รูปแบบ: General Post (ทั่วไป) และ Selling Post (ขายสินค้าพร้อมระบุสต็อก)
- **Interaction:** กดถูกใจ (Like), แสดงความคิดเห็น (Comment) และแชร์โพสต์
- **AI Vector Search:** ค้นหาโพสต์และสินค้าด้วยเทคโนโลยี Vector Embedding (`pgvector`) เพื่อความแม่นยำเชิงความหมาย

**C. ระบบซื้อขายและการเจรจา (Marketplace & Negotiation)**

- **Offer System (กลไกการเสนอราคาแบบโต้ตอบ):** 
    - ผู้ซื้อเสนอราคา -> ผู้ขายปฏิเสธ/ยอมรับ/ยื่นข้อเสนอใหม่ (Counter Offer) สลับกันไปมาได้ (Tracking via `counterCount`, `lastCounteredBy`)
- **Order Flow:** เมื่อข้อเสนอตกลงกันได้ ระบบจะสร้างคำสั่งซื้อ (Order) และตัดสต็อกสินค้านั้นทันที

**D. ระบบการเงินและการจัดส่ง (Payment & Fulfillment)**

- ผู้ซื้ออัปโหลดหลักฐานการโอนเงิน (Slip) และผู้ขายกดยืนยันการชำระเงิน
- ระบบติดตามสถานะสินค้า: รอตรวจสอบ (To Verify) -> รอจัดส่ง (To Ship) -> รอรับสินค้า (To Receive) -> สำเร็จ (Completed)

**E. ระบบสื่อสาร รีวิว และแจ้งเตือน (Communication, Review & Notification)**

- **Real-time Chat:** แชท 1-ต่อ-1 ระหว่างผู้ใช้
- **Notification:** ระบบแจ้งเตือน Real-time เมื่อมีคนต่อราคา, อัปเดตสถานะคำสั่งซื้อ หรือถูกตักเตือน
- **Review & Report:** ผู้ซื้อให้คะแนนผู้ขายหลังจบการขาย และระบบรายงาน (Report System) สำหรับสแปมหรือเนื้อหาไม่เหมาะสม

### **4. เครื่องมือและเทคโนโลยีที่ใช้ (Tools & Technologies)**

#### **Frontend Development**
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS v4 (Using `@theme` and `oklch` color space), shadcn/ui
- **State & Data:** `react-hook-form`, `zod`, `axios`
- **Real-time:** `socket.io-client`

#### **Backend Development**
- **Framework:** NestJS (Modular Architecture: Microservices/Gateway Ready)
- **Language:** TypeScript
- **Database:** PostgreSQL (with `pgvector` extension for AI Search)
- **ORM:** Prisma
- **Real-time:** Socket.io Gateway
- **API Structure:** แบ่งเป็น Modules (common, marketplace, social, users, admin/reports)

#### **Infrastructure & DevOps**
- **Deployment:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (Dev, UAT, Prod)
- **Cloud/Orchestration:** Kubernetes Ready (ตามแผนการขยายสเกล)

### **5. ประโยชน์ที่คาดว่าจะได้รับ (Expected Outcomes)**

1. ได้แพลตฟอร์มต้นแบบที่สามารถใช้งานได้จริงในการซื้อขายสินค้ามือสอง
2. ลดปัญหาความไม่มั่นใจในการซื้อขายผ่านการตรวจสอบประวัติและระบบรีวิว
3. ผู้ใช้งานมีความสะดวกสบายในการเจรจาต่อรองราคาผ่านระบบที่เป็นมาตรฐาน ลดความซ้ำซ้อนในการแชท

### **6. ข้อเสนอแนะสำหรับการพัฒนาต่อยอด (Recommendations)**

1. **ระบบจัดการคลังสินค้า (Warehouse/Inventory Management System):** พัฒนาระบบให้รองรับสินค้าแบบ Multi-variant และการจัดการสต็อกที่ซับซ้อนขึ้นสำหรับผู้ขายรายใหญ่
2. **ระบบคำขอเพิ่มหมวดหมู่และกลุ่ม (Community/Category Request System):** เพิ่มกระบวนการให้ผู้ใช้งานสามารถยื่นคำร้องต่อ Admin เพื่อสร้างกลุ่มหรือหมวดหมู่ใหม่ที่ยังไม่มีในระบบ เพื่อให้คอมมูนิตี้เติบโตตามความต้องการของผู้ใช้อย่างแท้จริง