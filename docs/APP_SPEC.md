# Khaophang Report — APP_SPEC

> เอกสารข้อกำหนดหลักของเว็บแอป Khaophang Report  
> ใช้เป็นแหล่งอ้างอิงกลางสำหรับการออกแบบ พัฒนา ทดสอบ และส่งมอบระบบ

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | APP_SPEC.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชันเอกสาร | 1.0.0 |
| สถานะ | Approved for Development |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| ผู้ดูแลโครงการ | Khaophang Report Project |
| อีเมลโครงการ | khaophangreport@gmail.com |
| GitHub Repository | https://github.com/khaophangreport-spec/khaophangreport.git |
| Production Domain | https://khaophangreport.pages.dev |
| เอกสารต้นทาง | KHAOPHANG_REPORT_MASTER_SPEC.md |

---

## 2. วัตถุประสงค์ของเอกสาร

เอกสารนี้กำหนดขอบเขต ฟังก์ชัน พฤติกรรม และข้อกำหนดหลักของเว็บแอป Khaophang Report เพื่อให้การพัฒนาเป็นไปในทิศทางเดียวกัน โดยใช้เป็นเอกสารอ้างอิงสำหรับ:

- การออกแบบ UX/UI
- การพัฒนา Frontend
- การพัฒนา Google Apps Script Backend
- การออกแบบฐานข้อมูล Google Sheets
- การจัดเก็บไฟล์ใน Google Drive
- การทดสอบระบบ
- การส่งมอบงาน
- การพัฒนาต่อยอดในอนาคต

หากรายละเอียดในเอกสารย่อยขัดแย้งกับเอกสารนี้ ให้ยึดเอกสารนี้เป็นหลัก เว้นแต่มีการแก้ไขเวอร์ชันอย่างเป็นทางการ

---

## 3. ภาพรวมระบบ

Khaophang Report เป็น Responsive Web Application แบบ Mobile-first สำหรับรับแจ้งปัญหา เหตุเดือดร้อน ความเสียหาย ข้อร้องเรียน และข้อเสนอแนะจากประชาชนในพื้นที่ตำบลเขาพัง

ประชาชนสามารถแจ้งปัญหาได้โดยไม่ต้องสมัครสมาชิก พร้อมแนบรูปภาพ ระบุตำแหน่ง เลือกแจ้งแบบระบุตัวตนหรือไม่ระบุตัวตน และติดตามผลด้วยรหัสติดตามเรื่อง

เจ้าหน้าที่และผู้ดูแลระบบสามารถตรวจสอบ คัดกรอง มอบหมายงาน อัปเดตสถานะ เพิ่มหลักฐาน บันทึกผลการดำเนินงาน ปิดเรื่อง และนำข้อมูลไปใช้วิเคราะห์ปัญหาในระยะยาว

---

## 4. เป้าหมายของระบบ

1. เพิ่มช่องทางรับแจ้งปัญหาที่ประชาชนเข้าถึงได้ง่าย
2. ลดการแจ้งปัญหาที่กระจัดกระจายผ่านโทรศัพท์หรือแชตส่วนตัว
3. รองรับการแจ้งแบบระบุตัวตนและไม่ระบุตัวตน
4. ให้ประชาชนติดตามผลได้ด้วยตนเอง
5. ช่วยให้เจ้าหน้าที่จัดลำดับและติดตามงานอย่างเป็นระบบ
6. บันทึกประวัติการดำเนินงานและหลักฐานย้อนหลังได้
7. สร้างฐานข้อมูลปัญหาชุมชนสำหรับวิเคราะห์และวางแผน
8. ลดค่าใช้จ่ายประจำ โดยใช้บริการที่มีโควตาฟรี
9. ออกแบบให้ผู้ดูแลระบบสามารถเรียนรู้และดูแลต่อได้
10. รองรับการย้ายฐานข้อมูลในอนาคตโดยไม่ต้องรื้อ Frontend ทั้งหมด

---

## 5. ขอบเขตระบบ

### 5.1 อยู่ในขอบเขตของรุ่นแรก

#### ฝั่งประชาชน

- หน้าแรก
- แจ้งปัญหา
- เลือกหมวดหมู่
- กรอกรายละเอียด
- ระบุวันที่พบปัญหา
- ระบุสถานที่ หมู่ที่ และจุดสังเกต
- ดึงพิกัดจากอุปกรณ์
- แนบภาพสูงสุด 3 ภาพ
- เลือกแจ้งแบบระบุตัวตนหรือไม่ระบุตัวตน
- ยอมรับเงื่อนไขการใช้ข้อมูล
- ส่งเรื่อง
- รับรหัสติดตาม
- คัดลอกรหัสติดตาม
- ติดตามสถานะ
- ดู Timeline
- ดูผลการดำเนินงาน
- ส่งข้อมูลเพิ่มเติม
- ดู FAQ
- ดูช่องทางติดต่อและหมายเลขฉุกเฉิน

#### ฝั่งเจ้าหน้าที่

- เข้าสู่ระบบ
- ออกจากระบบ
- ดู Dashboard ส่วนบุคคล
- ดูเรื่องที่ได้รับมอบหมาย
- ค้นหาและกรองรายการ
- เปิดดูรายละเอียดเรื่อง
- เปลี่ยนสถานะ
- เพิ่มข้อความอัปเดต
- เพิ่มหมายเหตุภายใน
- แนบหลักฐาน
- บันทึกผลการดำเนินงาน
- ปิดเรื่อง

#### ฝั่งผู้ดูแลระบบ

- เข้าสู่ระบบ
- Dashboard รวม
- ดูรายการเรื่องทั้งหมด
- คัดกรองเรื่อง
- ตั้งระดับความสำคัญ
- มอบหมายเจ้าหน้าที่
- เปลี่ยนสถานะ
- เพิ่ม Timeline
- จัดการหมวดหมู่
- จัดการบัญชีผู้ใช้งาน
- จัดการประกาศ
- จัดการค่าตั้งค่าระบบ
- ส่งออก CSV
- ดู Activity Log
- ดูรายงานสรุปพื้นฐาน

### 5.2 ยังไม่อยู่ในขอบเขตรุ่นแรก

- สมัครสมาชิกประชาชน
- Social Login
- LINE Login
- Push Notification
- Chat แบบ Real-time
- AI วิเคราะห์หรือจัดหมวดหมู่อัตโนมัติ
- Native Mobile Application
- Dashboard สาธารณะ
- Heatmap ขั้นสูง
- ระบบหลายตำบล
- ระบบหลายองค์กรแบบซับซ้อน
- Payment
- E-signature
- การเชื่อมระบบราชการภายนอก

---

## 6. กลุ่มผู้ใช้งาน

### 6.1 ประชาชนทั่วไป

ไม่ต้องสมัครสมาชิก สามารถแจ้งปัญหาและติดตามสถานะด้วยรหัสติดตาม

### 6.2 เจ้าหน้าที่

ดูและอัปเดตเรื่องที่ได้รับมอบหมายตามสิทธิ์

### 6.3 ผู้ดูแลระบบ

ดูแลข้อมูลทั้งหมด คัดกรอง มอบหมาย จัดการระบบ และส่งออกรายงาน

### 6.4 ผู้บริหารหรือผู้ดูข้อมูล

ดู Dashboard และรายงานสรุป โดยไม่มีสิทธิ์แก้ไขข้อมูลสำคัญ

---

## 7. บทบาทและสิทธิ์

| บทบาท | คำอธิบาย | สิทธิ์หลัก |
|---|---|---|
| `super_admin` | ผู้ดูแลสูงสุด | เข้าถึงทุกฟังก์ชันและการตั้งค่า |
| `admin` | ผู้ดูแลระบบ | จัดการเรื่อง หมวด ผู้ใช้ ประกาศ รายงาน |
| `officer` | เจ้าหน้าที่ปฏิบัติงาน | ดูและอัปเดตเรื่องที่ได้รับมอบหมาย |
| `viewer` | ผู้ดูข้อมูล | ดู Dashboard และรายงานเท่านั้น |

### กฎสิทธิ์สำคัญ

- ทุก Admin API ต้องตรวจ Session
- สิทธิ์จริงต้องตรวจที่ Backend
- Frontend ไม่มีสิทธิ์ตัดสินสิทธิ์ขั้นสุดท้าย
- Officer ต้องไม่เห็นหมายเหตุภายในที่เกินสิทธิ์
- Viewer ห้ามเปลี่ยนสถานะหรือแก้ไขข้อมูล
- ทุกการแก้ไขข้อมูลสำคัญต้องมี Activity Log

---

## 8. เทคโนโลยีหลัก

### 8.1 Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- Responsive Web Design
- Mobile-first
- Progressive Enhancement
- Local Storage เฉพาะข้อมูลชั่วคราวที่ไม่สำคัญ

### 8.2 Hosting

- Cloudflare Pages
- Production Domain: `khaophangreport.pages.dev`

### 8.3 Backend

- Google Apps Script Web App
- `doGet()`
- `doPost()`
- Script Properties
- Cache Service
- Lock Service

### 8.4 Database

- Google Sheets

### 8.5 File Storage

- Google Drive

### 8.6 Version Control

- GitHub Repository:
  `https://github.com/khaophangreport-spec/khaophangreport.git`

---

## 9. สถาปัตยกรรมระบบ

```text
User Browser
    ↓
Cloudflare Pages
    ↓
HTML + CSS + Vanilla JavaScript
    ↓
Fetch API
    ↓
Google Apps Script Web App
    ↓
Google Sheets + Google Drive
```

### หลักการสถาปัตยกรรม

- Frontend ห้ามเชื่อม Google Sheets โดยตรง
- ทุกข้อมูลต้องผ่าน Backend API
- Backend เป็นแหล่งตรวจสอบสิทธิ์และ Validation หลัก
- แยก Service, Repository และ Utility ให้ชัดเจน
- ใช้ API Response Format แบบเดียวกันทั้งระบบ
- แยก Public API และ Admin API
- ออกแบบ Data Access Layer ให้ย้ายฐานข้อมูลได้ในอนาคต

---

## 10. แนวทาง UX/UI ที่เลือก

ใช้แนวทาง UX/UI แบบที่ 1:

### ชื่อแนวทาง

**เรียบง่าย อบอุ่น เป็นมิตร**

### บุคลิกของระบบ

- เข้าถึงง่าย
- เป็นมิตรกับประชาชน
- ดูน่าเชื่อถือ
- ไม่แข็งแบบระบบราชการ
- ใช้คำไทยที่เข้าใจง่าย
- เน้นการใช้งานจากโทรศัพท์มือถือ
- ปุ่มหลักมองเห็นชัดเจน
- ไม่ใช้ข้อมูลหนาแน่นเกินไปในหน้าประชาชน

### โทนสี

- สีเขียวธรรมชาติเป็นสีหลัก
- ใช้สีเขียวเข้มสำหรับปุ่มหลักและหัวข้อสำคัญ
- ใช้สีเขียวอ่อนหรือสีครีมสำหรับพื้นหลัง
- ใช้สีขาวสำหรับ Card และพื้นที่เนื้อหา
- ใช้สีส้ม แดง เหลือง เฉพาะสถานะหรือคำเตือน
- ห้ามใช้สีสถานะเดียวกันในความหมายที่แตกต่างกัน

### ภาพประกอบ

- ใช้ภาพชุมชน ธรรมชาติ ภูเขา ลำน้ำ หรือภูมิทัศน์ตำบลเขาพัง
- ภาพควรให้ความรู้สึกสงบ อบอุ่น และเป็นมิตร
- หลีกเลี่ยงภาพแนวราชการเข้ม แข็ง หรือเคร่งขรึมเกินไป
- Hero Image ต้องไม่บดบังปุ่ม “แจ้งปัญหา” และ “ติดตามสถานะ”

### รูปแบบส่วนประกอบ

- Card มุมโค้ง
- เงาอ่อน
- ปุ่มขนาดใหญ่
- Icon แบบเรียบง่าย
- Spacing โปร่ง
- ข้อความกระชับ
- Touch target ไม่น้อยกว่า 44 × 44 พิกเซล
- รองรับ Font Scaling ของอุปกรณ์

---

## 11. Navigation

### 11.1 ฝั่งประชาชน

ใช้ Bottom Navigation บนมือถือ:

1. หน้าแรก
2. แจ้งปัญหา
3. ติดตาม
4. ติดต่อ

บน Desktop ใช้ Top Navigation

### 11.2 ฝั่ง Admin

เมนูหลัก:

1. Dashboard
2. เรื่องแจ้ง
3. งานของฉัน
4. รายงาน
5. ตั้งค่า

Desktop ใช้ Sidebar  
Mobile ใช้ Drawer หรือ Collapsible Navigation

---

## 12. โครงสร้างหน้าเว็บ

### 12.1 Public Pages

| Path | หน้าที่ |
|---|---|
| `/index.html` | หน้าแรก |
| `/report.html` | แบบฟอร์มแจ้งปัญหา |
| `/report-success.html` | แสดงผลส่งเรื่องสำเร็จ |
| `/track.html` | กรอกรหัสติดตาม |
| `/track-detail.html` | รายละเอียดและ Timeline |
| `/faq.html` | คำถามที่พบบ่อย |
| `/privacy.html` | นโยบายความเป็นส่วนตัว |
| `/terms.html` | เงื่อนไขการใช้งาน |
| `/contact.html` | ช่องทางติดต่อและหมายเลขฉุกเฉิน |

### 12.2 Admin Pages

| Path | หน้าที่ |
|---|---|
| `/admin/login.html` | เข้าสู่ระบบ |
| `/admin/dashboard.html` | Dashboard |
| `/admin/reports.html` | รายการเรื่องทั้งหมด |
| `/admin/report-detail.html` | รายละเอียดเรื่อง |
| `/admin/users.html` | จัดการผู้ใช้ |
| `/admin/categories.html` | จัดการหมวด |
| `/admin/announcements.html` | จัดการประกาศ |
| `/admin/settings.html` | ตั้งค่าระบบ |
| `/admin/activity-logs.html` | ประวัติการใช้งาน |
| `/admin/export.html` | ส่งออกข้อมูล |

---

## 13. รายละเอียดหน้าแรก

หน้าแรกต้องทำให้ประชาชนเข้าใจทันทีว่า:

- ระบบนี้ใช้ทำอะไร
- สามารถแจ้งปัญหาได้อย่างไร
- ติดตามเรื่องเดิมได้ที่ไหน
- ระบบไม่ใช้แทนหมายเลขฉุกเฉิน

### องค์ประกอบหลัก

1. Header
2. Logo และชื่อระบบ
3. Hero Section
4. ข้อความหลัก:
   - “ร่วมกันสร้างชุมชนเขาพังให้น่าอยู่ยิ่งขึ้น”
5. ปุ่มหลัก:
   - แจ้งปัญหา
   - ติดตามสถานะ
6. จุดเด่นของระบบ:
   - แจ้งง่าย
   - ติดตามได้
   - ปลอดภัย
   - ร่วมพัฒนาชุมชน
7. หมวดปัญหายอดนิยม
8. ขั้นตอนการใช้งาน
9. ประกาศจากระบบ
10. หมายเลขฉุกเฉิน
11. Footer
12. Bottom Navigation

---

## 14. ขั้นตอนการแจ้งปัญหา

แบบฟอร์มแจ้งปัญหาแบ่งเป็น 6 ขั้นตอน:

1. เลือกหมวด
2. กรอกรายละเอียด
3. ระบุสถานที่
4. เพิ่มภาพ
5. ระบุข้อมูลติดต่อ
6. ตรวจสอบและยืนยัน

### 14.1 Step 1 — เลือกหมวด

ผู้ใช้เลือกหมวดจาก Card พร้อม Icon และคำอธิบายสั้น

หมวดเริ่มต้น:

1. ถนน ทางเท้า และสะพาน
2. ไฟฟ้าและไฟส่องสว่าง
3. น้ำประปาและแหล่งน้ำ
4. ขยะและความสะอาด
5. น้ำท่วมและทางระบายน้ำ
6. สิ่งแวดล้อมและมลพิษ
7. ความปลอดภัยและเหตุเดือดร้อน
8. สัตว์จรจัดและสัตว์รบกวน
9. สาธารณสถานและทรัพย์สินส่วนรวม
10. ข้อเสนอแนะและเรื่องอื่น ๆ

### 14.2 Step 2 — รายละเอียด

ข้อมูล:

- หัวข้อเรื่อง
- รายละเอียด
- วันที่พบปัญหา
- ระดับความเร่งด่วนที่ผู้แจ้งประเมิน

### 14.3 Step 3 — สถานที่

ข้อมูล:

- ชื่อสถานที่
- หมู่ที่
- จุดสังเกต
- Latitude
- Longitude
- Map URL
- ปุ่ม “ใช้ตำแหน่งปัจจุบัน”

### 14.4 Step 4 — รูปภาพ

ข้อกำหนด:

- สูงสุด 3 ภาพ
- JPG, PNG, WebP
- ด้านยาวไม่เกิน 1,600 พิกเซล
- ขนาดหลังบีบอัดไม่เกิน 1 MB ต่อภาพ
- แสดง Preview
- ลบภาพก่อนส่งได้
- ต้องบีบอัดภาพก่อนอัปโหลด

### 14.5 Step 5 — ข้อมูลผู้แจ้ง

รูปแบบ:

- ระบุตัวตน
- ไม่ระบุตัวตน

เมื่อเลือก “ระบุตัวตน”:

- ชื่อ
- เบอร์โทร
- อีเมล ไม่บังคับ
- ช่องทางสะดวกให้ติดต่อกลับ

เมื่อเลือก “ไม่ระบุตัวตน”:

- ซ่อนช่องข้อมูลส่วนบุคคล
- แสดงคำอธิบายข้อจำกัดในการติดต่อกลับ
- ยังต้องติดตามเรื่องผ่านรหัสติดตามได้

### 14.6 Step 6 — ตรวจสอบและยืนยัน

แสดงข้อมูลสรุปก่อนส่ง:

- หมวด
- หัวข้อ
- รายละเอียด
- สถานที่
- รูปภาพ
- รูปแบบการแจ้ง
- ข้อมูลติดต่อที่อนุญาตให้แสดง
- Checkbox ยืนยันข้อมูล
- Checkbox ยอมรับนโยบายความเป็นส่วนตัว
- ปุ่มส่งเรื่อง

---

## 15. การส่งเรื่องสำเร็จ

หลังบันทึกสำเร็จ ระบบต้องแสดง:

- ข้อความยืนยัน
- Tracking Code
- ปุ่มคัดลอกรหัส
- ปุ่มติดตามสถานะ
- ปุ่มกลับหน้าแรก
- คำเตือนให้ผู้ใช้บันทึกรหัส
- วันและเวลาที่รับเรื่อง

ตัวอย่าง Tracking Code:

```text
KPR-260625-A7F4
```

---

## 16. ระบบติดตามสถานะ

### 16.1 หน้าค้นหา

ผู้ใช้กรอก Tracking Code

Validation:

- ตัดช่องว่าง
- เปลี่ยนเป็นตัวพิมพ์ใหญ่
- ตรวจรูปแบบเบื้องต้น
- จำกัดจำนวนครั้งค้นหา

### 16.2 หน้ารายละเอียด

แสดง:

- Tracking Code
- หมวด
- หัวข้อ
- วันที่แจ้ง
- สถานะปัจจุบัน
- หน่วยงานหรือผู้รับผิดชอบในรูปแบบที่เปิดเผยได้
- Timeline
- ผลการดำเนินงาน
- ภาพหลักฐานที่เปิดเผยได้
- แบบฟอร์มส่งข้อมูลเพิ่มเติม

### 16.3 ข้อมูลที่ห้ามแสดง

- หมายเหตุภายใน
- User ID ภายใน
- Session
- Token
- Password
- เบอร์โทรเต็ม
- อีเมลเต็ม
- ชื่อผู้แจ้งรายอื่น
- ข้อมูลส่วนบุคคลที่ไม่จำเป็น
- ข้อมูลที่อาจกระทบความปลอดภัย

---

## 17. สถานะเรื่อง

| ค่า | ข้อความใน UI | ความหมาย |
|---|---|---|
| `new` | รับเรื่องแล้ว | ระบบบันทึกเรื่องสำเร็จ |
| `reviewing` | กำลังตรวจสอบ | Admin กำลังตรวจสอบข้อมูล |
| `assigned` | มอบหมายแล้ว | มอบหมายเจ้าหน้าที่แล้ว |
| `in_progress` | กำลังดำเนินการ | เริ่มดำเนินงาน |
| `waiting` | รอข้อมูลเพิ่มเติม | รอข้อมูลหรือการประสานงาน |
| `resolved` | ดำเนินการแล้ว | แก้ไขหรือดำเนินการเสร็จ |
| `closed` | ปิดเรื่อง | จบกระบวนการ |
| `rejected` | ไม่รับดำเนินการ | ไม่อยู่ในขอบเขตหรือข้อมูลไม่พอ |
| `duplicate` | เรื่องซ้ำ | มีเรื่องเดิมอยู่แล้ว |

### กฎสถานะ

- ทุกการเปลี่ยนสถานะต้องสร้าง Timeline
- ต้องบันทึกผู้เปลี่ยน
- ต้องบันทึกวันและเวลา
- `rejected` ต้องมีเหตุผล
- `resolved` ต้องมีผลการดำเนินงาน
- `closed` ใช้เมื่อจบกระบวนการแล้ว
- ห้ามลบ Timeline เดิม
- สถานะที่ประชาชนเห็นต้องไม่เปิดเผยหมายเหตุภายใน

---

## 18. ระดับความสำคัญ

| ค่า | ข้อความใน UI | ตัวอย่าง |
|---|---|---|
| `low` | ทั่วไป | ข้อเสนอแนะหรือปัญหาเล็กน้อย |
| `normal` | ปกติ | ดำเนินการตามลำดับ |
| `high` | เร่งด่วน | กระทบประชาชนหลายราย |
| `critical` | ฉุกเฉิน | เสี่ยงต่อชีวิตหรือความปลอดภัย |

ระบบต้องแสดงข้อความชัดเจนว่า:

> กรณีฉุกเฉินหรือมีความเสี่ยงต่อชีวิต กรุณาติดต่อหมายเลขฉุกเฉินโดยตรง ระบบนี้ไม่ใช้แทนบริการฉุกเฉิน

---

## 19. Admin Dashboard

### 19.1 Summary Cards

- เรื่องทั้งหมด
- เรื่องใหม่
- กำลังตรวจสอบ
- กำลังดำเนินการ
- รอข้อมูล
- ดำเนินการแล้ว
- ปิดเรื่องแล้ว
- เรื่องเร่งด่วน
- เรื่องเกินกำหนด

### 19.2 Charts

- เรื่องรายเดือน
- เรื่องตามหมวด
- เรื่องตามสถานะ
- เรื่องตามหมู่หรือพื้นที่
- ระยะเวลาเฉลี่ยในการดำเนินงาน
- สัดส่วนที่ปิดภายในเป้าหมาย

### 19.3 Recent Reports

แสดง:

- Tracking Code
- วันที่แจ้ง
- หมวด
- หัวข้อ
- สถานะ
- Priority
- ผู้รับผิดชอบ
- อายุเรื่อง

### 19.4 Dashboard Rules

- ใช้ข้อมูลสรุปจาก Backend
- ห้ามโหลดข้อมูลทุกแถวเพื่อคำนวณที่ Browser
- รองรับ Empty State
- แสดง Last Updated
- มี Loading Skeleton
- ไม่ใช้กราฟมากเกินความจำเป็นใน MVP

---

## 20. รายการเรื่องฝั่ง Admin

### ฟังก์ชัน

- Pagination
- Keyword Search
- Filter by Status
- Filter by Category
- Filter by Priority
- Filter by Assignee
- Filter by Date Range
- Sort by Created Date
- Sort by Updated Date
- เปิดรายละเอียด

### ตาราง

แสดง 10–20 แถวต่อหน้า

คอลัมน์หลัก:

- Tracking Code
- วันที่
- หมวด
- หัวข้อ
- สถานะ
- Priority
- ผู้รับผิดชอบ
- อัปเดตล่าสุด

---

## 21. รายละเอียดเรื่องฝั่ง Admin

ต้องแสดง:

- ข้อมูลหลักของเรื่อง
- ข้อมูลสถานที่
- พิกัดและลิงก์แผนที่
- ข้อมูลผู้แจ้งตามสิทธิ์
- ภาพแนบ
- สถานะ
- Priority
- ผู้รับผิดชอบ
- Timeline สาธารณะ
- หมายเหตุภายใน
- Assignment History
- Activity ที่เกี่ยวข้อง

### การกระทำ

- เปลี่ยนสถานะ
- เปลี่ยน Priority
- มอบหมาย
- เพิ่มข้อความสาธารณะ
- เพิ่มหมายเหตุภายใน
- แนบหลักฐาน
- ระบุผลการดำเนินงาน
- ปิดเรื่อง
- ทำเครื่องหมายเรื่องซ้ำ
- ปฏิเสธพร้อมเหตุผล

---

## 22. Authentication และ Session

### 22.1 Login

ใช้:

- Username
- Password

### 22.2 Password

- ห้ามเก็บ Plain Text
- ต้อง Hash และ Salt
- ขั้นต่ำ 8 ตัวอักษร
- ไม่ส่ง Password กลับ Frontend
- ไม่บันทึก Password ใน Log

### 22.3 Session

- สร้าง Token แบบสุ่ม
- เก็บเฉพาะ Token Hash ในฐานข้อมูล
- Session มีเวลาหมดอายุ
- Logout ต้อง Revoke Session
- ตรวจ Session ทุก Admin API
- สามารถบังคับ Logout ได้
- Frontend เก็บ Token ตามแนวทางที่ปลอดภัยที่สุดภายใต้ข้อจำกัดของระบบ

### 22.4 Login Protection

- จำกัด Login ผิด
- บันทึกจำนวนครั้งที่ผิด
- Lock ชั่วคราว
- แสดงข้อความ Error แบบไม่เปิดเผยว่าบัญชีใดมีอยู่จริง

---

## 23. API Response Standard

### Success

```json
{
  "ok": true,
  "data": {},
  "message": "ดำเนินการสำเร็จ"
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "fields": {
      "title": "กรุณากรอกหัวข้อ"
    }
  }
}
```

### ข้อกำหนด

- ทุก Endpoint ต้องใช้โครงสร้างเดียวกัน
- ห้ามส่ง Stack Trace ให้ Frontend
- Error Message ต้องเป็นภาษาไทยที่เข้าใจง่าย
- Error Code ต้องคงที่และใช้ซ้ำได้
- Response ต้องไม่เปิดเผย Secret

---

## 24. Error Codes

| Code | ความหมาย |
|---|---|
| `VALIDATION_ERROR` | ข้อมูลไม่ถูกต้อง |
| `UNAUTHORIZED` | ยังไม่ได้เข้าสู่ระบบ |
| `FORBIDDEN` | ไม่มีสิทธิ์ |
| `NOT_FOUND` | ไม่พบข้อมูล |
| `DUPLICATE` | ข้อมูลซ้ำ |
| `RATE_LIMITED` | ใช้งานถี่เกินไป |
| `FILE_TOO_LARGE` | ไฟล์ใหญ่เกินไป |
| `INVALID_FILE_TYPE` | ประเภทไฟล์ไม่รองรับ |
| `SESSION_EXPIRED` | Session หมดอายุ |
| `INTERNAL_ERROR` | ระบบขัดข้อง |

---

## 25. Validation

### 25.1 Frontend

- Required Field
- ความยาวข้อความ
- รูปแบบเบอร์โทร
- รูปแบบอีเมล
- Latitude/Longitude
- ประเภทและขนาดภาพ
- จำนวนภาพ
- Consent
- ป้องกันกดส่งซ้ำ

### 25.2 Backend

ต้องตรวจซ้ำทั้งหมด:

- Action
- Authorization
- Whitelist
- Data Type
- ความยาว
- ID
- Status Transition
- File Type
- File Size
- Session
- Rate Limit
- Duplicate Request

---

## 26. Performance

### ต้องทำ

- Pagination
- Cache Service
- Batch Read/Write
- อ่านเฉพาะช่วงข้อมูลที่ใช้
- ลดจำนวน API Calls
- บีบอัดภาพก่อนส่ง
- Cache Config และ Category
- ใช้ Dashboard Summary
- รองรับ Archive ข้อมูลเก่า

### ห้ามทำ

- โหลดทุกแถวทุกครั้ง
- ใช้ `getDataRange()` โดยไม่จำเป็น
- เก็บภาพ Base64 ใน Sheet
- คำนวณ Dashboard ทั้งฐานทุก Request
- เรียก API ซ้ำเมื่อข้อมูลเดิมยังใช้ได้
- ใช้ Google Sheets เป็น Public Data Source

---

## 27. Security

### ข้อกำหนดหลัก

- ไม่เชื่อข้อมูลจาก Frontend
- Escape ข้อมูลก่อนแสดง
- หลีกเลี่ยง `innerHTML` กับข้อมูลผู้ใช้
- จำกัดความยาวทุกช่อง
- ตรวจ MIME Type ที่ Backend
- ตั้งชื่อไฟล์ใหม่
- จำกัดจำนวนคำขอ
- ใช้ Lock Service สำหรับงานสำคัญ
- เก็บ Secret ใน Script Properties
- ไม่ใส่ Secret ใน Repository
- ใช้ Soft Delete
- มี Activity Log
- จำกัด CORS/Origin ตามการออกแบบ
- ห้ามเปิด Spreadsheet และ Drive ทั้งระบบเป็น Public

---

## 28. Privacy และข้อมูลส่วนบุคคล

ข้อมูลที่อาจเก็บ:

- ชื่อ
- เบอร์โทร
- อีเมล
- พิกัด
- รูปภาพ
- เนื้อหาเรื่อง
- ประวัติการติดต่อ

### หลักปฏิบัติ

- เก็บเท่าที่จำเป็น
- แจ้งวัตถุประสงค์ก่อนส่ง
- ไม่แสดงข้อมูลส่วนบุคคลในหน้าติดตาม
- จำกัดผู้เข้าถึง Sheet และ Drive
- มี Privacy Policy
- มี Terms
- มีช่องทางติดต่อโครงการ
- กำหนดระยะเวลาจัดเก็บ
- รองรับคำขอแก้ไขหรือลบตามความเหมาะสม

---

## 29. Accessibility

- รองรับ Keyboard Navigation
- Focus State ต้องมองเห็น
- ใช้ Semantic HTML
- Label ทุก Form Field
- Error ต้องผูกกับ Field
- Contrast ผ่านเกณฑ์อ่านง่าย
- ไม่ใช้สีเพียงอย่างเดียวเพื่อสื่อความหมาย
- Alt Text สำหรับภาพสำคัญ
- Button ต้องใช้ `<button>`
- Link ต้องใช้ `<a>`
- รองรับหน้าจอ 320 พิกเซลขึ้นไป
- Touch Target ไม่น้อยกว่า 44 × 44 พิกเซล

---

## 30. Responsive Breakpoints

ใช้แนวทาง Mobile-first

แนะนำ:

```css
/* Base: 320px+ */

/* Small tablet */
@media (min-width: 640px) {}

/* Tablet */
@media (min-width: 768px) {}

/* Desktop */
@media (min-width: 1024px) {}

/* Large desktop */
@media (min-width: 1280px) {}
```

### พฤติกรรมหลัก

- Mobile: 1 Column
- Tablet: 2 Column เมื่อเหมาะสม
- Desktop: Content Container และ Grid
- Public Bottom Navigation แสดงบนมือถือ
- Desktop ใช้ Top Navigation
- Admin Desktop ใช้ Sidebar
- Admin Mobile ใช้ Drawer

---

## 31. Design Tokens เบื้องต้น

```css
:root {
  --color-primary-900: #174A2B;
  --color-primary-800: #1F5E36;
  --color-primary-700: #287444;
  --color-primary-600: #348A52;
  --color-primary-100: #E7F3EA;
  --color-primary-50: #F4FAF5;

  --color-surface: #FFFFFF;
  --color-background: #F7F8F3;
  --color-text: #1D2A22;
  --color-text-muted: #66736B;
  --color-border: #DDE5DF;

  --color-info: #2F80ED;
  --color-success: #2E7D32;
  --color-warning: #D98200;
  --color-danger: #C0392B;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;

  --shadow-sm: 0 2px 8px rgba(23, 74, 43, 0.08);
  --shadow-md: 0 8px 24px rgba(23, 74, 43, 0.12);

  --content-max-width: 1200px;
}
```

หมายเหตุ: ค่าสีสามารถปรับได้ภายหลังเมื่อมี Logo และ Brand Guide ฉบับสมบูรณ์ แต่ห้ามเปลี่ยนบุคลิกหลัก “เขียวธรรมชาติ อบอุ่น เป็นมิตร”

---

## 32. Loading, Empty, Error และ Success State

ทุกหน้าที่เรียก API ต้องมี:

### Loading

- Skeleton
- Spinner
- Disable ปุ่มระหว่างส่ง
- ข้อความกำลังดำเนินการ

### Empty State

- Icon หรือ Illustration
- ข้อความอธิบาย
- Action ที่ทำต่อได้

### Error State

- ข้อความภาษาไทย
- ไม่แสดง Technical Error
- ปุ่มลองใหม่
- ช่องทางติดต่อเมื่อ Error รุนแรง

### Success State

- แสดงผลสำเร็จชัดเจน
- สรุปข้อมูลสำคัญ
- ปุ่มไปขั้นตอนต่อไป

---

## 33. Notification UI

รุ่นแรกใช้:

- Toast
- Inline Alert
- Confirmation Modal

### หลักการ

- Success: สีเขียว
- Warning: สีเหลืองหรือส้ม
- Error: สีแดง
- Info: สีน้ำเงิน
- Toast ต้องไม่บัง Bottom Navigation
- Error สำคัญต้องไม่หายอัตโนมัติเร็วเกินไป
- การกระทำที่ย้อนกลับไม่ได้ต้องมี Confirm Modal

---

## 34. Config

ไฟล์ Frontend:

`assets/js/config.js`

```javascript
window.APP_CONFIG = {
  APP_NAME: "Khaophang Report",
  APP_NAME_TH: "ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง",
  API_URL: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
  SITE_URL: "https://khaophangreport.pages.dev",
  CONTACT_EMAIL: "khaophangreport@gmail.com",
  DEFAULT_LANGUAGE: "th",
  MAX_IMAGES: 3,
  MAX_IMAGE_SIZE_MB: 1,
  MAX_IMAGE_DIMENSION: 1600,
  DEFAULT_PAGE_SIZE: 20
};
```

ข้อกำหนด:

- ห้ามเก็บ Secret
- API URL ต้องกำหนดจากจุดเดียว
- Config ที่เป็น Public เท่านั้น
- Secret ทั้งหมดเก็บใน Apps Script Properties

---

## 35. Apps Script Properties

ต้องรองรับ:

- `SPREADSHEET_ID`
- `ROOT_FOLDER_ID`
- `APP_SECRET`
- `SESSION_SECRET`
- `ALLOWED_ORIGIN`
- `ADMIN_SETUP_KEY`
- `ENVIRONMENT`

ห้าม Commit ค่า Secret ลง GitHub

---

## 36. โครงสร้าง Source Code

```text
/
├── index.html
├── report.html
├── report-success.html
├── track.html
├── track-detail.html
├── faq.html
├── privacy.html
├── terms.html
├── contact.html
│
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── reports.html
│   ├── report-detail.html
│   ├── users.html
│   ├── categories.html
│   ├── announcements.html
│   ├── settings.html
│   ├── activity-logs.html
│   └── export.html
│
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── icons/
│
├── apps-script/
│   ├── Code.gs
│   ├── Config.gs
│   ├── Router.gs
│   ├── Response.gs
│   ├── Validation.gs
│   ├── AuthService.gs
│   ├── SessionService.gs
│   ├── ReportService.gs
│   ├── CategoryService.gs
│   ├── AttachmentService.gs
│   ├── AssignmentService.gs
│   ├── DashboardService.gs
│   ├── ExportService.gs
│   ├── UserService.gs
│   ├── AnnouncementService.gs
│   ├── SettingsService.gs
│   ├── AuditService.gs
│   ├── SheetRepository.gs
│   ├── DriveRepository.gs
│   ├── Security.gs
│   ├── Utils.gs
│   ├── Setup.gs
│   └── Tests.gs
│
├── docs/
│   ├── APP_SPEC.md
│   ├── UI_FLOW.md
│   ├── DATA_SCHEMA.md
│   ├── API_SPEC.md
│   └── DEVELOPMENT_RULES.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 37. Logging และ Audit

Activity Log ต้องบันทึก:

- ผู้ใช้งาน
- Action
- Entity Type
- Entity ID
- รายละเอียด
- วันเวลา
- ข้อมูลประกอบที่เหมาะสม

การกระทำที่ต้อง Log:

- Login สำเร็จ
- Login ล้มเหลว
- Logout
- เปลี่ยนสถานะ
- เปลี่ยน Priority
- มอบหมายงาน
- แก้ข้อมูลผู้ใช้
- แก้หมวด
- ส่งออก CSV
- เปลี่ยน Settings
- Soft Delete
- Revoke Session

ห้ามบันทึก:

- Password
- Raw Token
- Session Secret
- ข้อมูลสำคัญเกินความจำเป็น

---

## 38. Export CSV

รองรับ:

- รายการเรื่อง
- Timeline
- สรุปตามสถานะ
- สรุปตามหมวด
- สรุปตามพื้นที่
- สรุปตามผู้รับผิดชอบ
- ช่วงวันที่

### Security

- เฉพาะผู้มีสิทธิ์
- เลือกรวม/ไม่รวมข้อมูลส่วนบุคคล
- บันทึก Activity Log
- ป้องกัน CSV Formula Injection
- Escape ค่าเริ่มต้นด้วย `=`, `+`, `-`, `@`

---

## 39. Backup

- สำรอง Spreadsheet ตามรอบ
- สำรอง Drive Structure
- Backup Source Code ใน GitHub
- สำรอง Apps Script ด้วย `clasp` หรือคัดลอกโปรเจ็กต์
- ใช้บัญชีกลางของโครงการเป็นเจ้าของไฟล์
- ทดสอบ Restore
- สำรองก่อนเปลี่ยน Schema
- ห้ามพึ่งบัญชีส่วนตัวเพียงบัญชีเดียว

---

## 40. Testing Requirements

### 40.1 Public

- ส่งเรื่องสำเร็จ
- ส่งข้อมูลไม่ครบ
- แจ้งแบบไม่ระบุตัวตน
- แนบภาพ 1–3 ภาพ
- แนบภาพเกินจำนวน
- ภาพใหญ่เกิน
- File Type ไม่ถูกต้อง
- Location Permission Denied
- Location Success
- Tracking Code ถูก
- Tracking Code ผิด
- ส่งข้อมูลเพิ่มเติม
- กดส่งซ้ำ

### 40.2 Admin

- Login สำเร็จ
- Login ผิด
- Account Locked
- Session หมดอายุ
- Permission แต่ละ Role
- Pagination
- Search
- Filter
- Assign
- Update Status
- Add Timeline
- Internal Note
- Upload Evidence
- Resolve
- Close
- Reject
- Duplicate
- Export CSV

### 40.3 Device

- Android Mobile
- iPhone
- Tablet
- Desktop
- Chrome
- Edge
- Safari
- Firefox ระดับที่รองรับ

---

## 41. Acceptance Criteria ของ MVP

ระบบพร้อมทดลองใช้เมื่อ:

- ประชาชนส่งเรื่องจากมือถือได้
- ระบบสร้าง Tracking Code ไม่ซ้ำ
- แนบภาพได้สูงสุด 3 ภาพ
- รับพิกัดได้
- ติดตามสถานะได้
- Timeline แสดงถูกต้อง
- Admin Login ได้
- Admin เห็นเรื่องใหม่
- มอบหมายเจ้าหน้าที่ได้
- เปลี่ยนสถานะได้
- เจ้าหน้าที่เพิ่มผลดำเนินงานได้
- ปิดเรื่องได้
- Dashboard แสดงยอดพื้นฐานได้
- Export CSV ได้
- Activity Log ทำงาน
- ข้อมูลส่วนบุคคลไม่รั่วใน Public View
- มี Privacy Policy
- มี Backup
- ผ่านการทดสอบบนมือถือจริง

---

## 42. ลำดับการพัฒนา

### Phase 1 — Project Foundation

- สร้าง Repository
- สร้าง Folder Structure
- สร้าง Config
- สร้าง Design Tokens
- สร้าง Shared Components
- สร้าง Spreadsheet
- สร้าง Apps Script Project
- สร้าง Setup Script
- สร้าง Response Helper
- สร้าง Router

### Phase 2 — Public MVP

- หน้าแรก
- แบบฟอร์มแจ้งปัญหา
- Image Compression
- Location
- Create Report
- Success Page
- Track
- Timeline

### Phase 3 — Authentication

- Users
- Password Hash
- Login
- Session
- Logout
- Role Guard
- Login Rate Limit

### Phase 4 — Admin Reports

- Dashboard
- Report List
- Pagination
- Search and Filter
- Report Detail
- Assignment
- Status Update
- Timeline
- Evidence

### Phase 5 — System Management

- Users
- Categories
- Announcements
- Settings
- Activity Logs
- Export CSV

### Phase 6 — Quality

- Validation
- Error Handling
- Security Review
- Responsive Testing
- Performance Testing
- Backup
- Documentation

### Phase 7 — Production Launch

- Production Admin
- Contact Information
- Emergency Numbers
- Real Categories
- Real Officers
- Pilot Test
- User Training
- Production Deployment

---

## 43. Definition of Done

งานหนึ่งถือว่าเสร็จเมื่อ:

1. ทำงานตาม Requirement
2. Responsive
3. Mobile-first
4. มี Loading State
5. มี Empty State
6. มี Error State
7. มี Validation Frontend
8. มี Validation Backend
9. ไม่มี Secret ใน Source
10. มี Test อย่างน้อยตาม Acceptance Criteria
11. ไม่เกิด Console Error
12. ไม่ทำให้ Page อื่นเสีย
13. อัปเดตเอกสารที่เกี่ยวข้อง
14. Commit Message ชัดเจน
15. ผ่านการทดสอบบน Production-like Environment

---

## 44. ข้อมูลที่ต้องกำหนดเพิ่มเติมก่อนเปิดใช้จริง

- Logo อย่างเป็นทางการ
- Favicon
- หมายเลขฉุกเฉิน
- หมายเลขติดต่อโครงการ
- รายชื่อ Admin ชุดแรก
- รายชื่อเจ้าหน้าที่
- รายชื่อหมู่บ้านหรือพื้นที่
- หมวดปัญหาจริง
- ผู้รับผิดชอบเริ่มต้นแต่ละหมวด
- SLA หรือ Target Days
- Privacy Policy
- Terms
- Consent Text
- Data Retention Period
- บัญชีกลางเจ้าของ Google Sheets และ Drive
- Custom Domain หากต้องการใช้ในอนาคต

---

## 45. ข้อห้ามสำคัญ

- ห้ามเก็บ Password แบบข้อความธรรมดา
- ห้ามเปิด Google Sheets เป็น Public
- ห้ามเปิด Drive Root Folder เป็น Public
- ห้ามเก็บ Secret ใน JavaScript
- ห้ามใช้ `innerHTML` กับข้อมูลผู้ใช้โดยไม่ Sanitize
- ห้ามโหลดข้อมูลทั้งหมดทุกครั้ง
- ห้ามลบ Timeline
- ห้ามลบข้อมูลจริงทันที
- ห้ามให้ Frontend ตัดสินสิทธิ์ขั้นสุดท้าย
- ห้ามเปลี่ยนชื่อคอลัมน์โดยไม่อัปเดต Schema และ Code
- ห้ามข้าม Validation Backend
- ห้าม Deploy โดยไม่ทดสอบบนมือถือจริง

---

## 46. เอกสารที่ต้องจัดทำต่อ

หลังจาก APP_SPEC.md ให้จัดทำตามลำดับ:

1. `UI_FLOW.md`
2. `DATA_SCHEMA.md`
3. `API_SPEC.md`
4. `DEVELOPMENT_RULES.md`

### ความสัมพันธ์ของเอกสาร

- `APP_SPEC.md` กำหนดว่า “ระบบต้องทำอะไร”
- `UI_FLOW.md` กำหนดว่า “ผู้ใช้เดินผ่านหน้าจออย่างไร”
- `DATA_SCHEMA.md` กำหนดว่า “ข้อมูลจัดเก็บอย่างไร”
- `API_SPEC.md` กำหนดว่า “Frontend และ Backend สื่อสารอย่างไร”
- `DEVELOPMENT_RULES.md` กำหนดว่า “ทีมต้องเขียนและส่งมอบงานอย่างไร”

---

## 47. สรุป

Khaophang Report เป็นเว็บแอประดับชุมชนที่ต้องเน้น:

- ใช้ง่าย
- เข้าถึงง่าย
- ภาษาไทยชัดเจน
- Mobile-first
- ติดตามได้
- มีหลักฐาน
- มีประวัติ
- ปลอดภัย
- ดูแลต่อได้
- ไม่มีค่าใช้จ่ายประจำเกินความจำเป็น

แนวทาง UX/UI ต้องยึดรูปแบบ:

> เรียบง่าย อบอุ่น เป็นมิตร ใช้สีเขียวธรรมชาติ และสร้างความรู้สึกว่าระบบนี้เป็นเครื่องมือของชุมชน ไม่ใช่ระบบราชการที่เข้าถึงยาก

---

**End of APP_SPEC.md**
