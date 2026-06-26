# Khaophang Report — CODEX PROMPT PACK (ฉบับเริ่มต้นใหม่)

> ชุด Prompt สำหรับใช้สั่ง Codex ผ่าน VS Code  
> ครอบคลุมตั้งแต่เริ่มต้นโปรเจ็กต์ การสร้าง Google Sheets, Google Drive, Google Apps Script จนถึงเปิดใช้งานจริง

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | CODEX_PROMPT_PACK.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชัน | 2.0.0 |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| Production URL | https://khaophangreport.pages.dev |
| GitHub Repository | https://github.com/khaophangreport-spec/khaophangreport.git |
| Project Email | khaophangreport@gmail.com |
| Frontend | HTML + CSS + Vanilla JavaScript |
| Backend | Google Apps Script |
| Database | Google Sheets |
| File Storage | Google Drive |
| Hosting | Cloudflare Pages |

---

# PART A — วิธีใช้ Prompt Pack

## 2. เอกสารที่ต้องอยู่ในโปรเจ็กต์ก่อนเริ่ม

จัดวางไฟล์ดังนี้:

```text
/
├── README.md
└── docs/
    ├── KHAOPHANG_REPORT_MASTER_SPEC.md
    ├── APP_SPEC.md
    ├── UI_FLOW.md
    ├── DATA_SCHEMA.md
    ├── API_SPEC.md
    ├── DEVELOPMENT_RULES.md
    └── CODEX_PROMPT_PACK.md
```

Codex ต้องอ่านเอกสารต่อไปนี้ก่อนเริ่มทุกงาน:

```text
README.md
docs/APP_SPEC.md
docs/UI_FLOW.md
docs/DATA_SCHEMA.md
docs/API_SPEC.md
docs/DEVELOPMENT_RULES.md
```

---

## 2.1 กฎ Source of Truth

```text
ไฟล์ใน VS Code = Source of Truth
Google Apps Script = Runtime Copy
```

ทุกครั้งที่ Codex แก้ Backend ต้องคัดลอกไฟล์ล่าสุดขึ้น Google Apps Script ก่อนรันหรือ Deploy

---

## 3. กติกาการใช้ Prompt

1. ใช้ Prompt ตามลำดับ
2. ทำทีละ Prompt
3. ตรวจผลก่อนสั่ง Prompt ถัดไป
4. อย่ารวมหลาย Phase ใน Prompt เดียว
5. ให้ Codex ตรวจไฟล์เดิมก่อนแก้
6. ให้ Codex แก้เฉพาะไฟล์ที่อนุญาต
7. ตรวจ `git diff` ทุกครั้ง
8. ทดสอบก่อน Commit
9. Commit เป็นส่วนย่อย
10. หาก Codex เสนอเปลี่ยน Stack ให้ปฏิเสธ
11. ห้ามให้ Codex Deploy หรือ Push โดยอัตโนมัติ เว้นแต่สั่งอย่างชัดเจน
12. ห้ามใส่ Secret จริงใน Prompt

---

## 4. ข้อความนำมาตรฐาน

ใช้ข้อความนี้นำหน้าทุก Prompt:

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง
```

---

# PART B — PHASE 0: ตรวจสอบสภาพแวดล้อม

## Prompt 00 — ตรวจสอบโปรเจ็กต์ก่อนเริ่ม

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจสอบสถานะโปรเจ็กต์ Khaophang Report ก่อนเริ่มพัฒนา

ให้ดำเนินการ:

1. ตรวจโครงสร้างไฟล์ทั้งหมด
2. ตรวจว่าเอกสารใน docs/ มีครบ
3. ตรวจ README.md
4. ตรวจ git status
5. ตรวจ current branch
6. ตรวจ remote origin
7. ตรวจ .gitignore
8. ตรวจว่ามี Secret หรือไฟล์ที่ไม่ควร Commit หรือไม่
9. ตรวจว่ามีโค้ดเดิมที่อาจขัดกับเอกสารหรือไม่
10. ห้ามแก้ไฟล์ในขั้นตอนนี้

ผลลัพธ์ที่ต้องรายงาน:

- สรุปสถานะ Repository
- ไฟล์ที่มีอยู่
- ไฟล์ที่ขาด
- ความเสี่ยง
- สิ่งที่ควรทำก่อน Prompt 01
```

### ตรวจรับ

- ไม่มีไฟล์ถูกแก้
- รายงานครบ
- ไม่แต่งข้อมูล
- ไม่สร้างโครงสร้างเองก่อนตรวจ

---

# PART C — PHASE 1: PROJECT FOUNDATION

## Prompt 01 — สร้างโครงสร้างโปรเจ็กต์

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างโครงสร้างไฟล์และโฟลเดอร์พื้นฐานของ Khaophang Report ตามเอกสาร

อนุญาตให้สร้าง:

- index.html
- report.html
- report-success.html
- track.html
- track-detail.html
- faq.html
- privacy.html
- terms.html
- contact.html
- admin/
- assets/css/
- assets/js/
- assets/images/
- assets/icons/
- apps-script/
- .gitignore

เงื่อนไข:

1. สร้างเฉพาะโครงสร้างและไฟล์ตั้งต้น
2. HTML ทุกหน้าต้องมี:
   - lang="th"
   - charset UTF-8
   - viewport
   - title
   - semantic main
3. ยังไม่ต้องสร้างฟังก์ชันเต็ม
4. ห้ามใส่ API URL จริง
5. ห้ามสร้าง Secret
6. ห้ามเขียน Apps Script Logic เต็มในขั้นนี้
7. ห้ามแก้เอกสารใน docs/

หลังทำ:
- แสดง tree โครงสร้าง
- ตรวจ path อ้างอิง CSS/JS
- ตรวจไม่มีไฟล์ซ้ำ
```

### Commit แนะนำ

```bash
git add .
git commit -m "chore: initialize project structure"
```

---

## Prompt 02 — สร้าง Design Tokens และ CSS Foundation

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างระบบ CSS Foundation ของ Khaophang Report

อนุญาตให้แก้:

- assets/css/variables.css
- assets/css/reset.css
- assets/css/base.css
- assets/css/components.css
- assets/css/utilities.css
- assets/css/public.css
- assets/css/admin.css
- HTML ทุกหน้าเฉพาะการเชื่อม CSS

ข้อกำหนด:

1. ใช้สีเขียวธรรมชาติ
2. บุคลิกเรียบง่าย อบอุ่น เป็นมิตร
3. Mobile-first
4. รองรับ 320px ขึ้นไป
5. สร้าง Design Tokens:
   - Color
   - Typography
   - Spacing
   - Radius
   - Shadow
   - Container
   - Z-index
6. สร้าง Component Styles:
   - Button
   - Card
   - Form
   - Status Chip
   - Alert
   - Toast
   - Modal
   - Skeleton
   - Empty State
   - Stepper
7. ห้ามใช้ CSS Framework
8. ห้ามใช้ !important โดยไม่จำเป็น
9. ต้องมี Focus State
10. Contrast ต้องอ่านง่าย

หลังทำ:
- ตรวจ CSS Syntax
- สรุป Token สำคัญ
- แจ้งวิธีดูตัวอย่าง
```

### Commit แนะนำ

```bash
git add assets/css *.html admin/*.html
git commit -m "feat: add design tokens and css foundation"
```

---

## Prompt 03 — สร้าง Shared Public Layout

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Layout กลางฝั่งประชาชน

อนุญาตให้แก้:

- index.html
- report.html
- report-success.html
- track.html
- track-detail.html
- faq.html
- privacy.html
- terms.html
- contact.html
- assets/css/public.css
- assets/js/utils.js
- assets/js/public/home.js

ข้อกำหนด:

1. Header:
   - Logo Placeholder
   - ชื่อ Khaophang Report
   - Desktop Navigation
2. Mobile Bottom Navigation:
   - หน้าแรก
   - แจ้งปัญหา
   - ติดตาม
   - ติดต่อ
3. Footer:
   - ชื่อระบบ
   - Email
   - Privacy
   - Terms
4. Active Menu ถูกต้อง
5. Bottom Navigation ไม่บังเนื้อหา
6. Logo กดกลับหน้าแรก
7. ใช้ Semantic HTML
8. รองรับ Keyboard
9. ห้ามใช้ Inline Event
10. ยังไม่เชื่อม API

หลังทำ:
- ตรวจทุก Public Page
- ตรวจ Mobile 320px
- ตรวจ Desktop
```

---

## Prompt 04 — สร้าง Shared Admin Layout

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Layout กลางฝั่ง Admin

อนุญาตให้แก้:

- admin/login.html
- admin/dashboard.html
- admin/reports.html
- admin/report-detail.html
- admin/users.html
- admin/categories.html
- admin/announcements.html
- admin/settings.html
- admin/activity-logs.html
- admin/export.html
- assets/css/admin.css
- assets/js/auth.js
- assets/js/admin/layout.js

ข้อกำหนด:

1. Desktop Sidebar
2. Mobile Top Bar + Drawer
3. เมนู:
   - Dashboard
   - เรื่องแจ้ง
   - งานของฉัน
   - รายงาน
   - ผู้ใช้งาน
   - หมวดหมู่
   - ประกาศ
   - Activity Logs
   - ตั้งค่า
   - ออกจากระบบ
4. Drawer ปิดได้ด้วย:
   - ปุ่มปิด
   - Overlay
   - Escape
5. จัด Focus อย่างเหมาะสม
6. ยังไม่เชื่อม Session จริง
7. Role Menu เตรียม Hook ไว้ แต่ไม่ Hardcode สิทธิ์เป็นแหล่งจริง
8. ห้ามสร้างข้อมูล Admin จริง

หลังทำ:
- ตรวจ Sidebar
- ตรวจ Drawer
- ตรวจ Mobile
- ตรวจ Keyboard
```

---

## Prompt 05 — สร้าง Frontend Config และ Utility กลาง

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างไฟล์ Config และ Utility กลาง

อนุญาตให้แก้:

- assets/js/config.js
- assets/js/utils.js
- assets/js/validation.js
- assets/js/toast.js
- assets/js/modal.js

ข้อกำหนด:

1. config.js มีเฉพาะ Public Config
2. ใส่ค่า:
   - APP_NAME
   - APP_NAME_TH
   - API_URL เป็น Placeholder
   - SITE_URL
   - CONTACT_EMAIL
   - MAX_IMAGES
   - MAX_IMAGE_SIZE_MB
   - MAX_IMAGE_DIMENSION
   - DEFAULT_PAGE_SIZE
3. utils.js:
   - escape text อย่างปลอดภัย
   - format Thai date
   - format Thai datetime
   - normalize tracking code
   - debounce
   - generate request ID
4. validation.js:
   - required
   - phone
   - email
   - date
   - lat/lng
   - max length
5. toast.js:
   - success
   - error
   - warning
   - info
6. modal.js:
   - open
   - close
   - focus trap
   - restore focus
7. ห้ามเก็บ Secret
8. ห้ามใช้ innerHTML กับข้อมูลผู้ใช้โดยไม่ Sanitize

หลังทำ:
- สร้างตัวอย่างเรียกใช้งานสั้น ๆ ใน Comment
- ตรวจไม่มี Global Collision
```

---

## Prompt 06 — สร้าง API Client กลาง

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง assets/js/api.js เป็น API Client กลาง

อนุญาตให้แก้:

- assets/js/api.js
- assets/js/config.js เฉพาะเมื่อจำเป็น
- assets/js/auth.js เฉพาะ Hook Session

ข้อกำหนด:

1. ใช้ Fetch API
2. Request Envelope ตาม API_SPEC.md
3. รองรับ:
   - action
   - requestId
   - sessionToken
   - data
4. มี Timeout
5. ใช้ AbortController
6. Parse JSON อย่างปลอดภัย
7. สร้าง ApiError Class
8. Handle:
   - VALIDATION_ERROR
   - RATE_LIMITED
   - SESSION_EXPIRED
   - FORBIDDEN
   - NETWORK_ERROR
9. Retry เฉพาะ Read Action ที่ปลอดภัย
10. ห้าม Retry Write Action อัตโนมัติ
11. ห้าม Hardcode API URL
12. ห้าม Log Password, Token หรือ Base64
13. Export ฟังก์ชันที่ใช้ได้จาก Public/Admin

หลังทำ:
- แสดงตัวอย่างเรียก category.list
- แสดงตัวอย่างเรียก admin.report.list
- ตรวจ Syntax
```

---

# PART D — PHASE 2: GOOGLE SHEETS AND APPS SCRIPT FOUNDATION

## Prompt 07 — สร้าง Apps Script File Foundation

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างไฟล์ Google Apps Script Foundation

อนุญาตให้สร้าง/แก้:

- apps-script/Code.gs
- apps-script/Config.gs
- apps-script/Router.gs
- apps-script/Response.gs
- apps-script/Validation.gs
- apps-script/Utils.gs
- apps-script/Security.gs

ข้อกำหนด:

1. Code.gs มี doGet และ doPost เท่านั้น
2. Router ใช้ Action Whitelist
3. Response Format ตรง API_SPEC.md
4. Error กลางไม่ส่ง Stack Trace
5. Config อ่าน Script Properties
6. Validation Shared Helper
7. Utils:
   - UUID
   - ISO timestamp
   - normalize string
   - safe JSON parse
8. Security:
   - sanitize
   - hash helper interface
   - safe logging
9. เพิ่ม health.check
10. ห้ามเขียน Sheet Logic ใน Router
11. ห้าม Hardcode Spreadsheet ID
12. ห้าม Hardcode Folder ID
13. ห้าม Hardcode Secret

หลังทำ:
- สรุป Action Whitelist
- แสดงตัวอย่าง health.check
- ตรวจ Apps Script Syntax
```

---


# PART C1 — MANUAL GOOGLE SETUP ก่อน Prompt 08

> จุดนี้ต้องหยุดใช้ Codex ชั่วคราว แล้วสร้างทรัพยากร Google ด้วยตัวเองก่อน  
> ห้ามรัน Prompt 08 จนกว่าจะทำ Manual Step ต่อไปนี้ครบ

## MANUAL STEP G01 — สร้าง Google Spreadsheet

ใช้บัญชีโครงการ:

```text
khaophangreport@gmail.com
```

ขั้นตอน:

1. เข้า Google Drive
2. กด **ใหม่**
3. เลือก **Google ชีต**
4. ตั้งชื่อ:

```text
Khaophang Report Database
```

5. ไม่ต้องสร้าง Sheet ย่อยเอง
6. คัดลอก Spreadsheet ID จาก URL

ตัวอย่าง:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

เก็บเฉพาะส่วน `SPREADSHEET_ID` และห้ามใส่ลง GitHub

---

## MANUAL STEP G02 — สร้าง Google Drive Root Folder

ใน Google Drive บัญชีเดียวกัน:

1. กด **ใหม่**
2. เลือก **โฟลเดอร์**
3. ตั้งชื่อ:

```text
Khaophang_Report_Files
```

4. เปิดโฟลเดอร์
5. คัดลอก Folder ID จาก URL

ตัวอย่าง:

```text
https://drive.google.com/drive/folders/ROOT_FOLDER_ID
```

เก็บเฉพาะ `ROOT_FOLDER_ID`

ฉบับนี้กำหนดให้สร้าง Root Folder เอง เพื่อป้องกันการสร้างซ้ำและตรวจสอบบัญชีได้ชัดเจน

---

## MANUAL STEP G03 — สร้าง Google Apps Script Project

วิธีที่แนะนำ:

1. เปิด Spreadsheet `Khaophang Report Database`
2. ไปที่:

```text
ส่วนขยาย → Apps Script
```

3. ตั้งชื่อ Project:

```text
Khaophang Report Backend
```

4. ลบโค้ดตัวอย่างใน `Code.gs`
5. ยังไม่ต้อง Deploy

---

## MANUAL STEP G04 — ตั้ง Script Properties

ไปที่:

```text
Project Settings → Script Properties
```

เพิ่ม:

| Property | Value |
|---|---|
| `SPREADSHEET_ID` | Spreadsheet ID จริง |
| `ROOT_FOLDER_ID` | Folder ID จริง |
| `APP_SECRET` | ค่าสุ่มชุดที่ 1 |
| `SESSION_SECRET` | ค่าสุ่มชุดที่ 2 |
| `ADMIN_SETUP_KEY` | ค่าสุ่มชุดที่ 3 |
| `ALLOWED_ORIGIN` | `http://localhost:5500` หรือ Origin ของ Live Server ที่ใช้จริง |
| `ENVIRONMENT` | `development` |

สร้าง Secret ด้วย PowerShell:

```powershell
$b=New-Object byte[] 32;$r=[System.Security.Cryptography.RandomNumberGenerator]::Create();$r.GetBytes($b);$v=-join($b|ForEach-Object{$_.ToString("x2")});$r.Dispose();$v
```

รัน 3 ครั้ง และใช้คนละค่า

ห้ามเก็บ Secret ใน:

- GitHub
- `assets/js/config.js`
- README
- docs/
- Google Sheets
- Prompt ที่ส่งให้ Codex

---

## MANUAL STEP G05 — นำ Apps Script Foundation จาก VS Code ขึ้น Google

หลัง Prompt 07 ต้องมีไฟล์อย่างน้อย:

```text
apps-script/
├── Code.gs
├── Config.gs
├── Router.gs
├── Response.gs
├── Validation.gs
├── Utils.gs
├── Security.gs
├── Setup.gs
├── SheetRepository.gs
├── DriveRepository.gs
└── Tests.gs
```

ให้ทำดังนี้:

1. ใน Google Apps Script สร้างไฟล์ชื่อเดียวกัน
2. คัดลอกโค้ดจาก VS Code ไปวาง
3. กด Save
4. ห้ามแก้เฉพาะบน Google Apps Script แล้วไม่อัปเดต VS Code

กฎสำคัญ:

```text
ไฟล์ใน VS Code = Source of Truth
Google Apps Script = Runtime Copy
```


## Prompt 08 — สร้าง Setup.gs และ Google Sheets Schema

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Setup.gs สำหรับสร้าง Google Sheets และ Google Drive ตาม DATA_SCHEMA.md

อนุญาตให้แก้:

- apps-script/Setup.gs
- apps-script/Config.gs
- apps-script/SheetRepository.gs
- apps-script/DriveRepository.gs
- apps-script/Utils.gs

ข้อกำหนด:

1. setupSystem() ต้อง Idempotent
2. สร้าง Sheets:
   - reports
   - report_updates
   - attachments
   - categories
   - users
   - sessions
   - assignments
   - announcements
   - settings
   - activity_logs
   - report_additional_info
   - rate_limits
   - dashboard_cache
   - schema_migrations
   - system_counters
   - export_logs
3. Header ต้องตรง DATA_SCHEMA.md
4. Freeze Header
5. Bold Header
6. Filter
7. Data Validation
8. Checkbox
9. Column Width
10. Seed Categories
11. Seed Public Settings
12. สร้าง Root Folder:
    - reports
    - announcements
    - exports
    - backups
    - temp
13. ใช้ Script Properties:
    - SPREADSHEET_ID
    - ROOT_FOLDER_ID
14. บันทึก schema_version
15. ห้ามสร้าง Admin Password แบบ Plain Text
16. มี validateSetup() ตรวจผล

หลังทำ:
- สรุปสิ่งที่ setupSystem() สร้าง
- แจ้งขั้นตอนรัน
- แจ้งวิธีตรวจผล
```

---


## MANUAL STEP G06 — อัปเดตโค้ด Prompt 08 ขึ้น Google Apps Script

หลัง Codex ทำ Prompt 08 เสร็จ:

1. ตรวจรายชื่อไฟล์ที่ Codex แก้
2. คัดลอกไฟล์ล่าสุดจาก VS Code ไป Google Apps Script
3. อย่างน้อยต้องตรวจ:
   - `Setup.gs`
   - `Config.gs`
   - `SheetRepository.gs`
   - `DriveRepository.gs`
   - `Tests.gs`
4. กด Save

---

## MANUAL STEP G07 — รัน Setup และตรวจผล

รันตามลำดับ:

```javascript
debugSetupEnvironment()
```

ตรวจว่า Spreadsheet และ Root Folder ถูกต้อง

จากนั้นรัน:

```javascript
setupSystem()
```

Google จะขอสิทธิ์ Google Sheets, Google Drive และ Script Properties ให้ยอมรับด้วยบัญชีโครงการ

จากนั้นรัน:

```javascript
validateSetup()
validateSeedData()
```

### CHECKPOINT G07 — ห้ามไป Prompt 09 หากยังไม่ผ่าน

Google Sheets ต้องมี Sheets ครบ และ:

- `categories` มี Seed Data 10 รายการ
- `settings` มีค่าขั้นต่ำครบ

Google Drive ภายใน `Khaophang_Report_Files` ต้องมี:

```text
reports/
announcements/
exports/
backups/
temp/
```

Apps Script Logs ต้องไม่มี Error

Script Properties ต้องมี:

```text
SPREADSHEET_ID
ROOT_FOLDER_ID
APP_SECRET
SESSION_SECRET
ADMIN_SETUP_KEY
ALLOWED_ORIGIN
ENVIRONMENT
```

หาก Categories หรือ Settings ยังว่าง ให้หยุดและแก้ Prompt 08 ก่อน ห้ามเดินหน้าต่อ


## Prompt 09 — สร้าง SheetRepository และ DriveRepository

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Repository Layer

อนุญาตให้แก้:

- apps-script/SheetRepository.gs
- apps-script/DriveRepository.gs
- apps-script/Utils.gs
- apps-script/Validation.gs

ข้อกำหนด SheetRepository:

1. อ่าน Header Map
2. Convert Row ↔ Object
3. findById
4. findOne
5. list
6. append
7. updateById
8. softDeleteById
9. pagination helper
10. version check
11. filter is_deleted
12. batch read/write
13. ห้ามพึ่ง Column Number ถาวร

ข้อกำหนด DriveRepository:

1. สร้าง Report Folder ตามปีและ report_id
2. บันทึกไฟล์
3. ตั้งชื่อไฟล์ใหม่
4. ตรวจ Folder
5. ลบ/ย้าย Temp
6. ห้ามเปิด Root Folder Public
7. คืน File ID และ Metadata

หลังทำ:
- เพิ่ม Test Helper
- ตรวจ Error Handling
- อธิบาย Interface
```

---

## Prompt 10 — สร้าง Public Config, Category และ Announcement Services

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Service และ API สำหรับ Public Config, Category และ Announcement

อนุญาตให้แก้:

- apps-script/SettingsService.gs
- apps-script/CategoryService.gs
- apps-script/AnnouncementService.gs
- apps-script/Router.gs
- apps-script/Config.gs
- apps-script/Tests.gs

Action:

- public.config
- category.list
- announcement.list

ข้อกำหนด:

1. ใช้ Cache Service
2. คืนเฉพาะข้อมูล Public
3. Category คืนเฉพาะ Active
4. Announcement คืนเฉพาะ Active และอยู่ในช่วงเวลา
5. ห้ามคืน Default Assignee
6. ห้ามคืน Secret
7. Response ตรง API_SPEC.md
8. มี Test Functions

หลังทำ:
- แสดงตัวอย่าง Request/Response
- แจ้งวิธีทดสอบจาก Apps Script
```

---

# PART E — PHASE 3: PUBLIC MVP


## MANUAL STEP G08 — อัปเดตและทดสอบ Public API

หลัง Prompt 10:

1. คัดลอกไฟล์ล่าสุดขึ้น Google Apps Script
2. กด Save
3. รัน Test Functions ที่ Codex สร้าง
4. ตรวจว่า:
   - `health.check` สำเร็จ
   - `public.config` คืน Settings
   - `category.list` คืน 10 หมวด Active
   - `announcement.list` คืน Array ว่างได้โดยไม่ Error
   - ไม่มี Secret หรือข้อมูลภายในรั่ว

---

## MANUAL STEP G09 — Deploy Development Web App

1. Google Apps Script → **Deploy**
2. เลือก **New deployment**
3. Type: **Web app**
4. Execute as: **Me**
5. กำหนดสิทธิ์ให้ Public API เรียกได้
6. กด Deploy
7. คัดลอก URL ที่ลงท้ายด้วย `/exec`

ตั้ง `ALLOWED_ORIGIN` ให้ตรงกับ Live Server เช่น:

```text
http://127.0.0.1:5500
```

หรือ:

```text
http://localhost:5500
```

---

## MANUAL STEP G10 — ใส่ API URL ใน Frontend

นำ URL `/exec` ไปใส่เฉพาะใน:

```text
assets/js/config.js
```

เช่น:

```javascript
window.APP_CONFIG.API_URL = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
```

API URL ไม่ใช่ Secret แต่ห้ามใส่ Spreadsheet ID, Folder ID หรือ Secret ใน Frontend

### CHECKPOINT G10 — ห้ามไป Prompt 11 หาก

- `category.list` ยังใช้ไม่ได้
- `public.config` ยังใช้ไม่ได้
- API ยังไม่ Deploy
- Browser เรียก API ไม่ได้
- Console มี Error ที่ยังไม่แก้


## Prompt 11 — สร้างหน้าแรก

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างหน้า index.html ให้สมบูรณ์ตาม UX/UI แบบที่ 1

อนุญาตให้แก้:

- index.html
- assets/css/public.css
- assets/js/public/home.js
- assets/js/api.js เฉพาะเมื่อจำเป็น

ข้อกำหนด:

1. Hero Section
2. Headline:
   “ร่วมกันสร้างชุมชนเขาพังให้น่าอยู่ยิ่งขึ้น”
3. ปุ่ม:
   - แจ้งปัญหา
   - ติดตามสถานะ
4. จุดเด่น:
   - แจ้งง่าย
   - ติดตามได้
   - ปลอดภัย
   - ร่วมพัฒนาชุมชน
5. โหลดหมวดจาก category.list
6. โหลดประกาศจาก announcement.list
7. โหลด Public Config
8. มี Loading, Empty, Error
9. หมวดกดแล้วไป report.html พร้อม category query
10. แสดงคำเตือนกรณีฉุกเฉิน
11. Mobile-first
12. ห้าม Hardcode Category หาก API ใช้งานได้
13. ห้ามใช้ภาพที่ไม่มีสิทธิ์

หลังทำ:
- ตรวจ 320px
- ตรวจ Desktop
- ตรวจ API Failure
```

---

## Prompt 12 — สร้าง Report Form State และ Stepper

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างโครงสร้างแบบฟอร์มแจ้งปัญหา 6 ขั้น

อนุญาตให้แก้:

- report.html
- assets/css/public.css
- assets/js/public/report.js
- assets/js/validation.js
- assets/js/utils.js

ข้อกำหนด:

1. Step 1 หมวด
2. Step 2 รายละเอียด
3. Step 3 สถานที่
4. Step 4 รูปภาพ
5. Step 5 ข้อมูลผู้แจ้ง
6. Step 6 ตรวจสอบ
7. Stepper แสดงขั้นปัจจุบัน
8. Next/Back
9. Validate ต่อ Step
10. ข้อมูลไม่หายเมื่อย้อนกลับ
11. Draft ใน Local Storage เฉพาะข้อมูลปลอดภัย
12. Query category ต้อง Preselect
13. เตือนก่อนออกเมื่อยังไม่ส่ง
14. ยังไม่ส่ง API จริงใน Prompt นี้
15. ห้ามเก็บภาพ Base64 ถาวรใน Local Storage

หลังทำ:
- ทดสอบเดินครบ 6 ขั้น
- ทดสอบย้อนกลับ
- ทดสอบ Refresh Draft
```

---


## MANUAL CHECKPOINT G11 — ก่อนเริ่ม Prompt 13

ตรวจให้ครบ:

1. หน้าแรกโหลด Categories จาก Google Sheets จริง
2. Public Config โหลดได้
3. Announcement แสดงได้หรือแสดง Empty State ถูกต้อง
4. Report Form เดินครบ 6 ขั้น
5. Query Category Preselect ทำงาน
6. Draft ทำงาน
7. Console ไม่มี Error
8. `git diff` ไม่มี Secret

เมื่อผ่านครบแล้วจึงเริ่ม Prompt 13


## Prompt 13 — สร้าง Step 1 และ Step 2 ให้สมบูรณ์

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
พัฒนา Step 1 เลือกหมวด และ Step 2 รายละเอียด

อนุญาตให้แก้:

- report.html
- assets/css/public.css
- assets/js/public/report.js
- assets/js/validation.js

Step 1:

- โหลด category.list
- Card พร้อม Icon, Name, Description
- Selected State
- ปุ่มถัดไป Disable จนเลือก

Step 2:

- title
- description
- incidentDate
- priorityReported
- Character Count
- Emergency Warning เมื่อ critical

Validation:

- title 5–150
- description 10–3000
- incidentDate ไม่เป็นอนาคต
- priority enum ถูกต้อง

ต้องมี:
- Loading
- Empty
- Error
- Focus Field แรกที่ผิด
```

---

## Prompt 14 — สร้าง Step 3 Location

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
พัฒนา Step 3 ระบุสถานที่และพิกัด

อนุญาตให้แก้:

- report.html
- assets/js/location.js
- assets/js/public/report.js
- assets/css/public.css
- assets/js/validation.js

Fields:

- locationName
- villageNo
- landmark
- latitude
- longitude
- mapUrl

ฟังก์ชัน:

1. ปุ่มใช้ตำแหน่งปัจจุบัน
2. รองรับ Permission Allow
3. รองรับ Permission Deny
4. Timeout
5. Browser ไม่รองรับ
6. ผู้ใช้ยังกรอกเองได้
7. สร้าง Google Maps URL จากพิกัด
8. แสดงพิกัดแบบอ่านง่าย

Validation:

- ต้องมี locationName หรือ landmark
- Lat/Lng ถูกช่วง
- ถ้ามีค่าหนึ่งต้องมีครบคู่

ห้ามบังคับ GPS
```

---

## Prompt 15 — สร้าง Image Compression และ Step 4

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างระบบเพิ่มภาพและบีบอัดภาพฝั่ง Browser

อนุญาตให้แก้:

- assets/js/image-compress.js
- assets/js/public/report.js
- report.html
- assets/css/public.css

ข้อกำหนด:

1. รองรับ JPG, PNG, WebP
2. สูงสุด 3 รูป
3. ด้านยาวไม่เกิน 1600px
4. เป้าหมายไม่เกิน 1 MB ต่อรูป
5. ใช้ Canvas
6. แสดง Preview
7. แสดง Compressing State
8. ลบภาพได้
9. Handle Error ต่อภาพ
10. ไม่เก็บ Base64 ถาวรใน Local Storage
11. ส่ง Metadata:
    - fileName
    - mimeType
    - fileSize
    - width
    - height
12. ตรวจ Orientation เท่าที่ Browser รองรับ
13. ป้องกัน Memory Leak ด้วย revokeObjectURL

หลังทำ:
- ทดสอบภาพใหญ่
- ทดสอบ 4 รูป
- ทดสอบไฟล์ผิดชนิด
```

---

## Prompt 16 — สร้าง Step 5 และ Step 6

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
พัฒนา Step 5 ข้อมูลผู้แจ้ง และ Step 6 ตรวจสอบ

อนุญาตให้แก้:

- report.html
- assets/js/public/report.js
- assets/js/validation.js
- assets/css/public.css

Step 5:

- เลือกระบุตัวตน/ไม่ระบุตัวตน
- name
- phone
- email optional
- contactMethod
- Anonymous Explanation

Rules:

- Anonymous Payload ห้ามมี PII
- Switching ต้องไม่ส่งค่าที่ไม่ควรส่ง
- Phone และ Email Validation

Step 6:

- Summary ทุก Section
- ปุ่มแก้ไขกลับแต่ละ Step
- Truth Confirmation
- Privacy Acceptance
- Link Privacy/Terms ไม่ทำข้อมูลหาย
- Submit Button
- ยังไม่เชื่อม API ในช่วงต้น แต่เตรียม payload builder

หลังทำ:
- แสดงตัวอย่าง Payload แบบระบุตัวตน
- แสดงตัวอย่าง Payload แบบ Anonymous
```

---


## กฎบังคับเมื่อ Prompt ใดแก้ไฟล์ `apps-script/`

ทุกครั้งต้องทำตามลำดับ:

```text
Codex แก้ใน VS Code
→ ตรวจ git diff
→ คัดลอกไฟล์ที่แก้ขึ้น Google Apps Script
→ Save
→ Run Test
→ Deploy New Version
→ ทดสอบจริง
→ Commit
```

ห้ามรันโค้ดเก่าใน Google Apps Script หลัง Codex แก้ไฟล์ใน VS Code


## Prompt 17 — สร้าง ReportService และ report.create

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Backend สำหรับ report.create

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AttachmentService.gs
- apps-script/AuditService.gs
- apps-script/SheetRepository.gs
- apps-script/DriveRepository.gs
- apps-script/Validation.gs
- apps-script/Security.gs
- apps-script/Router.gs
- apps-script/Tests.gs

ข้อกำหนด:

1. Action report.create
2. ตรวจ Rate Limit
3. ตรวจ requestId
4. Validate Payload ทั้งหมด
5. สร้าง UUID
6. สร้าง Tracking Code
7. ใช้ Lock Service
8. บันทึก reports
9. อัปโหลดภาพ
10. บันทึก attachments
11. สร้าง Timeline แรก
12. สร้าง Activity Log
13. Anonymous ต้องไม่เก็บ PII
14. Rollback/Compensation เมื่อ Upload ล้มเหลว
15. Response ตรง API_SPEC.md
16. ห้ามเก็บ Base64 ใน Sheet
17. ห้ามเชื่อ Frontend MIME อย่างเดียว
18. มี Test Cases

หลังทำ:
- แสดง Test Functions
- อธิบาย Failure Handling
```

---

## Prompt 18 — เชื่อม Report Form กับ report.create

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
เชื่อมหน้า report.html กับ API report.create

อนุญาตให้แก้:

- assets/js/public/report.js
- assets/js/api.js เฉพาะจำเป็น
- report.html
- report-success.html
- assets/css/public.css

ข้อกำหนด:

1. Final Validation
2. สร้าง requestId
3. Disable Submit
4. Loading State
5. ป้องกัน Double Submit
6. ส่ง Attachments
7. Handle Field Errors
8. Handle Rate Limit
9. Handle Network Error
10. คงข้อมูลเมื่อ Error
11. Success:
    - ลบ Draft
    - เก็บ Result ชั่วคราว
    - ไป report-success.html
12. ห้ามสร้าง Tracking Code ฝั่ง Frontend

หลังทำ:
- ทดสอบ Success
- ทดสอบ Network Error
- ทดสอบกดซ้ำ
```

---

## Prompt 19 — สร้าง Report Success Page

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง report-success.html ให้สมบูรณ์

อนุญาตให้แก้:

- report-success.html
- assets/js/public/report-success.js
- assets/css/public.css

ข้อกำหนด:

1. แสดง Success
2. Tracking Code
3. Created At
4. ปุ่มคัดลอก
5. ปุ่มติดตาม
6. ปุ่มกลับหน้าแรก
7. เตือนให้เก็บรหัส
8. Direct Access โดยไม่มี Result:
   - ห้ามสร้างรหัสปลอม
   - แสดงทางไป Track/Home
9. Clipboard Fallback
10. Accessible

หลังทำ:
- ทดสอบ Copy
- ทดสอบ Direct URL
```

---

## Prompt 20 — สร้าง report.track Backend

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Backend Action report.track

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/CategoryService.gs
- apps-script/AttachmentService.gs
- apps-script/Router.gs
- apps-script/Validation.gs
- apps-script/Tests.gs

ข้อกำหนด:

1. Normalize Tracking Code
2. Rate Limit
3. หา Report
4. Public Projection เท่านั้น
5. โหลด Public Timeline
6. โหลด Public Attachments
7. ห้ามคืน PII
8. ห้ามคืน Internal Note
9. ห้ามคืน assigned_to ID
10. Not Found Message แบบทั่วไป
11. Response ตรง API_SPEC.md
12. มี Test ตรวจข้อมูลรั่ว

หลังทำ:
- แสดงตัวอย่าง Response
- แสดง Test Public Projection
```

---

## Prompt 21 — สร้าง Track Pages

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง track.html และ track-detail.html

อนุญาตให้แก้:

- track.html
- track-detail.html
- assets/js/public/track.js
- assets/css/public.css

track.html:

- Input Tracking Code
- Normalize
- Format Validation
- Loading
- Not Found
- Rate Limit
- Retry

track-detail.html:

- Tracking Code
- Category
- Title
- Created At
- Current Status
- Timeline
- Public Result
- Public Attachments
- ปุ่มส่งข้อมูลเพิ่ม

ข้อกำหนด:

- ห้ามแสดง PII
- Status มีสีและข้อความ
- Timeline อ่านง่ายบนมือถือ
- Direct URL ต้อง Handle Missing Code
```

---

## Prompt 22 — สร้าง report.addInfo

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างระบบส่งข้อมูลเพิ่มเติมทั้ง Backend และ Frontend

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AttachmentService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- track-detail.html
- assets/js/public/track.js
- assets/js/image-compress.js
- assets/css/public.css

ข้อกำหนด:

1. Action report.addInfo
2. requestId
3. Rate Limit
4. ตรวจ Report
5. Closed Policy
6. Message Validation
7. Attachments
8. บันทึก report_additional_info
9. สร้าง Timeline info_received
10. Default reviewStatus=pending
11. Success/Error State
12. ป้องกันส่งซ้ำ

หลังทำ:
- ทดสอบ Open Report
- ทดสอบ Closed Report
- ทดสอบ Duplicate Request
```

---

## Prompt 23 — สร้าง FAQ, Privacy, Terms และ Contact

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างหน้าข้อมูลสาธารณะให้ครบ

อนุญาตให้แก้:

- faq.html
- privacy.html
- terms.html
- contact.html
- assets/css/public.css
- assets/js/public/faq.js

ข้อกำหนด:

FAQ:
- Search
- Accordion
- Empty State

Privacy:
- โครงสร้างพร้อมแก้ข้อความจริง
- ระบุข้อมูลที่ระบบเก็บ
- วัตถุประสงค์
- สิทธิ์ผู้ใช้
- ช่องทางติดต่อ
- ห้ามแต่งข้อกฎหมายเฉพาะที่ยังไม่ยืนยัน

Terms:
- ข้อจำกัดการใช้งาน
- ห้ามแจ้งข้อมูลเท็จ
- ไม่ใช่ระบบฉุกเฉิน

Contact:
- Email khaophangreport@gmail.com
- ช่องเบอร์โทร Placeholder
- เวลาทำการ Placeholder
- Emergency Section ชัดเจน

ใช้ภาษาไทยเข้าใจง่าย
```

---

# PART F — PHASE 4: AUTHENTICATION

## Prompt 24 — สร้าง AuthService และ SessionService

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Authentication และ Session Backend

อนุญาตให้แก้:

- apps-script/AuthService.gs
- apps-script/SessionService.gs
- apps-script/UserService.gs
- apps-script/Security.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- apps-script/Setup.gs เฉพาะ setup admin helper

Action:

- auth.login
- auth.me
- auth.logout
- auth.changePassword

ข้อกำหนด:

1. Hash + Salt
2. ห้าม Plain Password
3. Token สุ่ม
4. เก็บ Token Hash
5. Session Expiry
6. Failed Login Count
7. Account Lock
8. Inactive User ห้าม Login
9. Generic Login Error
10. Change Password Revoke Sessions
11. Must Change Password
12. Activity Log
13. สร้าง First Admin ผ่าน ADMIN_SETUP_KEY
14. ห้ามใส่ Password จริงใน Source

หลังทำ:
- สร้าง Test Functions
- อธิบายวิธีสร้าง Admin แรก
```

---


## MANUAL STEP G12 — สร้าง Super Admin คนแรกหลัง Prompt 24

หลัง Prompt 24 และหลังอัปเดตโค้ดขึ้น Google Apps Script:

1. รันฟังก์ชัน Initial Super Admin ตามชื่อที่ Codex สร้าง
2. ใช้ `ADMIN_SETUP_KEY`
3. ตั้ง Username และ Temporary Password
4. ตรวจว่า Password ถูก Hash และไม่มี Plain Text ใน Sheet
5. Login ครั้งแรกต้องบังคับเปลี่ยน Password
6. หลังสร้างสำเร็จ:
   - ลบ `ADMIN_SETUP_KEY` หรือเปลี่ยนเป็นค่าใหม่
   - ปิด Initial Admin Setup
7. ทดสอบ `auth.login`, `auth.me`, `auth.logout`

ห้ามไป Prompt 25 หากยังสร้าง Super Admin หรือ Session ไม่สำเร็จ


## Prompt 25 — เชื่อม Admin Login

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
เชื่อม admin/login.html กับ Authentication API

อนุญาตให้แก้:

- admin/login.html
- assets/js/auth.js
- assets/js/api.js เฉพาะจำเป็น
- assets/css/admin.css

ข้อกำหนด:

1. Username
2. Password
3. Show/Hide Password
4. Loading
5. Generic Error
6. Account Locked
7. Rate Limited
8. Session Store ตามแนวทางที่เลือกในเอกสาร
9. auth.me
10. Redirect Dashboard
11. returnUrl Validation
12. ห้ามเก็บ Password
13. รองรับ Enter
14. Accessible

หลังทำ:
- ทดสอบ Login Success/Fail
- ทดสอบ Session เดิม
```

---

## Prompt 26 — สร้าง Admin Route Guard และ Role Menu

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Guard ทุกหน้า Admin

อนุญาตให้แก้:

- assets/js/auth.js
- assets/js/admin/layout.js
- admin/*.html เฉพาะ script hook
- assets/css/admin.css

ข้อกำหนด:

1. ตรวจ Session ก่อนแสดงเนื้อหา
2. เรียก auth.me
3. Session Expired → Login
4. เก็บ returnUrl อย่างปลอดภัย
5. Render ชื่อผู้ใช้
6. Render Role
7. ซ่อนเมนูตาม Permission
8. Backend ยังเป็นแหล่งจริง
9. Logout Revoke Session
10. ล้าง Client Session แม้ API Logout ล้มเหลว
11. ป้องกัน Redirect Loop
12. Loading State ระหว่างตรวจ Auth
```

---

# PART G — PHASE 5: ADMIN REPORT MANAGEMENT

## Prompt 27 — สร้าง DashboardService

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง dashboard.summary Backend

อนุญาตให้แก้:

- apps-script/DashboardService.gs
- apps-script/SheetRepository.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- apps-script/ReportService.gs เฉพาะ helper

ข้อกำหนด:

1. Summary Cards
2. By Month
3. By Category
4. By Status
5. By Village
6. Average Resolution Time
7. Within Target Percent
8. Overdue
9. Scope global/mine
10. Officer default mine
11. Cache
12. Clear Cache เมื่อข้อมูลเปลี่ยน
13. ไม่คืน PII
14. ไม่โหลดทุกแถวโดยไม่จำเป็น
```

---

## Prompt 28 — สร้าง Admin Dashboard UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin/dashboard.html

อนุญาตให้แก้:

- admin/dashboard.html
- assets/js/admin/dashboard.js
- assets/css/admin.css

ข้อกำหนด:

1. Welcome
2. Last Updated
3. Summary Cards
4. Urgent
5. Overdue
6. Recent Reports
7. Charts แบบเบา
8. Scope ตาม Role
9. Loading Skeleton
10. Empty State
11. Error State
12. Responsive
13. ห้ามใช้ Chart Library ใหญ่โดยไม่ได้รับอนุญาต
14. หากยังไม่ใช้กราฟจริง ให้ใช้ CSS/SVG แบบเรียบง่าย
```

---

## Prompt 29 — สร้าง admin.report.list Backend

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Action admin.report.list

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/SheetRepository.gs
- apps-script/Router.gs
- apps-script/Tests.gs

รองรับ:

- page
- pageSize
- keyword
- status
- categoryId
- priority
- assigneeId
- dateFrom
- dateTo
- scope
- sortBy
- sortDirection

ข้อกำหนด:

1. Pagination
2. Max 100
3. Sort Whitelist
4. Officer Scope
5. Viewer Read-only
6. ไม่คืน PII ใน List
7. คืน version
8. isOverdue
9. ageHours
10. Test Filters
```

---

## Prompt 30 — สร้าง Admin Reports UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin/reports.html

อนุญาตให้แก้:

- admin/reports.html
- assets/js/admin/reports.js
- assets/css/admin.css

ข้อกำหนด:

1. Search
2. Filter:
   - Status
   - Category
   - Priority
   - Assignee
   - Date
3. Pagination
4. Sort
5. Clear Filters
6. URL Query Sync
7. Desktop Table
8. Mobile Card
9. Loading
10. Empty
11. Error
12. กลับจาก Detail แล้วคง Filter/Page
13. Officer เห็น Scope ตามสิทธิ์
```

---

## Prompt 31 — สร้าง admin.report.detail Backend

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin.report.detail

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AttachmentService.gs
- apps-script/AssignmentService.gs
- apps-script/Router.gs
- apps-script/Tests.gs

ต้องคืน:

- Report
- Location
- Reporter ตามสิทธิ์
- Attachments
- Timeline
- Assignments
- Additional Info
- Internal Notes ตามสิทธิ์
- Version

ข้อกำหนด:

1. ตรวจ Permission
2. Officer Scope
3. Viewer PII Mask
4. ห้ามคืน Password/Session Data
5. Soft Deleted ไม่คืน
6. Test Role Projection
```

---

## Prompt 32 — สร้าง Admin Report Detail UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin/report-detail.html

อนุญาตให้แก้:

- admin/report-detail.html
- assets/js/admin/report-detail.js
- assets/css/admin.css

Sections:

1. Summary
2. Report Details
3. Location
4. Reporter
5. Attachments
6. Status
7. Priority
8. Assignment
9. Public Timeline
10. Internal Notes
11. Additional Info
12. History

ข้อกำหนด:

- Desktop 2 Columns
- Mobile 1 Column
- Permission-aware UI
- Loading/Error/Not Found
- Back to List คง Filter
- Version เก็บใน State
- ห้ามใช้ข้อมูล Mock เมื่อ API สำเร็จ
```

---

## Prompt 33 — สร้าง Assignment API และ UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างระบบมอบหมายงาน

อนุญาตให้แก้:

- apps-script/AssignmentService.gs
- apps-script/ReportService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/report-detail.html
- assets/js/admin/report-detail.js
- assets/css/admin.css

ข้อกำหนด:

1. admin.report.assign
2. Active Officer เท่านั้น
3. Reassign ปิด Assignment เดิม
4. Update reports.assigned_to
5. Version Check
6. Timeline
7. Activity Log
8. Target Due At
9. Modal
10. Loading/Error
11. Refresh Detail
12. Officer ใหม่เห็นในงานของฉัน
```

---

## Prompt 34 — สร้าง Status Update API และ UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างระบบเปลี่ยนสถานะ

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AuditService.gs
- apps-script/AttachmentService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/report-detail.html
- assets/js/admin/report-detail.js
- assets/css/admin.css

ข้อกำหนด:

1. admin.report.updateStatus
2. Transition Matrix ตาม API_SPEC
3. Version Check
4. Required Fields:
   - waiting: publicMessage
   - resolved: result
   - rejected: rejectionReason
   - duplicate: duplicate reference/reason
   - reopen: reason
5. Timeline
6. Activity Log
7. Timestamp
8. Clear Dashboard Cache
9. Confirmation สำหรับ Critical Action
10. Preview Public Message
11. Handle VERSION_CONFLICT
```

---

## Prompt 35 — สร้าง Add Update และ Evidence

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin.report.addUpdate

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AttachmentService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/report-detail.html
- assets/js/admin/report-detail.js
- assets/js/image-compress.js
- assets/css/admin.css

ข้อกำหนด:

1. Public Message
2. Internal Note
3. isPublic
4. Attachments
5. Preview Public
6. Private Attachment Default
7. Version Check
8. Timeline
9. Activity Log
10. Validation
11. Refresh Detail
12. ห้ามส่ง Internal Note ไป Public API
```

---

## Prompt 36 — สร้าง Priority Update

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin.report.updatePriority

อนุญาตให้แก้:

- apps-script/ReportService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- assets/js/admin/report-detail.js
- admin/report-detail.html

ข้อกำหนด:

- low / normal / high / critical
- Version Check
- Permission
- Note เมื่อเพิ่มเป็น high/critical
- Activity Log
- Timeline เมื่อเหมาะสม
- Refresh Detail
```

---

# PART H — PHASE 6: SYSTEM MANAGEMENT

## Prompt 37 — สร้าง User Management Backend

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง User Management API

อนุญาตให้แก้:

- apps-script/UserService.gs
- apps-script/AuthService.gs
- apps-script/SessionService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs

Action:

- admin.user.list
- admin.user.save
- admin.user.resetPassword
- admin.user.revokeSessions

ข้อกำหนด:

1. Username Unique
2. Role Enum
3. Status Enum
4. Create Temporary Password
5. Hash ทันที
6. Must Change Password
7. ห้ามปิด Super Admin คนสุดท้าย
8. Version Check
9. Activity Log
10. ห้ามคืน Hash/Salt
11. Pagination
```

---

## Prompt 38 — สร้าง User Management UI

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง admin/users.html

อนุญาตให้แก้:

- admin/users.html
- assets/js/admin/users.js
- assets/css/admin.css

ข้อกำหนด:

- Search
- Filter Role
- Filter Status
- Pagination
- Create
- Edit
- Active/Inactive
- Reset Password
- Revoke Sessions
- Confirmation
- Loading/Empty/Error
- Permission-aware
- ห้ามแสดง Password เดิม
```

---

## Prompt 39 — สร้าง Category Management

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง
งาน:
สร้าง Category Management ทั้ง Backend และ UI

อนุญาตให้แก้:

- apps-script/CategoryService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/categories.html
- assets/js/admin/categories.js
- assets/css/admin.css

ข้อกำหนด:

- list includeInactive
- save create/update
- code unique
- name
- description
- icon
- color
- defaultAssignee
- targetDays
- sortOrder
- isActive
- Version Check
- ห้าม Hard Delete
- Clear Public Cache
- Activity Log
```

---

## Prompt 40 — สร้าง Announcement Management

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Announcement Management

อนุญาตให้แก้:

- apps-script/AnnouncementService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/announcements.html
- assets/js/admin/announcements.js
- assets/css/admin.css

ข้อกำหนด:

- list
- create/update
- title
- content
- type
- startAt
- endAt
- isActive
- sortOrder
- Preview
- Sanitize
- Version Check
- Clear Cache
- Activity Log
```

---

## Prompt 41 — สร้าง Settings Management

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Settings Management

อนุญาตให้แก้:

- apps-script/SettingsService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/settings.html
- assets/js/admin/settings.js
- assets/css/admin.css

ข้อกำหนด:

1. admin.settings.get
2. admin.settings.update
3. Whitelist Keys
4. Type Validation
5. Version Check
6. Public/Private Separation
7. ห้ามคืน Secret
8. Contact
9. Emergency
10. Upload Limits
11. Privacy Version
12. Maintenance Mode
13. Clear Cache
14. Activity Log
15. Confirmation สำหรับค่าร้ายแรง
```

---

## Prompt 42 — สร้าง Activity Logs

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Activity Log API และ UI

อนุญาตให้แก้:

- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/activity-logs.html
- assets/js/admin/activity-logs.js
- assets/css/admin.css

ข้อกำหนด:

- Read-only
- Pagination
- Filter User
- Filter Action
- Filter Entity
- Date Range
- Keyword
- Permission
- ห้ามคืน Secret
- ห้ามแสดง Raw Token
- Mobile Card/Desktop Table
```

---

## Prompt 43 — สร้าง Export CSV

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง Export CSV Backend และ UI

อนุญาตให้แก้:

- apps-script/ExportService.gs
- apps-script/AuditService.gs
- apps-script/Router.gs
- apps-script/Tests.gs
- admin/export.html
- assets/js/admin/export.js
- assets/css/admin.css

ข้อกำหนด:

1. reports
2. timeline
3. summary
4. date range
5. status
6. category
7. assignee
8. includePersonalData default false
9. Permission export.personal_data
10. CSV Formula Injection Protection
11. UTF-8 BOM หากจำเป็นสำหรับ Excel ไทย
12. Activity Log
13. Export Log
14. จำกัดจำนวนแถว
15. Loading/Progress
16. Download Filename ชัดเจน
```

---

# PART I — PHASE 7: SECURITY AND QUALITY

## Prompt 44 — Security Review

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจสอบ Security ทั้งโปรเจ็กต์โดยยังไม่เปลี่ยนสถาปัตยกรรม

ตรวจ:

1. Secret ใน Source
2. Password Storage
3. Raw Token
4. Session Validation
5. Permission
6. Public PII Leak
7. Internal Note Leak
8. innerHTML
9. XSS
10. CSV Injection
11. File Validation
12. MIME Validation
13. Rate Limit
14. Idempotency
15. Version Conflict
16. Open Redirect
17. CORS/Origin
18. Error Stack Trace
19. Activity Log
20. Soft Delete

ให้:
- แก้เฉพาะปัญหาที่ตรวจพบ
- สรุประดับความรุนแรง
- ระบุไฟล์ที่แก้
- เพิ่ม Test สำหรับปัญหาสำคัญ
```

---

## Prompt 45 — Accessibility Review

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจ Accessibility ทุกหน้า

ตรวจ:

- Semantic HTML
- Heading
- Label
- Keyboard
- Focus
- Modal Focus Trap
- Drawer
- aria-live
- Error Association
- Alt Text
- Touch Target
- Contrast
- Status ไม่ใช้สีอย่างเดียว
- 320px
- Zoom

แก้เฉพาะที่จำเป็น
สรุปหน้าที่ผ่านและยังมีข้อจำกัด
```

---

## Prompt 46 — Responsive and UX Review

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจ Responsive และ UX ของ Public/Admin

ขนาด:

- 320
- 375
- 640
- 768
- 1024
- 1280

ตรวจ:

- Horizontal Overflow
- Bottom Navigation
- Sticky Buttons
- Form
- Table/Card
- Modal
- Drawer
- Timeline
- Dashboard
- Spacing
- Text Wrapping
- Long Thai Text

แก้เฉพาะปัญหาที่พบ
ห้ามเปลี่ยนบุคลิก UX/UI หลัก
```

---

## Prompt 47 — Performance Review

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจ Performance

Frontend:

- Duplicate API Calls
- Large JS
- Image Loading
- Lazy Loading
- Layout Shift
- Event Listener ซ้ำ
- Memory Leak
- Object URL
- Cache Config

Backend:

- getDataRange misuse
- Batch Read/Write
- Cache
- Lock Duration
- Dashboard Calculation
- Pagination
- Session Cleanup
- Rate Limit Cleanup
- Export Limits

แก้โดยไม่เปลี่ยน Contract
สรุป Before/After เชิงคุณภาพ
```

---

# PART J — PHASE 8: TESTING

## Prompt 48 — สร้าง Apps Script Test Suite

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
เพิ่ม Test Suite ใน apps-script/Tests.gs

ครอบคลุม:

- setup validation
- public.config
- category.list
- report.create
- anonymous report
- invalid payload
- duplicate request
- report.track
- no PII
- addInfo
- auth.login
- session
- permission
- list
- detail
- assign
- status transition
- version conflict
- export sanitization

กฎ:

- ใช้ Test Data เท่านั้น
- ห้ามใช้ Production Data
- Cleanup Test Data
- สรุปวิธีรัน
```

---

## Prompt 49 — สร้าง Manual Test Checklist

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง docs/TEST_CHECKLIST.md

ครอบคลุม:

- Environment
- Public
- Admin
- Security
- Responsive
- Browser
- Backup
- Restore
- Production Smoke Test

แต่ละ Test ต้องมี:

- Test ID
- Preconditions
- Steps
- Expected Result
- Actual Result
- Pass/Fail
- Note

ห้ามแก้โค้ด
```

---

## Prompt 50 — End-to-End Review

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจ End-to-End ทั้งระบบโดยไม่ Deploy

Flow 1:
หน้าแรก → แจ้งปัญหา → Success → Track

Flow 2:
Login → Dashboard → List → Detail → Assign → In Progress → Resolve → Close

Flow 3:
Anonymous Report → Public Tracking → ตรวจว่า PII ไม่รั่ว

Flow 4:
Viewer → ตรวจ Read-only

Flow 5:
Officer → งานของฉัน → Update

ให้:
- รายงานจุดที่ผ่าน
- รายงานจุดที่ล้มเหลว
- แก้เฉพาะ Bug ที่ยืนยันได้
- ห้ามสร้างข้อมูลแต่งเพื่อกลบ Error
```

---

# PART K — PHASE 9: DOCUMENTATION AND DEPLOYMENT

## Prompt 51 — ตรวจและอัปเดต README

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจ README.md ให้ตรงกับโค้ดล่าสุด

ตรวจ:

- Project Structure
- Setup
- Script Properties
- Sheets
- Apps Script
- Cloudflare Pages
- Development Workflow
- Testing
- Deployment
- Security
- Known Limitations

แก้ README เท่านั้น
ห้ามใส่ Secret
```

---

## Prompt 52 — สร้าง DEPLOYMENT.md

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง docs/DEPLOYMENT.md

ต้องมี:

1. Development Environment
2. Production Environment
3. Google Account กลาง
4. Spreadsheet Setup
5. Drive Setup
6. Script Properties
7. setupSystem()
8. First Admin
9. Apps Script Deploy
10. API URL
11. Cloudflare Pages Connect
12. Build Settings
13. Production Branch
14. Smoke Tests
15. Rollback
16. Backup
17. Troubleshooting

ห้ามใส่ Secret จริง
```

---

## Prompt 53 — สร้าง SECURITY.md

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้าง docs/SECURITY.md

ต้องมี:

- Threat Model เบื้องต้น
- Secret Management
- Password
- Session
- Permission
- File Upload
- PII
- Logging
- Backup
- Incident Response
- Vulnerability Reporting
- Security Checklist

ห้ามแต่งการรับรองมาตรฐานที่โครงการยังไม่มี
```

---

## Prompt 54 — Pre-Deployment Audit

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจความพร้อมก่อน Deploy โดยห้าม Deploy

ตรวจ:

- git status
- branch
- uncommitted files
- secrets
- API URL placeholder
- missing files
- broken links
- console errors
- Apps Script syntax
- setup
- tests
- privacy
- terms
- contact
- emergency placeholder
- production config
- backup
- first admin process

ผลลัพธ์:
- PASS
- BLOCKER
- WARNING
- สิ่งที่ผู้ใช้ต้องกำหนดเอง

ห้ามแก้ค่าที่ไม่ทราบ
```

---


# PART N1 — MANUAL PRODUCTION SETUP

## MANUAL STEP G13 — ตั้ง Apps Script Production

ก่อน Production:

```text
ENVIRONMENT = production
ALLOWED_ORIGIN = https://khaophangreport.pages.dev
```

ตรวจ:

- Production Spreadsheet ถูกต้อง
- Production Root Folder ถูกต้อง
- Secret ครบ
- Super Admin ใช้งานได้
- Backup พร้อม
- Tests ผ่าน

จากนั้น Deploy **New Version**

---

## MANUAL STEP G14 — ตั้ง Cloudflare Pages

| รายการ | ค่า |
|---|---|
| Repository | `khaophangreport-spec/khaophangreport` |
| Framework preset | None |
| Build command | ว่าง หรือ `exit 0` |
| Output directory | `/` |
| Production branch | `main` |

ตรวจว่า `assets/js/config.js` ใช้ Apps Script Production URL `/exec`


## Prompt 55 — เตรียม Cloudflare Pages

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจและเตรียม Frontend สำหรับ Cloudflare Pages

Repository:
https://github.com/khaophangreport-spec/khaophangreport.git

Domain:
https://khaophangreport.pages.dev

ข้อกำหนด:

1. Static Site
2. Framework Preset None
3. Build Command ว่างหรือ exit 0
4. Output Directory /
5. Asset Paths ถูก
6. ไม่มี Local Path
7. ไม่มี Secret
8. Production Config ถูก
9. 404 Handling ตามความเหมาะสม
10. ห้าม Deploy
11. สรุปขั้นตอนให้ผู้ใช้ทำใน Cloudflare Dashboard
```

---

## Prompt 56 — เตรียม Apps Script Production

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
ตรวจและเตรียม Apps Script สำหรับ Production โดยห้าม Deploy

ตรวจ:

- Script Properties Required
- setupSystem
- validateSetup
- schema version
- production spreadsheet
- production drive root
- allowed origin
- environment
- first admin
- health.check
- public APIs
- admin APIs
- test suite
- backup

ให้สร้าง Production Checklist แบบทีละขั้น
ห้ามใส่ค่า Secret หรือ ID สมมติ
```

---

## Prompt 57 — Post-Deployment Smoke Test

```text
อ่านเอกสารต่อไปนี้ทั้งหมดก่อนเริ่มงาน:

- README.md
- docs/APP_SPEC.md
- docs/UI_FLOW.md
- docs/DATA_SCHEMA.md
- docs/API_SPEC.md
- docs/DEVELOPMENT_RULES.md

กฎบังคับ:

1. ใช้ HTML, CSS และ Vanilla JavaScript สำหรับ Frontend
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ห้ามเพิ่ม Framework หรือ Library ขนาดใหญ่โดยไม่ได้รับอนุญาต
6. ห้ามเปลี่ยนชื่อไฟล์ ชื่อ Sheet ชื่อ Column, API Action, Enum หรือโครงสร้างหลัก
7. ห้าม Hardcode Secret, Spreadsheet ID, Folder ID หรือ Session Secret
8. ห้ามเรียก Google Sheets โดยตรงจาก Frontend
9. ทุก API ต้องผ่าน assets/js/api.js
10. ทุก Admin API ต้องตรวจ Session และ Permission ที่ Backend
11. ทุกหน้าที่เรียก API ต้องมี Loading, Empty, Error และ Success State ตามความเหมาะสม
12. Mobile-first
13. ภาษาไทยเป็นหลัก
14. ใช้ UX/UI แนวเรียบง่าย อบอุ่น เป็นมิตร โทนสีเขียวธรรมชาติ
15. ห้ามแก้ไฟล์นอกขอบเขตโดยไม่แจ้งเหตุผล
16. หลังทำงานให้สรุป:
   - ไฟล์ที่สร้าง
   - ไฟล์ที่แก้
   - สิ่งที่เปลี่ยน
   - วิธีทดสอบ
   - ปัญหาหรือข้อจำกัดที่พบ
17. อย่า Commit, Push หรือ Deploy จนกว่าจะได้รับคำสั่ง

งาน:
สร้างและดำเนินรายการ Smoke Test หลังผู้ใช้ Deploy แล้ว

Production URL:
https://khaophangreport.pages.dev

ตรวจ:

1. Home
2. Public Config
3. Categories
4. Announcement
5. Report Create
6. Image Upload
7. Location
8. Success
9. Track
10. Login
11. Dashboard
12. List
13. Detail
14. Assign
15. Status
16. Export
17. Logout
18. Mobile
19. Console
20. Network Errors

หากเครื่องมือไม่สามารถเข้าถึงระบบจริง:
- อย่าแต่งผล
- สร้างขั้นตอนให้ผู้ใช้ทดสอบ
- ระบุสิ่งที่ต้องนำกลับมาให้ตรวจ
```

---

# PART L — GIT PROMPTS

## Prompt G01 — ตรวจ Diff ก่อน Commit

```text
ตรวจ git status และ git diff

งาน:
1. สรุปไฟล์ที่เปลี่ยน
2. ระบุไฟล์ที่ไม่เกี่ยวข้อง
3. ตรวจ Secret
4. ตรวจ Debug Code
5. ตรวจ Console Log
6. ตรวจ Temporary File
7. เสนอ Commit Message หนึ่งข้อความ
8. ห้าม Commit
```

---

## Prompt G02 — Commit งานที่ตรวจแล้ว

```text
ตรวจ git status และ git diff อีกครั้ง

หากไม่มี Secret และไฟล์ไม่เกี่ยวข้อง:
1. git add เฉพาะไฟล์ของงานนี้
2. Commit ด้วยข้อความ:
   "<ใส่ข้อความ Commit>"
3. แสดงผล git status หลัง Commit
4. ห้าม Push
```

---

## Prompt G03 — Push ไป GitHub

```text
ตรวจ:
- current branch
- git status
- latest commit
- remote origin

หาก working tree clean และ remote ถูกต้อง:
1. Push branch ปัจจุบันไป origin
2. ห้าม force push
3. แสดงผลหลัง Push
```

---

## Prompt G04 — Merge เข้า main อย่างปลอดภัย

```text
งาน:
เตรียม Merge branch ปัจจุบันเข้า main

ตรวจ:
- working tree clean
- branch ปัจจุบัน
- commits ต่างจาก main
- conflicts
- tests

หากพร้อม:
1. checkout main
2. pull origin main
3. merge แบบไม่ force
4. รัน test/check ที่เกี่ยวข้อง
5. แสดง git log ล่าสุด
6. ห้าม push จนกว่าจะได้รับคำสั่ง
```

---

# PART M — DEBUG PROMPTS

## Prompt D01 — แก้ปัญหาแบบไม่เดา

```text
อ่านเอกสารใน docs/ และตรวจโค้ดจริง

อาการ:
<วาง Error Message และขั้นตอนที่ทำให้เกิด>

งาน:
1. หาสาเหตุจากหลักฐาน
2. ระบุไฟล์และบรรทัดที่เกี่ยวข้อง
3. ห้ามเดา
4. ห้ามแก้หลายส่วนโดยไม่จำเป็น
5. สร้างวิธี Reproduce
6. แก้สาเหตุราก
7. เพิ่ม Test ป้องกันซ้ำ
8. สรุป Before/After
9. ห้าม Commit
```

---

## Prompt D02 — ตรวจ API Error

```text
ตรวจ API Action:
<ชื่อ Action>

ข้อมูล:
- Request:
<วาง Request>
- Response:
<วาง Response>
- Console:
<วาง Error>
- Apps Script Execution Log:
<วาง Log ที่ลบ Secret แล้ว>

งาน:
1. ตรวจ Request Envelope
2. ตรวจ Router
3. ตรวจ Session/Permission
4. ตรวจ Validation
5. ตรวจ Service
6. ตรวจ Repository
7. ตรวจ Response
8. แก้เฉพาะสาเหตุ
9. ห้ามเปิดเผย Secret
```

---

## Prompt D03 — ตรวจหน้าเว็บแสดงผลผิด

```text
หน้าที่มีปัญหา:
<path>

Viewport:
<เช่น 375x812>

อาการ:
<อธิบาย>

งาน:
1. ตรวจ HTML
2. ตรวจ CSS Cascade
3. ตรวจ Overflow
4. ตรวจ Sticky/Fixed
5. ตรวจ z-index
6. ตรวจ JS State
7. แก้ Mobile-first
8. ห้ามแก้ Global Component ถ้าไม่จำเป็น
9. ตรวจ 320, 375, 768, 1024
```

---

# PART N — PROMPT สำหรับตรวจรับแต่ละ Milestone

## Prompt QA01 — ตรวจรับ Project Foundation

```text
ตรวจรับ Phase Project Foundation ตามเอกสาร

ต้องผ่าน:

- โครงสร้างไฟล์
- CSS Foundation
- Public Layout
- Admin Layout
- Config
- Utility
- API Client
- Apps Script Foundation
- Setup
- Repository

รายงาน:
- PASS
- FAIL
- BLOCKER
- ไฟล์ที่ต้องแก้

ห้ามแก้โค้ด
```

---

## Prompt QA02 — ตรวจรับ Public MVP

```text
ตรวจรับ Public MVP

ต้องผ่าน:

- Home
- Report 6 Steps
- Draft
- Location
- Image Compression
- report.create
- Success
- Track
- Timeline
- Add Info
- FAQ
- Privacy
- Terms
- Contact
- Anonymous PII

ห้ามแก้โค้ด
```

---

## Prompt QA03 — ตรวจรับ Admin MVP

```text
ตรวจรับ Admin MVP

ต้องผ่าน:

- Login
- Session
- Role Guard
- Dashboard
- Report List
- Detail
- Assignment
- Status
- Timeline
- Evidence
- Priority
- Users
- Categories
- Announcements
- Settings
- Activity
- Export

ห้ามแก้โค้ด
```

---

## Prompt QA04 — ตรวจรับ Production Readiness

```text
ตรวจรับ Production Readiness

ต้องผ่าน:

- Security
- Accessibility
- Responsive
- Performance
- Tests
- Backup
- Restore
- Documentation
- Config
- No Secret
- Privacy
- Terms
- Contact
- Emergency
- Cloudflare
- Apps Script
- Production Smoke Test Plan

ห้าม Deploy
```

---

# PART O — ลำดับการใช้งานจริง

## 5. ลำดับ Prompt ตั้งแต่ต้นจนเสร็จ

ใช้ตามลำดับนี้:

```text
00
01
02
03
04
05
06
07
08
09
10
QA01

11
12
13
14
15
16
17
18
19
20
21
22
23
QA02

24
25
26

27
28
29
30
31
32
33
34
35
36

37
38
39
40
41
42
43
QA03

44
45
46
47
48
49
50

51
52
53
54
QA04

55
56
ผู้ใช้ Deploy
57
```

---

## 6. จุดที่ต้องหยุดให้ผู้ใช้ตรวจเอง

ต้องหยุดตรวจหลัง:

- Prompt 01
- Prompt 02
- Prompt 08
- Prompt 11
- Prompt 18
- Prompt 21
- Prompt 25
- Prompt 28
- Prompt 30
- Prompt 32
- Prompt 34
- Prompt 38
- Prompt 43
- Prompt 50
- Prompt 54

---

## 7. ข้อมูลที่ผู้ใช้ต้องกำหนดเองก่อน Production

Codex ห้ามเดา:

- Logo
- Favicon
- Hero Image
- หมายเลขฉุกเฉิน
- เบอร์โทรโครงการ
- เวลาทำการ
- รายชื่อ Admin
- รายชื่อเจ้าหน้าที่
- รายชื่อหมู่บ้าน/หมู่ที่
- Target Days
- Privacy Policy ฉบับอนุมัติ
- Terms ฉบับอนุมัติ
- Consent Text
- Data Retention
- Session Lifetime
- Password Policy เพิ่มเติม
- Backup Schedule
- Spreadsheet ID
- Root Folder ID
- Apps Script Deployment URL
- Secret ทุกชนิด

---

## 8. Definition of Complete Project

โปรเจ็กต์ถือว่าเสร็จสมบูรณ์เมื่อ:

- [ ] Repository Structure ถูกต้อง
- [ ] Documentation ครบ
- [ ] Public UI ครบ
- [ ] Public API ครบ
- [ ] Report Create ทำงาน
- [ ] Image Upload ทำงาน
- [ ] Location ทำงาน
- [ ] Tracking ทำงาน
- [ ] Additional Info ทำงาน
- [ ] Login ทำงาน
- [ ] Session ปลอดภัย
- [ ] Dashboard ทำงาน
- [ ] Report List/Detail ทำงาน
- [ ] Assignment ทำงาน
- [ ] Status Workflow ทำงาน
- [ ] Timeline ทำงาน
- [ ] Evidence ทำงาน
- [ ] User Management ทำงาน
- [ ] Category Management ทำงาน
- [ ] Announcement ทำงาน
- [ ] Settings ทำงาน
- [ ] Activity Logs ทำงาน
- [ ] Export ทำงาน
- [ ] Security Review ผ่าน
- [ ] Accessibility Review ผ่าน
- [ ] Responsive Review ผ่าน
- [ ] Test Suite ผ่าน
- [ ] Backup ผ่าน
- [ ] Restore ผ่าน
- [ ] Production Deployment สำเร็จ
- [ ] Smoke Test ผ่าน
- [ ] ไม่มี Secret ใน Repository
- [ ] ไม่มี PII รั่วใน Public API

---

## 9. ข้อห้ามสูงสุด

Codex ห้าม:

1. เปลี่ยน Stack
2. เพิ่ม Framework โดยไม่อนุมัติ
3. เปลี่ยนชื่อ Sheet/Column/API/Enum
4. ใส่ Secret
5. สร้าง Password จริงใน Source
6. เปิด Google Sheets Public
7. เปิด Drive Root Public
8. ข้าม Backend Validation
9. ใช้ Frontend เป็นแหล่ง Permission
10. ลบ Timeline
11. Hard Delete ข้อมูลหลัก
12. Retry Write Action โดยไม่มี Idempotency
13. Deploy เอง
14. Force Push
15. แต่งผลทดสอบ
16. แก้ไฟล์เกินขอบเขตโดยไม่แจ้ง
17. ใช้ innerHTML กับข้อมูลผู้ใช้โดยไม่ Sanitize
18. เก็บรูป Base64 ใน Sheet
19. โหลดทุกแถวทุก Request
20. บอกว่างานสำเร็จทั้งที่ยังไม่ได้ทดสอบ

---

## 10. สรุป

Prompt Pack นี้ออกแบบให้ใช้สร้าง Khaophang Report แบบทีละขั้น ตั้งแต่:

- เริ่ม Repository
- วางโครงสร้าง
- สร้าง UI
- สร้าง Google Sheets
- สร้าง Apps Script
- สร้าง Public MVP
- สร้าง Authentication
- สร้าง Admin
- จัดการข้อมูล
- ตรวจ Security
- ทดสอบ
- Deploy
- ตรวจหลังเปิดใช้งาน

หลักสำคัญ:

> ให้ Codex ทำงานทีละขอบเขต ตรวจทุกครั้งก่อนเดินหน้าต่อ และห้ามให้ AI เปลี่ยนสถาปัตยกรรมหรือสร้างข้อมูลที่ไม่ทราบจริง

---

**End of CODEX_PROMPT_PACK.md**
