# Khaophang Report - Test Checklist

เอกสารนี้ใช้สำหรับตรวจรับระบบก่อนส่งมอบและก่อน Production โดยยึด `README.md`, `APP_SPEC.md`, `UI_FLOW.md`, `DATA_SCHEMA.md`, `API_SPEC.md` และ `DEVELOPMENT_RULES.md`

## วิธีใช้

- ใช้ข้อมูลทดสอบเท่านั้น ห้ามใช้ข้อมูลประชาชนหรือข้อมูล Production จริงในการทดสอบที่สร้าง/แก้ไขข้อมูล
- กรอก `Actual Result`, `Pass/Fail` และ `Note` ระหว่างทดสอบจริง
- หากทดสอบบน Production ให้เลือกเคสแบบ non-destructive ก่อน และแยกเคสที่ต้องสร้างข้อมูลทดสอบให้มีขั้นตอน cleanup ชัดเจน
- ห้ามบันทึก Secret, Spreadsheet ID, Folder ID, Session Token หรือ Password จริงในเอกสารนี้

## Environment

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| ENV-001 | มี Development และ Production แยกกัน | ตรวจ Script Properties, Spreadsheet, Drive Folder, Apps Script Deployment และ Frontend Config ของแต่ละ environment | Development และ Production ใช้ชุด resource แยกกัน ไม่มีการใช้ Production เป็นพื้นที่ทดลอง |  |  |  |
| ENV-002 | มี Apps Script Project สำหรับ environment ที่ทดสอบ | ตรวจค่า `SPREADSHEET_ID`, `ROOT_FOLDER_ID`, `APP_SECRET`, `SESSION_SECRET`, `ALLOWED_ORIGIN`, `ADMIN_SETUP_KEY`, `ENVIRONMENT` ใน Script Properties | ค่าครบถ้วนและไม่ถูก hardcode ใน repository หรือ frontend |  |  |  |
| ENV-003 | สร้าง Google Sheets แล้ว | รัน setup/validation ที่เกี่ยวข้อง แล้วตรวจชื่อ Sheet และ Header เทียบ `DATA_SCHEMA.md` | Sheet ครบ, Header ถูกต้อง, ไม่มี Header ซ้ำ, Freeze Header และ validation พื้นฐานพร้อมใช้ |  |  |  |
| ENV-004 | สร้าง Root Folder แล้ว | ตรวจ Drive structure: `reports/`, `announcements/`, `exports/`, `backups/`, `temp/` | โฟลเดอร์ครบและไม่เปิดเป็น public โดยไม่จำเป็น |  |  |  |
| ENV-005 | Frontend deploy หรือเปิดใน environment ทดสอบได้ | เปิดหน้า public และ admin แล้วตรวจว่า API URL มาจาก config กลาง | Frontend ใช้ `assets/js/api.js` และ config กลาง ไม่ hardcode API URL หลายจุด |  |  |  |

## Public

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| PUB-001 | API พร้อมใช้งาน | เปิดหน้าแรก | หน้าโหลดสำเร็จ มี Loading/Empty/Error state ตามส่วนที่เรียก API และไม่มี console error |  |  |  |
| PUB-002 | มี public settings | เรียก/เปิดส่วนที่ใช้ `public.config` | แสดงข้อมูล public เท่านั้น ไม่แสดง Spreadsheet ID, Folder ID, Secret หรือข้อมูลภายใน |  |  |  |
| PUB-003 | มี category active อย่างน้อย 1 รายการ | เปิดหน้าแจ้งปัญหาและส่วนหมวดหมู่ | แสดงเฉพาะหมวดที่ active เรียงถูกต้อง และไม่แสดง default assignee |  |  |  |
| PUB-004 | มีประกาศ active หรือไม่มีประกาศ | เปิดหน้าแรก | ถ้ามีประกาศให้แสดงรายการตาม limit ถ้าไม่มีให้แสดง empty state ที่เหมาะสม |  |  |  |
| PUB-005 | ใช้ข้อมูลทดสอบ | ส่งเรื่องแบบระบุตัวตนพร้อมข้อมูลครบ | ระบบสร้างเรื่องสำเร็จ ได้ Tracking Code และแสดง Success State |  |  | ลบ/ปิดข้อมูลทดสอบหลังตรวจ |
| PUB-006 | ใช้ข้อมูลทดสอบ | ส่งเรื่องแบบ anonymous โดยกรอก PII แล้วเลือกไม่ระบุตัวตน | ระบบส่งสำเร็จและ backend ไม่เก็บ PII ที่ไม่จำเป็น, `contactMethod` เป็น `none` |  |  | ลบ/ปิดข้อมูลทดสอบหลังตรวจ |
| PUB-007 | อยู่หน้าแจ้งปัญหา | ส่งฟอร์มโดยขาด category/title/location/consent | แสดง validation error ภาษาไทยและผูกกับ field ที่เกี่ยวข้อง ไม่ส่งข้อมูลสำเร็จ |  |  |  |
| PUB-008 | มีรูปทดสอบ JPG/PNG/WebP | แนบรูป 1-3 รูปแล้วส่งเรื่อง | รูปถูกบีบอัด/ตรวจขนาดตาม config และอัปโหลดเข้า Google Drive ได้ |  |  | ใช้รูปทดสอบเท่านั้น |
| PUB-009 | มีรูปทดสอบเกินเงื่อนไข | แนบรูปเกิน 3 รูป, ไฟล์ใหญ่เกิน, หรือชนิดไฟล์ไม่รองรับ | ระบบปฏิเสธพร้อมข้อความเข้าใจง่าย ไม่เก็บไฟล์ที่ผิดเงื่อนไข |  |  |  |
| PUB-010 | Browser รองรับ geolocation | ทดสอบอนุญาตและปฏิเสธ location permission | กรณีอนุญาตมีพิกัด กรณีปฏิเสธยังกรอกที่อยู่เองได้ |  |  |  |
| PUB-011 | มี Tracking Code ทดสอบ | ค้นหาด้วย Tracking Code ที่ถูกต้อง | แสดงข้อมูล public, status, timeline และ public attachments โดยไม่แสดง PII/internal data |  |  |  |
| PUB-012 | ไม่มี Tracking Code นี้ | ค้นหาด้วย Tracking Code ผิดรูปแบบหรือไม่มีจริง | แสดง not found แบบ generic ไม่บอกข้อมูลภายใน |  |  |  |
| PUB-013 | มีเรื่องที่ยังไม่ปิด | ส่งข้อมูลเพิ่มเติมผ่านหน้า track/detail | ระบบรับข้อมูลเพิ่มเติม, สถานะ review เป็น pending/private และไม่แสดงทันทีหากยังไม่อนุมัติ |  |  | ใช้ข้อมูลทดสอบ |
| PUB-014 | อยู่หน้า report submit | กดส่งซ้ำ/refresh ระหว่าง submit | ระบบป้องกัน duplicate submit ด้วย requestId/idempotency และ UI ไม่สร้างเรื่องซ้ำ |  |  |  |

## Admin

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| ADM-001 | มีบัญชี admin/super_admin ทดสอบ | Login ด้วย username/password ถูกต้อง | เข้าระบบสำเร็จ ได้ session และไป dashboard |  |  | ห้ามบันทึกรหัสผ่านจริง |
| ADM-002 | มีบัญชี admin ทดสอบ | Login ด้วยรหัสผ่านผิด/username ไม่มีจริง | แสดง error generic ไม่บอกว่า username หรือ password ผิดส่วนใด |  |  |  |
| ADM-003 | Login สำเร็จแล้ว | กด Logout แล้วเรียกหน้า admin อีกครั้ง | Session ถูก revoke และต้อง login ใหม่ |  |  |  |
| ADM-004 | มี session ที่หมดอายุหรือถูก revoke | เปิดหน้า admin หรือเรียก Admin API | ระบบพาออกจากระบบหรือแสดง session expired อย่างเหมาะสม |  |  |  |
| ADM-005 | มี user หลาย role | ตรวจเมนูและ action ของ `super_admin`, `admin`, `officer`, `viewer` | UI ซ่อนเมนูตาม role และ backend ปฏิเสธ action ที่ไม่มี permission |  |  |  |
| ADM-006 | มีข้อมูลเรื่องทดสอบ | เปิด Dashboard | Dashboard แสดง summary ตาม scope/permission, มี loading/error/empty และไม่รั่ว PII |  |  |  |
| ADM-007 | มีรายการเรื่องหลายรายการ | ทดสอบ search, filter, sort, pagination ในหน้ารายการ | ผลลัพธ์ถูกต้อง, เปลี่ยน filter แล้วกลับหน้า 1, ไม่โหลดทุกข้อมูลโดยไม่จำเป็น |  |  |  |
| ADM-008 | Officer มีงานของตนเองและงานคนอื่น | Login เป็น officer แล้วเปิดรายการ/รายละเอียด | Officer เห็นเฉพาะงานที่มีสิทธิ์ตาม scope |  |  |  |
| ADM-009 | Viewer login ได้ | เปิด detail report | Viewer เห็นข้อมูล masked/read-only ไม่เห็น internal summary, full PII หรือ action แก้ไข |  |  |  |
| ADM-010 | มี report ทดสอบสถานะเปิด | มอบหมายเจ้าหน้าที่ | Assignment สำเร็จ, version เพิ่ม, timeline และ activity log ถูกสร้าง |  |  |  |
| ADM-011 | มี report ทดสอบ | เปลี่ยนสถานะตาม transition ที่อนุญาต เช่น `new` -> `reviewing` -> `assigned` | สถานะเปลี่ยนถูกต้อง, required fields ถูกบังคับ, timeline/activity log ครบ |  |  |  |
| ADM-012 | มี report ทดสอบ | ลอง transition ที่ไม่อนุญาต เช่น `closed` -> `in_progress` | Backend ปฏิเสธด้วย error ที่เหมาะสม และข้อมูลเดิมไม่เปลี่ยน |  |  |  |
| ADM-013 | เปิด detail report พร้อม version เดิม | จำลองแก้ไขด้วย version เก่า | ได้ `VERSION_CONFLICT` และ UI แจ้งให้โหลดข้อมูลใหม่ |  |  |  |
| ADM-014 | มี report ทดสอบ | เพิ่ม public update และ internal note | Public update แสดงใน public timeline ตาม policy ส่วน internal note ไม่แสดง public |  |  |  |
| ADM-015 | มีไฟล์หลักฐานทดสอบ | แนบ evidence ใน admin detail | ไฟล์ถูกตรวจชนิด/ขนาด, เก็บใน Drive, metadata ไม่เปิดเผย file_id ต่อ public |  |  |  |
| ADM-016 | มี report สถานะที่ resolve ได้ | Resolve ด้วย result ครบถ้วน แล้ว close | ต้องมี result/public message ตาม policy, ปิดเรื่องได้ถูกต้อง และ timeline ครบ |  |  |  |
| ADM-017 | มีสิทธิ์ export | Export CSV แบบไม่รวม PII และแบบรวม PII ตาม permission | ค่า default ไม่รวม PII, การรวม PII ต้องมีสิทธิ์/confirmation, CSV ป้องกัน formula injection |  |  |  |
| ADM-018 | มี activity logs | เปิดหน้า Activity Logs และ filter | แสดง log ตามสิทธิ์ มี pagination และไม่แสดง secret/raw token/password |  |  |  |
| ADM-019 | มีสิทธิ์จัดการ users/categories/announcements/settings | สร้าง/แก้ไขข้อมูลด้วย payload valid/invalid | Valid สำเร็จ, invalid แสดง field errors, version required ใน update, audit log ไม่รั่วค่าลับ |  |  |  |

## Security

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| SEC-001 | มี repository ล่าสุด | ค้นหา secret pattern เช่น Spreadsheet ID, Folder ID, Session Secret, password จริง | ไม่พบ secret หรือ credential จริงใน source/documentation |  |  |  |
| SEC-002 | มี user ทดสอบ | ตรวจ Sheet `users` | ไม่เก็บ password plain text มี hash/salt และไม่ส่ง hash/salt กลับ frontend |  |  |  |
| SEC-003 | Login แล้ว | ตรวจ Sheet `sessions` และ response auth | ไม่เก็บ raw session token ใน Sheet หรือ log, frontend ได้เฉพาะ token ที่จำเป็นผ่าน HTTPS |  |  |  |
| SEC-004 | มี public track data | เปิด public tracking | ไม่แสดงชื่อ เบอร์โทร email internal note assigned user file id หรือ field ภายใน |  |  |  |
| SEC-005 | มี anonymous report ทดสอบ | ตรวจข้อมูลที่บันทึกหลังส่ง anonymous | PII ที่ไม่จำเป็นถูกล้างหรือไม่ถูกบันทึก |  |  |  |
| SEC-006 | มี payload ที่มี HTML/script | ส่ง title/content/comment ที่มี `<script>` หรือ HTML | Output ถูก sanitize/escape และไม่เกิด XSS |  |  |  |
| SEC-007 | มี payload CSV injection | Export ข้อมูลที่เริ่มด้วย `=`, `+`, `-`, `@` | CSV escape formula injection ด้วย prefix ที่ปลอดภัย |  |  |  |
| SEC-008 | เรียก Admin API ได้ | เรียก Admin API โดยไม่มี session หรือ session ผิด | Backend ตอบ `UNAUTHORIZED`/`SESSION_EXPIRED` ไม่ให้ข้อมูล |  |  |  |
| SEC-009 | มี user role จำกัดสิทธิ์ | เรียก write action ด้วย role ที่ไม่มีสิทธิ์ | Backend ตอบ `FORBIDDEN` และไม่มีข้อมูลเปลี่ยน |  |  |  |
| SEC-010 | มี request ที่ทำให้ error | ตรวจ response error | ไม่ส่ง stack trace/internal exception/secret กลับ frontend |  |  |  |
| SEC-011 | มี upload test files | อัปโหลด MIME ปลอม/ไฟล์ผิดชนิด | Backend ตรวจ magic bytes/MIME และปฏิเสธไฟล์ผิดชนิด |  |  |  |
| SEC-012 | มี rate limit config | ยิง request ซ้ำเกิน limit สำหรับ report.track/auth.login/report.create | ได้ `RATE_LIMITED` และไม่มีข้อมูลซ้ำ |  |  | ใช้ test environment |

## Responsive

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| RSP-001 | เปิด Public pages ได้ | ตรวจ `index.html`, `report.html`, `track.html`, `track-detail.html`, `contact.html`, `faq.html`, `privacy.html`, `terms.html` ที่ 320px | ไม่มี horizontal overflow, text wrap ถูกต้อง, bottom navigation ไม่บัง content |  |  |  |
| RSP-002 | เปิด Public pages ได้ | ตรวจที่ 375px, 640px, 768px, 1024px, 1280px | Layout ขยายตาม breakpoint อย่างเป็นธรรมชาติและยัง mobile-first |  |  |  |
| RSP-003 | อยู่ใน report flow | ตรวจ sticky buttons และ bottom navigation บน 320px/375px | ปุ่มไม่ทับ field, แตะง่าย, target อย่างน้อย 44x44px |  |  |  |
| RSP-004 | มีข้อความไทยยาว | ใส่ข้อความไทยยาวใน title/description/timeline | ข้อความไม่ล้น container และไม่ทับ UI อื่น |  |  |  |
| RSP-005 | เปิด Admin pages ได้ | ตรวจ dashboard, reports, report-detail, users, categories, announcements, settings, activity-logs, export ที่ 320px | Drawer/table/card/form ใช้งานได้ ไม่มี overflow ที่ไม่จำเป็น |  |  |  |
| RSP-006 | เปิด Admin desktop ได้ | ตรวจ admin ที่ 768px, 1024px, 1280px | Sidebar/table/dashboard ใช้งานได้ spacing สม่ำเสมอและไม่เสียบุคลิก UI หลัก |  |  |  |
| RSP-007 | มี modal/drawer | เปิด modal และ drawer บน mobile/desktop | Modal/drawer อยู่ใน viewport, scroll ได้, focus ใช้งานได้ |  |  |  |
| RSP-008 | Browser รองรับ zoom | Zoom 200% บน public/admin | ข้อความอ่านได้ ไม่ซ้อนทับ ไม่ต้อง scroll สองแกนโดยไม่จำเป็น |  |  |  |

## Browser

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| BRW-001 | มี URL ทดสอบ | เปิดระบบบน Chrome desktop/mobile | Public/Admin flow หลักทำงาน ไม่มี console error สำคัญ |  |  |  |
| BRW-002 | มี URL ทดสอบ | เปิดระบบบน Edge desktop | Public/Admin flow หลักทำงาน ไม่มี console error สำคัญ |  |  |  |
| BRW-003 | มีอุปกรณ์ iOS หรือ Safari | เปิดระบบบน Safari | Layout, upload, geolocation, local storage และ navigation ทำงานตามที่รองรับ |  |  |  |
| BRW-004 | มี Firefox | เปิดระบบบน Firefox | Public/Admin flow หลักทำงาน ไม่มี feature สำคัญเสีย |  |  |  |
| BRW-005 | อยู่ใน multi-step form | ทดสอบ browser back/forward/refresh | Step/draft/scroll behavior เป็นไปตาม `UI_FLOW.md` และไม่ทำข้อมูลหายโดยไม่เตือน |  |  |  |
| BRW-006 | มี modal/drawer | ใช้ keyboard Tab, Enter, Space, Escape | Focus order ถูกต้อง, Escape ปิด modal/drawer, focus state เห็นชัด |  |  |  |
| BRW-007 | มี screen reader หรือ accessibility tool | ตรวจ label, heading, aria-live, error association, alt text | โครงสร้าง semantic อ่านได้และ control มี accessible name |  |  |  |

## Backup

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| BAK-001 | ก่อน migration/release | สร้าง backup Spreadsheet snapshot | Backup สร้างสำเร็จ ระบุวันที่ environment และ schema version ได้ |  |  | ห้ามใส่ secret ในชื่อ/คำอธิบาย |
| BAK-002 | มี Drive root folder | สำรอง Drive structure หรือ export รายการไฟล์สำคัญ | ครอบคลุม reports/announcements/exports/backups/temp ตาม scope |  |  |  |
| BAK-003 | มี Apps Script source | สำรอง Apps Script source ด้วยวิธีที่ทีมใช้ เช่น clasp/copy project | Source backup สำเร็จและไม่เผยแพร่ Script Properties secret |  |  |  |
| BAK-004 | มี repository remote | ตรวจว่า source code ล่าสุดถูก push ไป repository ที่ถูกต้องเมื่อได้รับอนุมัติ | Source code backup ผ่าน version control พร้อม branch/commit ที่ตรวจสอบได้ |  |  | ห้าม commit/push หากยังไม่ได้รับคำสั่ง |
| BAK-005 | มี policy retention | ตรวจ backup schedule และ retention | มีรอบ backup และระยะเก็บรักษาที่ระบุชัดเจนสำหรับ Spreadsheet, Drive, export, temp |  |  |  |

## Restore

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| RST-001 | มี backup Spreadsheet | Restore ไปยัง spreadsheet สำเนาใน test environment | Restore สำเร็จและไม่กระทบ Production |  |  | ใช้สำเนาเท่านั้น |
| RST-002 | Restore spreadsheet แล้ว | ตั้งค่า `SPREADSHEET_ID` ใหม่ใน test Apps Script Properties | Backend อ่านข้อมูลจาก spreadsheet ที่ restore ได้ |  |  | ห้ามบันทึก ID จริงในเอกสาร |
| RST-003 | มี backup Drive structure | Restore/copy Drive folder ไป test root folder | Attachment metadata เชื่อมกับไฟล์ที่ restore ได้ หรือระบุรายการที่ต้อง repair |  |  |  |
| RST-004 | Restore environment พร้อม | ทดสอบ `health.check`, `public.config`, `category.list`, `report.track` | API อ่านข้อมูล restore ได้และ public projection ไม่รั่ว PII |  |  |  |
| RST-005 | มี admin test account ใน restore | Login admin และเปิด dashboard/detail | Auth/session/admin read ทำงานหลัง restore |  |  |  |
| RST-006 | Restore เสร็จแล้ว | ตรวจ schema version, sheet headers, activity logs และ timeline | Schema ตรง, version/history ยังอยู่ครบ, ไม่มีข้อมูล orphan สำคัญ |  |  |  |

## Production Smoke Test

| Test ID | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Note |
|---|---|---|---|---|---|---|
| PRD-001 | ได้รับอนุมัติทดสอบ Production แล้ว | เปิด Production URL | Domain เปิดได้ผ่าน HTTPS และ asset path ถูกต้อง |  |  | Non-destructive |
| PRD-002 | Production API URL ตั้งค่าแล้ว | เรียก `health.check` | ได้ status `ok`, environment ถูกต้อง และไม่ส่ง secret/id ภายใน |  |  | Non-destructive |
| PRD-003 | Production config พร้อม | เปิดหน้าแรก | `public.config`, `category.list`, `announcement.list` ทำงาน และหน้าแสดงผลปกติ |  |  | Non-destructive |
| PRD-004 | มีข้อมูล public track สำหรับทดสอบ หรือสร้าง test report ที่อนุมัติแล้ว | ค้นหา Tracking Code ทดสอบ | แสดง public detail/timeline ถูกต้อง ไม่รั่ว PII |  |  | ใช้ test data เท่านั้น |
| PRD-005 | มีบัญชี admin production ที่ได้รับอนุญาต | Login แล้วเปิด dashboard | Login สำเร็จ dashboard แสดงตามสิทธิ์ ไม่มี console error |  |  | ห้ามบันทึก password/token |
| PRD-006 | Login admin แล้ว | เปิดรายการเรื่องและ detail แบบ read-only smoke | Search/filter/pagination/detail โหลดได้โดยไม่แก้ข้อมูล |  |  | Non-destructive |
| PRD-007 | ได้รับอนุมัติให้สร้างข้อมูลทดสอบ Production | ส่ง report test 1 รายการพร้อม marker ชัดเจน | สร้างสำเร็จ ได้ Tracking Code และมีแผน cleanup/ปิดเรื่องทดสอบ |  |  | ทำเฉพาะเมื่ออนุมัติ |
| PRD-008 | มี report test จาก PRD-007 | มอบหมาย/เปลี่ยนสถานะ/ปิดเรื่อง test ตามขั้นตอน | Workflow สำเร็จ, timeline/activity log ครบ, ไม่มีผลกับข้อมูลจริง |  |  | Cleanup หลังจบ |
| PRD-009 | มีสิทธิ์ export | Export CSV ช่วงวันที่จำกัดโดยไม่รวม PII | ไฟล์ export สำเร็จ จำกัดข้อมูลถูกต้อง และป้องกัน CSV injection |  |  | ตรวจ retention/export cleanup |
| PRD-010 | Backup ล่าสุดพร้อม | ตรวจสถานะ backup หลัง deploy | Backup ล่าสุดสร้างได้และ restore plan มีเจ้าของรับผิดชอบ |  |  |  |
| PRD-011 | Smoke test เสร็จ | ตรวจ logs/error/activity หลังทดสอบ | ไม่มี error สำคัญ, ไม่มี secret/PII ใน log, requestId สำหรับปัญหาถูกบันทึก |  |  |  |
| PRD-012 | มีข้อมูลทดสอบที่สร้างใน Production | Cleanup หรือปิด/mark test data ตาม policy | ข้อมูลทดสอบไม่ปะปนกับงานจริง และมีบันทึกการ cleanup |  |  |  |

