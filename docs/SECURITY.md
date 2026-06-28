# Khaophang Report — SECURITY

แนวทางความปลอดภัยสำหรับระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง

> เอกสารนี้เป็น security guideline ของโครงการ ไม่ใช่เอกสารรับรองมาตรฐาน และไม่กล่าวอ้างว่าโครงการผ่านมาตรฐานหรือ certification ใด ๆ

---

## 1. Threat Model เบื้องต้น

### Assets ที่ต้องปกป้อง

- ข้อมูลส่วนบุคคลของผู้แจ้ง เช่น ชื่อ เบอร์โทร อีเมล สถานที่ และรายละเอียดปัญหา
- รูปภาพและไฟล์แนบใน Google Drive
- บัญชีผู้ดูแลระบบและเจ้าหน้าที่
- Session token และข้อมูล session
- Password hash และ password salt
- Script Properties เช่น `APP_SECRET`, `SESSION_SECRET`, `ADMIN_SETUP_KEY`
- Spreadsheet และ Drive Root Folder ของระบบ
- Activity Logs และ Export Logs

### Actor หลัก

- ประชาชนทั่วไปที่ใช้ Public UI
- ผู้แจ้งที่ไม่ระบุตัวตน
- เจ้าหน้าที่ `officer`
- ผู้ดูแล `admin`
- ผู้ดูแลสูงสุด `super_admin`
- ผู้ใช้อ่านอย่างเดียว `viewer`
- ผู้โจมตีภายนอกที่ไม่มีบัญชี
- ผู้ใช้งานที่มีบัญชีแต่พยายามเข้าถึงข้อมูลเกินสิทธิ์
- ผู้ที่ได้ URL หรือไฟล์แนบโดยไม่ควรได้

### Threat สำคัญ

- Unauthorized access: เรียก Admin API โดยไม่มี session หรือใช้ session หมดอายุ
- Broken access control: role ต่ำกว่าเข้าถึง PII, export หรือ action ที่ไม่มีสิทธิ์
- Data leakage: Public API คืน PII หรือ field ภายใน
- Secret leakage: secret, Spreadsheet ID, Folder ID หรือ setup key หลุดเข้า repository/frontend/log
- Credential attacks: brute force login, weak password, password reuse หลัง reset
- Session theft: raw session token ถูก log หรือเก็บผิดที่
- File abuse: อัปโหลดไฟล์ชนิดไม่อนุญาต, ไฟล์ใหญ่เกิน, Drive folder ถูกเปิด public
- Formula injection: ข้อมูลผู้ใช้หรือ export CSV เริ่มด้วย `=`, `+`, `-`, `@`
- Duplicate/replay: กดส่งซ้ำหรือ replay request เดิม
- Unsafe logging: log เก็บ password, token, secret หรือ PII เกินจำเป็น
- Backup exposure: backup Spreadsheet/Drive ถูกแชร์กว้างเกินไป

### Trust Boundary

```text
Browser / Cloudflare Pages
  ↓ API ผ่าน assets/js/api.js
Google Apps Script Web App
  ↓ Repository Layer
Google Sheets + Google Drive
```

หลักสำคัญ:

- Frontend เป็น untrusted client
- Backend เป็นแหล่งจริงของ validation, session และ permission
- Google Sheets และ Google Drive ห้ามเปิดเป็น public data source

---

## 2. Secret Management

Secret ต้องอยู่ใน Google Apps Script Script Properties เท่านั้น

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

ข้อบังคับ:

- ห้ามใส่ secret จริงใน repository
- ห้ามใส่ secret จริงใน `assets/js/config.js`
- ห้ามส่ง secret กลับไปที่ frontend
- ห้าม log secret
- ห้ามใส่ secret ในเอกสาร, issue, screenshot หรือ test fixture
- ใช้ placeholder เท่านั้นใน README และ docs เช่น `YOUR_SPREADSHEET_ID`

การใช้งานในโค้ด:

- `APP_SECRET` ใช้ร่วมกับ password hashing
- `SESSION_SECRET` ใช้ hash session token
- `ADMIN_SETUP_KEY` ใช้สร้าง First Admin
- `SPREADSHEET_ID` และ `ROOT_FOLDER_ID` ใช้เฉพาะ backend

เมื่อสงสัยว่า secret หลุด:

1. หยุด deploy ที่เกี่ยวข้อง
2. Rotate secret ทันที
3. Revoke session ที่เกี่ยวข้อง
4. ตรวจ commit, logs และ deployment history
5. บันทึก incident โดยไม่แนบ secret จริง

---

## 3. Password

ข้อกำหนดรหัสผ่าน:

- อย่างน้อย 8 ตัวอักษร
- ต้องมีตัวอักษรและตัวเลข
- ปฏิเสธค่าที่อ่อน เช่นตัวอักษรซ้ำทั้งหมด, `password`, `12345678`, `admin`
- ห้ามเก็บ plain text password
- ห้ามส่ง password กลับ frontend
- ห้าม log password

การเก็บข้อมูล:

- เก็บ `password_hash`
- เก็บ `password_salt`
- ใช้ `APP_SECRET` ในกระบวนการ hash
- Password reset ต้อง hash ทันทีและตั้ง `must_change_password=true`

Login security:

- ใช้ error message แบบ generic สำหรับ login fail
- มี login rate limit
- มี failed login count และ lock policy
- บันทึก audit event โดยไม่เปิดเผย password

---

## 4. Session

Session policy:

- สร้าง session token แบบสุ่ม
- เก็บเฉพาะ `token_hash` ใน sheet `sessions`
- Session TTL ปัจจุบันคือ 8 ชั่วโมง
- Logout ต้อง revoke session
- Password change ต้อง revoke session ทั้งหมดของ user
- User inactive ต้องทำให้ session ใช้งานไม่ได้

Backend enforcement:

- Admin API ต้องเรียก `SessionService_require_()`
- Missing token ต้องได้ `UNAUTHORIZED`
- หมดอายุหรือ revoke แล้วต้องได้ `SESSION_EXPIRED`
- Session touch failure ต้อง safe log โดยไม่เปิดเผย token

Frontend:

- Frontend ห้ามอ่าน/เขียน Google Sheets โดยตรง
- Session token ใช้เรียก API ผ่าน `assets/js/api.js`
- ห้ามเก็บข้อมูล session ร่วมข้าม environment

---

## 5. Permission

Backend เป็นแหล่งจริงของ permission

หลักการ:

- Frontend ซ่อนปุ่มได้เพื่อ UX แต่ไม่ถือเป็น security control
- ทุก Admin API ต้องตรวจ session และ permission ที่ backend
- Write action ต้องตรวจ permission เสมอ
- PII แสดงตาม role และ permission
- Viewer ต้องเป็น read-only
- Officer ต้องถูกจำกัด scope ตามสิทธิ์และงานที่เกี่ยวข้อง

Permission ที่พบในระบบ:

- `admin.full`
- `report.read`
- `report.update`
- `report.assign`
- `user.manage`
- `settings.manage`
- `export.personal_data`

ตัวอย่าง enforcement:

- `UserService_assertPermission_()` สำหรับ permission ทั่วไป
- `ReportService_assertPermission_()` สำหรับ report actions
- `SessionService_require_()` ก่อน admin action
- Export with PII ต้องมี `export.personal_data` และ confirmation

---

## 6. File Upload

ข้อกำหนดไฟล์:

- รองรับเฉพาะ JPG, PNG และ WebP
- จำนวนรูปตาม config ปัจจุบันสูงสุด 3 รูป
- ขนาดหลังบีบอัดไม่เกิน policy ปัจจุบัน
- ด้านยาวไม่เกิน 1,600 px
- Backend ต้อง validate MIME type, file size, width/height และ base64
- Backend ต้องตั้งชื่อไฟล์ใหม่
- ห้ามเก็บ Base64 ใน Google Sheets

Drive security:

- Root Folder และโฟลเดอร์ย่อยต้องไม่เป็น public
- Backend ต้องตรวจ `DriveRepository_assertFolderNotPublic_()`
- ไฟล์แนบต้องเก็บผ่าน Google Apps Script backend เท่านั้น
- File role ต้องอยู่ในค่าที่อนุญาต เช่น `report`, `progress`, `resolved`, `additional`, `announcement`

Error handling:

- หาก upload บางส่วนสำเร็จแล้วเกิด error ต้องชดเชยด้วยการลบไฟล์ที่ upload ไปแล้ว
- ห้ามเปิดเผย `file_id`, `drive_folder_id` หรือ checksum ผ่าน public projection

---

## 7. PII

PII ที่ระบบอาจจัดเก็บ:

- ชื่อผู้แจ้ง
- เบอร์โทรศัพท์
- อีเมล
- สถานที่เกิดเหตุ
- พิกัด
- รายละเอียดปัญหา
- รูปภาพ
- ข้อมูลติดต่อเพิ่มเติม

หลักการ:

- เก็บเท่าที่จำเป็น
- Anonymous report ต้องไม่เก็บ PII ที่ไม่จำเป็น
- Public tracking ห้ามคืน PII
- Admin list ห้ามแสดง PII เกินจำเป็น
- Viewer ต้องเห็น PII แบบ mask ตามสิทธิ์
- Export ค่า default ต้องไม่รวม PII
- Export ที่รวม PII ต้องมี permission และ confirmation
- Audit log ห้ามเก็บ raw PII ที่ไม่จำเป็น

Public API ต้องไม่คืน:

- `reporter_name`
- `reporter_phone`
- `reporter_email`
- `request_id`
- `internal_summary`
- `internal_note`
- `assigned_to`
- `file_id`
- secret/token/password fields

---

## 8. Logging

ระบบใช้ Activity Logs และ safe logging เพื่อ audit เหตุการณ์สำคัญ

ควร log:

- Report created
- Additional info created
- Login success/failure
- Logout
- Password changed/reset
- First admin created
- Admin user/category/announcement/settings changes
- Assignment
- Status update
- Priority update
- Export created

ห้าม log:

- Plain password
- Raw session token
- `APP_SECRET`
- `SESSION_SECRET`
- `ADMIN_SETUP_KEY`
- Base64 รูปภาพ
- Filter value หรือข้อความภายในที่ไม่จำเป็น
- PII เกินจำเป็น

Controls ที่มี:

- `Security_redactSensitive_()` redact key ที่มี password/token/secret/salt/base64
- `AuditService_projectAdminLog_()` sanitize และ redact detail ก่อนแสดง
- Audit detail ควรเก็บ metadata เช่น count, status, version, hasNote แทนข้อความจริง

---

## 9. Backup

Backup scope:

- Google Spreadsheet
- Google Drive Root Folder
- Apps Script source
- Apps Script deployment version
- Cloudflare Pages deployment/commit
- Script Properties key list โดยไม่เปิดเผยค่า secret

ข้อบังคับ:

- Backup ก่อน migration, deploy production, permission change และ schema change
- Backup ต้องจำกัดสิทธิ์เฉพาะผู้เกี่ยวข้อง
- Backup ห้ามแชร์แบบ public
- ห้าม commit backup ที่มี PII หรือ secret ลง repository
- Restore ต้องทดสอบกับสำเนาก่อนใช้กับ production

Backup ที่มี PII:

- ต้องถือเป็นข้อมูลอ่อนไหว
- ต้องเก็บในพื้นที่ที่จำกัดสิทธิ์
- ต้องมี retention policy ที่ทีมยืนยันแล้ว

---

## 10. Incident Response

ตัวอย่าง incident:

- Secret หลุด
- Spreadsheet หรือ Drive ถูกแชร์ public
- Public API คืน PII
- Admin action ถูกใช้โดย role ที่ไม่มีสิทธิ์
- Session/token รั่ว
- ข้อมูล production ถูกแก้ผิด
- Backup สูญหายหรือเปิดเผยผิดที่

ขั้นตอนตอบสนอง:

1. ระงับผลกระทบทันที เช่น revoke session, rotate secret, ปิด public sharing
2. เก็บหลักฐานขั้นต่ำ เช่นเวลา, requestId, action, user role, affected sheet/file
3. หลีกเลี่ยงการคัดลอก secret หรือ PII ลง incident note
4. ประเมินขอบเขตข้อมูลที่ได้รับผลกระทบ
5. Backup ก่อน repair หากต้องแก้ข้อมูล
6. แก้ root cause
7. ทดสอบ regression และ security cases
8. บันทึก post-incident summary
9. ปรับ checklist หรือ test เพื่อป้องกันซ้ำ

สำหรับ secret leakage:

- Rotate `APP_SECRET` และ/หรือ `SESSION_SECRET` ตามผลกระทบ
- Revoke sessions ทั้งหมดหาก session secret หรือ token หลุด
- เปลี่ยน `ADMIN_SETUP_KEY`
- ตรวจ commit history และ deployment artifacts

---

## 11. Vulnerability Reporting

หากพบช่องโหว่ ให้รายงานแบบ private ต่อผู้ดูแลโครงการ

ข้อมูลที่ควรส่ง:

- สรุปช่องโหว่
- ขั้นตอนทำซ้ำ
- URL/page/action ที่เกี่ยวข้อง
- ผลกระทบที่คาดว่าเกิดขึ้น
- Screenshot ที่ไม่เปิดเผย secret หรือ PII
- วันที่และเวลาที่พบ

ห้าม:

- เผยแพร่ช่องโหว่แบบ public ก่อนผู้ดูแลรับทราบ
- ทดสอบกับ Production Data เกินความจำเป็น
- ดาวน์โหลดหรือเปิดเผยข้อมูลผู้ใช้จริง
- แนบ secret, token, password หรือ PII จริงในรายงาน

สถานะปัจจุบัน:

- โครงการยังไม่ได้ประกาศ SLA หรือ bug bounty program
- โครงการยังไม่ได้อ้างการรับรองมาตรฐานความปลอดภัยภายนอก
- ช่องทางและผู้รับผิดชอบอย่างเป็นทางการต้องยืนยันก่อน production launch

---

## 12. Security Checklist

### Secret

- [ ] ไม่มี secret ใน repository
- [ ] ไม่มี Spreadsheet ID หรือ Folder ID จริงใน frontend/docs
- [ ] Script Properties ครบ
- [ ] Secret ถูก rotate เมื่อสงสัยว่าหลุด
- [ ] `ADMIN_SETUP_KEY` ไม่ถูกเก็บใน frontend

### Password และ Session

- [ ] Password ไม่ถูกเก็บ plain text
- [ ] Password hash ใช้ salt และ app secret
- [ ] Login error เป็น generic
- [ ] Login rate limit ทำงาน
- [ ] Session เก็บเฉพาะ hash
- [ ] Logout revoke session
- [ ] Password change revoke sessions
- [ ] Admin API ไม่มี session ต้องถูกปฏิเสธ

### Permission

- [ ] Backend ตรวจ permission ทุก Admin API
- [ ] Viewer เป็น read-only
- [ ] Officer ถูกจำกัด scope
- [ ] Export PII ต้องมี permission
- [ ] Action สำคัญมี audit log

### Public และ PII

- [ ] `public.config` ไม่คืน secret
- [ ] `category.list` ไม่คืน default assignee
- [ ] `announcement.list` ไม่คืน internal fields
- [ ] `report.track` ไม่คืน PII
- [ ] Anonymous report ไม่เก็บ PII ที่ไม่จำเป็น
- [ ] Admin list/detail mask PII ตาม role

### File Upload

- [ ] จำกัด MIME type เป็น JPG, PNG, WebP
- [ ] จำกัดจำนวนรูป
- [ ] จำกัดขนาดและ dimension
- [ ] Drive folders ไม่เปิด public
- [ ] Public projection ไม่คืน Drive file id
- [ ] Upload failure มี compensation

### Logging และ Export

- [ ] Log redact password/token/secret/salt/base64
- [ ] Audit detail ไม่เก็บข้อความภายในเกินจำเป็น
- [ ] CSV ป้องกัน formula injection
- [ ] Export default ไม่รวม PII
- [ ] Export PII ต้อง confirmation

### Backup และ Incident

- [ ] Backup ก่อน deploy/migration/schema change
- [ ] Backup ไม่ public
- [ ] Restore ทดสอบกับสำเนาแล้ว
- [ ] มีขั้นตอน incident response
- [ ] มีช่องทาง private สำหรับรายงานช่องโหว่

---

## หมายเหตุ

เอกสารนี้ต้องอัปเดตเมื่อมีการเปลี่ยน:

- Permission model
- Session policy
- Password policy
- File upload policy
- PII projection
- Logging/audit behavior
- Backup/restore policy
- Deployment environment หรือ Script Properties
