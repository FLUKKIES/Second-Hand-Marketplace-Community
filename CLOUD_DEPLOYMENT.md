# Group Mart: Cloud Deployment Guide

เอกสารฉบับนี้อธิบายขั้นตอนการนำโปรเจกต์ **Group Mart** ขึ้นรันบน Cloud Server (Production Environment) แบบสมบูรณ์ เนื่องจากตัวโปรเจกต์มีการทำ Containerized (Docker) ไว้เรียบร้อยแล้ว การนำขึ้น Cloud จึงมุ่งเน้นไปที่การเตรียม Server และการตั้งค่า Environment

---

## 1. การเตรียมความพร้อมของ Server (Prerequisites)

### 1.1 สเปคของ Server (Server Requirements)
เนื่องจากระบบมีการรัน **Ollama (AI Models - `bge-m3` และ `llama3.2`)** ซึ่งกินทรัพยากรสูงมาก สเปคขั้นต่ำที่แนะนำสำหรับการรันบน Production คือ:
- **CPU**: 4 vCPUs ขึ้นไป
- **RAM**: **16GB - 32GB** (แนะนำ 32GB หรือมี GPU ขนาดเล็ก เพื่อป้องกันสถานการณ์ Out of Memory ตอน AI ทำการ Process)
- **Storage**: 50GB+ (SSD) สำหรับ Image ของ OS, Docker Images, Database, AI Models (~8GB) และไฟล์รูปภาพของ User
- **OS**: Ubuntu 22.04 LTS หรือ 24.04 LTS

### 1.2 โดเมนเนม (Domain Name)
- จดโดเมนเนม (เช่น `groupmart.com`)
- ตั้งค่า DNS Record (A Record) ชี้มาที่ Public IP ของ Cloud Server

---

## 2. ขั้นตอนการตั้งค่า Server (Server Setup)

หลังจากเช่า Cloud Server และ SSH เข้าไปที่เซิร์ฟเวอร์แล้ว ให้ทำตามขั้นตอนดังนี้:

### 2.1 ติดตั้ง Docker และ Docker Compose Plugin
รันคำสั่งต่อไปนี้เพื่อติดตั้ง Docker บน Ubuntu:

```bash
# อัปเดตแพ็กเกจ
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# เพิ่ม Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# ตั้งค่า Repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ติดตั้ง Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# เพิ่ม User ปัจจุบันเข้ากลุ่ม docker (เพื่อให้รันคำสั่งโดยไม่ต้อง sudo)
sudo usermod -aG docker $USER
# (ต้อง Logout แล้ว Login SSH ใหม่ให้ผลบังคับใช้)
```

---

## 3. การเตรียม Source Code และ Environment

### 3.1 นำโค้ดลง Server
สร้างโฟลเดอร์สำหรับโปรเจกต์และ Clone โค้ดลงมา (เปลี่ยนลิงก์ Git ให้ตรงกับของจริง)

```bash
mkdir -p ~/projects
cd ~/projects
git clone <URL_ของ_Repository> group-mart
cd group-mart
```

### 3.2 ตั้งค่า Environment Variables (.env.prod)
คุณต้องสร้างหรือแก้ไขไฟล์ `.env.prod` ให้รัดกุมก่อนรันบน Production:

**ตัวอย่าง `/.env.prod` (ระดับ Root) หรือในโฟลเดอร์ฝั่ง Backend/Frontend:**
```env
# ฐานข้อมูล (สำคัญ: เปลี่ยน Default Password)
POSTGRES_USER=my_db_user
POSTGRES_PASSWORD=my_secure_password
POSTGRES_DB=marketplace_db

# pgAdmin (Admin Panel ของ Database)
PGADMIN_DEFAULT_EMAIL=admin@groupmart.com
PGADMIN_DEFAULT_PASSWORD=admin_secure_password

# Authentication
JWT_SECRET=super_secure_jwt_secret_key_change_me
JWT_EXPIRATION=7d

# Frontend & Backend URLs
NEXT_PUBLIC_API_URL=https://api.groupmart.com  # หรือ https://groupmart.com/api
# เบื้องต้นถ้าใช้ Nginx proxy ผ่านพอร์ตเดียวกัน ใช้:
NEXT_PUBLIC_API_URL=/api

# (ถ้ายังไม่ได้ใช้โดเมนจริง และใช้ Ngrok อยู่ ให้คงค่า Ngrok ไว้ก่อน)
NGROK_AUTHTOKEN=your_ngrok_token
NGROK_DOMAIN=your_ngrok_domain
```
*คำแนะนำ: สำหรับ Production จริง แนะนำให้ **เอา Service `ngrok` ออกจาก `docker-compose.prod.yml`** แล้วใช้ Domain Name จริงร่วมกับ SSL.*

---

## 4. การรันระบบ (Deploy)

ในโฟลเดอร์ Root ของโปรเจกต์ (ที่มีไฟล์ `docker-compose.prod.yml`) ให้รันคำสั่ง:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
ระบบจะทำการ:
1. Build Frontend Image (รัน `npm run build` ใน Container)
2. Build Backend Image
3. สร้าง Database Container (PostgreSQL pgvector)
4. สร้าง Container สำหรับ Ollama และทำการดึงโมเดล `bge-m3`, `llama3.2` โดยอัตโนมัติ (อาจใช้เวลา 5-10 นาทีในครั้งแรก)
5. เปิด Nginx Reverse Proxy เพื่อรับ Request

สถานะการรัน ดูได้จากคำสั่ง:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## 5. การตั้งค่า SSL (HTTPS) สำหรับ Production ของจริง

เมื่อเลิกใช้ Ngrok และมี Domain จริง (เช่น `groupmart.com` ชี้มาที่ IP Server) ให้ปรับแต่งตามนี้:

### 5.1 แก้ไข `nginx.prod.conf`
เพิ่ม/แก้ไข Nginx ให้รองรับชื่อโดเมน:
```nginx
server {
    listen 80;
    server_name groupmart.com www.groupmart.com;
    client_max_body_size 50M;

    # (การตั้งค่า Location อื่นๆ คงเดิมตามที่มีอยู่)
}
```

### 5.2 ติดตั้ง Certbot เพื่อขอ SSL ฟรี (Let's Encrypt)
คุณสามารถติดตั้ง Certbot ไว้ที่ระดับ OS เพื่อให้มันสร้าง SSL Certificate และจัดการ Nginx ทะลุ Container เข้าไป หรือ **วิธีที่นิยมสุดและง่ายกว่าคือ**: เอา Nginx ขึ้นมาติดตั้งบน **Host OS** เครื่องหลัก แล้วให้มันชี้ Proxy เข้าไปยังพอร์ตต่างๆ ของ Docker (เช่น 3000 สำหรับ Next, 3001 สำหรับ Nest)

**วิธีทำ (แบบ Nginx บน Host OS):**
1. ลบ Service `nginx` และ `ngrok` ออกจาก `docker-compose.prod.yml`
2. Expose Port ของ Frontend(3000), Backend(3001) และ pgAdmin ให้ผูกกับ Localhost ของพับลิคเซิร์ฟเวอร์
3. ติดตั้ง Nginx และ Certbot บน Host:
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```
4. เอาเนื้อหาจาก `nginx.prod.conf` ไปปรับใส่ไว้ใน `/etc/nginx/sites-available/groupmart`
5. รันคำสั่งขอ SSL:
   ```bash
   sudo certbot --nginx -d groupmart.com -d www.groupmart.com
   ```
   (Certbot จะเพิ่มตั้งค่า HTTPS / พอร์ต 443 ให้อัตโนมัติ)

---

## 6. การบริหารจัดการ

- **เช็คโมเดล AI**:
  ```bash
  docker exec -it marketplace-prod-ollama ollama list
  ```
- **จัดการ Database ผ่าน pgAdmin**: 
  เข้าถึงได้ทางบราวเซอร์ `http://[YOUR_IP_OR_DOMAIN]/pgadmin/` (ล็อกอินด้วยอีเมลและรหัสใน `.env.prod`)
- **ดู Logs ของ Backend**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f backend
  ```
- **การอัปเดตระบบเมื่อมีโค้ดใหม่ (CD/CI Manual)**:
  ```bash
  git pull origin main
  docker compose -f docker-compose.prod.yml up -d --build
  # Docker จะทำการ Build แค่ส่วนที่มีการเปลี่ยนแปลง
  ```
