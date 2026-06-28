# Apps Script Production Checklist

Checklist นี้ใช้ตรวจและเตรียม Google Apps Script สำหรับ Production ก่อน Deploy

ห้ามกรอก Secret, Spreadsheet ID, Folder ID, Setup Key หรือ Session Secret ลงในไฟล์นี้ ให้ตั้งค่าจริงเฉพาะใน Apps Script Project Settings หรือ Script Properties เท่านั้น

## 0. หลักการก่อนเริ่ม

- [ ] ใช้ Google Account กลางของโครงการ
- [ ] เปิด Apps Script project ที่ผูกกับ production เท่านั้น
- [ ] ยืนยันว่าไม่ได้ใช้ Spreadsheet หรือ Drive Folder ของ development/test
- [ ] ยืนยันว่าจะไม่ Deploy จนกว่าจะตรวจ checklist นี้ครบและได้รับอนุมัติ
- [ ] เปิดเอกสารอ้างอิงล่าสุด: `README.md`, `docs/DATA_SCHEMA.md`, `docs/API_SPEC.md`, `docs/DEPLOYMENT.md`, `docs/SECURITY.md`

## 1. Script Properties Required

ตรวจใน Apps Script > Project Settings > Script Properties

- [ ] `SPREADSHEET_ID` ตั้งค่าแล้ว และชี้ไปยัง production Spreadsheet
- [ ] `ROOT_FOLDER_ID` ตั้งค่าแล้ว และชี้ไปยัง production Drive root folder
- [ ] `APP_SECRET` ตั้งค่าแล้ว และไม่ซ้ำกับ environment อื่น
- [ ] `SESSION_SECRET` ตั้งค่าแล้ว และไม่ซ้ำกับ environment อื่น
- [ ] `ALLOWED_ORIGIN` ตั้งค่าแล้ว และตรงกับ production frontend origin
- [ ] `ADMIN_SETUP_KEY` ตั้งค่าแล้วเฉพาะช่วงสร้าง First Admin
- [ ] `ENVIRONMENT` ตั้งค่าเป็น production

ข้อควรระวัง:

- [ ] ไม่เก็บค่า property เหล่านี้ใน repository
- [ ] ไม่ส่งค่าเหล่านี้ผ่าน chat, issue, docs หรือ screenshot ที่เผยแพร่ได้
- [ ] จำกัดคนที่แก้ Script Properties ได้เฉพาะผู้ดูแลที่จำเป็น

## 2. Production Spreadsheet

- [ ] Spreadsheet อยู่ใน Google Account กลางหรือ Shared Drive ที่โครงการควบคุม
- [ ] ตั้งสิทธิ์ไม่เป็น public
- [ ] จำกัดสิทธิ์ edit เฉพาะผู้ดูแลระบบและ Apps Script owner
- [ ] มี sheet ครบตาม `docs/DATA_SCHEMA.md`
- [ ] Header row ตรงกับ schema
- [ ] มี sheet `settings`
- [ ] มีค่า `schema_version`
- [ ] มีข้อมูล seed สำหรับหมวดหมู่และ setting ที่จำเป็น
- [ ] ไม่ใช้ production Spreadsheet เป็นพื้นที่ทดสอบทั่วไป

## 3. Production Drive Root

- [ ] Drive root folder อยู่ใน Google Account กลางหรือ Shared Drive ที่โครงการควบคุม
- [ ] ตั้งสิทธิ์ไม่เป็น public
- [ ] จำกัดสิทธิ์ edit เฉพาะผู้ดูแลระบบและ Apps Script owner
- [ ] มี folder ย่อยครบ:
  - [ ] `reports`
  - [ ] `announcements`
  - [ ] `exports`
  - [ ] `backups`
  - [ ] `temp`
- [ ] ไม่มีไฟล์ทดสอบหรือไฟล์ส่วนตัวปะปนใน production root

## 4. Allowed Origin

- [ ] `ALLOWED_ORIGIN` ตรงกับ production frontend origin
- [ ] ไม่ใส่ origin ของ localhost ใน production
- [ ] ทดสอบว่า frontend เรียก API ได้จาก production domain เท่านั้น
- [ ] ตรวจว่า response ไม่เปิด CORS กว้างเกินจำเป็น

## 5. Environment

- [ ] `ENVIRONMENT` เป็น production
- [ ] `public.config` ต้องส่ง `environment` เป็น production
- [ ] production ไม่ชี้ไปยัง Spreadsheet หรือ Drive Folder ของ development
- [ ] development/test ไม่ชี้กลับมายัง production resource

## 6. setupSystem()

รันจาก Apps Script Editor หลังตั้ง Script Properties สำคัญแล้ว

- [ ] เลือก function `setupSystem`
- [ ] กด Run ด้วยบัญชี production owner
- [ ] อนุญาต scope เฉพาะที่จำเป็น
- [ ] ตรวจผลลัพธ์ว่า `ok` เป็น `true`
- [ ] ตรวจว่า `createdSheets`, `updatedSheets`, `createdFolders` สมเหตุสมผล
- [ ] ตรวจว่าไม่มี error เรื่อง permission, missing Spreadsheet หรือ missing Drive folder

หลังรัน:

- [ ] เปิด production Spreadsheet แล้วตรวจ sheet/header จริง
- [ ] เปิด production Drive root แล้วตรวจ folder จริง
- [ ] ห้ามคัดลอกผลลัพธ์ที่มี ID จริงลง repository

## 7. validateSetup()

รันจาก Apps Script Editor

- [ ] เลือก function `validateSetup`
- [ ] กด Run
- [ ] ตรวจว่า `ok` เป็น `true`
- [ ] `missingProperties` ต้องว่าง
- [ ] `missingSheets` ต้องว่าง
- [ ] `headerMismatches` ต้องว่าง
- [ ] `missingFolders` ต้องว่าง
- [ ] `missingSettings` ต้องว่าง
- [ ] `missingCategories` ต้องว่าง

หากไม่ผ่าน:

- [ ] หยุด deploy
- [ ] แก้เฉพาะ resource หรือ property ที่ผิด
- [ ] รัน `validateSetup()` ซ้ำจนผ่าน

## 8. Schema Version

- [ ] เปิด sheet `settings`
- [ ] ตรวจ key `schema_version`
- [ ] ค่า schema version ตรงกับ `docs/DATA_SCHEMA.md`
- [ ] ค่า `schema_version` ไม่ถูกตั้งเป็น public
- [ ] หากมี migration ให้ backup ก่อนและทดสอบใน environment สำเนาก่อน

## 9. Seed Validation

รันจาก Apps Script Editor

- [ ] `validateSeedData()`
- [ ] `validatePhysicalSeedPlacement()`

เกณฑ์ผ่าน:

- [ ] ผลลัพธ์ `ok` เป็น `true`
- [ ] categories seed ครบ
- [ ] settings seed ครบ
- [ ] ไม่มี seed row อยู่ผิดตำแหน่ง

## 10. First Admin

ทำหลัง `setupSystem()` และ `validateSetup()` ผ่านแล้ว

- [ ] ตั้ง `ADMIN_SETUP_KEY` ใน Script Properties แล้ว
- [ ] เตรียมข้อมูล First Admin ผ่านช่องทางภายในที่ปลอดภัย
- [ ] รัน `setupFirstAdmin(input)` ใน Apps Script Editor
- [ ] ตรวจผลลัพธ์ว่า `ok` เป็น `true`
- [ ] First Admin มี role `super_admin`
- [ ] First Admin ต้องเปลี่ยนรหัสผ่านหลัง login ครั้งแรก
- [ ] ตรวจว่า activity log บันทึกการสร้าง First Admin
- [ ] หลังสร้างสำเร็จ ให้ rotate หรือเอา `ADMIN_SETUP_KEY` ออกจาก production ตามนโยบายทีม
- [ ] ห้ามบันทึกรหัสผ่านชั่วคราวหรือ setup key ลง repository

## 11. health.check

ทดสอบหลัง Deploy Apps Script web app เท่านั้น แต่ก่อนเปิดใช้งาน production เต็มรูปแบบ

- [ ] เรียก action `health.check`
- [ ] ตรวจว่า response `ok` เป็น `true`
- [ ] ตรวจว่า `data.status` เป็น `ok`
- [ ] ตรวจว่า response ไม่ส่ง Secret, Spreadsheet ID หรือ Folder ID
- [ ] ตรวจว่า request มี `requestId`

ใน Apps Script Editor สามารถรัน:

- [ ] `testGetHealthCheckRouter()`

## 12. Public APIs

ทดสอบ public actions:

- [ ] `public.config`
- [ ] `category.list`
- [ ] `announcement.list`
- [ ] `report.create`
- [ ] `report.track`
- [ ] `report.addInfo`

เกณฑ์ผ่าน:

- [ ] public response ไม่เผย Secret หรือ ID ภายใน
- [ ] `category.list` ไม่ส่ง default assignee
- [ ] `announcement.list` ไม่ส่ง field ภายใน
- [ ] `report.create` ต้อง validate consent, requestId, attachment และ rate limit
- [ ] `report.track` ต้องคืน generic not found เมื่อไม่พบเรื่อง
- [ ] `report.addInfo` ต้องไม่รับข้อมูลเพิ่มเมื่อเรื่องปิดแล้ว

ใน Apps Script Editor สามารถรัน:

- [ ] `testPublicReadApiRouter()`
- [ ] `testPublicConfigApi()`
- [ ] `testCategoryListApi()`
- [ ] `testAnnouncementListApi()`

## 13. Admin APIs

ทดสอบ admin actions ผ่าน session ที่ถูกต้อง:

- [ ] `auth.login`
- [ ] `auth.me`
- [ ] `auth.logout`
- [ ] `auth.changePassword`
- [ ] `dashboard.summary`
- [ ] `admin.report.list`
- [ ] `admin.report.detail`
- [ ] `admin.report.assign`
- [ ] `admin.report.updateStatus`
- [ ] `admin.report.updatePriority`
- [ ] `admin.report.addUpdate`
- [ ] `admin.user.list`
- [ ] `admin.user.save`
- [ ] `admin.user.resetPassword`
- [ ] `admin.user.revokeSessions`
- [ ] `admin.category.list`
- [ ] `admin.category.save`
- [ ] `admin.announcement.list`
- [ ] `admin.announcement.save`
- [ ] `admin.settings.get`
- [ ] `admin.settings.update`
- [ ] `admin.activity.list`
- [ ] `admin.export.csv`

เกณฑ์ผ่าน:

- [ ] ทุก admin action ต้องมี sessionToken ที่ใช้งานได้
- [ ] ทุก admin action ต้องตรวจ permission ที่ backend
- [ ] viewer เห็นเฉพาะข้อมูลที่ได้รับอนุญาต
- [ ] officer ไม่เห็นหรือแก้เรื่องที่อยู่นอก scope ของตัวเอง
- [ ] export ที่มีข้อมูลส่วนบุคคลต้องใช้ permission และ confirmation
- [ ] audit log ไม่เก็บ password, token, secret หรือข้อความภายในที่ไม่ควรเก็บ

ใน Apps Script Editor สามารถรัน router whitelist tests:

- [ ] `testAuthRouterWhitelist()`
- [ ] `testDashboardSummaryRouterWhitelist()`
- [ ] `testAdminReportListRouterWhitelist()`
- [ ] `testAdminReportDetailRouterWhitelist()`
- [ ] `testAdminReportAssignRouterWhitelist()`
- [ ] `testAdminReportUpdateStatusRouterWhitelist()`
- [ ] `testAdminReportAddUpdateRouterWhitelist()`
- [ ] `testAdminReportUpdatePriorityRouterWhitelist()`
- [ ] `testAdminUserRouterWhitelist()`
- [ ] `testAdminCategoryRouterWhitelist()`
- [ ] `testAdminAnnouncementRouterWhitelist()`
- [ ] `testAdminSettingsRouterWhitelist()`
- [ ] `testAdminActivityRouterWhitelist()`
- [ ] `testAdminExportRouterWhitelist()`

## 14. Test Suite

ก่อน Deploy:

- [ ] รัน `validateSetup()`
- [ ] รัน `validateSeedData()`
- [ ] รัน `validatePhysicalSeedPlacement()`
- [ ] รัน `runKhaophangCoreTestSuite()`

เกณฑ์ผ่าน:

- [ ] `failed` เป็น `0`
- [ ] cleanup ใน test suite สำเร็จ
- [ ] ไม่มี test data ค้างใน production
- [ ] ไม่ใช้ข้อมูลประชาชนจริงใน test case ที่สร้างข้อมูล
- [ ] บันทึกผล test โดยไม่แนบ Secret หรือ ID จริง

## 15. Backup

ต้องทำก่อน deploy production และก่อน migration/schema change

- [ ] Copy production Spreadsheet เป็น backup
- [ ] บันทึกวันที่ environment และ schema version ไว้ใน metadata ภายในที่ปลอดภัย
- [ ] สำรอง Drive folder structure หรือรายการไฟล์สำคัญ
- [ ] สำรอง Apps Script source ตามวิธีของทีม
- [ ] ตรวจว่า backup ไม่ถูกแชร์ public
- [ ] ตรวจว่า backup ไม่ถูก commit ลง repository
- [ ] ทดสอบ restore กับสำเนา ไม่ใช่ production resource จริง
- [ ] ระบุผู้รับผิดชอบ backup และ retention policy

## 16. Final Go / No-Go

ห้าม Deploy ถ้ามีข้อใดข้อหนึ่งยังไม่ผ่าน:

- [ ] Script Properties ไม่ครบ
- [ ] `validateSetup()` ไม่ผ่าน
- [ ] `schema_version` ไม่ถูกต้อง
- [ ] production Spreadsheet หรือ Drive root ไม่แน่ชัด
- [ ] `ALLOWED_ORIGIN` ไม่ใช่ production origin
- [ ] First Admin ยังไม่พร้อม
- [ ] test suite ไม่ผ่าน
- [ ] backup ยังไม่พร้อม
- [ ] ยังมี Secret, ID หรือ password อยู่ใน repository
- [ ] ยังไม่ได้รับอนุมัติ Deploy

พร้อม Deploy เมื่อ:

- [ ] Checklist ทุกหัวข้อสำคัญผ่าน
- [ ] ผู้ดูแลระบบยืนยัน resource production แล้ว
- [ ] ผู้รับผิดชอบอนุมัติ Deploy แล้ว
- [ ] มีแผน rollback และ restore ที่ทดสอบแล้ว
