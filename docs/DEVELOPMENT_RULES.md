# Khaophang Report — DEVELOPMENT_RULES

> กฎและมาตรฐานการพัฒนาเว็บแอป Khaophang Report  
> ใช้เป็นข้อบังคับกลางสำหรับผู้พัฒนา ผู้ตรวจสอบโค้ด และ AI Coding Assistant เช่น Codex

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | DEVELOPMENT_RULES.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชันเอกสาร | 1.0.0 |
| สถานะ | Approved for Development |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| เอกสารอ้างอิง | APP_SPEC.md, UI_FLOW.md, DATA_SCHEMA.md, API_SPEC.md |
| Production Domain | https://khaophangreport.pages.dev |
| Repository | https://github.com/khaophangreport-spec/khaophangreport.git |
| Project Email | khaophangreport@gmail.com |

---

## 2. วัตถุประสงค์

เอกสารนี้กำหนดกฎการพัฒนา เพื่อให้:

- โค้ดเป็นระเบียบ
- สถาปัตยกรรมไม่หลุดจากสเปก
- Frontend และ Backend สื่อสารตรงกัน
- ข้อมูลไม่เสียหาย
- ระบบปลอดภัย
- ทดสอบได้
- แก้ไขต่อได้ง่าย
- ใช้ Codex หรือ AI Coding Assistant ได้โดยไม่สร้างโค้ดกระจัดกระจาย
- ลดการแก้ย้อนหลัง
- รองรับการย้ายฐานข้อมูลในอนาคต

หากคำสั่งใดขัดกับเอกสารชุดหลัก ให้ยึดลำดับดังนี้:

1. `APP_SPEC.md`
2. `UI_FLOW.md`
3. `DATA_SCHEMA.md`
4. `API_SPEC.md`
5. `DEVELOPMENT_RULES.md`
6. Prompt เฉพาะงาน

Prompt ห้ามสั่งเปลี่ยนสถาปัตยกรรมหลักโดยไม่แก้เอกสารก่อน

---

# PART A — CORE PRINCIPLES

## 3. หลักการบังคับ

1. ใช้ HTML, CSS และ Vanilla JavaScript
2. ใช้ Google Apps Script เป็น Backend
3. ใช้ Google Sheets เป็นฐานข้อมูล
4. ใช้ Google Drive เก็บไฟล์
5. ใช้ Cloudflare Pages เป็น Frontend Hosting
6. ใช้ GitHub เป็น Version Control
7. Mobile-first สำหรับฝั่งประชาชน
8. Responsive สำหรับทุกหน้า
9. ภาษาไทยเป็นภาษาหลัก
10. ไม่เพิ่ม Framework โดยไม่มีเหตุผลจำเป็น
11. ไม่เก็บ Secret ใน Frontend
12. ไม่เชื่อข้อมูลจาก Frontend
13. ตรวจ Validation ทั้ง Frontend และ Backend
14. Admin API ทุกตัวต้องตรวจ Session
15. การแก้ข้อมูลสำคัญต้องมี Activity Log
16. การเปลี่ยนสถานะต้องมี Timeline
17. ใช้ Soft Delete
18. ใช้ Pagination
19. ใช้ Idempotency สำหรับคำขอที่เสี่ยงซ้ำ
20. ใช้ Version Conflict Protection สำหรับการแก้ข้อมูล
21. ไม่ใช้ Google Sheets เป็น Public API โดยตรง
22. ไม่เก็บรูปภาพ Base64 ใน Sheet
23. ไม่เก็บ Password แบบข้อความธรรมดา
24. ไม่เก็บ Raw Session Token
25. ต้องทดสอบบนมือถือจริงก่อน Production

---

## 4. สิ่งที่ห้ามเปลี่ยนโดยไม่ได้รับอนุมัติ

- Technology Stack
- ชื่อระบบ
- Domain หลัก
- Repository หลัก
- Status Enum
- Role Enum
- ชื่อ Sheet
- ชื่อคอลัมน์
- รูปแบบ API Envelope
- Public/Admin Boundary
- UX/UI แนวทางสีเขียวธรรมชาติ
- โครงสร้าง Report Flow 6 ขั้น
- Tracking Code Concept
- Privacy Rules
- Security Rules

หากจำเป็นต้องเปลี่ยน ต้อง:

1. ระบุเหตุผล
2. วิเคราะห์ผลกระทบ
3. แก้เอกสารที่เกี่ยวข้อง
4. ทำ Migration Plan
5. สำรองข้อมูล
6. ทดสอบก่อนใช้จริง

---

# PART B — PROJECT STRUCTURE

## 5. โครงสร้างโปรเจ็กต์มาตรฐาน

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
│   │
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
│   │   ├── public/
│   │   │   ├── home.js
│   │   │   ├── report.js
│   │   │   └── track.js
│   │   └── admin/
│   │       ├── dashboard.js
│   │       ├── reports.js
│   │       ├── report-detail.js
│   │       ├── users.js
│   │       └── settings.js
│   │
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

## 6. กฎการจัดไฟล์

- หนึ่งไฟล์ควรมีหน้าที่หลักชัดเจน
- ห้ามใส่ JavaScript จำนวนมากไว้ใน HTML
- ห้ามใส่ CSS จำนวนมากไว้ใน HTML
- Shared Code ต้องอยู่ในไฟล์กลาง
- Public และ Admin Code ต้องแยกกัน
- ห้าม Copy Utility Function ซ้ำหลายไฟล์
- Config ต้องมีจุดเดียว
- API Client ต้องมีจุดเดียว
- Auth Logic ต้องมีจุดเดียว
- Validation Rule ที่ใช้ซ้ำต้องรวมศูนย์
- ห้ามสร้างไฟล์ชื่อคลุมเครือ เช่น `test2.js`, `new.js`, `final-final.css`

---

# PART C — HTML RULES

## 7. มาตรฐาน HTML

- ใช้ HTML5 Semantic Elements
- ระบุ `lang="th"`
- มี `<meta name="viewport">`
- มี Page Title
- มี Meta Description
- ใช้ Heading ตามลำดับ
- หนึ่งหน้ามี `<h1>` หลักหนึ่งรายการ
- Form ทุกช่องต้องมี Label
- Button ใช้ `<button>`
- Navigation ใช้ `<nav>`
- Main Content ใช้ `<main>`
- Footer ใช้ `<footer>`
- Link ใช้ `<a>`
- ห้ามใช้ `<div>` เป็นปุ่ม
- รูปสำคัญต้องมี Alt Text
- รูปตกแต่งใช้ `alt=""`
- ห้ามใช้ Inline Event เช่น `onclick=""`
- ห้ามใช้ Inline Style เว้นแต่มีเหตุผลเฉพาะ

### ตัวอย่างที่ถูกต้อง

```html
<label for="report-title">หัวข้อปัญหา</label>
<input
  id="report-title"
  name="title"
  type="text"
  required
  maxlength="150"
  aria-describedby="report-title-error"
/>
<p id="report-title-error" class="field-error"></p>
```

---

## 8. Accessibility HTML

- Interactive Element ต้อง Keyboard ใช้งานได้
- Icon-only Button ต้องมี `aria-label`
- Modal ต้องมี `role="dialog"`
- Error ต้องเชื่อมกับ Field
- Stepper ใช้ `aria-current="step"`
- Loading สำคัญใช้ `aria-live`
- Drawer ต้องจัดการ Focus
- ห้ามใช้ Placeholder แทน Label
- ห้ามปิด Zoom
- Touch Target ขั้นต่ำ 44 × 44 px

---

# PART D — CSS RULES

## 9. CSS Architecture

ลำดับไฟล์:

1. `variables.css`
2. `reset.css`
3. `base.css`
4. `components.css`
5. `utilities.css`
6. `public.css` หรือ `admin.css`

### Responsibilities

#### variables.css

- Colors
- Typography
- Spacing
- Radius
- Shadow
- Z-index
- Breakpoints Concept

#### reset.css

- Browser Reset
- Box Sizing

#### base.css

- Body
- Typography
- Global Elements

#### components.css

- Button
- Card
- Form
- Modal
- Toast
- Status Chip
- Stepper

#### utilities.css

- Layout Helpers
- Screen Reader Only
- Spacing Helpers ที่จำเป็น

#### public.css

- Public Page Layout

#### admin.css

- Admin Layout
- Sidebar
- Table
- Dashboard

---

## 10. CSS Naming

ใช้ชื่อแบบอ่านง่าย:

```css
.report-card {}
.report-card__title {}
.report-card__meta {}
.report-card--urgent {}
```

หรือใช้ Component Naming ที่สม่ำเสมอทั้งโปรเจ็กต์

ห้าม:

```css
.box1 {}
.green-text2 {}
.a {}
.temp-style {}
```

---

## 11. Design Tokens

ห้าม Hardcode สีหลักซ้ำหลายจุด

ใช้:

```css
:root {
  --color-primary-900: #174A2B;
  --color-primary-700: #287444;
  --color-primary-100: #E7F3EA;
  --color-background: #F7F8F3;
  --color-surface: #FFFFFF;
  --color-text: #1D2A22;
  --color-text-muted: #66736B;
  --color-border: #DDE5DF;
  --color-success: #2E7D32;
  --color-warning: #D98200;
  --color-danger: #C0392B;
}
```

### UX/UI Character

- เรียบง่าย
- อบอุ่น
- เป็นมิตร
- สีเขียวธรรมชาติ
- ไม่แข็งแบบระบบราชการ
- Card มุมโค้ง
- เงาอ่อน
- Spacing โปร่ง
- Contrast อ่านง่าย

---

## 12. Responsive Rules

- Base Style เริ่มที่ Mobile
- ห้ามออกแบบ Desktop แล้วค่อยย่อ
- รองรับ 320px
- ห้ามเกิด Horizontal Scroll โดยไม่จำเป็น
- Mobile Public ใช้ Bottom Navigation
- Desktop Public ใช้ Top Navigation
- Admin Desktop ใช้ Sidebar
- Admin Mobile ใช้ Drawer
- Table ต้องมี Mobile Card Alternative
- Sticky Element ต้องไม่บัง Form

---

## 13. CSS Restrictions

- ห้ามใช้ `!important` โดยไม่จำเป็น
- ห้ามใช้เลข `z-index` แบบสุ่ม
- ห้าม Hardcode ความสูงที่ทำให้ Content ถูกตัด
- ห้ามใช้ Fixed Width กับ Main Layout
- ห้ามซ่อน Focus Outline โดยไม่มี Replacement
- ห้ามใช้สีเพียงอย่างเดียวแสดง Status
- ห้ามเพิ่ม CSS Framework ใน MVP โดยไม่ได้อนุมัติ
- ห้ามใช้ Tailwind CDN ใน Production

---

# PART E — JAVASCRIPT RULES

## 14. JavaScript Standard

- ใช้ Vanilla JavaScript
- ใช้ `const` เป็นค่าเริ่มต้น
- ใช้ `let` เมื่อค่าต้องเปลี่ยน
- ห้ามใช้ `var`
- ใช้ Strict Comparison
- ใช้ `async/await`
- ใช้ `try/catch`
- ตรวจ Null/Undefined
- ห้ามสร้าง Global Variable โดยไม่จำเป็น
- ใช้ Module Pattern หรือ ES Modules หาก Hosting รองรับ
- Function ต้องมีหน้าที่เดียว
- ชื่อ Function เป็น Verb
- ชื่อ Boolean ขึ้นต้นด้วย `is`, `has`, `can`, `should`

### ตัวอย่าง

```javascript
async function loadCategories() {
  try {
    setLoading(true);
    const result = await apiRequest("category.list", {});
    renderCategories(result.data.items);
  } catch (error) {
    showCategoryError(error);
  } finally {
    setLoading(false);
  }
}
```

---

## 15. Naming Convention

| ประเภท | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Variable | camelCase | `trackingCode` |
| Function | camelCase | `loadReportDetail` |
| Constant | UPPER_SNAKE_CASE | `MAX_IMAGES` |
| Class | PascalCase | `ApiError` |
| Data Attribute | kebab-case | `data-report-id` |
| API Field | camelCase | `reportId` |
| Sheet Column | snake_case | `report_id` |

Mapping ระหว่าง API Field กับ Sheet Column ต้องทำใน Mapper/Repository

---

## 16. DOM Rules

- Query DOM ครั้งเดียวเมื่อทำได้
- Cache Element Reference
- ใช้ `textContent` กับข้อมูลผู้ใช้
- หลีกเลี่ยง `innerHTML`
- หากจำเป็นต้องใช้ HTML จากข้อมูล ต้อง Sanitize
- Event Listener ต้องติดตั้งอย่างเป็นระบบ
- ห้ามผูก Listener ซ้ำเมื่อ Render
- Dynamic List ใช้ Event Delegation เมื่อเหมาะสม
- Loading, Empty, Error, Success ต้องแยก State

---

## 17. Form Rules

ทุก Form ต้อง:

- Validate ก่อนส่ง
- Disable Submit ระหว่างส่ง
- ป้องกัน Double Submit
- คงข้อมูลเมื่อ Network Error
- Scroll ไป Field แรกที่ผิด
- แสดง Error ใต้ Field
- ล้าง Error เมื่อแก้ถูก
- ไม่แสดง Error ก่อนผู้ใช้แตะ Fieldโดยไม่จำเป็น
- แสดง Character Count เมื่อมี Limit
- มี Confirmation สำหรับ Action สำคัญ

---

## 18. Local Storage Rules

ใช้ได้เฉพาะ:

- Draft ที่ไม่อ่อนไหว
- UI Preference
- Tracking Code ล่าสุดตามนโยบาย
- Session ตามแนวทางที่เลือกและประเมินความเสี่ยงแล้ว

ห้ามเก็บ:

- Password
- Password Hash
- Secret
- Raw Personal Data เกินจำเป็น
- Base64 รูปขนาดใหญ่ถาวร
- Permission เป็นแหล่งจริง
-ข้อมูลที่ Backend ต้องเป็นผู้ตัดสิน

Key ต้องมี Prefix:

```text
KPR_
```

ตัวอย่าง:

```text
KPR_REPORT_DRAFT_V1
KPR_LAST_TRACKING_CODE
```

---

# PART F — FRONTEND API RULES

## 19. API Client

ทุก API Call ต้องผ่าน `assets/js/api.js`

ห้ามเขียน `fetch()` กระจายตามหน้า ยกเว้นมีเหตุผลที่บันทึกไว้

API Client ต้องจัดการ:

- Base URL
- Request Envelope
- Request ID
- Session Token
- Timeout
- JSON Parsing
- Error Mapping
- Session Expired
- Rate Limit
- Network Error
- Retry เฉพาะ Read
- AbortController

---

## 20. Retry Rules

Retry ได้อัตโนมัติ:

- Public Config
- Category List
- Announcement List
- Read-only Dashboard ตามความเหมาะสม

ห้าม Retry อัตโนมัติ:

- Create Report
- Add Info
- Update Status
- Assign
- Upload
- Export

เว้นแต่มี Idempotency และตรวจผลเดิมได้

---

## 21. API Error Handling

Frontend ต้องแปลง Error เป็นข้อความผู้ใช้

ตัวอย่าง:

```javascript
const ERROR_MESSAGES = {
  VALIDATION_ERROR: "กรุณาตรวจสอบข้อมูล",
  RATE_LIMITED: "มีการใช้งานถี่เกินไป กรุณาลองใหม่ภายหลัง",
  SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อระบบได้"
};
```

ห้ามแสดง:

- Stack Trace
- Function Name ภายใน
- Spreadsheet ID
- Folder ID
- Deployment Detail
- Raw Exception

---

# PART G — GOOGLE APPS SCRIPT RULES

## 22. Apps Script Layering

### Router Layer

- Parse Request
- Validate Action
- Dispatch
- Catch Error กลาง
- Return Response Format กลาง

### Service Layer

- Business Logic
- Permission
- Status Transition
- Transaction-like Flow
- Activity Log

### Repository Layer

- Read/Write Sheet
- Header Mapping
- Row/Object Conversion
- Find by ID
- Pagination Support

### Utility Layer

- UUID
- Date
- Sanitize
- Hash
- Validation Helper

ห้ามให้ Router เขียน Sheet โดยตรง

---

## 23. Apps Script File Responsibilities

### Code.gs

- `doGet`
- `doPost`
- Entry Point เท่านั้น

### Router.gs

- Action Whitelist
- Routing

### Response.gs

- Success/Error Response

### Validation.gs

- Shared Validation

### AuthService.gs

- Login
- Password Verify
- Permission

### SessionService.gs

- Create
- Validate
- Revoke
- Cleanup

### ReportService.gs

- Create
- Track
- List
- Detail
- Status
- Timeline

### SheetRepository.gs

- Generic Sheet Access

### DriveRepository.gs

- Folder/File Access

### Setup.gs

- Setup
- Seed
- Migration Entry

### Tests.gs

- Unit-like Test Functions
- Integration Test Helpers

---

## 24. Router Security

ห้ามทำ:

```javascript
this[action]();
```

ต้องใช้ Whitelist:

```javascript
const ACTIONS = {
  "report.create": ReportService.create,
  "report.track": ReportService.track
};
```

Unknown Action ต้องตอบ:

```text
VALIDATION_ERROR หรือ NOT_FOUND ตามมาตรฐานที่กำหนด
```

---

## 25. Sheet Repository Rules

- อ่าน Header แล้วสร้าง Map
- ห้ามพึ่ง Column Number ถาวร
- ห้ามใช้ `getDataRange()` ทุก Request โดยไม่จำเป็น
- ใช้ Batch Read/Write
- ใช้ Lock เมื่อแก้ข้อมูลสำคัญ
- ใช้ Cache กับ Config/Category
- Filter Soft Deleted
- Return Object ไม่ Return Raw Row
- ตรวจ Duplicate ID
- Version เพิ่มทุก Update
- Timestamp อัปเดตสม่ำเสมอ

---

## 26. Date and Time

Backend เก็บ ISO 8601

ใช้ Time Zone:

```text
Asia/Bangkok
```

แต่ค่าที่ส่งและเก็บควรตีความได้ชัดเจน

ห้าม:

- เปรียบเทียบวันที่ด้วย String ที่ Format ไม่คงที่
- เก็บวันที่ภาษาไทยในฐานข้อมูล
- เก็บ พ.ศ. เป็นค่าระบบ
- พึ่ง Browser Time เป็นแหล่งจริงสำหรับ Timestamp สำคัญ

---

## 27. Lock Service

ต้องใช้เมื่อ:

- สร้าง Tracking Code
- ตรวจ Request ID
- Create Report
- Update Status
- Assign/Reassign
- Create User
- Run Migration
- Update Counter

Lock ต้อง:

- มี Timeout
- Release ใน `finally`
- ไม่ Lock นานเกินจำเป็น
- ไม่เรียก External Operation ช้าโดยไม่จำเป็นระหว่าง Lock

---

## 28. Cache Service

เหมาะกับ:

- Public Config
- Category List
- Announcement List
- Dashboard Summary
- User Permission Map ตามความเหมาะสม

Cache ต้อง Clear เมื่อข้อมูลต้นทางเปลี่ยน

ห้ามใช้ Cache เป็นแหล่งจริง

---

# PART H — SECURITY RULES

## 29. Secret Management

เก็บใน Apps Script Properties:

- `SPREADSHEET_ID`
- `ROOT_FOLDER_ID`
- `APP_SECRET`
- `SESSION_SECRET`
- `ALLOWED_ORIGIN`
- `ADMIN_SETUP_KEY`
- `ENVIRONMENT`

ห้ามเก็บใน:

- `config.js`
- HTML
- GitHub
- Google Sheets Public Setting
- Log
- Screenshot/Documentation ที่เผยแพร่

---

## 30. Password Rules

- Hash + Salt
- ขั้นต่ำ 8 ตัวอักษร
- ห้าม Plain Text
- ห้าม Log
- ห้ามส่งกลับ Frontend
- Temporary Password ต้องบังคับเปลี่ยน
- Reset Password ต้อง Revoke Session ตามนโยบาย
- Login Error ต้องไม่บอกว่า Username มีจริงหรือไม่

---

## 31. Session Rules

- Token ต้องสุ่ม
- เก็บเฉพาะ Token Hash
- มี Expiry
- Logout ต้อง Revoke
- Inactive User ใช้ Session เดิมไม่ได้
- Password Change ต้อง Revoke ตามนโยบาย
- Admin API ตรวจทุกครั้ง
- Token ห้ามอยู่ใน URL
- Token ห้ามอยู่ใน Log

---

## 32. Authorization Rules

- Frontend ซ่อนปุ่มได้ แต่ไม่ใช่ Security
- Backend ตรวจ Permission ทุก Write Action
- Officer จำกัด Scope
- Viewer Read-only
- PII แสดงตาม Role
- Internal Notes จำกัด Role
- Super Admin Action สำคัญต้อง Log

---

## 33. Input Security

- Whitelist Field
- ตรวจ Type
- จำกัด Length
- Sanitize
- Escape Output
- ตรวจ Enum
- ตรวจ ID
- ตรวจ URL
- ตรวจ File MIME
- ตรวจ File Size
- ตรวจ Status Transition
- ป้องกัน Formula Injection ใน CSV
- ไม่ใช้ `eval`
- ไม่ใช้ Dynamic Function จาก Input

---

## 34. File Security

- JPG, PNG, WebP เท่านั้น
- ตรวจ MIME จาก Content เท่าที่ทำได้
- ตั้งชื่อไฟล์ใหม่
- ไม่ใช้ชื่อผู้แจ้ง
- ไม่เปิด Root Folder Public
- Public File ต้องผ่าน Control
- จำกัด 3 รูป
- จำกัด 1 MB หลังบีบอัด
- จำกัดด้านยาว 1,600 px
- Cleanup Temp

---

## 35. Privacy Rules

- เก็บข้อมูลเท่าที่จำเป็น
- Anonymous Report ห้ามเก็บ PII ที่ไม่จำเป็น
- Public Tracking ห้ามแสดง PII
- Public Timeline ห้ามแสดง Internal Note
- Export Default ไม่รวม PII
- PII Export ต้องมี Permission
- ต้องมี Privacy Policy
- ต้องมี Consent Version
- Data Retention ต้องกำหนดก่อน Production

---

# PART I — DATA RULES

## 36. Schema Compliance

- ชื่อ Sheet ต้องตรง `DATA_SCHEMA.md`
- ชื่อ Column ต้องตรง
- Enum ต้องตรง
- API Mapping ต้องชัด
- ห้ามเพิ่ม Column โดยไม่อัปเดตเอกสาร
- ห้ามลบ Column ตรง ๆ
- ใช้ Migration
- Backup ก่อน Migration

---

## 37. Soft Delete

ห้ามลบแถวข้อมูลหลักจริงในงานปกติ

ใช้:

- `is_deleted`
- `deleted_at`
- `deleted_by`

Read Query ต้องไม่คืน Soft Deleted เว้นแต่ Action เฉพาะ

---

## 38. Versioning

Entity สำคัญต้องมี `version`

Update ต้อง:

1. รับ Version จาก Client
2. เปรียบเทียบ
3. หากไม่ตรงตอบ `VERSION_CONFLICT`
4. หากตรง Update และ +1

---

## 39. Idempotency

ใช้ Request ID กับ:

- Create Report
- Add Additional Info
- Upload สำคัญ
- Export ตามความเหมาะสม

Backend ต้องตรวจ Request ซ้ำ

---

## 40. Referential Integrity

Service ต้องตรวจ:

- Category มีจริง
- User มีจริงและ Active
- Report มีจริง
- Attachment ผูก Parent ถูก
- Assignment ตรงกับ Report
- Duplicate Link ถูก
- Parent/Child Soft Delete สอดคล้อง

---

# PART J — STATUS WORKFLOW RULES

## 41. Status Source of Truth

Backend เป็นผู้ตัดสิน Status Transition

Frontend มีหน้าที่:

- แสดงตัวเลือกที่เป็นไปได้
- ส่งคำขอ
- แสดงผล

Frontend ห้ามบังคับเปลี่ยน Status ด้วยตนเอง

---

## 42. Status Transition

ใช้ Matrix จาก `API_SPEC.md`

ทุก Transition ต้อง:

- ตรวจ Permission
- ตรวจ Current Status
- ตรวจ Required Fields
- Update Timestamp
- เพิ่ม Timeline
- เพิ่ม Activity Log
- เพิ่ม Version
- Clear Dashboard Cache

---

## 43. Required Data by Status

- `waiting`: Public Message
- `resolved`: Result
- `closed`: Resolved ก่อน หรือ Policy อนุญาต
- `rejected`: Rejection Reason
- `duplicate`: Duplicate Reference/Reason
- Reopen: Reason

---

# PART K — UX IMPLEMENTATION RULES

## 44. Global UI States

ทุก API-driven Screen ต้องมี:

- Loading
- Empty
- Error
- Success
- Disabled
- Offline เมื่อเหมาะสม

ห้ามแสดง Blank Screen

---

## 45. Public Form Flow

Report Form ต้องมี 6 ขั้น:

1. หมวด
2. รายละเอียด
3. สถานที่
4. รูปภาพ
5. ข้อมูลผู้แจ้ง
6. ตรวจสอบและยืนยัน

กฎ:

- ย้อนกลับแล้วข้อมูลไม่หาย
- Stepper แสดงตำแหน่ง
- Validate ต่อ Step
- Final Validate ก่อน Submit
- Draft ปลอดภัย
- Submit ป้องกันซ้ำ
- Success Page ต้องมี Tracking Code

---

## 46. Status Color

Status Chip ต้องมี:

- สี
- ข้อความ
- Icon เมื่อเหมาะสม

ห้ามใช้สีอย่างเดียว

---

## 47. Modal and Toast

- Modal สำคัญต้อง Trap Focus
- Restore Focus เมื่อปิด
- Toast ไม่บัง Bottom Navigation
- Success สำคัญต้องมี State ในหน้า ไม่ใช้ Toast อย่างเดียว
- Dangerous Action ต้อง Confirmation

---

# PART L — ERROR HANDLING

## 48. Error Policy

ทุก Error ต้อง:

- มี Code
- มี Message
- ไม่เปิดเผย Internal Detail
- Log Technical Detail ฝั่ง Backend อย่างปลอดภัย
- Frontend แสดงข้อความเข้าใจง่าย
- คง Form Data
- ให้ Retry เมื่อเหมาะสม

---

## 49. Error Categories

### User Error

- Validation
- Invalid File
- Missing Field

### Auth Error

- Unauthorized
- Session Expired
- Forbidden

### Conflict Error

- Version Conflict
- Duplicate Request
- Invalid Transition

### System Error

- Sheet Access
- Drive Upload
- Unknown Failure

System Error ต้องตอบ `INTERNAL_ERROR` โดยไม่เปิด Stack Trace

---

# PART M — TESTING RULES

## 50. Testing Levels

### Static Check

- HTML Structure
- CSS Syntax
- JavaScript Syntax
- Apps Script Syntax
- Missing File Reference

### Functional Test

- Public Flow
- Track Flow
- Login
- Admin CRUD
- Status
- Assignment
- Export

### Security Test

- Permission
- Session Expired
- Anonymous PII
- Invalid File
- Direct API Access
- Version Conflict
- Duplicate Request

### Responsive Test

- 320px
- 375px
- 768px
- 1024px
- 1280px

### Browser Test

- Chrome
- Edge
- Safari
- Firefox ตามระดับรองรับ

---

## 51. Test Data Rules

- ใช้ข้อมูลจำลอง
- ห้ามใช้ข้อมูลประชาชนจริงใน Development
- ชื่อและเบอร์ต้องเป็น Test Data
- รูปต้องไม่มีข้อมูลส่วนบุคคล
- แยก Development Spreadsheet
- แยก Production Spreadsheet
- ห้ามทดสอบ Delete/Migration กับ Production โดยตรง

---

## 52. Minimum Tests Before Commit

- ไม่มี Syntax Error
- ไม่มี Console Error
- Page เปิดได้
- Function ที่แก้ทำงาน
- Flow เดิมไม่เสีย
- Mobile Layout ไม่พัง
- API Response ตรง Contract
- Error State ทำงาน
- Loading State ทำงาน

---

## 53. Minimum Tests Before Production

- Public Submit
- Anonymous Submit
- Upload 3 Images
- Location Allow/Deny
- Tracking
- Add Info
- Login Success/Fail
- Session Expired
- Role Permissions
- Assign
- Status Update
- Resolve
- Close
- Export
- Backup
- Restore
- Mobile Real Device
- Production URL

---

# PART N — GIT AND GITHUB RULES

## 54. Branch Strategy

MVP แบบง่าย:

- `main` = Production-ready
- Feature Branch = งานใหม่
- Fix Branch = แก้ปัญหา

ตัวอย่าง:

```text
feature/public-report-form
feature/admin-dashboard
fix/login-session
docs/api-spec-update
```

ห้ามพัฒนา Feature ใหญ่บน `main` โดยตรง หากมีผู้ร่วมงานหลายคน

---

## 55. Commit Rules

Commit ต้องเล็กและสื่อความหมาย

รูปแบบแนะนำ:

```text
feat: add public report category step
fix: prevent duplicate report submission
docs: update API status transition
refactor: centralize API error handling
test: add report create validation tests
chore: update gitignore
```

### Prefix

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `style`
- `perf`
- `security`

ห้ามใช้:

```text
update
แก้
ล่าสุด
final
work
test123
```

โดยไม่มีรายละเอียด

---

## 56. Pull Request Rules

PR ต้องระบุ:

- ทำอะไร
- แก้ไฟล์ใด
- ผลกระทบ
- วิธีทดสอบ
- Screenshot เมื่อเป็น UI
- Schema/API Change หรือไม่
- Checklist

หากใช้คนเดียว อาจใช้ Commit Review ก่อน Merge แทน แต่ต้องรักษาหลักเดียวกัน

---

## 57. Gitignore

ขั้นต่ำ:

```gitignore
node_modules/
.env
.env.*
!.env.example
.dev.vars
.wrangler/
.clasp.json
.DS_Store
Thumbs.db
*.log
temp/
dist/
coverage/
```

หมายเหตุ:

- พิจารณา `.clasp.json` ตามวิธี Deploy
- ห้าม Commit Secret
- Apps Script Source Commit ได้
- Production Config ที่ไม่ลับ Commit ได้

---

# PART O — CODE REVIEW RULES

## 58. Review Checklist

### Architecture

- อยู่ Layer ถูกต้อง
- ไม่สร้าง Duplicate Logic
- ไม่ข้าม Repository
- ไม่ขัด Spec

### Security

- ไม่มี Secret
- ตรวจ Permission
- ตรวจ Input
- Escape Output
- ไม่ Log Sensitive Data

### UX

- Mobile-first
- Loading/Error/Empty
- Accessibility
- ภาษาไทยชัดเจน

### Data

- Field ตรง Schema
- Version
- Soft Delete
- Activity Log
- Timeline

### API

- Envelope ถูก
- Error Code ถูก
- Permission ถูก
- Public Projection ปลอดภัย

---

## 59. Definition of Done

งานถือว่าเสร็จเมื่อ:

1. ตรง Requirement
2. ตรงเอกสารสเปก
3. Responsive
4. Accessible ระดับพื้นฐาน
5. มี Loading
6. มี Empty
7. มี Error
8. Validate Frontend
9. Validate Backend
10. Permission ถูก
11. ไม่มี Secret
12. ไม่มี Console Error
13. ไม่มี Syntax Error
14. Test ผ่าน
15. เอกสารอัปเดต
16. Commit ชัดเจน
17. ไม่ทำ Flow เดิมเสีย
18. ทดสอบ Production-like Environment

---

# PART P — AI/CODEX RULES

## 60. กฎการสั่ง Codex

ทุก Prompt ควรระบุ:

- เป้าหมาย
- ไฟล์ที่อนุญาตให้แก้
- ไฟล์ห้ามแก้
- เอกสารที่ต้องอ่าน
- Acceptance Criteria
- คำสั่งทดสอบ
- ให้สรุปไฟล์ที่แก้
- ห้ามเปลี่ยนสถาปัตยกรรม

ตัวอย่าง:

```text
อ่าน docs/APP_SPEC.md, docs/UI_FLOW.md, docs/DATA_SCHEMA.md,
docs/API_SPEC.md และ docs/DEVELOPMENT_RULES.md ก่อนเริ่มงาน

งาน: สร้างหน้า report.html ขั้นตอนที่ 1 เลือกหมวดปัญหา

อนุญาตให้แก้:
- report.html
- assets/css/public.css
- assets/js/public/report.js

ห้ามแก้:
- apps-script/
- docs/
- config.js

ข้อกำหนด:
- Mobile-first
- ใช้ Category จาก category.list
- มี Loading, Empty, Error
- ปุ่มถัดไป Disable จนกว่าจะเลือกหมวด
- ห้ามใช้ Framework
- ห้ามใช้ Inline Event
- ห้าม Hardcode API URL

หลังทำ:
- ตรวจ Syntax
- สรุปไฟล์ที่แก้
- แจ้งวิธีทดสอบ
```

---

## 61. สิ่งที่ Codex ห้ามทำเอง

- เปลี่ยนชื่อไฟล์หลัก
- เปลี่ยน Technology Stack
- เพิ่ม Framework
- เปลี่ยน Schema
- เปลี่ยน API Contract
- เปลี่ยน Status Enum
- ลบ Security Check
- ลบ Validation
- ลบ Activity Log
- Hardcode Secret
- แก้หลายส่วนเกินขอบเขต
- Commit/Push โดยไม่ได้รับคำสั่ง
- Deploy โดยไม่ได้รับคำสั่ง
- สร้างข้อมูล Admin จริงใน Repository

---

## 62. Workflow สำหรับงานแต่ละขั้น

1. อ่านเอกสาร
2. ตรวจไฟล์ปัจจุบัน
3. สรุปสิ่งที่จะทำ
4. แก้เฉพาะไฟล์จำเป็น
5. ตรวจ Syntax
6. ทดสอบ
7. ตรวจ Diff
8. สรุปผล
9. ผู้ใช้ตรวจ
10. Commit
11. Push
12. Deploy เมื่อพร้อม

---

# PART Q — DEPLOYMENT RULES

## 63. Environment

แยกอย่างน้อย:

- Development
- Production

ควรแยก:

- Spreadsheet
- Drive Folder
- Apps Script Deployment
- Config
- Admin Account

ห้ามใช้ Production เป็นพื้นที่ทดลอง

---

## 64. Cloudflare Pages

Production:

```text
https://khaophangreport.pages.dev
```

กฎ:

- Framework Preset: None
- Build Command: ว่าง หรือ `exit 0`
- Output Directory: `/`
- Deploy จาก `main`
- ตรวจ Asset Path
- ตรวจ HTTPS
- ตรวจ Mobile
- ตรวจ API URL

---

## 65. Apps Script Deployment

ก่อน Deploy:

- Backup
- ตรวจ Script Properties
- ตรวจ Spreadsheet ID
- ตรวจ Root Folder ID
- Run Setup/Migration
- Run Tests
- Deploy Version ใหม่
- บันทึก Deployment URL
- Update Config
- Test Public/Admin

ห้ามใช้ Development Deployment URL ใน Production

---

## 66. Production Checklist

- [ ] Domain เปิดได้
- [ ] HTTPS
- [ ] API Health
- [ ] Public Config
- [ ] Category List
- [ ] Create Report
- [ ] Upload
- [ ] Track
- [ ] Login
- [ ] Dashboard
- [ ] Assignment
- [ ] Status
- [ ] Export
- [ ] Activity Log
- [ ] Privacy
- [ ] Terms
- [ ] Contact
- [ ] Emergency Number
- [ ] Backup
- [ ] Admin Account
- [ ] No Secret in Repo
- [ ] Mobile Test

---

# PART R — BACKUP AND MIGRATION RULES

## 67. Backup Before Change

ต้อง Backup ก่อน:

- Schema Change
- Migration
- Bulk Update
- Permission Change
- Drive Structure Change
- Production Setup
- Major Release

---

## 68. Migration Rules

- Migration ต้องมี ID
- Idempotent
- Test กับ Copy
- Log Result
- Backup
- Rollback Plan
- Update Schema Version
- Update Docs
- ห้ามแก้ Migration ที่ใช้แล้ว
- เพิ่ม Migration ใหม่แทน

---

# PART S — DOCUMENTATION RULES

## 69. เอกสารต้องอัปเดตเมื่อใด

### APP_SPEC

เมื่อ Function/Scope เปลี่ยน

### UI_FLOW

เมื่อหน้าจอหรือ Journey เปลี่ยน

### DATA_SCHEMA

เมื่อ Sheet/Field/Enum เปลี่ยน

### API_SPEC

เมื่อ Action/Request/Response/Error เปลี่ยน

### DEVELOPMENT_RULES

เมื่อมาตรฐานการพัฒนาเปลี่ยน

### README

เมื่อ Setup/Run/Deploy เปลี่ยน

---

## 70. Documentation Style

- ภาษาไทยชัดเจน
- Code และ Field เป็นภาษาอังกฤษ
- ใช้ตัวอย่างจริงของโครงการ
- ไม่ใส่ Secret
- ระบุ Version
- ระบุวันที่
- ไม่เขียนข้อความคลุมเครือ
- Checklist ต้องตรวจได้จริง

---

# PART T — PERFORMANCE RULES

## 71. Frontend Performance

- Compress Images
- Lazy Load รูปที่ไม่สำคัญ
- ลด JS ที่ไม่ใช้
- ลด API Calls
- Cache Public Config
- ไม่โหลด Library ใหญ่โดยไม่จำเป็น
- ใช้ SVG/Icon ที่เหมาะสม
- หลีกเลี่ยง Layout Shift
- แสดง Skeleton เมื่อโหลด

---

## 72. Backend Performance

- Pagination
- Batch Read/Write
- Cache
- Header Map
- ไม่ใช้ `getDataRange()` ทุกครั้ง
- ไม่คำนวณ Dashboard ทั้งฐานทุก Request
- Cleanup Session/Rate Limit
- Archive เมื่อข้อมูลมาก
- จำกัด Export
- จำกัด File Size

---

# PART U — MAINTENANCE RULES

## 73. Monitoring

ควรตรวจ:

- API Error
- Login Failed
- Upload Failed
- Rate Limit
- Duplicate Request
- Drive Quota
- Sheet Size
- Apps Script Quota
- Session Cleanup
- Backup Status

---

## 74. Incident Handling

เมื่อระบบมีปัญหา:

1. หยุด Action เสี่ยง
2. เปิด Maintenance Mode หากจำเป็น
3. เก็บ Request ID/Error Code
4. ตรวจ Log
5. Backup ก่อน Repair
6. แก้ด้วย Script ที่ตรวจสอบได้
7. ทดสอบ
8. ปิด Maintenance
9. บันทึกสาเหตุและการแก้

---

# PART V — FINAL CHECKLIST

## 75. Development Compliance Checklist

### Architecture

- [ ] ใช้ Stack ตามกำหนด
- [ ] Public/Admin แยก
- [ ] Service/Repository แยก
- [ ] Config รวมศูนย์
- [ ] API Client รวมศูนย์

### Frontend

- [ ] Mobile-first
- [ ] Semantic HTML
- [ ] Accessible Form
- [ ] Loading/Empty/Error
- [ ] No Inline Event
- [ ] No Secret
- [ ] No Unsafe innerHTML

### Backend

- [ ] Action Whitelist
- [ ] Validation
- [ ] Session
- [ ] Permission
- [ ] Lock
- [ ] Cache
- [ ] Activity Log
- [ ] Timeline

### Data

- [ ] Schema ตรง
- [ ] Soft Delete
- [ ] Version
- [ ] Idempotency
- [ ] Referential Check
- [ ] Backup

### Security

- [ ] Password Hash
- [ ] Token Hash
- [ ] PII Protected
- [ ] File Validation
- [ ] CSV Injection Protection
- [ ] No Stack Trace

### Git

- [ ] Branch เหมาะสม
- [ ] Commit ชัดเจน
- [ ] Diff ตรวจแล้ว
- [ ] No Secret
- [ ] Docs Updated

### Production

- [ ] Test Mobile
- [ ] Test Public
- [ ] Test Admin
- [ ] Test Backup
- [ ] Test Restore
- [ ] Production Config ถูกต้อง

---

## 76. สรุปกฎสำคัญที่สุด

1. อ่านเอกสารก่อนเขียนโค้ด
2. แก้เฉพาะขอบเขตงาน
3. ไม่เปลี่ยนสถาปัตยกรรมเอง
4. Frontend ไม่ใช่แหล่งตัดสินสิทธิ์
5. Backend ตรวจทุกอย่าง
6. ข้อมูลสำคัญต้องมี Log
7. Status ต้องมี Timeline
8. ห้ามเก็บ Secret ใน Repository
9. ห้ามเก็บ Password/Token แบบ Raw
10. ใช้ Pagination และ Cache
11. ใช้ Soft Delete และ Versioning
12. ป้องกัน Double Submit
13. ทดสอบ Error State
14. ทดสอบมือถือจริง
15. อัปเดตเอกสารทุกครั้งที่ Contract เปลี่ยน

หลักการสูงสุด:

> สร้างระบบให้เรียบง่ายสำหรับผู้ใช้ แต่เข้มงวดเรื่องข้อมูล สิทธิ์ ความปลอดภัย และความสามารถในการดูแลต่อ

---

**End of DEVELOPMENT_RULES.md**
