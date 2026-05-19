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

### 1.2 โดเมนเนม (Domain Name) และ DNS
- **จดโดเมนเนม:** แนะนำให้ใช้ **Namecheap** ในการจดโดเมนเนม เนื่องจากราคาถูกและจัดการง่าย (เช่น `groupmart.com`)
- **จัดการ DNS และ Security:** แนะนำให้ผูกโดเมนเข้ากับ **Cloudflare** (เปลี่ยน Nameserver ใน Namecheap ให้ชี้มาที่ Cloudflare)
- ตั้งค่า DNS Record (A Record) ใน Cloudflare ให้ชี้มาที่ Public IP ของ GCP Compute Engine (เปิดแถบส้ม "Proxied" เพื่อใช้ Free SSL และ DDoS Protection)

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

## 5. การตั้งค่า SSL และ Security (GCP + Cloudflare)

เมื่อเราใช้ **Google Cloud Platform (GCP)** ร่วมกับ **Cloudflare** กระบวนการทำ SSL และ Security จะง่ายและปลอดภัยมากยิ่งขึ้น

### 5.1 ตั้งค่า GCP Firewall (VPC Network)
ใน Console ของ GCP > VPC Network > Firewall:
1. สร้างกฏ (Rule) อนุญาต HTTP (Port 80) และ HTTPS (Port 443)
2. (Optional) เพื่อความปลอดภัยสูงสุด ให้อนุญาตเฉพาะ IP ของ Cloudflare เท่านั้นที่เข้ามายัง Port 80/443 ได้

### 5.2 การจัดการ SSL ผ่าน Cloudflare (วิธีที่แนะนำ)
เราไม่จำเป็นต้องติดตั้ง Certbot บนเซิร์ฟเวอร์ให้ยุ่งยาก เพราะ Cloudflare มีระบบ SSL/TLS ให้ฟรี:
1. เข้าไปที่ Dashboard ของ Cloudflare > เมนู **SSL/TLS**
2. เลือกโหมด **Flexible** (Cloudflare จะเชื่อมต่อกับผู้ใช้ด้วย HTTPS แต่เชื่อมต่อกับเซิร์ฟเวอร์ GCP ของเราด้วย HTTP พอร์ต 80 ซึ่ง Nginx ของเรารองรับอยู่แล้ว)
3. หรือเลือกโหมด **Full (Strict)** (แนะนำที่สุดสำหรับ Production) โดยคุณต้องสร้าง Origin Certificate จาก Cloudflare นำไฟล์ `.pem` และ `.key` มาใส่ในเซิร์ฟเวอร์ GCP และแก้ `nginx.prod.conf` ให้ Nginx เปิดพอร์ต 443 อ่านไฟล์ Certificate เหล่านี้

### 5.3 อัปเดต `nginx.prod.conf` สำหรับโดเมนจริง
เปลี่ยนให้ Nginx รับค่าจากโดเมนที่เราจดไว้ (สมมติว่าเป็นโหมด Flexible SSL):

```nginx
server {
    listen 80;
    server_name groupmart.com www.groupmart.com;
    client_max_body_size 50M;

    # Cloudflare Proxy Headers
    proxy_set_header Host $host;
    proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # ... (Location blocks remain the same)
}
```

### 5.4 การเชื่อมต่อ CI/CD (GitHub Actions) สู่ GCP
ในไฟล์ `.github/workflows/cd-production.yml` ที่สร้างไว้แล้ว คุณต้องไปที่ GitHub Repo > Settings > Secrets and variables > Actions แล้วเพิ่มค่าต่อไปนี้:
- `GCP_HOST_IP`: Public IP ของ Compute Engine
- `GCP_SSH_USERNAME`: ชื่อ User ที่คุณใช้รันระบบ (เช่น `ubuntu`)
- `GCP_SSH_PRIVATE_KEY`: Private Key (`~/.ssh/id_rsa`) ที่จับคู่กับ Public Key ใน GCP metadata

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
