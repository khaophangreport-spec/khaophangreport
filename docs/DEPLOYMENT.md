# Khaophang Report — DEPLOYMENT

คู่มือ Deploy ระบบ Khaophang Report สำหรับ Development และ Production

> เอกสารนี้ห้ามใส่ Secret จริง, Spreadsheet ID จริง, Folder ID จริง, Session Secret, App Secret หรือ Setup Key จริง ให้ใช้ placeholder เท่านั้น

---

## 1. Development Environment

Development Environment ใช้สำหรับพัฒนาและทดสอบก่อนขึ้น Production

สิ่งที่ต้องแยกจาก Production:

- Google Apps Script Project
- Google Spreadsheet
- Google Drive Root Folder
- Script Properties
- Apps Script Web App Deployment
- Cloudflare Pages preview หรือ branch สำหรับทดสอบ

ค่าที่ควรใช้:

```text
ENVIRONMENT = development
ALLOWED_ORIGIN = http://localhost:8080
```

Frontend เป็น static site ไม่มี build step สามารถทดสอบในเครื่องด้วย:

```bash
python -m http.server 8080
```

จากนั้นเปิด:

```text
http://localhost:8080
```

ข้อควรระวัง:

- ห้ามใช้ Production Spreadsheet เป็นพื้นที่ทดลอง
- ห้ามใช้ Production Drive Folder เก็บไฟล์ทดสอบ
- Test Data ต้องระบุได้ชัดเจนและ cleanup ได้

---

## 2. Production Environment

Production Environment ใช้สำหรับผู้ใช้งานจริง

สิ่งที่ต้องมี:

- Google Account กลางเป็นเจ้าของ resource หลัก
- Spreadsheet สำหรับ production โดยเฉพาะ
- Drive Root Folder สำหรับ production โดยเฉพาะ
- Apps Script Project สำหรับ production
- Apps Script Web App Deployment แบบ versioned deployment
- Cloudflare Pages production branch
- Backup และ rollback plan

ค่าที่ควรใช้:

```text
ENVIRONMENT = production
ALLOWED_ORIGIN = https://YOUR_PRODUCTION_DOMAIN
```

ก่อนเปิดใช้งานจริงต้องผ่าน smoke tests และ mobile tests ตามหัวข้อท้ายเอกสารนี้

---

## 3. Google Account กลาง

ใช้ Google Account กลางของโครงการเป็นเจ้าของ resource สำคัญทั้งหมด

Account กลางควรเป็นเจ้าของ:

- Google Spreadsheet
- Google Drive Root Folder
- Google Apps Script Project
- Apps Script Web App Deployment
- Backup folder

แนวทาง:

- เปิด 2-Step Verification
- จำกัดสิทธิ์ owner เท่าที่จำเป็น
- แยกบัญชีผู้ใช้ระบบใน sheet `users` ออกจากบัญชี Google เจ้าของ resource
- ห้ามใช้บัญชีส่วนตัวเป็น owner หลักของ production

---

## 4. Spreadsheet Setup

สร้าง Google Spreadsheet ใหม่สำหรับ environment นั้น ๆ

Sheet ที่ระบบต้องมีทั้งหมด:

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

วิธี setup:

1. สร้าง Spreadsheet ใหม่
2. คัดลอก Spreadsheet ID เก็บไว้เฉพาะในที่ปลอดภัย
3. ตั้งค่า `SPREADSHEET_ID` ใน Apps Script Properties
4. รัน `setupSystem()`
5. รัน `validateSeedData()`
6. รัน `validatePhysicalSeedPlacement()`

ห้าม:

- เปลี่ยนชื่อ Sheet
- เปลี่ยนชื่อ Column
- ลบ Column ที่อยู่ใน schema
- เปิด Spreadsheet เป็น public

รายละเอียด column ให้ยึด `docs/DATA_SCHEMA.md`

---

## 5. Drive Setup

สร้าง Google Drive Root Folder สำหรับ environment นั้น ๆ

โครงสร้าง folder:

```text
Khaophang_Report_Files/
├── reports/
├── announcements/
├── exports/
├── backups/
└── temp/
```

วิธี setup:

1. สร้าง Root Folder ใหม่
2. คัดลอก Folder ID เก็บไว้เฉพาะในที่ปลอดภัย
3. ตั้งค่า `ROOT_FOLDER_ID` ใน Apps Script Properties
4. รัน `setupSystem()` เพื่อสร้างโฟลเดอร์ย่อยที่จำเป็น
5. ตรวจว่า Root Folder ไม่ได้เปิด public

ข้อควรระวัง:

- ไฟล์แนบจากประชาชนต้องเก็บใน Drive ผ่าน Backend เท่านั้น
- Frontend ห้ามอัปโหลดเข้าหรืออ่านจาก Google Drive โดยตรง
- ห้ามเก็บ Base64 รูปภาพไว้ใน Google Sheets

---

## 6. Script Properties

ตั้งค่าผ่าน Google Apps Script Project Settings → Script Properties

Required keys:

```text
SPREADSHEET_ID
ROOT_FOLDER_ID
APP_SECRET
SESSION_SECRET
ALLOWED_ORIGIN
ADMIN_SETUP_KEY
ENVIRONMENT
```

คำอธิบาย:

| Key | ใช้สำหรับ | ตัวอย่างแบบ placeholder |
|---|---|---|
| `SPREADSHEET_ID` | Spreadsheet ของ environment นั้น | `YOUR_SPREADSHEET_ID` |
| `ROOT_FOLDER_ID` | Drive Root Folder ของ environment นั้น | `YOUR_ROOT_FOLDER_ID` |
| `APP_SECRET` | Hash password และข้อมูลที่ต้องใช้ secret | `GENERATE_RANDOM_SECRET_1` |
| `SESSION_SECRET` | Hash session token | `GENERATE_RANDOM_SECRET_2` |
| `ALLOWED_ORIGIN` | Origin ที่อนุญาตเรียก API | `https://YOUR_DOMAIN` |
| `ADMIN_SETUP_KEY` | Key สำหรับสร้าง First Admin | `GENERATE_RANDOM_SETUP_KEY` |
| `ENVIRONMENT` | ชื่อ environment | `development` หรือ `production` |

ข้อบังคับ:

- ห้าม commit ค่าเหล่านี้ลง repository
- ห้ามใส่ค่าเหล่านี้ใน `assets/js/config.js`
- ห้ามส่งค่าเหล่านี้กลับไปที่ Frontend
- หากสงสัยว่า secret หลุด ให้ rotate ทันที

---

## 7. `setupSystem()`

รัน `setupSystem()` จาก Apps Script Editor หลังตั้ง Script Properties แล้ว

หน้าที่ของ `setupSystem()`:

- ตรวจ Script Properties ที่จำเป็น
- ตรวจ Spreadsheet
- สร้าง Sheet ตาม schema
- สร้าง header row
- สร้าง checkbox/data validation ที่จำเป็น
- seed `categories`
- seed `settings`
- seed schema version
- สร้าง Drive folders ที่จำเป็น

หลังรันให้ตรวจ:

```text
validateSeedData()
validatePhysicalSeedPlacement()
```

หาก seed row อยู่ผิดตำแหน่ง ให้ใช้ test/repair function ที่เกี่ยวข้องตามสถานะของ Apps Script source ล่าสุด และตรวจผลซ้ำอีกครั้ง

---

## 8. First Admin

สร้าง First Admin หลัง `setupSystem()` สำเร็จและก่อนเปิด Admin UI ให้ผู้ใช้งานจริง

Backend function:

```text
setupFirstAdmin(input)
```

Payload แบบตัวอย่าง ห้ามใช้ค่าจริงในเอกสาร:

```javascript
setupFirstAdmin({
  setupKey: "YOUR_ADMIN_SETUP_KEY",
  username: "superadmin",
  temporaryPassword: "TEMPORARY_STRONG_PASSWORD",
  displayName: "ผู้ดูแลระบบ",
  email: "admin@example.test",
  phone: ""
});
```

เงื่อนไข:

- ต้องตั้ง `ADMIN_SETUP_KEY` ใน Script Properties ก่อน
- สร้างได้เฉพาะตอนที่ยังไม่มี user ในระบบ
- User แรกจะมี role `super_admin`
- ระบบบังคับ `mustChangePassword`
- หลังสร้างสำเร็จควร rotate หรือเอา `ADMIN_SETUP_KEY` ออกจาก production properties ตามนโยบายทีม

---

## 9. Apps Script Deploy

Deploy Backend เป็น Google Apps Script Web App

ขั้นตอน:

1. เปิด Apps Script Project
2. ตรวจว่า source ใน Apps Script ตรงกับโฟลเดอร์ `apps-script/`
3. ตรวจ Script Properties ครบ
4. รัน `setupSystem()` และ validation tests
5. เลือก Deploy → New deployment
6. Type: Web app
7. Execute as: account กลางของโครงการ
8. Who has access: ตามนโยบาย deployment ของโครงการ
9. Deploy เป็น version ใหม่
10. เก็บ Web App URL ในที่ปลอดภัย

หลัง deploy ต้องทดสอบ:

```text
health.check
public.config
category.list
auth.login
```

ข้อควรระวัง:

- ถ้าแก้ `Router.gs` หรือ Service ใด ๆ ต้อง deploy Apps Script version ใหม่
- Cloudflare Pages จะเรียก backend action ล่าสุดได้ก็ต่อเมื่อ `API_URL` ชี้ไป deployment ที่มี source ล่าสุด
- ห้ามใช้ development deployment URL ใน production

---

## 10. API URL

Frontend อ่าน API endpoint จาก:

```text
assets/js/config.js
```

ตั้งค่า:

```javascript
window.APP_CONFIG = Object.freeze({
  API_URL: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
});
```

ข้อบังคับ:

- `API_URL` เป็น public endpoint ได้ แต่ไม่ใช่ secret
- ห้ามใส่ Spreadsheet ID, Folder ID, App Secret, Session Secret หรือ Setup Key
- ทุก API call ต้องผ่าน `assets/js/api.js`
- หากเปลี่ยน Apps Script deployment URL ต้องอัปเดต `assets/js/config.js` ให้ตรง environment

---

## 11. Cloudflare Pages Connect

ใช้ Cloudflare Pages สำหรับ host static frontend

ขั้นตอน:

1. เข้า Cloudflare Dashboard
2. เลือก Workers & Pages หรือ Pages
3. Connect to Git
4. เลือก repository ของโครงการ
5. ตั้งค่า production branch
6. ตั้งค่า build ตามหัวข้อถัดไป
7. Deploy

Cloudflare Pages ทำหน้าที่ host:

- HTML
- CSS
- Vanilla JavaScript
- Static assets

Cloudflare Pages ไม่ควรเก็บ secret ของ backend

---

## 12. Build Settings

ค่า build สำหรับ Cloudflare Pages:

| Setting | Value |
|---|---|
| Framework preset | `None` |
| Build command | เว้นว่าง หรือ `exit 0` |
| Build output directory | `/` |
| Root directory | `/` |

เหตุผล:

- โครงการนี้เป็น static frontend
- ไม่มี npm build
- ไม่มี framework
- ไม่มี bundler

หลัง deploy ให้ตรวจว่าไฟล์เหล่านี้เปิดได้:

```text
/
/report.html
/track.html
/admin/login.html
/privacy.html
/terms.html
```

---

## 13. Production Branch

ค่าแนะนำ:

```text
Production Branch = main
```

แนวทาง branch:

- `main` สำหรับ production-ready source
- feature/fix branches สำหรับงานพัฒนา
- preview deployment ใช้สำหรับทดสอบก่อน merge

ก่อน merge เข้า production branch:

- ตรวจ `git status`
- ตรวจ `git diff`
- ตรวจว่าไม่มี secret
- ทดสอบ flow ที่เกี่ยวข้อง
- ตรวจ Apps Script deployment plan

---

## 14. Smoke Tests

หลัง deploy Apps Script และ Cloudflare Pages ให้รัน smoke tests อย่างน้อยตามนี้

Public:

- เปิดหน้าแรก
- เปิดหน้าแจ้งปัญหา
- โหลด `public.config`
- โหลด `category.list`
- ส่ง report ด้วย test data
- เห็น success page และ tracking code
- ใช้ tracking code เปิดหน้าติดตาม
- ส่ง anonymous report และตรวจว่า public tracking ไม่แสดง PII
- ส่ง additional info ด้วย test data

Admin:

- Login ด้วยบัญชีทดสอบ
- เปิด dashboard
- เปิด report list
- เปิด report detail
- Assign report
- เปลี่ยนสถานะเป็น `in_progress`
- Resolve
- Close
- Viewer เห็น read-only และไม่มีปุ่ม action ที่ไม่มีสิทธิ์
- Officer เห็นเฉพาะ scope ที่ได้รับอนุญาต

Security:

- เรียก Admin API โดยไม่มี session ต้องถูกปฏิเสธ
- Public API ต้องไม่คืน field ภายในหรือ PII
- Export ค่า default ต้องไม่รวม PII
- CSV ต้องป้องกัน formula injection

Apps Script test functions ที่ควรรัน:

```text
testValidateSeedData()
testValidatePhysicalSeedPlacement()
testGetHealthCheckRouter()
testPublicReadApiRouter()
runKhaophangCoreTestSuite()
```

หลังทดสอบ:

- Cleanup Test Data
- ตรวจ `activity_logs`
- ตรวจ `sessions`
- ตรวจ `rate_limits`
- ตรวจ Drive test files

---

## 15. Rollback

Rollback มี 2 ส่วน: Frontend และ Backend

Frontend rollback:

1. เข้า Cloudflare Pages deployment history
2. เลือก deployment ก่อนหน้า
3. Rollback หรือ redeploy commit ที่เสถียร
4. ตรวจ smoke tests

Backend rollback:

1. เข้า Apps Script Deployments
2. เลือก Web App deployment
3. เปลี่ยนให้ชี้ version ก่อนหน้า หรือ deploy version เสถียรใหม่
4. ตรวจ `API_URL` ยังชี้ deployment ที่ถูกต้อง
5. รัน smoke tests

Data rollback:

- ใช้เมื่อมี migration หรือข้อมูลเสียหายเท่านั้น
- Restore จาก backup ไปยัง Spreadsheet/Drive สำเนาก่อน
- ตรวจ schema และ seed data
- ค่อยเปลี่ยน `SPREADSHEET_ID` หรือ `ROOT_FOLDER_ID` ใน environment ที่ต้องการกู้คืน
- ห้าม restore ทับ production โดยไม่ทดสอบกับสำเนาก่อน

---

## 16. Backup

ก่อน deploy production หรือแก้ schema ต้อง backup:

- Google Spreadsheet
- Google Drive Root Folder
- Apps Script source
- Current Apps Script deployment version
- Current Cloudflare Pages deployment
- Script Properties key list โดยไม่เปิดเผยค่า secret

แนวทาง:

1. Copy Spreadsheet เป็น backup
2. Copy Drive Folder หรือ export metadata ตามนโยบายทีม
3. บันทึก Apps Script version ที่ใช้งานจริง
4. บันทึก Cloudflare Pages deployment id/commit
5. เก็บ backup ใน folder ที่จำกัดสิทธิ์
6. ทดสอบ restore กับ environment สำเนาเป็นระยะ

ห้าม:

- backup secret ลงไฟล์ใน repository
- แชร์ backup แบบ public
- ใช้ backup production เป็น test data โดยไม่ทำสำเนาและลบ PII ตามนโยบาย

---

## 17. Troubleshooting

### API เรียกแล้วได้ `NOT_FOUND`

ตรวจ:

- `action` สะกดตรงกับ `Router.gs`
- Apps Script deployment เป็น version ล่าสุด
- `assets/js/config.js` ชี้ `API_URL` ถูก environment
- Deploy URL ไม่ใช่ development deployment ที่เลิกใช้แล้ว

### Admin API ได้ `UNAUTHORIZED` หรือ `SESSION_EXPIRED`

ตรวจ:

- Login สำเร็จและมี session token
- Frontend ส่ง API ผ่าน `assets/js/api.js`
- Session ยังไม่หมดอายุ
- Sheet `sessions` ไม่ถูกลบหรือ revoke
- Browser local storage ไม่เก็บ session เก่าจาก environment อื่น

### ได้ `FORBIDDEN`

ตรวจ:

- Role ของ user ใน sheet `users`
- Permission ของ action นั้น
- Officer scope ต้องเป็นงานที่ได้รับอนุญาต
- Viewer เป็น read-only

### `setupSystem()` ล้มเหลว

ตรวจ:

- `SPREADSHEET_ID` ถูกต้อง
- `ROOT_FOLDER_ID` ถูกต้อง
- Account กลางมีสิทธิ์แก้ Spreadsheet และ Drive
- Sheet เดิมไม่มี header ที่เปลี่ยนชื่อเอง
- Drive Root Folder ไม่ถูกลบหรือย้ายสิทธิ์

### `public.config` หรือ `category.list` โหลดไม่ได้

ตรวจ:

- Apps Script Web App deploy สำเร็จ
- `ALLOWED_ORIGIN` ตรงกับ origin ที่เรียกจริง
- `settings` และ `categories` seed แล้ว
- Cache อาจยังถือค่าเก่า ให้รอ TTL หรือ clear cache ตาม function ที่เกี่ยวข้อง

### รูปภาพอัปโหลดไม่ได้

ตรวจ:

- MIME type เป็น JPG, PNG หรือ WebP
- ขนาดหลังบีบอัดไม่เกิน policy
- Drive Folder ยังมีสิทธิ์เขียน
- Backend ไม่ได้รับ base64 ที่เสียหาย
- Quota ของบัญชี Google ยังไม่เต็ม

### Cloudflare Pages แสดงหน้าเก่า

ตรวจ:

- Production branch ถูกต้อง
- Deployment ล่าสุดสำเร็จ
- Browser cache
- Cloudflare cache
- Commit ที่ deploy มี `assets/js/config.js` ถูก environment

### Smoke test สร้างข้อมูลทดสอบค้าง

ตรวจและ cleanup:

- `reports`
- `report_updates`
- `report_additional_info`
- `attachments`
- `sessions`
- `activity_logs`
- `rate_limits`
- Drive test files

ใช้ prefix test data ที่ค้นหาได้ง่าย และห้ามลบ production data ที่ไม่ใช่ test data

---

## Deployment Checklist สั้น

- [ ] แยก Development/Production resource แล้ว
- [ ] ตั้ง Script Properties ครบ โดยไม่เก็บ secret ใน repo
- [ ] รัน `setupSystem()` แล้ว
- [ ] รัน validation tests แล้ว
- [ ] สร้าง First Admin แล้ว
- [ ] Deploy Apps Script Web App version ล่าสุดแล้ว
- [ ] ตั้ง `API_URL` ถูก environment แล้ว
- [ ] Cloudflare Pages build settings ถูกต้องแล้ว
- [ ] Production branch ถูกต้องแล้ว
- [ ] Smoke tests ผ่านแล้ว
- [ ] Backup ก่อนเปิดใช้งานจริงแล้ว
- [ ] มี rollback plan แล้ว
