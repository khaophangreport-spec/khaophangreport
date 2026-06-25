# Khaophang Report — DATA_SCHEMA

> เอกสารกำหนดโครงสร้างข้อมูลของระบบ Khaophang Report  
> ใช้เป็นแหล่งอ้างอิงหลักสำหรับ Google Sheets, Google Drive, Google Apps Script, Validation, API และการย้ายฐานข้อมูลในอนาคต

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | DATA_SCHEMA.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชันเอกสาร | 1.0.0 |
| สถานะ | Approved for Development |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| เอกสารอ้างอิง | APP_SPEC.md, UI_FLOW.md |
| Database รุ่นแรก | Google Sheets |
| File Storage | Google Drive |
| Backend | Google Apps Script |
| Production Domain | https://khaophangreport.pages.dev |
| Repository | https://github.com/khaophangreport-spec/khaophangreport.git |

---

## 2. วัตถุประสงค์

เอกสารนี้กำหนด:

- ชื่อ Sheet
- ชื่อคอลัมน์
- ชนิดข้อมูล
- Required/Optional
- ค่าเริ่มต้น
- Validation
- ความสัมพันธ์ระหว่างข้อมูล
- Index สำหรับค้นหา
- กฎ Soft Delete
- กฎ Versioning
- กฎ Timestamp
- โครงสร้าง Google Drive
- แนวทาง Setup และ Migration
- แนวทาง Backup และ Restore

ห้ามเปลี่ยนชื่อ Sheet หรือชื่อคอลัมน์โดยไม่อัปเดตเอกสารนี้ โค้ด Backend, API Specification และ Test ที่เกี่ยวข้อง

---

## 3. หลักการออกแบบข้อมูล

1. ใช้ Google Sheets เป็นฐานข้อมูลของ MVP
2. แยกข้อมูลตามหน้าที่ ไม่รวมทุกอย่างไว้ใน Sheet เดียว
3. ใช้ ID ภายในแบบ UUID
4. ใช้ Tracking Code สำหรับประชาชน แต่ไม่ใช้เป็น Primary Key
5. ใช้ ISO 8601 สำหรับวันเวลาในฐานข้อมูล
6. ใช้ชื่อคอลัมน์แบบ `snake_case`
7. เก็บ Boolean เป็น `TRUE` / `FALSE`
8. หลีกเลี่ยงเซลล์ Merge
9. Header อยู่แถว 1 เสมอ
10. Freeze Header ทุก Sheet
11. เปิด Filter ให้ Sheet ที่เหมาะสม
12. ใช้ Soft Delete แทนการลบแถวจริง
13. ไม่เก็บภาพ Base64 ใน Sheet
14. ไม่เก็บ Password แบบข้อความธรรมดา
15. ไม่เก็บ Raw Session Token
16. ไม่เก็บ Secret ใน Spreadsheet
17. เก็บค่า Secret ใน Apps Script Properties
18. ทุกการแก้ข้อมูลสำคัญต้องมี Activity Log
19. Public API ต้องอ่านเฉพาะข้อมูลที่เปิดเผยได้
20. ออกแบบ Repository Layer เพื่อย้ายฐานข้อมูลในอนาคต

---

## 4. Convention

### 4.1 ชื่อ ID

| Entity | รูปแบบ |
|---|---|
| Report | UUID |
| Report Update | UUID |
| Attachment | UUID |
| Category | UUID หรือรหัสคงที่ เช่น `CAT-001` |
| User | UUID |
| Session | UUID |
| Assignment | UUID |
| Announcement | UUID |
| Activity Log | UUID |

### 4.2 Timestamp

เก็บเป็น ISO 8601 UTC หรือ Timestamp ที่แปลงได้ชัดเจน เช่น:

```text
2026-06-26T15:30:45.123Z
```

Frontend แสดงเป็นเวลาไทย (`Asia/Bangkok`) เท่านั้น

### 4.3 Null และค่าว่าง

- String ที่ไม่มีค่าใช้ `""`
- Timestamp ที่ไม่มีค่าใช้ `""`
- Number ที่ไม่มีค่าใช้ `""` ไม่ใช้ `0` หาก 0 มีความหมาย
- Boolean ต้องเป็น `TRUE` หรือ `FALSE`
- Array/Object เก็บเป็น JSON String เฉพาะกรณีจำเป็น
- หลีกเลี่ยงคำว่า `null`, `undefined`, `N/A` ใน Sheet

### 4.4 Enum

ค่าประเภท Enum ต้องใช้ค่าภาษาอังกฤษคงที่ในระบบ และแปลงเป็นภาษาไทยเฉพาะ UI

---

## 5. Entity Relationship Overview

```text
categories
    1
    │
    └──────< reports >────── users (assigned_to)
                  │
                  ├──────< report_updates
                  │              │
                  │              └──────< attachments
                  │
                  ├──────< attachments
                  │
                  ├──────< assignments
                  │
                  └──────< activity_logs

users
  ├──────< sessions
  ├──────< assignments
  ├──────< report_updates
  ├──────< announcements
  └──────< activity_logs

settings
announcements
dashboard_cache
rate_limits
schema_migrations
```

---

## 6. รายชื่อ Sheets

### 6.1 Core Sheets

1. `reports`
2. `report_updates`
3. `attachments`
4. `categories`
5. `users`
6. `sessions`
7. `assignments`
8. `announcements`
9. `settings`
10. `activity_logs`

### 6.2 Supporting Sheets

11. `report_additional_info`
12. `rate_limits`
13. `dashboard_cache`
14. `schema_migrations`
15. `system_counters`
16. `export_logs`

### 6.3 Optional Future Sheets

17. `villages`
18. `notifications`
19. `satisfaction_surveys`
20. `duplicate_links`

---

# PART A — CORE DATA SCHEMA

## 7. Sheet: `reports`

เก็บข้อมูลหลักของเรื่องแจ้ง หนึ่งแถวต่อหนึ่งเรื่อง

### 7.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `report_id` | string(UUID) | Yes | generated | Primary Key ภายใน |
| 2 | `tracking_code` | string | Yes | generated | รหัสติดตามสำหรับประชาชน |
| 3 | `request_id` | string | No | `""` | Idempotency Key ป้องกันส่งซ้ำ |
| 4 | `category_id` | string | Yes | - | FK ไป `categories.category_id` |
| 5 | `title` | string | Yes | - | หัวข้อเรื่อง |
| 6 | `description` | string | Yes | - | รายละเอียด |
| 7 | `incident_date` | date/string | Yes | current date | วันที่พบปัญหา |
| 8 | `location_name` | string | No* | `""` | ชื่อสถานที่ |
| 9 | `village_no` | string | No | `""` | หมู่ที่ |
| 10 | `landmark` | string | No* | `""` | จุดสังเกต |
| 11 | `latitude` | number | No | `""` | ละติจูด |
| 12 | `longitude` | number | No | `""` | ลองจิจูด |
| 13 | `map_url` | string(URL) | No | `""` | ลิงก์แผนที่ |
| 14 | `is_anonymous` | boolean | Yes | `FALSE` | แจ้งแบบไม่ระบุตัวตน |
| 15 | `reporter_name` | string | Conditional | `""` | ชื่อผู้แจ้ง |
| 16 | `reporter_phone` | string | Conditional | `""` | เบอร์โทร |
| 17 | `reporter_email` | string | No | `""` | อีเมล |
| 18 | `contact_method` | enum | No | `""` | phone / email / none |
| 19 | `reporter_consent` | boolean | Yes | `FALSE` | ยอมรับการใช้ข้อมูล |
| 20 | `truth_confirmation` | boolean | Yes | `FALSE` | ยืนยันข้อมูลเป็นจริง |
| 21 | `privacy_version` | string | Yes | current | เวอร์ชันนโยบายที่ยอมรับ |
| 22 | `priority_reported` | enum | Yes | `normal` | ความเร่งด่วนที่ประชาชนเลือก |
| 23 | `priority` | enum | Yes | `normal` | ความสำคัญที่ Admin ยืนยัน |
| 24 | `status` | enum | Yes | `new` | สถานะปัจจุบัน |
| 25 | `assigned_to` | string(UUID) | No | `""` | FK ไป `users.user_id` |
| 26 | `target_due_at` | datetime | No | `""` | กำหนดเป้าหมายเสร็จ |
| 27 | `source` | enum | Yes | `web` | web / admin / phone / line / other |
| 28 | `public_result` | string | No | `""` | ผลดำเนินงานที่ประชาชนเห็น |
| 29 | `internal_summary` | string | No | `""` | สรุปภายใน |
| 30 | `resolved_at` | datetime | No | `""` | เวลาดำเนินการเสร็จ |
| 31 | `closed_at` | datetime | No | `""` | เวลาปิดเรื่อง |
| 32 | `rejected_at` | datetime | No | `""` | เวลาปฏิเสธ |
| 33 | `rejection_reason` | string | Conditional | `""` | เหตุผลปฏิเสธ |
| 34 | `duplicate_of_report_id` | string(UUID) | Conditional | `""` | เรื่องต้นฉบับกรณีซ้ำ |
| 35 | `created_at` | datetime | Yes | generated | เวลาสร้าง |
| 36 | `updated_at` | datetime | Yes | generated | เวลาแก้ล่าสุด |
| 37 | `created_by` | string | Yes | `public` | public หรือ user_id |
| 38 | `updated_by` | string | Yes | `public` | public หรือ user_id |
| 39 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 40 | `deleted_at` | datetime | No | `""` | เวลาลบเชิงตรรกะ |
| 41 | `deleted_by` | string | No | `""` | ผู้ Soft Delete |
| 42 | `version` | integer | Yes | `1` | Optimistic Version |
| 43 | `search_text` | string | No | generated | ข้อความรวมเพื่อช่วยค้นหา |
| 44 | `year_month` | string | Yes | generated | เช่น `2026-06` สำหรับสรุป |
| 45 | `village_key` | string | No | generated | ค่ามาตรฐานสำหรับสรุปพื้นที่ |

\* ต้องมีอย่างน้อย `location_name` หรือ `landmark`

### 7.2 Validation Rules

- `report_id` ต้องไม่ซ้ำ
- `tracking_code` ต้องไม่ซ้ำ
- `request_id` หากมี ต้องไม่ซ้ำในช่วงเวลาที่กำหนด
- `category_id` ต้องมีอยู่และ Active
- `title` แนะนำ 5–150 ตัวอักษร
- `description` แนะนำ 10–3,000 ตัวอักษร
- `incident_date` ต้องไม่เป็นอนาคต
- ต้องมี `location_name` หรือ `landmark`
- Latitude: -90 ถึง 90
- Longitude: -180 ถึง 180
- หากมี Latitude ต้องมี Longitude
- `is_anonymous=TRUE` ต้องไม่เก็บข้อมูล PII ที่ไม่จำเป็น
- `is_anonymous=FALSE` ต้องมีชื่อและเบอร์โทรตามนโยบาย
- `reporter_consent=TRUE`
- `truth_confirmation=TRUE`
- `priority_reported` และ `priority`: low / normal / high / critical
- `status` ต้องอยู่ใน Enum
- `assigned_to` ต้องเป็น Active User เมื่อกำหนด
- `rejected` ต้องมี `rejection_reason`
- `duplicate` ต้องมี `duplicate_of_report_id` เมื่อระบบกำหนดให้เชื่อม
- `resolved` ต้องมี `public_result` หรือ Update ผลงาน
- `closed_at` ต้องไม่ก่อน `resolved_at`

### 7.3 Index Recommendation

Google Sheets ไม่มี Index จริง จึงใช้ Cache/Index Sheet/Map ในหน่วยความจำ

ควรสร้าง lookup สำหรับ:

- `report_id`
- `tracking_code`
- `request_id`
- `status`
- `category_id`
- `assigned_to`
- `created_at`
- `updated_at`
- `year_month`
- `village_key`
- `is_deleted`

---

## 8. Sheet: `report_updates`

เก็บ Timeline และทุกการเปลี่ยนสถานะ

### 8.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `update_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `report_id` | string(UUID) | Yes | - | FK ไป reports |
| 3 | `update_type` | enum | Yes | `note` | status / note / result / request_info / info_received / assignment / system |
| 4 | `old_status` | enum | No | `""` | สถานะเดิม |
| 5 | `new_status` | enum | No | `""` | สถานะใหม่ |
| 6 | `public_message` | string | No | `""` | ข้อความที่ประชาชนเห็น |
| 7 | `internal_note` | string | No | `""` | หมายเหตุภายใน |
| 8 | `is_public` | boolean | Yes | `FALSE` | แสดงใน Public Timeline |
| 9 | `updated_by` | string | Yes | - | user_id / public / system |
| 10 | `updated_by_name_snapshot` | string | No | `""` | ชื่อ ณ เวลาบันทึก |
| 11 | `updated_by_role_snapshot` | string | No | `""` | Role ณ เวลาบันทึก |
| 12 | `created_at` | datetime | Yes | generated | วันเวลา |
| 13 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 14 | `version` | integer | Yes | `1` | Version |

### 8.2 Rules

- ห้ามแก้ไขหรือลบ Timeline เดิมตามปกติ
- การแก้ไขย้อนหลังต้องใช้ Super Admin และสร้าง Activity Log
- `is_public=TRUE` ต้องมี `public_message` หรือ Public Attachment
- `internal_note` ห้ามส่งออกผ่าน Public API
- การเปลี่ยน Status ต้องมี `old_status` และ `new_status`
- `updated_by_name_snapshot` ช่วยเก็บประวัติแม้ชื่อผู้ใช้เปลี่ยน
- Timeline เรียงตาม `created_at` จากเก่าไปใหม่ใน Public View

---

## 9. Sheet: `attachments`

เก็บ Metadata ของไฟล์ใน Google Drive

### 9.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `attachment_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `report_id` | string(UUID) | Yes | - | FK ไป reports |
| 3 | `update_id` | string(UUID) | No | `""` | FK ไป report_updates |
| 4 | `additional_info_id` | string(UUID) | No | `""` | FK ไป report_additional_info |
| 5 | `file_id` | string | Yes | - | Google Drive File ID |
| 6 | `file_name` | string | Yes | generated | ชื่อไฟล์ภายใน |
| 7 | `original_file_name` | string | No | `""` | ชื่อเดิมเพื่ออ้างอิงภายใน |
| 8 | `mime_type` | enum | Yes | - | image/jpeg, image/png, image/webp |
| 9 | `file_size` | integer | Yes | - | Bytes |
| 10 | `width` | integer | No | `""` | ความกว้าง |
| 11 | `height` | integer | No | `""` | ความสูง |
| 12 | `file_role` | enum | Yes | `report` | report / progress / resolved / additional / announcement |
| 13 | `is_public` | boolean | Yes | `FALSE` | เปิดเผยต่อประชาชน |
| 14 | `uploaded_by` | string | Yes | - | public / user_id |
| 15 | `created_at` | datetime | Yes | generated | วันเวลา |
| 16 | `drive_folder_id` | string | Yes | - | Folder ID |
| 17 | `checksum` | string | No | `""` | Hash ถ้าจัดทำ |
| 18 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 19 | `deleted_at` | datetime | No | `""` | เวลาลบ |
| 20 | `version` | integer | Yes | `1` | Version |

### 9.2 Rules

- ไฟล์ต้องอยู่ในโฟลเดอร์ของ Report
- ไม่ใช้ชื่อผู้แจ้งเป็นชื่อไฟล์
- ขนาดหลังบีบอัดไม่เกิน 1 MB ต่อภาพสำหรับ Public Create
- สูงสุด 3 ภาพต่อการแจ้งรุ่นแรก
- MIME Type ต้องผ่าน Backend Validation
- ห้ามรับ Script/Executable
- Public API ส่งเฉพาะไฟล์ `is_public=TRUE`
- Google Drive Root Folder ห้ามเป็น Public
- การลบ Metadata ต้องประสานกับการย้าย/ลบไฟล์จริงตามนโยบาย

---

## 10. Sheet: `categories`

เก็บหมวดปัญหา

### 10.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `category_id` | string | Yes | generated | Primary Key |
| 2 | `code` | string | Yes | - | เช่น ROAD, LIGHT |
| 3 | `name` | string | Yes | - | ชื่อภาษาไทย |
| 4 | `description` | string | No | `""` | คำอธิบาย |
| 5 | `icon` | string | Yes | `circle` | Icon Key |
| 6 | `color` | string(hex) | Yes | `#287444` | สีประจำหมวด |
| 7 | `default_assignee` | string(UUID) | No | `""` | ผู้รับผิดชอบเริ่มต้น |
| 8 | `target_days` | integer | Yes | `7` | จำนวนวันเป้าหมาย |
| 9 | `sort_order` | integer | Yes | `0` | ลำดับ |
| 10 | `is_active` | boolean | Yes | `TRUE` | เปิดใช้งาน |
| 11 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 12 | `updated_at` | datetime | Yes | generated | วันแก้ |
| 13 | `created_by` | string | Yes | - | user_id / setup |
| 14 | `updated_by` | string | Yes | - | user_id / setup |
| 15 | `version` | integer | Yes | `1` | Version |

### 10.2 Initial Categories

| code | name | target_days |
|---|---|---:|
| `ROAD` | ถนน ทางเท้า และสะพาน | 14 |
| `LIGHT` | ไฟฟ้าและไฟส่องสว่าง | 7 |
| `WATER` | น้ำประปาและแหล่งน้ำ | 7 |
| `WASTE` | ขยะและความสะอาด | 5 |
| `DRAIN` | น้ำท่วมและทางระบายน้ำ | 7 |
| `ENV` | สิ่งแวดล้อมและมลพิษ | 14 |
| `SAFETY` | ความปลอดภัยและเหตุเดือดร้อน | 3 |
| `ANIMAL` | สัตว์จรจัดและสัตว์รบกวน | 7 |
| `PUBLIC` | สาธารณสถานและทรัพย์สินส่วนรวม | 14 |
| `OTHER` | ข้อเสนอแนะและเรื่องอื่น ๆ | 14 |

ค่า Target Days เป็นค่าเริ่มต้น ต้องยืนยันกับคณะทำงานก่อน Production

### 10.3 Rules

- `code` ต้องไม่ซ้ำ
- `name` ต้องไม่ซ้ำในรายการ Active
- ห้าม Hard Delete หมวดที่มี Report
- ใช้ `is_active=FALSE`
- `target_days` ต้องมากกว่าหรือเท่ากับ 0
- สีต้องเป็น Hex ที่ถูกต้อง
- Default Assignee ต้องเป็น Active User

---

## 11. Sheet: `users`

เก็บบัญชีเจ้าหน้าที่และผู้ดูแล

### 11.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `user_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `username` | string | Yes | - | ชื่อเข้าใช้ |
| 3 | `password_hash` | string | Yes | - | Hash |
| 4 | `password_salt` | string | Yes | - | Salt |
| 5 | `password_version` | integer | Yes | `1` | เวอร์ชันวิธี Hash |
| 6 | `display_name` | string | Yes | - | ชื่อแสดง |
| 7 | `email` | string | No | `""` | อีเมล |
| 8 | `phone` | string | No | `""` | เบอร์โทร |
| 9 | `role` | enum | Yes | `officer` | super_admin / admin / officer / viewer |
| 10 | `status` | enum | Yes | `active` | active / inactive |
| 11 | `failed_login_count` | integer | Yes | `0` | จำนวน Login ผิด |
| 12 | `locked_until` | datetime | No | `""` | เวลาปลดล็อก |
| 13 | `last_login_at` | datetime | No | `""` | Login ล่าสุด |
| 14 | `last_password_changed_at` | datetime | Yes | generated | เปลี่ยนรหัสล่าสุด |
| 15 | `must_change_password` | boolean | Yes | `TRUE` | บังคับเปลี่ยนรหัส |
| 16 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 17 | `updated_at` | datetime | Yes | generated | วันแก้ |
| 18 | `created_by` | string | Yes | setup/user_id | ผู้สร้าง |
| 19 | `updated_by` | string | Yes | setup/user_id | ผู้แก้ |
| 20 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 21 | `version` | integer | Yes | `1` | Version |

### 11.2 Rules

- `username` ไม่ซ้ำแบบ case-insensitive
- ห้ามเก็บ Plain Password
- Password ขั้นต่ำ 8 ตัวอักษร
- Role ต้องอยู่ใน Enum
- Inactive User ห้าม Login
- ห้ามปิด Super Admin คนสุดท้าย
- เปลี่ยน Password ต้อง Revoke Session ตามนโยบาย
- `password_hash` และ `password_salt` ห้ามส่งกลับ Frontend
- Viewer ไม่มีสิทธิ์แก้ข้อมูล

---

## 12. Sheet: `sessions`

เก็บ Session ฝั่ง Admin

### 12.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `session_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `user_id` | string(UUID) | Yes | - | FK users |
| 3 | `token_hash` | string | Yes | - | Hash ของ Token |
| 4 | `expires_at` | datetime | Yes | - | หมดอายุ |
| 5 | `revoked_at` | datetime | No | `""` | ยกเลิก |
| 6 | `revoke_reason` | string | No | `""` | เหตุผล |
| 7 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 8 | `last_used_at` | datetime | Yes | generated | ใช้ล่าสุด |
| 9 | `user_agent_hint` | string | No | `""` | ข้อมูลประกอบแบบจำกัด |
| 10 | `device_key_hash` | string | No | `""` | Hash Device Key |
| 11 | `is_active` | boolean | Yes | `TRUE` | สถานะ |
| 12 | `version` | integer | Yes | `1` | Version |

### 12.2 Rules

- ห้ามเก็บ Raw Token
- Token Hash ต้องไม่ซ้ำ
- Session ใช้ได้เมื่อ:
  - `is_active=TRUE`
  - `revoked_at=""`
  - `expires_at > now`
  - User ยัง Active
- Logout ต้อง Revoke
- Password Change ควร Revoke Session อื่น
- Cleanup Session หมดอายุตามรอบเวลา

---

## 13. Sheet: `assignments`

เก็บประวัติการมอบหมาย

### 13.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `assignment_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `report_id` | string(UUID) | Yes | - | FK reports |
| 3 | `assigned_to` | string(UUID) | Yes | - | FK users |
| 4 | `assigned_by` | string(UUID) | Yes | - | FK users |
| 5 | `note` | string | No | `""` | หมายเหตุ |
| 6 | `assigned_at` | datetime | Yes | generated | เวลามอบหมาย |
| 7 | `target_due_at` | datetime | No | `""` | กำหนดเสร็จ |
| 8 | `completed_at` | datetime | No | `""` | เสร็จ |
| 9 | `unassigned_at` | datetime | No | `""` | ยุติการมอบหมาย |
| 10 | `assignment_status` | enum | Yes | `active` | active / completed / reassigned / cancelled |
| 11 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 12 | `version` | integer | Yes | `1` | Version |

### 13.2 Rules

- หนึ่ง Report มี Active Assignment ได้หนึ่งรายการใน MVP
- Reassign ต้องปิด Assignment เดิมก่อน
- Assigned User ต้อง Active
- `reports.assigned_to` ต้องตรงกับ Active Assignment
- เมื่อ Report Closed ให้ Assignment เป็น completed
- ทุกการมอบหมายสร้าง Timeline และ Activity Log

---

## 14. Sheet: `announcements`

เก็บประกาศหน้า Public

### 14.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `announcement_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `title` | string | Yes | - | หัวข้อ |
| 3 | `content` | string | Yes | - | เนื้อหา |
| 4 | `type` | enum | Yes | `info` | info / warning / emergency / maintenance |
| 5 | `start_at` | datetime | Yes | generated | เริ่มแสดง |
| 6 | `end_at` | datetime | No | `""` | สิ้นสุด |
| 7 | `is_active` | boolean | Yes | `TRUE` | เปิดใช้งาน |
| 8 | `sort_order` | integer | Yes | `0` | ลำดับ |
| 9 | `created_by` | string(UUID) | Yes | - | ผู้สร้าง |
| 10 | `updated_by` | string(UUID) | Yes | - | ผู้แก้ |
| 11 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 12 | `updated_at` | datetime | Yes | generated | วันแก้ |
| 13 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 14 | `version` | integer | Yes | `1` | Version |

### 14.2 Rules

- `end_at` ต้องไม่ก่อน `start_at`
- Public แสดงเมื่อ Active และอยู่ในช่วงเวลา
- Content ต้อง Sanitize/Escape
- `emergency` ต้องใช้เฉพาะกรณีเหมาะสม
- Maintenance Announcement ต้องสอดคล้องกับ Setting

---

## 15. Sheet: `settings`

เก็บค่าตั้งค่าที่ไม่ใช่ Secret

### 15.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `key` | string | Yes | - | Primary Key |
| 2 | `value` | string | Yes | - | ค่า |
| 3 | `type` | enum | Yes | `string` | string / number / boolean / json |
| 4 | `description` | string | No | `""` | คำอธิบาย |
| 5 | `is_public` | boolean | Yes | `FALSE` | Frontend Public อ่านได้ |
| 6 | `group_name` | string | Yes | `general` | กลุ่มค่า |
| 7 | `updated_at` | datetime | Yes | generated | วันแก้ |
| 8 | `updated_by` | string | Yes | setup/user_id | ผู้แก้ |
| 9 | `version` | integer | Yes | `1` | Version |

### 15.2 Initial Public Settings

| key | type | example |
|---|---|---|
| `app_name` | string | Khaophang Report |
| `app_name_th` | string | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| `contact_email` | string | khaophangreport@gmail.com |
| `contact_phone` | string | กำหนดภายหลัง |
| `office_hours` | string | กำหนดภายหลัง |
| `max_images` | number | 3 |
| `max_image_size_mb` | number | 1 |
| `max_image_dimension` | number | 1600 |
| `default_page_size` | number | 20 |
| `privacy_version` | string | 1.0 |
| `maintenance_mode` | boolean | false |

### 15.3 Secret Settings

ห้ามเก็บใน Sheet:

- `APP_SECRET`
- `SESSION_SECRET`
- `ADMIN_SETUP_KEY`
- OAuth Credentials
- Private Keys
- Raw API Keys

ให้เก็บใน Apps Script Properties

---

## 16. Sheet: `activity_logs`

เก็บ Audit Trail

### 16.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `log_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `user_id` | string | Yes | system/public/user_id | ผู้กระทำ |
| 3 | `user_name_snapshot` | string | No | `""` | ชื่อ ณ เวลานั้น |
| 4 | `role_snapshot` | string | No | `""` | Role ณ เวลานั้น |
| 5 | `action` | string | Yes | - | ชื่อ Action |
| 6 | `entity_type` | string | Yes | - | report/user/category/etc. |
| 7 | `entity_id` | string | No | `""` | ID ที่เกี่ยวข้อง |
| 8 | `detail` | string(JSON) | No | `""` | รายละเอียดที่ปลอดภัย |
| 9 | `request_id` | string | No | `""` | Request Correlation |
| 10 | `ip_hint` | string | No | `""` | ข้อมูลเท่าที่เหมาะสม |
| 11 | `user_agent_hint` | string | No | `""` | Browser Hint |
| 12 | `created_at` | datetime | Yes | generated | วันเวลา |
| 13 | `severity` | enum | Yes | `info` | info / warning / critical |
| 14 | `success` | boolean | Yes | `TRUE` | สำเร็จหรือไม่ |

### 16.2 Actions ที่ต้องบันทึก

- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `auth.session.revoked`
- `report.create`
- `report.status_changed`
- `report.assigned`
- `report.updated`
- `report.resolved`
- `report.closed`
- `report.rejected`
- `report.duplicate`
- `user.created`
- `user.updated`
- `user.deactivated`
- `category.created`
- `category.updated`
- `announcement.created`
- `announcement.updated`
- `settings.updated`
- `export.created`
- `data.soft_deleted`

### 16.3 Rules

ห้าม Log:

- Password
- Raw Token
- Salt
- Secret
- Base64 Image
- PII เต็มรูปแบบโดยไม่จำเป็น

---

# PART B — SUPPORTING DATA SCHEMA

## 17. Sheet: `report_additional_info`

เก็บข้อมูลเพิ่มเติมที่ประชาชนส่งภายหลัง

### 17.1 Columns

| ลำดับ | Column | Type | Required | Default | รายละเอียด |
|---:|---|---|---:|---|---|
| 1 | `additional_info_id` | string(UUID) | Yes | generated | Primary Key |
| 2 | `report_id` | string(UUID) | Yes | - | FK reports |
| 3 | `message` | string | Yes | - | ข้อความเพิ่มเติม |
| 4 | `contact_name` | string | No | `""` | ชื่อถ้าผู้ใช้ให้ |
| 5 | `contact_phone` | string | No | `""` | เบอร์ถ้าผู้ใช้ให้ |
| 6 | `is_public` | boolean | Yes | `FALSE` | แสดง Public Timeline หรือไม่ |
| 7 | `review_status` | enum | Yes | `pending` | pending / reviewed / hidden |
| 8 | `reviewed_by` | string(UUID) | No | `""` | ผู้ตรวจ |
| 9 | `reviewed_at` | datetime | No | `""` | เวลาตรวจ |
| 10 | `created_at` | datetime | Yes | generated | วันสร้าง |
| 11 | `request_id` | string | No | `""` | ป้องกันส่งซ้ำ |
| 12 | `is_deleted` | boolean | Yes | `FALSE` | Soft Delete |
| 13 | `version` | integer | Yes | `1` | Version |

### 17.2 Rules

- Report ต้องมีอยู่
- Report Closed อาจไม่อนุญาตตาม Setting
- ข้อความต้องผ่าน Validation/Sanitize
- ค่าเริ่มต้นไม่แสดง Public จนผ่านกติกา
- สร้าง Timeline แบบ `info_received`
- แจ้ง Admin ว่ามีข้อมูลใหม่ใน Dashboard/รายการ

---

## 18. Sheet: `rate_limits`

เก็บข้อมูล Rate Limit แบบเบื้องต้น

### 18.1 Columns

| Column | Type | Required | รายละเอียด |
|---|---|---:|---|
| `rate_key` | string | Yes | Hash จาก Action + Device/Session |
| `action` | string | Yes | report.create / track / login |
| `window_start` | datetime | Yes | เริ่มช่วง |
| `count` | integer | Yes | จำนวน |
| `blocked_until` | datetime | No | บล็อกถึง |
| `updated_at` | datetime | Yes | อัปเดตล่าสุด |
| `expires_at` | datetime | Yes | ลบได้หลังเวลานี้ |

### 18.2 Rules

- เก็บ Key แบบ Hash
- ไม่พึ่ง IP เพียงอย่างเดียว
- ใช้ Cache Service ก่อน Sheet เมื่อเหมาะสม
- Cleanup แถวหมดอายุ
- ห้ามเก็บ Device Identifier แบบ Raw ที่ไม่จำเป็น

---

## 19. Sheet: `dashboard_cache`

เก็บค่าสรุปเพื่อลดการคำนวณซ้ำ

### 19.1 Columns

| Column | Type | Required | รายละเอียด |
|---|---|---:|---|
| `cache_key` | string | Yes | Primary Key |
| `scope` | string | Yes | global / user / date-range |
| `payload_json` | string(JSON) | Yes | ข้อมูลสรุป |
| `generated_at` | datetime | Yes | เวลาสร้าง |
| `expires_at` | datetime | Yes | หมดอายุ |
| `source_version` | string | No | เวอร์ชันข้อมูล |
| `is_valid` | boolean | Yes | ใช้งานได้ |

### 19.2 Rules

- ไม่เป็นแหล่งจริง
- สร้างใหม่ได้เสมอ
- Clear เมื่อแก้ข้อมูลสำคัญ
- ห้ามเก็บ PII เกินจำเป็น
- Payload ต้องมีขนาดเหมาะสม

---

## 20. Sheet: `schema_migrations`

เก็บประวัติการเปลี่ยน Schema

### 20.1 Columns

| Column | Type | Required | รายละเอียด |
|---|---|---:|---|
| `migration_id` | string | Yes | เช่น `20260626_001` |
| `name` | string | Yes | ชื่อ Migration |
| `from_version` | string | Yes | เวอร์ชันเดิม |
| `to_version` | string | Yes | เวอร์ชันใหม่ |
| `applied_at` | datetime | Yes | วันใช้ |
| `applied_by` | string | Yes | ผู้รัน |
| `checksum` | string | No | ตรวจ Script |
| `status` | enum | Yes | success / failed / rolled_back |
| `detail` | string | No | รายละเอียด |

### 20.2 Rules

- Migration ID ไม่ซ้ำ
- ต้อง Backup ก่อน Migration สำคัญ
- ห้ามแก้ Migration ที่ใช้แล้ว
- เพิ่ม Migration ใหม่แทน
- Setup Script ต้องตรวจ Current Version

---

## 21. Sheet: `system_counters`

ใช้กับ Counter ที่จำเป็น โดยไม่ใช้เป็น Primary Key

### 21.1 Columns

| Column | Type | Required | รายละเอียด |
|---|---|---:|---|
| `counter_key` | string | Yes | Primary Key |
| `current_value` | integer | Yes | ค่าปัจจุบัน |
| `updated_at` | datetime | Yes | วันแก้ |
| `version` | integer | Yes | Lock Version |

### 21.2 Rules

- ใช้ Lock Service ทุกครั้ง
- Tracking Code ไม่ควรพึ่ง Counter เพียงอย่างเดียว
- ใช้เฉพาะงานเช่นเลขเอกสารภายในถ้าจำเป็น

---

## 22. Sheet: `export_logs`

เก็บประวัติการส่งออก

### 22.1 Columns

| Column | Type | Required | รายละเอียด |
|---|---|---:|---|
| `export_id` | string(UUID) | Yes | Primary Key |
| `user_id` | string(UUID) | Yes | ผู้ส่งออก |
| `export_type` | string | Yes | reports / timeline / summary |
| `filters_json` | string(JSON) | No | Filter |
| `included_personal_data` | boolean | Yes | รวม PII หรือไม่ |
| `row_count` | integer | Yes | จำนวนแถว |
| `file_id` | string | No | Drive File ID ถ้าเก็บ |
| `created_at` | datetime | Yes | วันสร้าง |
| `expires_at` | datetime | No | วันหมดอายุไฟล์ |
| `status` | enum | Yes | success / failed / deleted |

### 22.2 Rules

- ทุก Export ต้อง Log
- Default ไม่รวม PII
- ไฟล์ Export ต้องมีอายุและลบตามรอบ
- จำกัดสิทธิ์เข้าถึง
- ป้องกัน CSV Formula Injection

---

# PART C — ENUMS AND DOMAIN RULES

## 23. Report Status Enum

```text
new
reviewing
assigned
in_progress
waiting
resolved
closed
rejected
duplicate
```

### 23.1 Allowed Transitions

| From | Allowed To |
|---|---|
| `new` | reviewing, assigned, waiting, rejected, duplicate |
| `reviewing` | assigned, in_progress, waiting, rejected, duplicate |
| `assigned` | in_progress, waiting, resolved |
| `in_progress` | waiting, resolved |
| `waiting` | reviewing, assigned, in_progress, rejected |
| `resolved` | closed, in_progress |
| `closed` | none ตามปกติ |
| `rejected` | reviewing เฉพาะสิทธิ์ที่กำหนด |
| `duplicate` | reviewing เฉพาะสิทธิ์ที่กำหนด |

Backend เป็นแหล่งจริงของ Transition Rules

---

## 24. Priority Enum

```text
low
normal
high
critical
```

### Rules

- `priority_reported` คือค่าที่ประชาชนเลือก
- `priority` คือค่าที่ Admin ยืนยัน
- ทั้งสองค่าแยกกัน
- `critical` ต้องไม่ทำให้ระบบถูกใช้แทน Emergency Service

---

## 25. Role Enum

```text
super_admin
admin
officer
viewer
```

---

## 26. Contact Method Enum

```text
phone
email
none
```

อาจเพิ่ม `line` ภายหลังเมื่อมีระบบที่รองรับจริง

---

## 27. Source Enum

```text
web
admin
phone
line
other
```

---

## 28. Attachment Role Enum

```text
report
progress
resolved
additional
announcement
```

---

# PART D — PUBLIC DATA PROJECTION

## 29. Public Report Projection

Public API `report.track` ห้ามคืนทั้งแถว `reports`

ควรคืนเฉพาะ:

```json
{
  "trackingCode": "KPR-260625-A7F4",
  "category": {
    "id": "CAT-001",
    "name": "ไฟฟ้าและไฟส่องสว่าง",
    "icon": "lightbulb",
    "color": "#287444"
  },
  "title": "ไฟส่องสว่างดับ",
  "incidentDate": "2026-06-25",
  "createdAt": "2026-06-26T10:00:00.000Z",
  "status": "in_progress",
  "publicAssigneeName": "เจ้าหน้าที่ผู้รับผิดชอบ",
  "publicResult": "",
  "timeline": [],
  "attachments": []
}
```

### ห้ามคืน

- `report_id` หากไม่จำเป็น
- `reporter_name`
- `reporter_phone`
- `reporter_email`
- `internal_summary`
- `internal_note`
- `assigned_to`
- `updated_by` แบบ Internal ID
- `request_id`
- `version`
- `deleted_*`
- Session และ Token ทุกชนิด

---

## 30. Admin Data Projection

Admin API คืนข้อมูลตาม Role

### Officer

- เห็นข้อมูลเฉพาะงานตามสิทธิ์
- เห็น PII เท่าที่จำเป็นต่อการประสานงาน
- อาจไม่เห็น Activity Log ทั้งระบบ

### Viewer

- Read-only
- PII ควรถูก Mask
- ไม่มี Password/Session Data

### Admin/Super Admin

- เข้าถึงตามสิทธิ์
- Password Hash, Salt และ Token Hash ยังห้ามส่ง Frontend

---

# PART E — SEARCH, PAGINATION, AND PERFORMANCE

## 31. Search Text

`reports.search_text` สร้างจากค่าที่ผ่าน Normalize เช่น:

```text
tracking_code + title + description + location_name + landmark + village_no
```

### Rules

- Lowercase สำหรับภาษาอังกฤษ
- Trim
- Normalize Space
- ไม่รวม PII หากไม่จำเป็น
- อัปเดตเมื่อข้อมูลต้นทางเปลี่ยน

---

## 32. Pagination

Request:

```json
{
  "page": 1,
  "pageSize": 20,
  "status": "in_progress",
  "categoryId": "",
  "assigneeId": "",
  "priority": "",
  "keyword": "",
  "dateFrom": "",
  "dateTo": ""
}
```

Rules:

- Default 20
- Maximum 100
- Filter ก่อน Slice
- Return `total`, `page`, `pageSize`, `totalPages`
- หลีกเลี่ยงโหลดทุกแถวสู่ Frontend
- Repository อาจโหลดข้อมูลเป็น Batch ฝั่ง Backend ตามข้อจำกัด Sheets

---

## 33. Dashboard Aggregation

สรุปอย่างน้อย:

- Count by Status
- Count by Priority
- Count by Category
- Count by Year-Month
- Count by Village
- Average Resolution Time
- SLA Compliance
- Overdue Count

### Suggested Derived Fields

- `year_month`
- `village_key`
- `target_due_at`
- `resolved_at`
- `closed_at`

---

# PART F — GOOGLE DRIVE SCHEMA

## 34. Root Structure

```text
Khaophang_Report_Files/
├── reports/
│   ├── 2026/
│   │   ├── REPORT_UUID_1/
│   │   │   ├── report/
│   │   │   ├── progress/
│   │   │   ├── resolved/
│   │   │   └── additional/
│   │   └── REPORT_UUID_2/
│   └── 2027/
├── announcements/
├── exports/
├── backups/
└── temp/
```

---

## 35. File Naming

รูปแบบแนะนำ:

```text
{role}_{timestamp}_{random}.{ext}
```

ตัวอย่าง:

```text
report_20260626T103000Z_a7f4.webp
resolved_20260628T091500Z_b8c2.jpg
```

### Rules

- ไม่ใช้ชื่อผู้แจ้ง
- ไม่ใช้เบอร์โทร
- ไม่ใช้ Tracking Code อย่างเดียว
- Sanitize Extension
- MIME Type ต้องตรงกับไฟล์
- เก็บ Original Name เฉพาะ Metadata ภายในเมื่อจำเป็น

---

## 36. Drive Permissions

- Root Folder ไม่เป็น Public
- File Public ต้องให้บริการผ่านแนวทางที่ควบคุมได้
- ห้ามเปิด Folder ทั้งโฟลเดอร์เป็น “Anyone with link”
- Export จำกัดสิทธิ์และอายุ
- Backup จำกัด Super Admin/เจ้าของระบบ
- Temp Cleanup ตามรอบ

---

# PART G — GOOGLE SHEETS SETUP

## 37. Header Setup

`setupSystem()` ต้อง:

1. สร้าง Sheet ถ้ายังไม่มี
2. ตรวจชื่อ Sheet
3. สร้าง Header ตามลำดับเอกสารนี้
4. Freeze แถว 1
5. Bold Header
6. ตั้งสี Header
7. เปิด Filter
8. ตั้ง Column Width
9. ตั้ง Date Format
10. ตั้ง Number Format
11. ตั้ง Data Validation
12. ป้องกัน Header Row ตามความเหมาะสม
13. Seed Categories
14. Seed Settings
15. บันทึก Schema Version

---

## 38. Data Validation ใน Google Sheets

### reports

- `is_anonymous`: Checkbox
- `reporter_consent`: Checkbox
- `truth_confirmation`: Checkbox
- `priority_reported`: Dropdown
- `priority`: Dropdown
- `status`: Dropdown
- `source`: Dropdown
- `is_deleted`: Checkbox

### users

- `role`: Dropdown
- `status`: Dropdown
- `must_change_password`: Checkbox
- `is_deleted`: Checkbox

### categories

- `is_active`: Checkbox
- `target_days`: Number >= 0

### attachments

- `is_public`: Checkbox
- `is_deleted`: Checkbox
- `file_role`: Dropdown

---

## 39. Sheet Protection

แนะนำ:

- Header Row ป้องกันการแก้โดยไม่ตั้งใจ
- `password_hash`, `password_salt`, `token_hash` จำกัดสิทธิ์
- Settings Secret ไม่ควรมีใน Sheet ตั้งแต่แรก
- ให้บัญชีกลางโครงการเป็น Owner
- เจ้าหน้าที่ทั่วไปไม่ควรเปิด Spreadsheet โดยตรง
- การแก้ข้อมูลควรผ่าน App เป็นหลัก

---

# PART H — CONCURRENCY AND DATA INTEGRITY

## 40. Locking

ใช้ Lock Service เมื่อ:

- สร้าง Tracking Code
- ตรวจ Request ID ซ้ำ
- เพิ่ม Report
- เปลี่ยน Status
- Reassign
- เพิ่ม User
- แก้ Counter
- Run Migration
- Generate Export สำคัญ

---

## 41. Optimistic Versioning

ทุก Entity สำคัญมี `version`

Update Request ควรส่ง Version ปัจจุบัน:

```json
{
  "reportId": "UUID",
  "version": 4,
  "newStatus": "resolved"
}
```

Backend:

1. อ่าน Version ปัจจุบัน
2. หากไม่ตรง ให้ตอบ `VERSION_CONFLICT`
3. หากตรง ให้อัปเดตและเพิ่ม Version +1

---

## 42. Idempotency

ใช้ `request_id` สำหรับ:

- Create Report
- Add Additional Info
- Upload ที่เสี่ยงซ้ำ
- Export ตามความเหมาะสม

Backend ต้องตรวจว่ามี Request ID เดิมหรือไม่ก่อนสร้างข้อมูลใหม่

---

## 43. Referential Integrity

Google Sheets ไม่บังคับ FK จึงต้องตรวจใน Service/Repository:

- Category ต้องมีอยู่
- Assigned User ต้องมีอยู่และ Active
- Update ต้องมี Report
- Attachment ต้องมี Report
- Assignment ต้องมี Report และ User
- Session ต้องมี User
- Duplicate Report ต้องอ้าง Report ที่มีอยู่
- ห้าม Soft Delete Parent โดยไม่พิจารณา Child

---

# PART I — PRIVACY AND RETENTION

## 44. PII Classification

### High Sensitivity

- Password Hash
- Password Salt
- Token Hash
- Session Data

### Personal Data

- ชื่อ
- เบอร์โทร
- อีเมล
- พิกัด
- ภาพ
- รายละเอียดเรื่อง

### Public Data

- Tracking Code
- หมวด
- หัวข้อที่ผ่านการแสดง
- Status
- Public Timeline
- Public Result
- Public Attachments

---

## 45. Masking

ตัวอย่าง:

- Phone: `08X-XXX-1234`
- Email: `k***@example.com`
- Name: แสดงเฉพาะเมื่อมีเหตุผลและสิทธิ์

Public Tracking ไม่ควรแสดง PII โดยปกติ

---

## 46. Retention

ต้องกำหนดก่อน Production:

- Report Retention
- Attachment Retention
- Session Retention
- Rate Limit Log Retention
- Activity Log Retention
- Export File Retention
- Temp File Retention
- Backup Retention

ค่าแนะนำเบื้องต้น:

| Data | Retention |
|---|---|
| Active Reports | ตามอายุโครงการ |
| Sessions | ลบหลังหมดอายุ + ระยะผ่อนผัน |
| Rate Limits | 1–7 วัน |
| Temp Files | ภายใน 24 ชั่วโมง |
| Export Files | 7–30 วัน |
| Activity Logs | อย่างน้อย 1–3 ปี ตามนโยบาย |
| Backups | ตามรอบรายสัปดาห์/รายเดือน |

ต้องปรับให้สอดคล้องกับนโยบายข้อมูลส่วนบุคคลจริง

---

# PART J — MIGRATION AND VERSIONING

## 47. Schema Version

ค่าเริ่มต้น:

```text
1.0.0
```

เก็บใน:

- `settings.schema_version`
- หรือ `schema_migrations` เป็นแหล่งประวัติ

---

## 48. Migration Rules

1. Backup ก่อนเปลี่ยน Schema
2. ห้ามเปลี่ยนชื่อคอลัมน์ตรง ๆ โดยไม่มี Migration
3. เพิ่มคอลัมน์ใหม่ท้ายตารางหากทำได้
4. หากต้องย้ายลำดับ ให้ใช้ Header Mapping ไม่พึ่ง Column Number
5. Code ต้องอ่าน Column Index จาก Header
6. Migration ต้อง Idempotent
7. บันทึกผล Migration
8. มี Rollback Plan
9. ทดสอบกับสำเนา Spreadsheet ก่อน Production
10. อัปเดต DATA_SCHEMA และ API_SPEC

---

## 49. Header Mapping

ห้าม Hardcode เช่น:

```javascript
row[12]
```

ควรใช้:

```javascript
const headerMap = getHeaderMap_(sheet);
const status = row[headerMap.status];
```

ช่วยลดผลกระทบเมื่อเพิ่มคอลัมน์

---

# PART K — BACKUP AND RESTORE

## 50. Backup Scope

- Spreadsheet
- Drive Files
- Apps Script Source
- GitHub Repository
- Script Properties รายการค่าโดยไม่เปิดเผย Secret ในเอกสาร
- Config
- Schema Version

---

## 51. Backup Schedule

แนะนำ:

- Spreadsheet Snapshot รายวันหรือรายสัปดาห์
- Full Backup ก่อน Migration
- Drive Backup ตามรอบ
- Git Push ทุก Milestone
- Apps Script Backup ด้วย `clasp`

---

## 52. Restore Test

ต้องทดสอบ:

- Restore Spreadsheet
- เชื่อม Spreadsheet ID ใหม่
- เชื่อม Root Folder ID ใหม่
- ตรวจ Report และ Timeline
- ตรวจ Attachment Metadata
- ตรวจ Login/Admin
- ตรวจ Schema Version
- ตรวจ Public Track

---

# PART L — DATA QUALITY

## 53. Automated Checks

ควรมี Function ตรวจ:

- Duplicate `report_id`
- Duplicate `tracking_code`
- Duplicate `username`
- Orphan Updates
- Orphan Attachments
- Orphan Assignments
- Invalid Status
- Invalid Role
- Missing Required Fields
- Closed Report without Result
- Assigned Report without Active Assignment
- Attachment File ID ที่หาไม่พบ
- Deleted Parent กับ Active Child

---

## 54. Data Repair

ห้ามแก้ข้อมูล Production แบบไม่มี Log

ขั้นตอน:

1. Backup
2. ระบุปัญหา
3. รัน Repair Script
4. บันทึก Activity/Migration Log
5. ตรวจผล
6. อัปเดตเอกสารหากเป็นการเปลี่ยน Schema

---

# PART M — SETUP SEED DATA

## 55. Initial Settings Seed

```json
[
  {"key":"app_name","value":"Khaophang Report","type":"string","is_public":true},
  {"key":"app_name_th","value":"ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง","type":"string","is_public":true},
  {"key":"contact_email","value":"khaophangreport@gmail.com","type":"string","is_public":true},
  {"key":"max_images","value":"3","type":"number","is_public":true},
  {"key":"max_image_size_mb","value":"1","type":"number","is_public":true},
  {"key":"max_image_dimension","value":"1600","type":"number","is_public":true},
  {"key":"default_page_size","value":"20","type":"number","is_public":true},
  {"key":"privacy_version","value":"1.0","type":"string","is_public":true},
  {"key":"maintenance_mode","value":"false","type":"boolean","is_public":true},
  {"key":"schema_version","value":"1.0.0","type":"string","is_public":false}
]
```

---

## 56. Initial Admin Seed

ห้ามเขียน Username/Password จริงไว้ใน Repository

แนวทาง:

1. ใช้ `ADMIN_SETUP_KEY` ใน Script Properties
2. รัน Function สร้าง Super Admin ครั้งแรก
3. บังคับเปลี่ยน Password เมื่อ Login ครั้งแรก
4. ปิด Setup Function หรือ Rotate Key หลังใช้งาน
5. บันทึก Activity Log

---

# PART N — ACCEPTANCE CRITERIA

## 57. Schema Acceptance Criteria

- [ ] สร้าง Sheets ครบ
- [ ] Header ตรงตามเอกสาร
- [ ] ไม่มี Header ซ้ำ
- [ ] Freeze Header ทุก Sheet
- [ ] Data Validation ทำงาน
- [ ] Seed Categories ครบ
- [ ] Seed Settings ครบ
- [ ] สร้าง Root Folder ครบ
- [ ] สร้าง Report Folder ตามปีได้
- [ ] UUID ไม่ซ้ำ
- [ ] Tracking Code ไม่ซ้ำ
- [ ] Password ไม่เป็น Plain Text
- [ ] Token เก็บเป็น Hash
- [ ] Public API ไม่คืน PII
- [ ] Timeline แยก Public/Internal
- [ ] Soft Delete ทำงาน
- [ ] Version เพิ่มเมื่อแก้ข้อมูล
- [ ] Assignment History ถูกต้อง
- [ ] Activity Log ถูกสร้าง
- [ ] Pagination ทำงาน
- [ ] Backup/Restore ทดสอบแล้ว
- [ ] Migration บันทึก Version ได้
- [ ] ไม่มี Secret ใน Spreadsheet หรือ Repository

---

## 58. ความสัมพันธ์กับเอกสารอื่น

- `APP_SPEC.md` กำหนดฟังก์ชันและขอบเขต
- `UI_FLOW.md` กำหนดการเดินหน้าจอ
- `DATA_SCHEMA.md` กำหนดข้อมูลและความสัมพันธ์
- `API_SPEC.md` ต้องใช้ชื่อ Field และ Enum จากเอกสารนี้
- `DEVELOPMENT_RULES.md` ต้องกำหนดกฎการเขียน Repository และ Migration

หาก API ต้องใช้ชื่อ Field ต่างจาก Sheet ให้กำหนด Mapping อย่างชัดเจน ห้ามเกิดชื่อหลายแบบโดยไม่มีเหตุผล

---

## 59. ข้อกำหนดที่ต้องยืนยันก่อน Production

- รายชื่อหมู่บ้าน/หมู่ที่จริง
- Target Days แต่ละหมวด
- Data Retention
- สิทธิ์การเห็น PII ของแต่ละ Role
- รูปแบบ Password Hash ที่ใช้จริง
- Session Lifetime
- Reopen Policy
- Additional Info หลัง Closed
- Export Retention
- Backup Schedule
- Privacy Version
- Consent Text
- หมายเลขฉุกเฉิน
- เบอร์โทรโครงการ

---

## 60. สรุป

โครงสร้างข้อมูลของ Khaophang Report ต้องรองรับ:

- การแจ้งปัญหาโดยไม่สมัครสมาชิก
- การแจ้งแบบระบุตัวตนและไม่ระบุตัวตน
- การแนบภาพ
- Tracking Code
- Timeline
- Assignment
- Status Workflow
- Result และ Evidence
- Authentication และ Session
- Role-based Access
- Dashboard
- Export
- Audit Log
- Soft Delete
- Migration
- Backup
- การย้ายฐานข้อมูลในอนาคต

หัวใจสำคัญคือ:

> Google Sheets ต้องถูกใช้ผ่าน Backend และ Repository Layer อย่างมีโครงสร้าง ไม่ใช่เปิดเป็นตารางสาธารณะหรือให้ Frontend เขียนข้อมูลโดยตรง

---

**End of DATA_SCHEMA.md**
