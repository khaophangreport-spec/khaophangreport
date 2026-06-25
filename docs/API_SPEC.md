# Khaophang Report — API_SPEC

> เอกสารกำหนดมาตรฐาน API ของเว็บแอป Khaophang Report  
> ใช้เป็นสัญญากลางระหว่าง Frontend, Google Apps Script Backend, Google Sheets และ Google Drive

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | API_SPEC.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชันเอกสาร | 1.0.0 |
| สถานะ | Approved for Development |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| เอกสารอ้างอิง | APP_SPEC.md, UI_FLOW.md, DATA_SCHEMA.md |
| Backend | Google Apps Script Web App |
| Database | Google Sheets |
| File Storage | Google Drive |
| Production Domain | https://khaophangreport.pages.dev |
| Repository | https://github.com/khaophangreport-spec/khaophangreport.git |

---

## 2. วัตถุประสงค์

เอกสารนี้กำหนด:

- รูปแบบ Request และ Response
- รายชื่อ Action
- Public API
- Admin API
- Authentication และ Session
- Authorization
- Validation
- Pagination
- Search และ Filter
- File Upload
- Error Code
- Rate Limit
- Idempotency
- Version Conflict
- Status Transition
- Public Data Projection
- Security Rules
- Logging
- ตัวอย่าง Payload

API ทุก Action ต้องทำงานตามเอกสารนี้ เว้นแต่มีการเพิ่มเวอร์ชันและบันทึกการเปลี่ยนแปลงอย่างเป็นทางการ

---

## 3. สถาปัตยกรรม API

```text
Frontend
HTML + CSS + Vanilla JavaScript
        ↓
Fetch API
        ↓
Google Apps Script Web App
        ↓
Router.gs
        ↓
Validation / Auth / Permission
        ↓
Service Layer
        ↓
Repository Layer
        ↓
Google Sheets + Google Drive
```

### หลักการสำคัญ

1. ใช้ Endpoint เดียวของ Google Apps Script Web App
2. แยกการทำงานด้วยค่า `action`
3. Public API และ Admin API ใช้ Response Format เดียวกัน
4. Admin API ต้องตรวจ Session ทุกครั้ง
5. Backend เป็นแหล่งจริงของ Validation และ Permission
6. Frontend ห้ามอ่าน Google Sheets โดยตรง
7. Backend ห้ามส่ง Secret, Password Hash หรือ Token Hash กลับ Frontend
8. ทุกการแก้ไขข้อมูลสำคัญต้องสร้าง Activity Log
9. ทุกการเปลี่ยนสถานะต้องสร้าง Timeline
10. API ต้องรองรับ Idempotency ใน Action ที่เสี่ยงสร้างข้อมูลซ้ำ

---

## 4. Base Endpoint

ตัวอย่าง:

```text
POST https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Frontend ต้องกำหนด URL ที่:

```javascript
window.APP_CONFIG.API_URL
```

ห้ามเขียน API URL ซ้ำในหลายไฟล์

---

## 5. HTTP Method

### 5.1 POST

ใช้เป็น Method หลักสำหรับทุก Action ที่:

- สร้างข้อมูล
- แก้ข้อมูล
- Login
- Logout
- Upload
- Search ที่มี Filter ซับซ้อน
- Export

### 5.2 GET

ใช้เฉพาะ Action อ่านข้อมูลที่ไม่อ่อนไหวและไม่มี Payload ซับซ้อน เช่น:

- Health Check
- Public Config
- Category List
- Announcement List

แต่เพื่อให้โครงสร้างง่ายใน Apps Script สามารถใช้ POST กับทุก Action ได้

### 5.3 Recommendation

MVP ใช้:

```text
POST /exec
Content-Type: application/json
```

เป็นมาตรฐานหลัก

---

## 6. Request Envelope

ทุก Request ใช้รูปแบบ:

```json
{
  "action": "report.create",
  "requestId": "REQ-UUID",
  "sessionToken": "",
  "data": {}
}
```

### 6.1 Fields

| Field | Type | Required | รายละเอียด |
|---|---|---:|---|
| `action` | string | Yes | ชื่อ Action |
| `requestId` | string | Conditional | Idempotency/Correlation ID |
| `sessionToken` | string | Admin Only | Raw Session Token ส่งผ่าน HTTPS |
| `data` | object | Yes | Payload ของ Action |

### 6.2 Rules

- `action` ต้องอยู่ใน Whitelist
- `data` ต้องเป็น Object
- `requestId` ต้องไม่ยาวเกินกำหนด
- Public Action ไม่ต้องส่ง Session
- Admin Action ต้องส่ง Session ยกเว้น Login
- ห้ามส่ง Password ใน Query String
- ห้ามส่ง Token ใน URL
- ห้ามส่ง Base64 Image ใน Log

---

## 7. Response Envelope

### 7.1 Success

```json
{
  "ok": true,
  "data": {},
  "message": "ดำเนินการสำเร็จ",
  "meta": {
    "requestId": "REQ-UUID",
    "timestamp": "2026-06-26T15:30:45.123Z"
  }
}
```

### 7.2 Error

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "fields": {
      "title": "กรุณากรอกหัวข้อ"
    }
  },
  "meta": {
    "requestId": "REQ-UUID",
    "timestamp": "2026-06-26T15:30:45.123Z"
  }
}
```

### 7.3 Rules

- `ok` ต้องเป็น Boolean
- Success ต้องมี `data`
- Error ต้องมี `error.code`
- Error Message ต้องเป็นภาษาไทยที่เข้าใจง่าย
- ห้ามส่ง Stack Trace
- ห้ามส่ง Internal Exception
- `meta.requestId` ใช้ตรวจสอบปัญหา
- `meta.timestamp` เป็น ISO 8601
- Field Error ใช้ชื่อ Field ตาม API Contract

---

## 8. API Versioning

MVP ใช้เวอร์ชัน:

```text
1.0.0
```

อาจส่งใน Public Config:

```json
{
  "apiVersion": "1.0.0"
}
```

### Version Rules

- การเพิ่ม Field แบบ Optional ไม่ถือเป็น Breaking Change
- การลบหรือเปลี่ยนชื่อ Field เป็น Breaking Change
- การเปลี่ยน Enum เป็น Breaking Change
- Breaking Change ต้องเพิ่ม Major Version
- Frontend ต้องตรวจ Compatibility เมื่อจำเป็น

---

# PART A — PUBLIC API

## 9. Action: `health.check`

ตรวจสอบว่า Backend พร้อมใช้งาน

### Authentication

ไม่ต้อง Login

### Request

```json
{
  "action": "health.check",
  "requestId": "REQ-UUID",
  "data": {}
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "apiVersion": "1.0.0",
    "environment": "production"
  },
  "message": "ระบบพร้อมใช้งาน",
  "meta": {}
}
```

### Notes

- ห้ามส่ง Spreadsheet ID
- ห้ามส่ง Folder ID
- ห้ามส่ง Secret
- ใช้ตรวจ Health เท่านั้น

---

## 10. Action: `public.config`

อ่านค่าตั้งค่าสาธารณะ

### Authentication

ไม่ต้อง Login

### Request

```json
{
  "action": "public.config",
  "requestId": "REQ-UUID",
  "data": {}
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "appName": "Khaophang Report",
    "appNameTh": "ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง",
    "siteUrl": "https://khaophangreport.pages.dev",
    "contactEmail": "khaophangreport@gmail.com",
    "contactPhone": "",
    "officeHours": "",
    "maxImages": 3,
    "maxImageSizeMb": 1,
    "maxImageDimension": 1600,
    "privacyVersion": "1.0",
    "maintenanceMode": false,
    "emergencyContacts": []
  },
  "message": "โหลดค่าระบบสำเร็จ",
  "meta": {}
}
```

### Rules

- คืนเฉพาะ `settings.is_public=TRUE`
- ใช้ Cache Service
- ห้ามคืน Secret
- หาก Maintenance Mode เปิด ต้องยังให้ Login ของ Super Admin ใช้งานได้

---

## 11. Action: `category.list`

อ่านหมวดปัญหาที่เปิดใช้งาน

### Authentication

ไม่ต้อง Login

### Request

```json
{
  "action": "category.list",
  "requestId": "REQ-UUID",
  "data": {}
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "categoryId": "CAT-001",
        "code": "ROAD",
        "name": "ถนน ทางเท้า และสะพาน",
        "description": "ปัญหาถนนชำรุด ทางเท้า หรือสะพาน",
        "icon": "road",
        "color": "#287444",
        "targetDays": 14
      }
    ]
  },
  "message": "โหลดหมวดปัญหาสำเร็จ",
  "meta": {}
}
```

### Rules

- แสดงเฉพาะ Active
- เรียงตาม `sort_order`
- ห้ามคืน Default Assignee
- ใช้ Cache Service

---

## 12. Action: `announcement.list`

อ่านประกาศที่กำลังแสดง

### Authentication

ไม่ต้อง Login

### Request

```json
{
  "action": "announcement.list",
  "requestId": "REQ-UUID",
  "data": {
    "limit": 5
  }
}
```

### Validation

- `limit` ค่าเริ่มต้น 5
- สูงสุด 20

### Success Response

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "announcementId": "UUID",
        "title": "ประกาศแจ้งเตือน",
        "content": "ข้อความประกาศ",
        "type": "info",
        "startAt": "2026-06-26T00:00:00.000Z",
        "endAt": ""
      }
    ]
  },
  "message": "โหลดประกาศสำเร็จ",
  "meta": {}
}
```

### Rules

- Active
- อยู่ในช่วงเวลา
- ไม่ Soft Deleted
- Content ต้องผ่าน Sanitize/Escape

---

## 13. Action: `report.create`

สร้างเรื่องแจ้งใหม่

### Authentication

ไม่ต้อง Login

### Idempotency

บังคับใช้ `requestId`

### Rate Limit

แนะนำไม่เกิน 5 ครั้งต่อ 10 นาทีต่อ Key ประกอบ

### Request

```json
{
  "action": "report.create",
  "requestId": "REQ-UUID",
  "data": {
    "categoryId": "CAT-001",
    "title": "ไฟส่องสว่างดับ",
    "description": "ไฟส่องสว่างบริเวณทางเข้าหมู่บ้านดับ",
    "incidentDate": "2026-06-25",
    "priorityReported": "normal",
    "location": {
      "name": "ทางเข้าหมู่บ้าน",
      "villageNo": "3",
      "landmark": "ใกล้ศาลาหมู่บ้าน",
      "latitude": 8.123456,
      "longitude": 98.123456,
      "mapUrl": "https://maps.google.com/..."
    },
    "reporter": {
      "isAnonymous": false,
      "name": "สมชาย ใจดี",
      "phone": "0812345678",
      "email": "",
      "contactMethod": "phone"
    },
    "consent": {
      "truthConfirmed": true,
      "privacyAccepted": true,
      "privacyVersion": "1.0"
    },
    "attachments": [
      {
        "fileName": "photo-1.jpg",
        "mimeType": "image/jpeg",
        "base64": "BASE64_DATA",
        "fileSize": 245678,
        "width": 1200,
        "height": 900
      }
    ]
  }
}
```

### Validation

#### General

- `requestId` ต้องมี
- Category ต้องมีและ Active
- Title 5–150 ตัวอักษร
- Description 10–3,000 ตัวอักษร
- Incident Date ต้องไม่เป็นอนาคต
- Priority: low / normal / high / critical

#### Location

- ต้องมีชื่อสถานที่หรือจุดสังเกต
- Latitude -90 ถึง 90
- Longitude -180 ถึง 180
- หากมีพิกัดต้องมีครบคู่

#### Reporter

กรณีระบุตัวตน:

- Name Required
- Phone Required
- Email Optional แต่ต้องถูก Format
- Contact Method ต้องสัมพันธ์กับข้อมูล

กรณีไม่ระบุตัวตน:

- Backend ต้องละทิ้ง PII ที่ส่งมาโดยไม่จำเป็น
- `contactMethod` เป็น `none`

#### Consent

- `truthConfirmed=true`
- `privacyAccepted=true`
- `privacyVersion` ต้องตรงกับ Current Policy หรืออยู่ในเวอร์ชันที่ยอมรับได้

#### Attachments

- สูงสุด 3 รูป
- JPG, PNG, WebP
- ไม่เกิน 1 MB ต่อรูปหลังบีบอัด
- ด้านยาวไม่เกิน 1,600 px
- MIME Type ต้องตรวจจากข้อมูลจริง ไม่เชื่อ Frontend อย่างเดียว

### Processing Steps

1. ตรวจ Rate Limit
2. ตรวจ Request ID ซ้ำ
3. Validate Payload
4. สร้าง `report_id`
5. สร้าง Tracking Code
6. บันทึก Report
7. อัปโหลดภาพ
8. บันทึก Attachment Metadata
9. สร้าง Timeline แรก
10. สร้าง Activity Log
11. คืน Tracking Code
12. หากขั้นตอนไฟล์ล้มเหลว ต้อง Rollback หรือ Mark สถานะอย่างสอดคล้อง

### Success Response

```json
{
  "ok": true,
  "data": {
    "trackingCode": "KPR-260626-A7F4",
    "createdAt": "2026-06-26T15:30:45.123Z",
    "status": "new"
  },
  "message": "ส่งเรื่องเรียบร้อยแล้ว",
  "meta": {}
}
```

### Possible Errors

- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `DUPLICATE_REQUEST`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `FILE_LIMIT_EXCEEDED`
- `CATEGORY_NOT_AVAILABLE`
- `INTERNAL_ERROR`

---

## 14. Action: `report.track`

ติดตามสถานะด้วย Tracking Code

### Authentication

ไม่ต้อง Login

### Rate Limit

แนะนำ 30 ครั้งต่อ 10 นาที

### Request

```json
{
  "action": "report.track",
  "requestId": "REQ-UUID",
  "data": {
    "trackingCode": "KPR-260626-A7F4"
  }
}
```

### Validation

- Trim
- Uppercase
- ตรวจรูปแบบ
- จำกัดความยาว
- ไม่เปิดเผยข้อมูลเมื่อรหัสไม่ถูกต้อง

### Success Response

```json
{
  "ok": true,
  "data": {
    "trackingCode": "KPR-260626-A7F4",
    "category": {
      "categoryId": "CAT-001",
      "name": "ไฟฟ้าและไฟส่องสว่าง",
      "icon": "lightbulb",
      "color": "#287444"
    },
    "title": "ไฟส่องสว่างดับ",
    "incidentDate": "2026-06-25",
    "createdAt": "2026-06-26T15:30:45.123Z",
    "status": "in_progress",
    "priority": "normal",
    "publicAssigneeName": "เจ้าหน้าที่ผู้รับผิดชอบ",
    "publicResult": "",
    "timeline": [
      {
        "updateId": "UUID",
        "type": "status",
        "status": "new",
        "message": "ระบบรับเรื่องแล้ว",
        "createdAt": "2026-06-26T15:30:45.123Z",
        "attachments": []
      }
    ],
    "attachments": []
  },
  "message": "พบข้อมูลเรื่องแจ้ง",
  "meta": {}
}
```

### Public Projection Rules

ห้ามคืน:

- Internal Report ID หากไม่จำเป็น
- Reporter Name
- Reporter Phone
- Reporter Email
- Internal Summary
- Internal Note
- Assigned User ID
- Raw User ID
- Request ID
- Version
- Deleted Fields
- Private Attachments

### Not Found Response

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "ไม่พบรหัสติดตามนี้"
  },
  "meta": {}
}
```

---

## 15. Action: `report.addInfo`

เพิ่มข้อมูลภายหลัง

### Authentication

ไม่ต้อง Login

### Idempotency

บังคับใช้ `requestId`

### Request

```json
{
  "action": "report.addInfo",
  "requestId": "REQ-UUID",
  "data": {
    "trackingCode": "KPR-260626-A7F4",
    "message": "ขณะนี้ไฟยังไม่กลับมาใช้งาน",
    "contact": {
      "name": "",
      "phone": ""
    },
    "attachments": []
  }
}
```

### Validation

- Tracking Code ต้องมีอยู่
- Message 5–2,000 ตัวอักษร
- ตรวจสถานะเรื่อง
- หาก Closed และ Policy ไม่อนุญาต ให้ Reject
- Attachment ตามข้อจำกัด
- Rate Limit
- Request ID ซ้ำ

### Success Response

```json
{
  "ok": true,
  "data": {
    "additionalInfoId": "UUID",
    "createdAt": "2026-06-27T10:00:00.000Z",
    "reviewStatus": "pending"
  },
  "message": "ส่งข้อมูลเพิ่มเติมเรียบร้อยแล้ว",
  "meta": {}
}
```

### Possible Errors

- `NOT_FOUND`
- `REPORT_CLOSED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `DUPLICATE_REQUEST`
- `FILE_TOO_LARGE`
- `INVALID_FILE_TYPE`

---

# PART B — AUTHENTICATION API

## 16. Action: `auth.login`

เข้าสู่ระบบ Admin

### Authentication

ไม่ต้องมี Session เดิม

### Rate Limit

แนะนำ 5 ครั้งต่อ 15 นาทีต่อ Username + Device Key

### Request

```json
{
  "action": "auth.login",
  "requestId": "REQ-UUID",
  "data": {
    "username": "admin",
    "password": "USER_PASSWORD",
    "deviceKey": "DEVICE_KEY"
  }
}
```

### Processing

1. Normalize Username
2. Rate Limit
3. Lookup User
4. ตรวจ Active
5. ตรวจ Locked
6. Verify Password Hash
7. Update Failed Count
8. สร้าง Session Token
9. เก็บ Token Hash
10. Update Last Login
11. Activity Log
12. คืน Raw Token ครั้งเดียว

### Success Response

```json
{
  "ok": true,
  "data": {
    "sessionToken": "RAW_SESSION_TOKEN",
    "expiresAt": "2026-06-27T15:30:45.123Z",
    "user": {
      "userId": "UUID",
      "displayName": "ผู้ดูแลระบบ",
      "role": "admin",
      "mustChangePassword": false
    }
  },
  "message": "เข้าสู่ระบบสำเร็จ",
  "meta": {}
}
```

### Error Response

ใช้ข้อความทั่วไป:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
  },
  "meta": {}
}
```

### Possible Errors

- `INVALID_CREDENTIALS`
- `ACCOUNT_INACTIVE`
- `ACCOUNT_LOCKED`
- `RATE_LIMITED`
- `VALIDATION_ERROR`

---

## 17. Action: `auth.me`

อ่านผู้ใช้ปัจจุบัน

### Authentication

Required

### Request

```json
{
  "action": "auth.me",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {}
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "userId": "UUID",
    "displayName": "ผู้ดูแลระบบ",
    "email": "admin@example.com",
    "phone": "",
    "role": "admin",
    "permissions": [
      "report.read",
      "report.update",
      "report.assign"
    ],
    "mustChangePassword": false
  },
  "message": "โหลดข้อมูลผู้ใช้สำเร็จ",
  "meta": {}
}
```

### Rules

- ห้ามคืน Password Hash
- ห้ามคืน Salt
- ห้ามคืน Token Hash
- Permission อาจคำนวณจาก Role

---

## 18. Action: `auth.logout`

ออกจากระบบ

### Authentication

Required

### Request

```json
{
  "action": "auth.logout",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {}
}
```

### Success Response

```json
{
  "ok": true,
  "data": {},
  "message": "ออกจากระบบแล้ว",
  "meta": {}
}
```

### Rules

- Revoke Session
- Activity Log
- Frontend ต้องล้าง Token แม้ API ล้มเหลว

---

## 19. Action: `auth.changePassword`

เปลี่ยนรหัสผ่าน

### Authentication

Required

### Request

```json
{
  "action": "auth.changePassword",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "currentPassword": "OLD_PASSWORD",
    "newPassword": "NEW_PASSWORD"
  }
}
```

### Validation

- Current Password ถูกต้อง
- New Password ขั้นต่ำ 8 ตัวอักษร
- New Password ไม่เหมือนเดิม
- ห้ามใช้รหัสอ่อนเกินกติกา

### Success Response

```json
{
  "ok": true,
  "data": {
    "sessionsRevoked": true
  },
  "message": "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่",
  "meta": {}
}
```

### Rules

- Update Password Hash + Salt
- Update Password Version
- Revoke Sessions
- Activity Log
- ห้าม Log Password

---

# PART C — DASHBOARD API

## 20. Action: `dashboard.summary`

อ่านข้อมูลสรุป Dashboard

### Authentication

Required

### Roles

super_admin, admin, officer, viewer

### Request

```json
{
  "action": "dashboard.summary",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "scope": "global",
    "dateFrom": "2026-01-01",
    "dateTo": "2026-12-31"
  }
}
```

### Scope

- `global`
- `mine`

Officer ค่าเริ่มต้นเป็น `mine`

### Success Response

```json
{
  "ok": true,
  "data": {
    "summary": {
      "total": 120,
      "new": 8,
      "reviewing": 5,
      "assigned": 9,
      "inProgress": 20,
      "waiting": 4,
      "resolved": 45,
      "closed": 29,
      "urgent": 3,
      "overdue": 7
    },
    "charts": {
      "byMonth": [],
      "byCategory": [],
      "byStatus": [],
      "byVillage": []
    },
    "performance": {
      "averageResolutionHours": 72.5,
      "withinTargetPercent": 81.2
    },
    "lastUpdatedAt": "2026-06-26T15:30:45.123Z"
  },
  "message": "โหลด Dashboard สำเร็จ",
  "meta": {}
}
```

### Rules

- ใช้ Cache
- Scope ตาม Permission
- ไม่คืน PII
- Viewer อ่านอย่างเดียว
- Officer เห็นเฉพาะงานตามสิทธิ์

---

# PART D — ADMIN REPORT API

## 21. Action: `admin.report.list`

อ่านรายการเรื่อง

### Authentication

Required

### Roles

super_admin, admin, officer, viewer

### Request

```json
{
  "action": "admin.report.list",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "page": 1,
    "pageSize": 20,
    "keyword": "",
    "status": "",
    "categoryId": "",
    "priority": "",
    "assigneeId": "",
    "dateFrom": "",
    "dateTo": "",
    "scope": "global",
    "sortBy": "created_at",
    "sortDirection": "desc"
  }
}
```

### Validation

- Page >= 1
- Page Size 1–100
- Sort Field อยู่ใน Whitelist
- Sort Direction asc / desc
- Filter IDs ต้องถูกต้อง
- Officer Scope จำกัดตามสิทธิ์

### Success Response

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "reportId": "UUID",
        "trackingCode": "KPR-260626-A7F4",
        "createdAt": "2026-06-26T15:30:45.123Z",
        "category": {
          "categoryId": "CAT-001",
          "name": "ไฟฟ้าและไฟส่องสว่าง"
        },
        "title": "ไฟส่องสว่างดับ",
        "status": "new",
        "priority": "normal",
        "assignee": {
          "userId": "",
          "displayName": ""
        },
        "updatedAt": "2026-06-26T15:30:45.123Z",
        "ageHours": 2,
        "isOverdue": false,
        "version": 1
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 120,
      "totalPages": 6
    }
  },
  "message": "โหลดรายการเรื่องสำเร็จ",
  "meta": {}
}
```

---

## 22. Action: `admin.report.detail`

อ่านรายละเอียดเรื่อง

### Authentication

Required

### Request

```json
{
  "action": "admin.report.detail",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "reportId": "UUID"
  }
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "report": {
      "reportId": "UUID",
      "trackingCode": "KPR-260626-A7F4",
      "categoryId": "CAT-001",
      "title": "ไฟส่องสว่างดับ",
      "description": "รายละเอียด",
      "incidentDate": "2026-06-25",
      "location": {
        "name": "ทางเข้าหมู่บ้าน",
        "villageNo": "3",
        "landmark": "ใกล้ศาลาหมู่บ้าน",
        "latitude": 8.123,
        "longitude": 98.123,
        "mapUrl": ""
      },
      "reporter": {
        "isAnonymous": false,
        "name": "สมชาย ใจดี",
        "phone": "0812345678",
        "email": "",
        "contactMethod": "phone"
      },
      "status": "in_progress",
      "priorityReported": "normal",
      "priority": "high",
      "assignedTo": "USER_UUID",
      "publicResult": "",
      "internalSummary": "",
      "createdAt": "2026-06-26T15:30:45.123Z",
      "updatedAt": "2026-06-26T16:00:00.000Z",
      "version": 3
    },
    "timeline": [],
    "attachments": [],
    "assignments": [],
    "additionalInfo": []
  },
  "message": "โหลดรายละเอียดเรื่องสำเร็จ",
  "meta": {}
}
```

### Permission Rules

- Officer เห็นเฉพาะเรื่องที่ได้รับอนุญาต
- Viewer เห็นข้อมูลแบบ Read-only
- PII อาจถูก Mask ตาม Role
- ห้ามคืน Password/Session Data
- Internal Notes คืนเฉพาะ Role ที่มีสิทธิ์

---

## 23. Action: `admin.report.updateStatus`

เปลี่ยนสถานะเรื่อง

### Authentication

Required

### Roles

super_admin, admin, officer ตามสิทธิ์

### Request

```json
{
  "action": "admin.report.updateStatus",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "reportId": "UUID",
    "version": 3,
    "newStatus": "resolved",
    "publicMessage": "ดำเนินการซ่อมแซมเรียบร้อยแล้ว",
    "internalNote": "ตรวจสอบหลังดำเนินการแล้ว",
    "result": "เปลี่ยนหลอดไฟและตรวจระบบไฟฟ้า",
    "attachments": []
  }
}
```

### Validation

- Report มีอยู่
- Version ตรง
- User มีสิทธิ์
- Transition ถูกต้อง
- Required Fields ตามสถานะ
- Attachment Validation

### Required by Status

| Status | Required |
|---|---|
| `waiting` | `publicMessage` |
| `resolved` | `result` หรือ `publicMessage` |
| `closed` | Confirmation และ Preconditions |
| `rejected` | `rejectionReason` |
| `duplicate` | `duplicateOfReportId` หรือเหตุผลภายในตาม Policy |

### Success Response

```json
{
  "ok": true,
  "data": {
    "reportId": "UUID",
    "oldStatus": "in_progress",
    "newStatus": "resolved",
    "updatedAt": "2026-06-26T17:00:00.000Z",
    "version": 4
  },
  "message": "อัปเดตสถานะสำเร็จ",
  "meta": {}
}
```

### Possible Errors

- `NOT_FOUND`
- `FORBIDDEN`
- `INVALID_STATUS_TRANSITION`
- `VERSION_CONFLICT`
- `VALIDATION_ERROR`

---

## 24. Action: `admin.report.assign`

มอบหมายหรือมอบหมายใหม่

### Authentication

Required

### Roles

super_admin, admin

### Request

```json
{
  "action": "admin.report.assign",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "reportId": "UUID",
    "version": 3,
    "assigneeId": "USER_UUID",
    "note": "มอบหมายให้ตรวจสอบพื้นที่",
    "targetDueAt": "2026-06-30T10:00:00.000Z"
  }
}
```

### Validation

- Report มีอยู่
- Assignee มีอยู่และ Active
- Assignee Role เหมาะสม
- Version ตรง
- User มีสิทธิ์

### Success Response

```json
{
  "ok": true,
  "data": {
    "assignmentId": "UUID",
    "reportId": "UUID",
    "assignee": {
      "userId": "USER_UUID",
      "displayName": "เจ้าหน้าที่ ก"
    },
    "assignedAt": "2026-06-26T16:30:00.000Z",
    "targetDueAt": "2026-06-30T10:00:00.000Z",
    "version": 4
  },
  "message": "มอบหมายงานสำเร็จ",
  "meta": {}
}
```

### Rules

- ปิด Assignment เดิมเมื่อ Reassign
- Update `reports.assigned_to`
- สร้าง Timeline
- สร้าง Activity Log
- อาจเปลี่ยน Status เป็น `assigned`

---

## 25. Action: `admin.report.addUpdate`

เพิ่ม Timeline หรือบันทึก

### Authentication

Required

### Request

```json
{
  "action": "admin.report.addUpdate",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "reportId": "UUID",
    "version": 4,
    "publicMessage": "เจ้าหน้าที่ลงพื้นที่ตรวจสอบแล้ว",
    "internalNote": "พบเสาไฟชำรุด 1 จุด",
    "isPublic": true,
    "attachments": []
  }
}
```

### Validation

- ต้องมี Public Message หรือ Internal Note อย่างน้อยหนึ่งค่า
- หาก `isPublic=true` ต้องมี Public Message หรือ Public Attachment
- Version ตรง
- Permission ถูกต้อง

### Success Response

```json
{
  "ok": true,
  "data": {
    "updateId": "UUID",
    "createdAt": "2026-06-26T16:45:00.000Z",
    "version": 5
  },
  "message": "เพิ่มข้อมูลอัปเดตสำเร็จ",
  "meta": {}
}
```

---

## 26. Action: `admin.report.updatePriority`

เปลี่ยนระดับความสำคัญ

### Request

```json
{
  "action": "admin.report.updatePriority",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "reportId": "UUID",
    "version": 4,
    "priority": "high",
    "note": "กระทบประชาชนหลายครัวเรือน"
  }
}
```

### Success Response

```json
{
  "ok": true,
  "data": {
    "priority": "high",
    "updatedAt": "2026-06-26T17:00:00.000Z",
    "version": 5
  },
  "message": "เปลี่ยนระดับความสำคัญสำเร็จ",
  "meta": {}
}
```

---

# PART E — CATEGORY API

## 27. Action: `admin.category.list`

### Authentication

Required

### Request

```json
{
  "action": "admin.category.list",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "includeInactive": true
  }
}
```

### Response

คืนรายการ Category พร้อมข้อมูลภายในตามสิทธิ์ เช่น Default Assignee และ Target Days

---

## 28. Action: `admin.category.save`

สร้างหรือแก้หมวด

### Authentication

Required

### Roles

super_admin, admin

### Request

```json
{
  "action": "admin.category.save",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "categoryId": "",
    "code": "ROAD",
    "name": "ถนน ทางเท้า และสะพาน",
    "description": "ปัญหาถนน ทางเท้า และสะพาน",
    "icon": "road",
    "color": "#287444",
    "defaultAssignee": "",
    "targetDays": 14,
    "sortOrder": 1,
    "isActive": true,
    "version": 0
  }
}
```

### Rules

- `categoryId=""` หมายถึง Create
- Existing Category ต้องส่ง Version
- Code ไม่ซ้ำ
- Name ไม่ซ้ำตามกติกา
- ห้าม Hard Delete
- Clear Cache หลัง Save

---

# PART F — USER API

## 29. Action: `admin.user.list`

### Authentication

Required

### Roles

super_admin, admin ตามสิทธิ์

### Request

```json
{
  "action": "admin.user.list",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "page": 1,
    "pageSize": 20,
    "keyword": "",
    "role": "",
    "status": ""
  }
}
```

### Response

ห้ามคืน:

- Password Hash
- Salt
- Token Hash
- Session Data

---

## 30. Action: `admin.user.save`

สร้างหรือแก้ผู้ใช้

### Request

```json
{
  "action": "admin.user.save",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "userId": "",
    "username": "officer01",
    "displayName": "เจ้าหน้าที่ ก",
    "email": "",
    "phone": "",
    "role": "officer",
    "status": "active",
    "temporaryPassword": "TEMP_PASSWORD",
    "mustChangePassword": true,
    "version": 0
  }
}
```

### Rules

- Create ต้องมี Temporary Password
- Update ไม่ต้องส่ง Password
- Username ไม่ซ้ำ
- ห้ามปิด Super Admin คนสุดท้าย
- ห้ามส่ง Password กลับ
- Activity Log
- Version Check

---

## 31. Action: `admin.user.resetPassword`

### Request

```json
{
  "action": "admin.user.resetPassword",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "userId": "UUID",
    "temporaryPassword": "TEMP_PASSWORD",
    "revokeSessions": true
  }
}
```

### Rules

- เฉพาะผู้มีสิทธิ์
- Hash ทันที
- ห้าม Log Password
- บังคับเปลี่ยนรหัส
- Revoke Session

---

## 32. Action: `admin.user.revokeSessions`

### Request

```json
{
  "action": "admin.user.revokeSessions",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "userId": "UUID",
    "reason": "security_reset"
  }
}
```

---

# PART G — ANNOUNCEMENT API

## 33. Action: `admin.announcement.list`

อ่านประกาศทั้งหมดตามสิทธิ์

### Request

```json
{
  "action": "admin.announcement.list",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "page": 1,
    "pageSize": 20,
    "status": ""
  }
}
```

---

## 34. Action: `admin.announcement.save`

สร้างหรือแก้ประกาศ

### Request

```json
{
  "action": "admin.announcement.save",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "announcementId": "",
    "title": "ประกาศแจ้งเตือน",
    "content": "ข้อความประกาศ",
    "type": "info",
    "startAt": "2026-06-26T00:00:00.000Z",
    "endAt": "",
    "isActive": true,
    "sortOrder": 1,
    "version": 0
  }
}
```

### Validation

- Title Required
- Content Required
- Type Enum
- End ไม่ก่อน Start
- Sanitize Content
- Version Check

---

# PART H — SETTINGS API

## 35. Action: `admin.settings.get`

### Authentication

Required

### Roles

super_admin, admin ตามสิทธิ์

### Response

- คืนค่าที่แก้ได้
- Secret ต้อง Mask หรือไม่คืนเลย
- Public/Private แยกชัดเจน

---

## 36. Action: `admin.settings.update`

### Request

```json
{
  "action": "admin.settings.update",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "items": [
      {
        "key": "contact_phone",
        "value": "077000000",
        "version": 1
      }
    ]
  }
}
```

### Rules

- Key อยู่ใน Whitelist
- Type ถูกต้อง
- Version Check
- Clear Cache
- Activity Log
- Secret ห้ามแก้ผ่าน Public Settings API

---

# PART I — ACTIVITY LOG API

## 37. Action: `admin.activity.list`

### Authentication

Required

### Roles

super_admin หรือ admin ตามสิทธิ์

### Request

```json
{
  "action": "admin.activity.list",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "page": 1,
    "pageSize": 20,
    "userId": "",
    "actionName": "",
    "entityType": "",
    "dateFrom": "",
    "dateTo": "",
    "keyword": ""
  }
}
```

### Response

Read-only และไม่คืน Secret

---

# PART J — EXPORT API

## 38. Action: `admin.export.csv`

### Authentication

Required

### Roles

super_admin, admin, viewer ตามสิทธิ์

### Request

```json
{
  "action": "admin.export.csv",
  "requestId": "REQ-UUID",
  "sessionToken": "RAW_SESSION_TOKEN",
  "data": {
    "exportType": "reports",
    "filters": {
      "dateFrom": "2026-01-01",
      "dateTo": "2026-12-31",
      "status": "",
      "categoryId": "",
      "assigneeId": ""
    },
    "includePersonalData": false
  }
}
```

### Success Response

ทางเลือก A:

```json
{
  "ok": true,
  "data": {
    "fileName": "khaophang_reports_2026-01-01_2026-12-31.csv",
    "mimeType": "text/csv",
    "contentBase64": "BASE64_CSV"
  },
  "message": "สร้างไฟล์ส่งออกสำเร็จ",
  "meta": {}
}
```

ทางเลือก B:

```json
{
  "ok": true,
  "data": {
    "exportId": "UUID",
    "fileName": "khaophang_reports_2026.csv",
    "downloadToken": "SHORT_LIVED_TOKEN",
    "expiresAt": "2026-06-26T18:00:00.000Z"
  },
  "message": "สร้างไฟล์ส่งออกสำเร็จ",
  "meta": {}
}
```

### Recommendation

MVP ใช้ทางเลือก A หากไฟล์เล็ก  
หากข้อมูลมากให้ใช้ทางเลือก B

### Security

- Default ไม่รวม PII
- Include PII ต้องมีสิทธิ์และ Confirmation
- ป้องกัน CSV Formula Injection
- Activity Log
- จำกัดช่วงวันที่และจำนวนแถว

---

# PART K — SESSION AND AUTHORIZATION

## 39. Session Validation

Admin Request ต้อง:

1. มี Session Token
2. Hash Token
3. Lookup Session
4. ตรวจ Active
5. ตรวจ Revoked
6. ตรวจ Expires At
7. ตรวจ User Active
8. Update Last Used ตามรอบที่เหมาะสม
9. ตรวจ Permission

---

## 40. Permission Model

ตัวอย่าง Permission Keys:

```text
dashboard.read
report.read
report.read_all
report.read_assigned
report.create_admin
report.update
report.assign
report.change_status
report.close
report.reject
report.view_pii
report.view_internal_notes
category.manage
user.manage
announcement.manage
settings.manage
activity.read
export.basic
export.personal_data
```

### Role Baseline

#### super_admin

ทุก Permission

#### admin

ทุกงานบริหาร ยกเว้นค่าระบบหรือการกระทำที่จำกัดไว้เฉพาะ Super Admin

#### officer

- dashboard.read
- report.read_assigned
- report.update
- report.change_status ตามกติกา
- report.view_pii เท่าที่จำเป็น

#### viewer

- dashboard.read
- report.read ตามขอบเขต
- export.basic ตามสิทธิ์
- ไม่มี Write Permission

---

# PART L — STATUS TRANSITION API RULES

## 41. Transition Matrix

| Current | Allowed New Status |
|---|---|
| `new` | reviewing, assigned, waiting, rejected, duplicate |
| `reviewing` | assigned, in_progress, waiting, rejected, duplicate |
| `assigned` | in_progress, waiting, resolved |
| `in_progress` | waiting, resolved |
| `waiting` | reviewing, assigned, in_progress, rejected |
| `resolved` | closed, in_progress |
| `closed` | none ตามปกติ |
| `rejected` | reviewing เฉพาะสิทธิ์ |
| `duplicate` | reviewing เฉพาะสิทธิ์ |

### Additional Rules

- `resolved → in_progress` คือ Reopen
- Reopen ต้องมีเหตุผล
- `closed` Reopen ได้เฉพาะ Super Admin หาก Policy อนุญาต
- ทุก Transition สร้าง Timeline
- ทุก Transition สร้าง Activity Log
- Update `resolved_at`, `closed_at`, `rejected_at` ตามสถานะ

---

# PART M — FILE UPLOAD API RULES

## 42. Attachment Payload

```json
{
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "base64": "BASE64_DATA",
  "fileSize": 245678,
  "width": 1200,
  "height": 900,
  "isPublic": true,
  "fileRole": "report"
}
```

### Validation

- Base64 ต้อง Decode ได้
- ตรวจ Magic Bytes หรือ Content Signature เท่าที่ทำได้
- MIME Type อยู่ใน Whitelist
- Size ไม่เกิน Limit
- Dimension ไม่เกิน Limit
- จำนวนไม่เกิน Limit
- ตั้งชื่อไฟล์ใหม่
- บันทึกใน Folder ที่ถูกต้อง
- ไม่เปิด Root Folder เป็น Public

### Error Codes

- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `FILE_LIMIT_EXCEEDED`
- `FILE_DECODE_FAILED`
- `FILE_UPLOAD_FAILED`

---

# PART N — PAGINATION, SEARCH, FILTER

## 43. Pagination Standard

Request:

```json
{
  "page": 1,
  "pageSize": 20
}
```

Response:

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

### Rules

- Default 20
- Maximum 100
- Invalid Page ใช้ 1 หรือ Error ตามกติกา
- Filter เปลี่ยนต้องกลับหน้า 1
- Backend ต้องไม่คืนข้อมูลทั้งหมดโดยไม่จำเป็น

---

## 44. Sort Standard

```json
{
  "sortBy": "created_at",
  "sortDirection": "desc"
}
```

Sort Field ต้องอยู่ใน Whitelist:

- `created_at`
- `updated_at`
- `priority`
- `status`
- `target_due_at`

ห้ามนำค่า Sort ไปใช้โดยตรงโดยไม่ Validate

---

## 45. Search Standard

- Trim
- Normalize Space
- Limit ความยาว
- Search จาก `search_text`
- ไม่ค้น PII หาก Role ไม่มีสิทธิ์
- Debounce ฝั่ง Frontend
- Rate Limit เมื่อจำเป็น

---

# PART O — IDEMPOTENCY AND VERSIONING

## 46. Request ID

ใช้กับ:

- `report.create`
- `report.addInfo`
- Upload
- Export ตามความเหมาะสม

### Duplicate Request Response

```json
{
  "ok": false,
  "error": {
    "code": "DUPLICATE_REQUEST",
    "message": "คำขอนี้ถูกดำเนินการไปแล้ว"
  },
  "meta": {}
}
```

หรืออาจคืนผลเดิมหากเก็บ Result ไว้

---

## 47. Optimistic Versioning

Update Request ต้องส่ง `version`

หาก Version ไม่ตรง:

```json
{
  "ok": false,
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "ข้อมูลนี้ถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่"
  },
  "meta": {}
}
```

Frontend ต้อง Reload Detail ก่อนแก้ซ้ำ

---

# PART P — ERROR CODES

## 48. Standard Error Codes

| Code | ความหมาย |
|---|---|
| `VALIDATION_ERROR` | ข้อมูลไม่ถูกต้อง |
| `UNAUTHORIZED` | ยังไม่ได้เข้าสู่ระบบ |
| `FORBIDDEN` | ไม่มีสิทธิ์ |
| `NOT_FOUND` | ไม่พบข้อมูล |
| `DUPLICATE` | ข้อมูลซ้ำ |
| `DUPLICATE_REQUEST` | Request ถูกใช้แล้ว |
| `RATE_LIMITED` | ใช้งานถี่เกินไป |
| `INVALID_CREDENTIALS` | Login ไม่ถูกต้อง |
| `ACCOUNT_INACTIVE` | บัญชีปิดใช้งาน |
| `ACCOUNT_LOCKED` | บัญชีถูกล็อก |
| `SESSION_EXPIRED` | Session หมดอายุ |
| `SESSION_REVOKED` | Session ถูกยกเลิก |
| `INVALID_FILE_TYPE` | ประเภทไฟล์ไม่รองรับ |
| `FILE_TOO_LARGE` | ไฟล์ใหญ่เกินไป |
| `FILE_LIMIT_EXCEEDED` | จำนวนไฟล์เกินกำหนด |
| `FILE_DECODE_FAILED` | ถอดรหัสไฟล์ไม่สำเร็จ |
| `FILE_UPLOAD_FAILED` | อัปโหลดไม่สำเร็จ |
| `CATEGORY_NOT_AVAILABLE` | หมวดไม่พร้อมใช้งาน |
| `INVALID_STATUS_TRANSITION` | เปลี่ยนสถานะไม่ได้ |
| `VERSION_CONFLICT` | Version ไม่ตรง |
| `REPORT_CLOSED` | เรื่องถูกปิดแล้ว |
| `MAINTENANCE_MODE` | ระบบอยู่ระหว่างปรับปรุง |
| `INTERNAL_ERROR` | ระบบขัดข้อง |

---

## 49. Validation Error Example

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "กรุณาตรวจสอบข้อมูล",
    "fields": {
      "title": "กรุณากรอกหัวข้อ",
      "reporter.phone": "รูปแบบเบอร์โทรไม่ถูกต้อง"
    }
  },
  "meta": {}
}
```

---

# PART Q — RATE LIMIT

## 50. Suggested Limits

| Action | Limit |
|---|---|
| `report.create` | 5 ครั้ง / 10 นาที |
| `report.track` | 30 ครั้ง / 10 นาที |
| `report.addInfo` | 10 ครั้ง / 10 นาที |
| `auth.login` | 5 ครั้ง / 15 นาที |
| Admin Read API | ตาม Session และพฤติกรรม |
| Upload | ตามจำนวนไฟล์และ Action |

### Response

```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง",
    "retryAfterSeconds": 300
  },
  "meta": {}
}
```

---

# PART R — CORS AND ORIGIN

## 51. Allowed Origin

Production:

```text
https://khaophangreport.pages.dev
```

Development อาจเพิ่ม Origin ที่กำหนดชัดเจน

### Rules

- Origin อยู่ใน Script Properties
- ห้ามใช้ `*` กับ Admin API หากหลีกเลี่ยงได้
- ตรวจ Origin เท่าที่ Apps Script รองรับ
- Session Token ยังต้องตรวจเสมอ
- CORS ไม่ใช่ตัวแทน Authentication

---

# PART S — LOGGING

## 52. Request Logging

Log ได้:

- Request ID
- Action
- User ID
- Success/Failure
- Duration
- Error Code
- Timestamp

ห้าม Log:

- Password
- Raw Session Token
- Base64 File
- Salt
- Secret
- PII เต็มรูปแบบโดยไม่จำเป็น

---

## 53. Activity Log vs Technical Log

### Activity Log

สำหรับตรวจสอบการกระทำของผู้ใช้

### Technical Log

สำหรับ Debug ระบบ

ทั้งสองต้องไม่เก็บ Secret

---

# PART T — ROUTER DESIGN

## 54. Router Whitelist

ตัวอย่าง:

```javascript
const ACTIONS = {
  "health.check": HealthService.check,
  "public.config": SettingsService.getPublicConfig,
  "category.list": CategoryService.listPublic,
  "announcement.list": AnnouncementService.listPublic,
  "report.create": ReportService.create,
  "report.track": ReportService.track,
  "report.addInfo": ReportService.addInfo,
  "auth.login": AuthService.login,
  "auth.me": AuthService.me,
  "auth.logout": AuthService.logout,
  "dashboard.summary": DashboardService.summary,
  "admin.report.list": ReportService.listAdmin,
  "admin.report.detail": ReportService.detailAdmin,
  "admin.report.updateStatus": ReportService.updateStatus,
  "admin.report.assign": AssignmentService.assign,
  "admin.report.addUpdate": ReportService.addUpdate
};
```

### Rules

- ห้ามเรียก Function ด้วยชื่อจาก Input โดยตรง
- ใช้ Whitelist เท่านั้น
- ตรวจ Method
- Parse JSON อย่างปลอดภัย
- Catch Error กลาง
- Return Response Format เดียวกัน

---

# PART U — FRONTEND API CLIENT

## 55. Suggested API Client Contract

```javascript
async function apiRequest(action, data = {}, options = {}) {
  const payload = {
    action,
    requestId: options.requestId || crypto.randomUUID(),
    sessionToken: options.sessionToken || "",
    data
  };

  const response = await fetch(window.APP_CONFIG.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!result.ok) {
    throw new ApiError(result.error, result.meta);
  }

  return result;
}
```

### Rules

- Timeout
- AbortController
- Retry เฉพาะ Read Action ที่ปลอดภัย
- ห้าม Retry Create อัตโนมัติโดยไม่มี Request ID
- Handle Session Expired กลาง
- Handle Rate Limit กลาง
- ไม่แสดง Technical Error ต่อผู้ใช้

---

# PART V — TEST CASES

## 56. Public API Tests

- `public.config` สำเร็จ
- Category เฉพาะ Active
- Create Report ปกติ
- Create Anonymous
- Missing Consent
- Invalid Category
- Invalid Location
- 4 Attachments
- Oversized File
- Duplicate Request
- Track Found
- Track Not Found
- Add Info
- Add Info Closed Report
- Rate Limit

---

## 57. Authentication Tests

- Login Success
- Wrong Password
- Unknown Username
- Inactive Account
- Locked Account
- Expired Session
- Revoked Session
- Logout
- Change Password
- Must Change Password

---

## 58. Admin API Tests

- Role Permission
- Officer Scope
- Viewer Read-only
- Pagination
- Search
- Filter
- Detail
- Assign
- Reassign
- Status Transition Valid
- Status Transition Invalid
- Version Conflict
- Resolve without Result
- Reject without Reason
- Close before Resolved
- Add Public Update
- Add Internal Note
- Export without PII
- Export with PII Permission

---

# PART W — ACCEPTANCE CRITERIA

## 59. API Acceptance Criteria

- [ ] ทุก Action อยู่ใน Whitelist
- [ ] Request Envelope แบบเดียวกัน
- [ ] Response Envelope แบบเดียวกัน
- [ ] Error Code สม่ำเสมอ
- [ ] Public API ไม่คืน PII
- [ ] Admin API ตรวจ Session
- [ ] Permission ตรวจ Backend
- [ ] Password ไม่ถูก Log
- [ ] Raw Token ไม่ถูกเก็บ
- [ ] Upload ตรวจ Type และ Size
- [ ] Create Report รองรับ Idempotency
- [ ] Update รองรับ Version Conflict
- [ ] Status Transition ตรวจ Backend
- [ ] Timeline ถูกสร้างทุกครั้ง
- [ ] Activity Log ถูกสร้าง
- [ ] Pagination ใช้งานได้
- [ ] Rate Limit ทำงาน
- [ ] CORS/Origin ตั้งค่า
- [ ] Maintenance Mode รองรับ
- [ ] Test Public, Auth, Admin ครบ
- [ ] ไม่มี Stack Trace ใน Response
- [ ] ไม่มี Secret ใน Frontend หรือ Repository

---

## 60. ความสัมพันธ์กับเอกสารอื่น

- `APP_SPEC.md` กำหนดว่าระบบต้องทำอะไร
- `UI_FLOW.md` กำหนดว่าหน้าจอเรียก Action ใดเมื่อใด
- `DATA_SCHEMA.md` กำหนด Field, Enum และความสัมพันธ์
- `API_SPEC.md` กำหนดการสื่อสาร Frontend–Backend
- `DEVELOPMENT_RULES.md` จะกำหนดมาตรฐานการเขียนโค้ด ทดสอบ และ Deploy

หากชื่อ Field ใน API ต่างจากชื่อ Column ใน Sheet ต้องมี Mapping ชัดเจนใน Repository/Mapper

---

## 61. ข้อกำหนดที่ยังต้องยืนยันก่อน Production

- Session Lifetime
- วิธีเก็บ Session Token ฝั่ง Frontend
- Password Hash Algorithm ที่ใช้จริง
- CORS Strategy ของ Apps Script
- Reopen Policy
- การเพิ่มข้อมูลหลัง Closed
- Export File Strategy
- Data Retention
- Emergency Contacts
- Contact Phone
- Privacy Version
- Consent Text
- Permission รายละเอียดของ Admin และ Viewer

---

## 62. สรุป

API ของ Khaophang Report ต้องมีคุณสมบัติ:

- เรียบง่าย
- มีรูปแบบเดียวกัน
- ตรวจสอบข้อมูลทุกครั้ง
- แยก Public และ Admin ชัดเจน
- ป้องกันข้อมูลส่วนบุคคลรั่ว
- ป้องกัน Request ซ้ำ
- รองรับ Version Conflict
- บันทึก Timeline
- บันทึก Activity Log
- รองรับ Pagination
- รองรับ Upload อย่างปลอดภัย
- รองรับการย้ายฐานข้อมูลในอนาคต

หลักสำคัญ:

> Frontend เป็นผู้ส่งคำขอ แต่ Backend เป็นผู้ตัดสินความถูกต้อง สิทธิ์ สถานะ และความปลอดภัยทั้งหมด

---

**End of API_SPEC.md**
