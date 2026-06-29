# Khaophang Report

ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง

[![Status](https://img.shields.io/badge/status-active%20development-287444)](#สถานะโครงการ)
[![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JavaScript-174A2B)](#เทคโนโลยี)
[![Backend](https://img.shields.io/badge/backend-Google%20Apps%20Script-287444)](#เทคโนโลยี)
[![Hosting](https://img.shields.io/badge/hosting-Cloudflare%20Pages-F7A31B)](#การ-deploy)

---

## เกี่ยวกับโครงการ

**Khaophang Report** เป็น Responsive Web Application แบบ Mobile-first สำหรับรับแจ้งปัญหา เหตุเดือดร้อน ความเสียหาย ข้อร้องเรียน และข้อเสนอแนะจากประชาชนในพื้นที่ตำบลเขาพัง

ประชาชนสามารถ:

- แจ้งปัญหาโดยไม่ต้องสมัครสมาชิก
- เลือกแจ้งแบบระบุตัวตนหรือไม่ระบุตัวตน
- แนบรูปภาพ
- ระบุสถานที่และพิกัด
- รับรหัสติดตาม
- ตรวจสอบสถานะและ Timeline
- ส่งข้อมูลเพิ่มเติมภายหลัง

เจ้าหน้าที่และผู้ดูแลระบบสามารถ:

- ตรวจสอบและคัดกรองเรื่อง
- มอบหมายผู้รับผิดชอบ
- เปลี่ยนสถานะ
- เพิ่มบันทึกและหลักฐาน
- บันทึกผลการดำเนินงาน
- ปิดเรื่อง
- ดู Dashboard
- ส่งออกข้อมูล
- ใช้ข้อมูลสะสมเพื่อวิเคราะห์ปัญหาชุมชน

---

## ข้อมูลโครงการ

| รายการ | รายละเอียด |
|---|---|
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| Production URL | https://khaophangreport.pages.dev |
| GitHub Repository | https://github.com/khaophangreport-spec/khaophangreport.git |
| Project Email | khaophangreport@gmail.com |
| รูปแบบระบบ | Responsive Web Application |
| แนวทางออกแบบ | Mobile-first |
| ภาษา | ภาษาไทยเป็นหลัก |

---

## แนวทาง UX/UI

ระบบใช้แนวทางการออกแบบ:

> เรียบง่าย อบอุ่น เป็นมิตร ใช้สีเขียวธรรมชาติ เข้าถึงง่าย และไม่ให้ความรู้สึกเป็นระบบราชการที่ซับซ้อน

หลักการสำคัญ:

- ปุ่มขนาดใหญ่ กดง่าย
- ข้อความสั้นและชัดเจน
- Card มุมโค้ง
- เงาอ่อน
- พื้นหลังสีเขียวอ่อนหรือสีครีม
- ใช้สีสถานะอย่างสม่ำเสมอ
- รองรับหน้าจอมือถือเป็นหลัก
- รองรับ Accessibility ระดับพื้นฐาน
- ไม่ใช้สีเพียงอย่างเดียวเพื่อสื่อความหมาย

---

## เทคโนโลยี

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- Responsive Web Design
- Local Storage เฉพาะข้อมูลชั่วคราวที่ไม่สำคัญ

### Backend

- Google Apps Script Web App
- `doGet()`
- `doPost()`
- Cache Service
- Lock Service
- Script Properties

### Database

- Google Sheets

### File Storage

- Google Drive

### Hosting และ Version Control

- Cloudflare Pages
- GitHub

---

## สถาปัตยกรรมระบบ

```text
ผู้ใช้งาน
   ↓
Web Browser
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

หลักการสำคัญ:

- Frontend ห้ามเชื่อม Google Sheets โดยตรง
- ทุกข้อมูลต้องผ่าน Backend API
- Backend เป็นผู้ตรวจสอบ Validation และ Permission
- ไม่เก็บ Secret ใน Frontend
- ไม่เก็บ Password แบบข้อความธรรมดา
- ไม่เก็บ Raw Session Token
- ไม่เปิด Spreadsheet หรือ Drive Root Folder เป็น Public

---

## ขอบเขต MVP

### ฝั่งประชาชน

- หน้าแรก
- แจ้งปัญหา
- เลือกหมวด
- กรอกรายละเอียด
- ระบุสถานที่
- ดึงพิกัด
- แนบภาพสูงสุด 3 รูป
- แจ้งแบบระบุตัวตนหรือไม่ระบุตัวตน
- ยอมรับเงื่อนไข
- ส่งเรื่อง
- รับรหัสติดตาม
- ติดตามสถานะ
- ดู Timeline
- ส่งข้อมูลเพิ่มเติม
- ดู FAQ
- ดูช่องทางติดต่อและหมายเลขฉุกเฉิน

### ฝั่งเจ้าหน้าที่

- Login
- Dashboard ส่วนบุคคล
- ดูงานที่ได้รับมอบหมาย
- ค้นหาและกรอง
- ดูรายละเอียด
- เปลี่ยนสถานะ
- เพิ่ม Timeline
- เพิ่มหมายเหตุภายใน
- แนบหลักฐาน
- บันทึกผล
- ปิดเรื่อง

### ฝั่งผู้ดูแลระบบ

- Dashboard รวม
- ดูเรื่องทั้งหมด
- คัดกรอง
- ตั้งระดับความสำคัญ
- มอบหมาย
- จัดการผู้ใช้
- จัดการหมวด
- จัดการประกาศ
- จัดการ Settings
- ดู Activity Logs
- ส่งออก CSV

---

## หมวดปัญหาเริ่มต้น

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

---

## สถานะเรื่อง

| ค่าในระบบ | ข้อความใน UI |
|---|---|
| `new` | รับเรื่องแล้ว |
| `reviewing` | กำลังตรวจสอบ |
| `assigned` | มอบหมายแล้ว |
| `in_progress` | กำลังดำเนินการ |
| `waiting` | รอข้อมูลเพิ่มเติม |
| `resolved` | ดำเนินการแล้ว |
| `closed` | ปิดเรื่อง |
| `rejected` | ไม่รับดำเนินการ |
| `duplicate` | เรื่องซ้ำ |

ทุกการเปลี่ยนสถานะต้อง:

- ตรวจสิทธิ์
- ตรวจ State Transition
- บันทึกวันและเวลา
- สร้าง Timeline
- สร้าง Activity Log
- เพิ่ม Version ของข้อมูล

---

## โครงสร้างโปรเจ็กต์

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
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── utilities.css
│   │   ├── public.css
│   │   └── admin.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── utils.js
│   │   ├── validation.js
│   │   ├── image-compress.js
│   │   ├── location.js
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── admin-login.js
│   │   ├── public/
│   │   │   ├── home.js
│   │   │   ├── report.js
│   │   │   ├── report-success.js
│   │   │   ├── track.js
│   │   │   └── faq.js
│   │   └── admin/
│   │       ├── layout.js
│   │       ├── dashboard.js
│   │       ├── reports.js
│   │       ├── report-detail.js
│   │       ├── users.js
│   │       ├── categories.js
│   │       ├── announcements.js
│   │       ├── settings.js
│   │       ├── activity-logs.js
│   │       └── export.js
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
│   ├── KHAOPHANG_REPORT_MASTER_SPEC.md
│   ├── APP_SPEC.md
│   ├── UI_FLOW.md
│   ├── DATA_SCHEMA.md
│   ├── API_SPEC.md
│   ├── DEVELOPMENT_RULES.md
│   ├── CODEX_PROMPT_PACK.md
│   └── TEST_CHECKLIST.md
│
└── README.md
```

---

## เอกสารโครงการ

เอกสารทั้งหมดควรจัดเก็บในโฟลเดอร์ `docs/`

| เอกสาร | หน้าที่ |
|---|---|
| [`KHAOPHANG_REPORT_MASTER_SPEC.md`](docs/KHAOPHANG_REPORT_MASTER_SPEC.md) | เอกสารสเปกแม่และภาพรวมระบบฉบับเต็ม |
| [`APP_SPEC.md`](docs/APP_SPEC.md) | กำหนดขอบเขต ฟังก์ชัน และข้อกำหนดของแอป |
| [`UI_FLOW.md`](docs/UI_FLOW.md) | กำหนดเส้นทางผู้ใช้และพฤติกรรมหน้าจอ |
| [`DATA_SCHEMA.md`](docs/DATA_SCHEMA.md) | กำหนดโครงสร้าง Google Sheets และข้อมูล |
| [`API_SPEC.md`](docs/API_SPEC.md) | กำหนด Request, Response, Action และ Permission |
| [`DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md) | กำหนดมาตรฐานการพัฒนา ทดสอบ Git และ Deploy |
| [`CODEX_PROMPT_PACK.md`](docs/CODEX_PROMPT_PACK.md) | ชุด prompt และขั้นตอนปฏิบัติงานสำหรับพัฒนาแบบมี guardrail |
| [`TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md) | Checklist ทดสอบ Manual, Backup, Restore และ Production Smoke Test |

### ลำดับที่ต้องอ่านก่อนพัฒนา

1. `README.md`
2. `docs/APP_SPEC.md`
3. `docs/UI_FLOW.md`
4. `docs/DATA_SCHEMA.md`
5. `docs/API_SPEC.md`
6. `docs/DEVELOPMENT_RULES.md`
7. `docs/KHAOPHANG_REPORT_MASTER_SPEC.md` เมื่อต้องการดูรายละเอียดต้นทาง

---

## Setup และการเริ่มต้นโปรเจ็กต์

### 1. Clone Repository

```bash
git clone https://github.com/khaophangreport-spec/khaophangreport.git
cd khaophangreport
```

### 2. สร้าง Branch สำหรับงาน

```bash
git checkout -b feature/project-foundation
```

### 3. เปิด Frontend แบบ Static

Frontend เป็น HTML, CSS และ Vanilla JavaScript เท่านั้น ไม่มี build step และไม่มี framework

```bash
python -m http.server 8080
```

จากนั้นเปิด:

```text
http://localhost:8080
```

หรือใช้ static server อื่นได้ แต่ห้ามเพิ่ม framework/library ขนาดใหญ่โดยไม่ได้รับอนุญาต

### 4. ตรวจ Frontend Config

ไฟล์:

```text
assets/js/config.js
```

ตัวอย่าง:

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

`API_URL` ต้องเป็น URL ของ Google Apps Script Web App เท่านั้น และห้ามเก็บ Secret, Spreadsheet ID, Folder ID หรือ Session Secret ในไฟล์นี้

---

## การตั้งค่า Google Workspace

### Google Sheets

สร้าง Spreadsheet ใหม่สำหรับระบบโดยเฉพาะ

Sheets หลัก:

```text
reports
report_updates
attachments
categories
users
sessions
assignments
announcements
settings
activity_logs
report_additional_info
rate_limits
dashboard_cache
schema_migrations
system_counters
export_logs
```

โครงสร้างคอลัมน์ทั้งหมดให้ยึด `docs/DATA_SCHEMA.md`

### Google Drive

สร้าง Root Folder:

```text
Khaophang_Report_Files/
```

โครงสร้าง:

```text
Khaophang_Report_Files/
├── reports/
├── announcements/
├── exports/
├── backups/
└── temp/
```

### Google Apps Script Properties

กำหนด:

```text
SPREADSHEET_ID
ROOT_FOLDER_ID
APP_SECRET
SESSION_SECRET
ALLOWED_ORIGIN
ADMIN_SETUP_KEY
ENVIRONMENT
```

ค่าลับห้ามบันทึกใน GitHub

---

## การตั้งค่า Google Apps Script

1. สร้าง Google Apps Script Project
2. เพิ่มไฟล์ตามโครงสร้าง `apps-script/`
3. ตั้ง Script Properties
4. รัน `setupSystem()`
5. รัน `validateSeedData()`
6. รัน `validatePhysicalSeedPlacement()`
7. ตรวจสอบ Google Drive Folder
8. สร้าง Super Admin แรกด้วย setup key ที่เก็บใน Script Properties
9. Deploy เป็น Web App
10. บันทึก Deployment URL ไว้นอก repository
11. ใส่ URL ใน `assets/js/config.js`
12. ทดสอบ `health.check`
13. ทดสอบ Public API และ Admin API

ไฟล์ Backend หลัก:

- `Code.gs` รับ `doGet()` และ `doPost()`
- `Router.gs` เป็น whitelist ของ API Action
- `Response.gs` สร้าง response envelope
- `*Service.gs` เก็บ business logic
- `SheetRepository.gs` อ่าน/เขียน Google Sheets
- `DriveRepository.gs` จัดการไฟล์ใน Google Drive
- `Security.gs` จัดการ hash, session token, sanitization และข้อมูลอ่อนไหว
- `Setup.gs` สร้าง/ตรวจโครงสร้าง Sheets, seed data และ setup admin แรก
- `Tests.gs` รวม test functions และ core test suite

Action ที่อยู่ใน Router ล่าสุดครอบคลุม:

```text
health.check
public.config
category.list
announcement.list
report.create
report.track
report.addInfo
auth.login
auth.me
auth.logout
auth.changePassword
dashboard.summary
admin.report.list
admin.report.detail
admin.report.assign
admin.report.updateStatus
admin.report.updatePriority
admin.report.addUpdate
admin.category.list
admin.category.save
admin.user.list
admin.user.save
admin.user.resetPassword
admin.user.revokeSessions
admin.announcement.list
admin.announcement.save
admin.settings.get
admin.settings.update
admin.activity.list
admin.export.csv
```

---

## การ Deploy Frontend

### Cloudflare Pages

ตั้งค่า:

| รายการ | ค่า |
|---|---|
| Repository | `khaophangreport-spec/khaophangreport` |
| Framework Preset | None |
| Build Command | เว้นว่าง หรือ `exit 0` |
| Output Directory | `/` |
| Production Branch | `main` |
| Domain | `khaophangreport.pages.dev` |

หลัง Deploy ต้องทดสอบ:

- หน้าแรก
- Mobile Navigation
- แบบฟอร์มแจ้งปัญหา
- รูปภาพ
- พิกัด
- Tracking
- Admin Login
- API Connection
- Privacy และ Terms

ก่อน Deploy ต้องยืนยันว่า Google Apps Script deployment URL ใน `assets/js/config.js` ชี้ไปยัง deployment ที่มี backend version ล่าสุดแล้ว

---

## ลำดับการพัฒนา

### Phase 1 — Project Foundation

- สร้าง Repository Structure
- สร้าง Design Tokens
- สร้าง Layout กลาง
- สร้าง API Client
- สร้าง Google Sheets
- สร้าง Setup Script
- สร้าง Router
- สร้าง Response Helper

### Phase 2 — Public MVP

- หน้าแรก
- แบบฟอร์มแจ้งปัญหาแบบหน้าเดียว
- Location
- Image Compression
- Create Report
- Success Page
- Tracking
- Timeline
- Additional Information

### Phase 3 — Authentication

- Users
- Password Hash
- Login
- Session
- Logout
- Role Guard
- Rate Limit

### Phase 4 — Admin Reports

- Dashboard
- Report List
- Search และ Filter
- Pagination
- Report Detail
- Assignment
- Status Update
- Timeline
- Evidence
- Resolve และ Close

### Phase 5 — System Management

- Users
- Categories
- Announcements
- Settings
- Activity Logs
- Export CSV

### Phase 6 — Quality and Security

- Validation
- Error Handling
- Accessibility
- Security Review
- Mobile Testing
- Browser Testing
- Performance
- Backup
- Restore Test

### Phase 7 — Production Launch

- สร้าง Admin จริง
- เพิ่มเจ้าหน้าที่
- เพิ่มข้อมูลติดต่อ
- เพิ่มหมายเลขฉุกเฉิน
- ยืนยันหมวดและ Target Days
- เพิ่ม Privacy Policy
- เพิ่ม Terms
- Pilot Test
- อบรมผู้ใช้งาน
- เปิดใช้งานจริง

---

## กฎการพัฒนาที่สำคัญ

- อ่านเอกสารใน `docs/` ก่อนแก้โค้ด
- ไม่เพิ่ม Framework โดยไม่ได้อนุมัติ
- ไม่ Hardcode API URL หลายไฟล์
- ไม่ Hardcode Secret
- ไม่เขียน API Call กระจายทุกหน้า
- ไม่อ่าน Google Sheets จาก Frontend
- ไม่ใช้ `innerHTML` กับข้อมูลผู้ใช้โดยไม่ Sanitize
- ไม่เก็บ Base64 รูปใน Sheet
- ไม่โหลดข้อมูลทุกแถวทุก Request
- ทุก Admin API ต้องตรวจ Session
- ทุก Write Action ต้องตรวจ Permission
- ทุก Status Change ต้องมี Timeline
- ทุก Action สำคัญต้องมี Activity Log
- ทุกตารางต้องมี Pagination
- ทุก Form ต้อง Validate ทั้ง Frontend และ Backend
- ทุกหน้าที่เรียก API ต้องมี Loading, Empty และ Error State
- ต้องทดสอบมือถือจริงก่อน Deploy

รายละเอียดทั้งหมดให้ยึด `docs/DEVELOPMENT_RULES.md`

---

## Development Workflow

1. อ่านเอกสารตามลำดับก่อนเริ่มงาน
2. ตรวจ `git status` เพื่อดูงานค้างหรือไฟล์ที่ผู้อื่นแก้ไว้
3. จำกัดขอบเขตไฟล์ที่แก้ให้ตรงกับงาน
4. เรียก API ผ่าน `assets/js/api.js` เท่านั้น
5. ตรวจ Loading, Empty, Error และ Success State ของหน้าที่แตะ API
6. ตรวจ Session และ Permission ที่ Backend สำหรับ Admin API ทุกครั้ง
7. ใช้ Test Data สำหรับการทดสอบ ห้ามใช้ Production Data เป็นพื้นที่ทดลอง
8. Cleanup Test Data หลังทดสอบ
9. ตรวจ syntax และ flow ที่เกี่ยวข้อง
10. สรุปไฟล์ที่แก้ วิธีทดสอบ และข้อจำกัด

ห้าม Commit, Push หรือ Deploy ถ้ายังไม่ได้รับคำสั่งชัดเจน

## Git Workflow

### Branch Name

```text
feature/public-report-form
feature/admin-dashboard
fix/login-session
docs/update-api-spec
```

### Commit Message

```text
feat: add public report category step
fix: prevent duplicate report submission
docs: add project README
refactor: centralize API error handling
test: add report create validation tests
```

### ก่อน Commit

```bash
git status
git diff
```

ตรวจว่า:

- ไม่มี Secret
- ไม่มีไฟล์ทดสอบที่ไม่เกี่ยวข้อง
- ไม่มี Console Error
- เอกสารได้รับการอัปเดต
- งานเดิมไม่เสีย

---

## การใช้ Codex หรือ AI Coding Assistant

ก่อนสั่งงานทุกครั้ง ให้กำหนดให้ AI อ่าน:

```text
docs/APP_SPEC.md
docs/UI_FLOW.md
docs/DATA_SCHEMA.md
docs/API_SPEC.md
docs/DEVELOPMENT_RULES.md
```

Prompt ควรระบุ:

- งานที่ต้องทำ
- ไฟล์ที่อนุญาตให้แก้
- ไฟล์ที่ห้ามแก้
- Acceptance Criteria
- วิธีทดสอบ
- ห้ามเปลี่ยนสถาปัตยกรรม
- ให้สรุปไฟล์ที่แก้

ตัวอย่าง:

```text
อ่านเอกสารทั้งหมดใน docs/ ก่อนเริ่มงาน

งาน:
สร้างหน้า report.html ขั้นตอนที่ 1 เลือกหมวดปัญหา

อนุญาตให้แก้:
- report.html
- assets/css/public.css
- assets/js/public/report.js

ห้ามแก้:
- apps-script/
- docs/
- assets/js/config.js

ข้อกำหนด:
- Mobile-first
- โหลดหมวดจาก category.list
- มี Loading, Empty และ Error State
- ปุ่มถัดไป Disable จนกว่าจะเลือกหมวด
- ไม่ใช้ Framework
- ไม่ใช้ Inline Event
- ไม่ Hardcode API URL

หลังทำ:
- ตรวจ Syntax
- สรุปไฟล์ที่แก้
- แจ้งวิธีทดสอบ
```

---

## ความปลอดภัย

### Password

- Hash และ Salt
- ขั้นต่ำ 8 ตัวอักษร
- ห้ามเก็บ Plain Text
- ห้าม Log
- ห้ามส่งกลับ Frontend

### Session

- Token ต้องสุ่ม
- เก็บเฉพาะ Token Hash
- มีเวลาหมดอายุ
- Logout ต้อง Revoke
- Admin API ตรวจ Session ทุกครั้ง

### File Upload

- JPG, PNG, WebP
- สูงสุด 3 รูป
- ไม่เกิน 1 MB ต่อรูปหลังบีบอัด
- ด้านยาวไม่เกิน 1,600 px
- ตรวจ MIME Type ที่ Backend
- ตั้งชื่อไฟล์ใหม่
- ไม่เปิด Root Folder เป็น Public

### Privacy

- เก็บข้อมูลเท่าที่จำเป็น
- Anonymous Report ต้องไม่เก็บ PII ที่ไม่จำเป็น
- Public Tracking ห้ามแสดง PII
- Export ค่าเริ่มต้นไม่รวม PII
- ต้องมี Privacy Policy และ Consent Version

---

## การทดสอบขั้นต่ำ

### Static และ Syntax

- เปิดหน้าที่แก้ผ่าน static server
- ตรวจ Console Error ใน Browser DevTools
- ตรวจ JavaScript ที่แก้ด้วย `node --check` เมื่อไฟล์ไม่มี dependency ของ browser global ที่ทำให้ตรวจไม่ได้
- ตรวจว่าไม่มี Secret หรือ ID จริงหลุดเข้า repository
- ตรวจ `git diff --check`

### Apps Script Tests

รันจาก Google Apps Script Editor หรือ Apps Script runtime ที่เชื่อมกับ Spreadsheet/Drive สำหรับทดสอบ:

```text
testValidateSeedData()
testValidatePhysicalSeedPlacement()
testPublicReadApiRouter()
testGetHealthCheckRouter()
runKhaophangCoreTestSuite()
```

`runKhaophangCoreTestSuite()` ครอบคลุม setup validation, public config, category list, report create, anonymous report, invalid payload, duplicate request, report track, no PII, addInfo, auth login, session, permission, list/detail/assign, status transition, version conflict และ export sanitization

ใช้ Test Data เท่านั้น และตรวจว่า cleanup ทำงานหลัง suite จบ

### Public

- ส่งเรื่องปกติ
- ส่งแบบไม่ระบุตัวตน
- ส่งข้อมูลไม่ครบ
- แนบภาพ 1–3 รูป
- แนบภาพเกินจำนวน
- พิกัดอนุญาตและปฏิเสธ
- Tracking Code ถูกและผิด
- ส่งข้อมูลเพิ่มเติม
- ป้องกันกดส่งซ้ำ

### Admin

- Login สำเร็จและล้มเหลว
- Session หมดอายุ
- Role และ Permission
- Dashboard
- Search และ Filter
- Pagination
- Assignment
- Status Transition
- Version Conflict
- Timeline
- Resolve
- Close
- Export
- Activity Log

### Device

- Android
- iPhone
- Tablet
- Desktop
- Chrome
- Edge
- Safari
- Firefox ตามระดับที่รองรับ

---

## Definition of Done

งานหนึ่งถือว่าเสร็จเมื่อ:

- ตรง Requirement
- ตรงเอกสารสเปก
- Responsive
- Mobile-first
- มี Loading
- มี Empty State
- มี Error State
- Validate Frontend
- Validate Backend
- Permission ถูกต้อง
- ไม่มี Secret
- ไม่มี Console Error
- ไม่มี Syntax Error
- Test ผ่าน
- เอกสารอัปเดต
- Commit Message ชัดเจน
- ไม่ทำ Flow เดิมเสีย
- ทดสอบใน Production-like Environment แล้ว

---

## สถานะโครงการ

สถานะปัจจุบัน:

```text
Active Development
```

เอกสารที่จัดทำแล้ว:

- [x] Master Specification
- [x] APP_SPEC.md
- [x] UI_FLOW.md
- [x] DATA_SCHEMA.md
- [x] API_SPEC.md
- [x] DEVELOPMENT_RULES.md
- [x] CODEX_PROMPT_PACK.md
- [x] TEST_CHECKLIST.md
- [x] README.md
- [x] Frontend Foundation
- [x] Apps Script Backend
- [x] Public MVP
- [x] Admin MVP
- [x] Testing Suite
- [ ] Google Sheets/Drive Production Setup
- [ ] Production Launch

---

## ข้อมูลที่ต้องกำหนดก่อนเปิดใช้จริง

- Logo
- Favicon
- Hero Image
- หมายเลขฉุกเฉิน
- เบอร์โทรโครงการ
- เวลาทำการ
- รายชื่อ Admin
- รายชื่อเจ้าหน้าที่
- รายชื่อหมู่บ้านหรือหมู่ที่
- Target Days แต่ละหมวด
- Privacy Policy
- Terms
- Consent Text
- Data Retention
- Session Lifetime
- Backup Schedule

## Known Limitations

- Frontend เป็น static site จึงต้องอาศัย Google Apps Script Web App deployment ที่อัปเดตแล้วเสมอ หากแก้ `apps-script/Router.gs` หรือ Service ใหม่ ต้อง deploy Apps Script version ใหม่ก่อน Cloudflare Pages จะเรียก action ล่าสุดได้
- Admin End-to-End Test ต้องมีบัญชีทดสอบตาม role ได้แก่ `super_admin`, `admin`, `officer` และ `viewer`
- Production Data ห้ามใช้เป็นพื้นที่ทดสอบโดยตรง ควรมี Spreadsheet และ Drive Folder สำหรับ development/test แยกจาก production
- การทดสอบไฟล์แนบจริงต้องใช้ Google Drive quota และ permission ของบัญชีเจ้าของ Apps Script
- Browser บนมือถือจริงยังต้องทดสอบก่อนเปิด production โดยเฉพาะ camera upload, geolocation, copy tracking code และ admin table/card layout
- Backup/Restore ต้องทดสอบกับสำเนา Spreadsheet และ Drive Folder ก่อนใช้กับ production
- ค่าติดต่อ, หมายเลขฉุกเฉิน, Privacy Policy, Terms, Consent Text, Data Retention และ Backup Schedule ต้องยืนยันกับผู้ดูแลโครงการก่อนเปิดใช้งานจริง

---

## License

ยังไม่ได้กำหนด License อย่างเป็นทางการ

ก่อนเปิด Repository เป็นสาธารณะ ควรพิจารณาเลือก License ให้เหมาะสม เช่น:

- MIT License สำหรับโค้ดที่อนุญาตให้นำไปใช้และแก้ไขได้
- Proprietary License หากต้องการสงวนสิทธิ์
- ไม่ใส่ License หากยังไม่อนุญาตให้ผู้อื่นนำโค้ดไปใช้

---

## ติดต่อโครงการ

**Khaophang Report**

- Website: https://khaophangreport.pages.dev
- Email: khaophangreport@gmail.com
- GitHub: https://github.com/khaophangreport-spec/khaophangreport

---

## หมายเหตุสำคัญ

ระบบนี้เป็นช่องทางรับแจ้งและติดตามปัญหาชุมชน ไม่ใช่ระบบบริการฉุกเฉิน

กรณีมีเหตุที่เสี่ยงต่อชีวิต ความปลอดภัย หรือทรัพย์สิน ผู้ใช้งานต้องติดต่อหมายเลขฉุกเฉินหรือหน่วยงานที่เกี่ยวข้องโดยตรง

---

**Khaophang Report — ร่วมกันสร้างชุมชนเขาพังให้น่าอยู่ยิ่งขึ้น**
