# Khaophang Report — UI_FLOW

> เอกสารกำหนดเส้นทางการใช้งาน หน้าจอ การเปลี่ยนสถานะ และพฤติกรรม UX ของเว็บแอป Khaophang Report  
> ใช้ร่วมกับ `APP_SPEC.md`, `DATA_SCHEMA.md`, `API_SPEC.md` และ `DEVELOPMENT_RULES.md`

---

## 1. ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|---|---|
| ชื่อเอกสาร | UI_FLOW.md |
| ชื่อระบบ | Khaophang Report |
| ชื่อภาษาไทย | ระบบรับแจ้งและติดตามปัญหาชุมชนตำบลเขาพัง |
| เวอร์ชันเอกสาร | 1.0.0 |
| สถานะ | Approved for Development |
| วันที่จัดทำ | 26 มิถุนายน 2026 |
| เอกสารอ้างอิงหลัก | APP_SPEC.md |
| Production Domain | https://khaophangreport.pages.dev |
| GitHub Repository | https://github.com/khaophangreport-spec/khaophangreport.git |
| อีเมลโครงการ | khaophangreport@gmail.com |

---

## 2. วัตถุประสงค์

เอกสารนี้กำหนดว่า ผู้ใช้แต่ละประเภทต้องเดินผ่านหน้าจอใดบ้าง กดอะไรได้ เห็นข้อมูลอะไร และระบบต้องตอบสนองอย่างไรในแต่ละสถานการณ์

ใช้เป็นหลักสำหรับ:

- ออกแบบ Wireframe
- ออกแบบ Prototype
- พัฒนา HTML, CSS และ JavaScript
- วาง Route และ Navigation
- เชื่อม Frontend กับ API
- ทดสอบ User Journey
- ตรวจสอบสิทธิ์แต่ละบทบาท
- ลดความคลาดเคลื่อนระหว่างหน้าจอและฟังก์ชัน

---

## 3. หลัก UX ที่ใช้ทั้งระบบ

แนวทางที่เลือก:

> เรียบง่าย อบอุ่น เป็นมิตร ใช้สีเขียวธรรมชาติ เข้าถึงง่าย และไม่ให้ความรู้สึกเป็นระบบราชการที่ซับซ้อน

### 3.1 หลักการทั่วไป

1. Mobile-first
2. ภาษาไทยเป็นหลัก
3. ปุ่มหลักต้องเห็นชัด
4. หนึ่งหน้าจอควรมีเป้าหมายหลักเพียงหนึ่งเรื่อง
5. แบบฟอร์มยาวต้องแบ่งขั้นตอน
6. ผู้ใช้ต้องรู้เสมอว่าตนอยู่ขั้นตอนไหน
7. ทุกการส่งข้อมูลต้องมี Loading, Success และ Error State
8. Error Message ต้องบอกวิธีแก้
9. ห้ามใช้ศัพท์เทคนิคกับประชาชน
10. ห้ามใช้สีเพียงอย่างเดียวเพื่อสื่อความหมาย
11. ข้อมูลสำคัญต้องสรุปก่อนยืนยัน
12. การกระทำที่ย้อนกลับไม่ได้ต้องมี Confirmation
13. ต้องรองรับการใช้งานด้วยนิ้วมือบนหน้าจอเล็ก
14. ต้องมีทางออกจากทุกหน้าจอ
15. ห้ามทำให้ผู้ใช้สูญเสียข้อมูลโดยไม่เตือน

---

## 4. กลุ่มผู้ใช้และ Entry Point

| กลุ่มผู้ใช้ | Entry Point หลัก | การยืนยันตัวตน |
|---|---|---|
| ประชาชน | `/index.html` | ไม่ต้อง Login |
| ผู้แจ้งที่ติดตามเรื่อง | `/track.html` | ใช้ Tracking Code |
| เจ้าหน้าที่ | `/admin/login.html` | Username + Password |
| ผู้ดูแลระบบ | `/admin/login.html` | Username + Password |
| ผู้ดูข้อมูล | `/admin/login.html` | Username + Password |

---

## 5. Site Map

```text
PUBLIC
/
├── index.html
├── report.html
├── report-success.html
├── track.html
├── track-detail.html
├── faq.html
├── privacy.html
├── terms.html
└── contact.html

ADMIN
/admin/
├── login.html
├── dashboard.html
├── reports.html
├── report-detail.html
├── users.html
├── categories.html
├── announcements.html
├── settings.html
├── activity-logs.html
└── export.html
```

---

## 6. Public Navigation

### 6.1 Mobile Bottom Navigation

| เมนู | Icon | Path | Active State |
|---|---|---|---|
| หน้าแรก | Home | `/index.html` | เมื่ออยู่หน้าแรก |
| แจ้งปัญหา | Edit / Plus | `/report.html` | เมื่ออยู่ใน Flow แจ้งปัญหา |
| ติดตาม | Search | `/track.html` | เมื่ออยู่ใน Flow ติดตาม |
| ติดต่อ | Phone / Info | `/contact.html` | เมื่ออยู่หน้าติดต่อ |

### 6.2 Desktop Top Navigation

- หน้าแรก
- แจ้งปัญหา
- ติดตามสถานะ
- คำถามที่พบบ่อย
- ติดต่อเรา

### 6.3 Navigation Rules

- ปุ่ม “แจ้งปัญหา” เป็น Primary Action
- ปุ่ม “ติดตามสถานะ” เป็น Secondary Action
- บนหน้าฟอร์ม Bottom Navigation ต้องไม่บดบังปุ่ม Next
- เมื่อผู้ใช้มีข้อมูลที่ยังไม่ส่งและพยายามออกจากหน้า ต้องเตือนก่อน
- เมนูต้องแสดง Active State
- Header ต้องย่อขนาดบนมือถือ
- Logo กดกลับหน้าแรกได้

---

## 7. Admin Navigation

### 7.1 Desktop Sidebar

1. Dashboard
2. เรื่องแจ้ง
3. งานของฉัน
4. รายงาน
5. ผู้ใช้งาน
6. หมวดหมู่
7. ประกาศ
8. Activity Logs
9. ตั้งค่า
10. ออกจากระบบ

### 7.2 Mobile Admin Navigation

- ใช้ Top Bar
- ใช้ Hamburger เปิด Drawer
- Drawer ต้องปิดได้ด้วย:
  - ปุ่มปิด
  - แตะ Overlay
  - กด Escape
  - เลือกเมนู
- แสดงชื่อผู้ใช้และ Role ใน Drawer

### 7.3 Role-based Menu

| เมนู | super_admin | admin | officer | viewer |
|---|---:|---:|---:|---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| เรื่องทั้งหมด | ✓ | ✓ | ตามสิทธิ์ | ดูอย่างเดียว |
| งานของฉัน | ✓ | ✓ | ✓ | - |
| รายงาน | ✓ | ✓ | จำกัด | ✓ |
| ผู้ใช้งาน | ✓ | ตามสิทธิ์ | - | - |
| หมวดหมู่ | ✓ | ✓ | - | - |
| ประกาศ | ✓ | ✓ | - | - |
| Activity Logs | ✓ | จำกัด | - | - |
| ตั้งค่า | ✓ | จำกัด | - | - |
| Export | ✓ | ✓ | - | ตามสิทธิ์ |

Frontend ใช้ Role เพื่อซ่อนเมนูได้ แต่ Backend ต้องตรวจสิทธิ์ซ้ำทุกครั้ง

---

# PART A — PUBLIC USER FLOWS

## 8. Flow P-01: เข้าสู่หน้าแรก

### เป้าหมาย

ทำให้ประชาชนเข้าใจทันทีว่าระบบนี้ใช้ทำอะไร และเลือกเริ่ม “แจ้งปัญหา” หรือ “ติดตามสถานะ” ได้

### Flow

```text
เปิด URL
  ↓
แสดง Splash/Loading สั้น ๆ เฉพาะเมื่อจำเป็น
  ↓
โหลด Public Config + Category + Announcement
  ↓
หน้าแรกพร้อมใช้งาน
  ├── แจ้งปัญหา → P-02
  ├── ติดตามสถานะ → P-09
  ├── ดูหมวดปัญหา → P-02 พร้อม Preselect Category
  ├── FAQ → P-12
  └── ติดต่อ/ฉุกเฉิน → P-13
```

### องค์ประกอบหน้า

1. Header
2. Hero Image
3. Headline
4. คำอธิบายสั้น
5. ปุ่มแจ้งปัญหา
6. ปุ่มติดตามสถานะ
7. จุดเด่น 4 ข้อ
8. หมวดปัญหา
9. ขั้นตอนใช้งาน 3–4 ขั้น
10. ประกาศ
11. คำเตือนกรณีฉุกเฉิน
12. Footer
13. Bottom Navigation

### Loading State

- แสดง Skeleton เฉพาะส่วนประกาศและหมวด
- ปุ่มหลักยังใช้งานได้หาก Config พื้นฐานโหลดสำเร็จ
- หากประกาศโหลดไม่ได้ ไม่ควรทำให้หน้าแรกใช้ไม่ได้

### Error State

| กรณี | พฤติกรรม |
|---|---|
| โหลด Config ไม่ได้ | แสดงข้อความ “ระบบยังโหลดข้อมูลไม่สำเร็จ” พร้อมปุ่มลองใหม่ |
| โหลดหมวดไม่ได้ | ซ่อนหมวดชั่วคราว แต่ยังเปิดหน้าแจ้งปัญหาได้ |
| Offline | แสดง Banner “ขณะนี้ไม่มีการเชื่อมต่ออินเทอร์เน็ต” |
| API ช้า | แสดง Skeleton และ Timeout Message |

---

## 9. Flow P-02: เริ่มแจ้งปัญหา

### Entry Points

- ปุ่ม Hero
- Bottom Navigation
- ปุ่มจากหมวดในหน้าแรก
- Direct URL `/report.html`

### Initial Flow

```text
เข้าสู่ report.html
  ↓
โหลด Category + Public Config
  ↓
ตรวจ Draft ใน Local Storage
  ├── มี Draft → แสดง Modal “พบข้อมูลที่ยังส่งไม่สำเร็จ”
  │      ├── ทำต่อ → โหลด Draft
  │      └── เริ่มใหม่ → ลบ Draft
  └── ไม่มี Draft → เริ่ม Step 1
```

### Draft Rules

- เก็บเฉพาะข้อมูลชั่วคราวที่ไม่อ่อนไหว
- ห้ามเก็บ Base64 ภาพขนาดใหญ่ถาวร
- ห้ามเก็บ Token หรือ Secret
- ลบ Draft เมื่อส่งเรื่องสำเร็จ
- Draft หมดอายุได้ตามเวลาที่กำหนด
- ก่อนออกจากหน้าโดยยังไม่ส่ง ต้องเตือน

---

## 10. Flow P-03: Step 1 — เลือกหมวดปัญหา

### หน้าจอ

แสดงหมวดเป็น Card พร้อม:

- Icon
- ชื่อหมวด
- คำอธิบายสั้น
- สีประจำหมวด

### Interaction

```text
เลือกหมวด
  ↓
Card แสดง Selected State
  ↓
ปุ่ม “ถัดไป” เปิดใช้งาน
  ↓
กดถัดไป → Step 2
```

### Validation

- ต้องเลือก 1 หมวด
- หากไม่มีหมวด ให้แสดงข้อความและปุ่มลองใหม่
- หากเข้าจากหน้าแรกด้วยหมวดที่เลือกไว้ ให้ Preselect
- หมวดที่ปิดใช้งานต้องไม่แสดง

### Back Behavior

- กดกลับ → หน้าแรก
- หากไม่มีข้อมูลอื่น ไม่ต้องเตือน
- หากมี Draft เดิม ต้องคงค่า

---

## 11. Flow P-04: Step 2 — กรอกรายละเอียด

### Fields

- หัวข้อเรื่อง
- รายละเอียด
- วันที่พบปัญหา
- ระดับความเร่งด่วนที่ผู้แจ้งประเมิน

### UX Rules

- แสดง Character Count
- Label อยู่เหนือ Field
- Placeholder เป็นตัวอย่าง ไม่ใช้แทน Label
- วันที่เริ่มต้นเป็นวันที่ปัจจุบันได้ แต่ผู้ใช้แก้ได้
- Priority ต้องมีคำอธิบาย
- `critical` ต้องแสดง Emergency Warning

### Flow

```text
กรอกข้อมูล
  ↓
Validate ระหว่างพิมพ์แบบไม่รบกวน
  ↓
กดถัดไป
  ├── Valid → Save Draft → Step 3
  └── Invalid → Scroll ไป Field แรกที่ผิด
```

### Error Examples

- “กรุณากรอกหัวข้อปัญหา”
- “กรุณาอธิบายรายละเอียดอย่างน้อย … ตัวอักษร”
- “วันที่พบปัญหาต้องไม่เป็นวันในอนาคต”
- “หากเป็นเหตุฉุกเฉิน กรุณาติดต่อหมายเลขฉุกเฉินโดยตรง”

### Back Behavior

- กดย้อนกลับ → Step 1
- ข้อมูลต้องไม่หาย

---

## 12. Flow P-05: Step 3 — ระบุสถานที่

### Fields

- ชื่อสถานที่
- หมู่ที่
- จุดสังเกต
- Latitude
- Longitude
- Map URL

### Main Actions

- ใช้ตำแหน่งปัจจุบัน
- กรอกสถานที่เอง
- เปิดตำแหน่งในแผนที่ หากมีพิกัด

### Geolocation Flow

```text
กด “ใช้ตำแหน่งปัจจุบัน”
  ↓
ตรวจ Browser Support
  ├── ไม่รองรับ → แนะนำให้กรอกเอง
  └── รองรับ → ขอ Permission
         ├── Allow → แสดง Loading → เติมพิกัด → แสดง Success
         ├── Deny → แสดงวิธีกรอกเอง
         ├── Timeout → ปุ่มลองใหม่
         └── Error → แสดงข้อความเข้าใจง่าย
```

### UX Rules

- ห้ามบังคับให้ใช้ GPS
- หากผู้ใช้ไม่อนุญาต ต้องยังแจ้งเรื่องต่อได้
- แสดงพิกัดแบบอ่านง่าย
- จุดสังเกตควรมีตัวอย่าง
- หมู่ที่ใช้ Dropdown หากกำหนดรายการจริงแล้ว
- Map Preview เป็น Optional ใน MVP

### Validation

- ต้องมีอย่างน้อยชื่อสถานที่หรือจุดสังเกต
- Latitude อยู่ระหว่าง -90 ถึง 90
- Longitude อยู่ระหว่าง -180 ถึง 180
- หากมีพิกัดหนึ่งค่า ต้องมีครบทั้งสองค่า

---

## 13. Flow P-06: Step 4 — เพิ่มรูปภาพ

### Upload Flow

```text
กดเพิ่มรูป
  ↓
เลือกจากกล้องหรือคลังภาพ
  ↓
ตรวจชนิดไฟล์
  ↓
ตรวจจำนวนภาพ
  ↓
บีบอัดภาพ
  ↓
สร้าง Preview
  ↓
เพิ่มเข้ารายการ
```

### ข้อกำหนด

- สูงสุด 3 รูป
- JPG, PNG, WebP
- บีบอัดก่อนส่ง
- ด้านยาวไม่เกิน 1,600 px
- หลังบีบอัดไม่เกิน 1 MB ต่อรูป
- ผู้ใช้ลบรูปได้
- ผู้ใช้เปลี่ยนลำดับได้เฉพาะเมื่อทำได้ง่าย; ไม่จำเป็นใน MVP

### UI States

| State | การแสดงผล |
|---|---|
| Empty | ช่องเพิ่มรูป + คำแนะนำ |
| Compressing | Progress / Spinner บนรูป |
| Ready | Preview + ปุ่มลบ |
| Error | แสดงสาเหตุใต้รูป |
| Limit Reached | ปิดปุ่มเพิ่มรูปและแจ้งครบ 3 รูป |

### Error Messages

- “รองรับเฉพาะไฟล์ JPG, PNG และ WebP”
- “เพิ่มรูปได้สูงสุด 3 รูป”
- “ไม่สามารถประมวลผลรูปนี้ได้ กรุณาเลือกรูปอื่น”
- “รูปมีขนาดใหญ่เกินไปหลังการบีบอัด”

### Back Behavior

- กลับ Step 3 ได้
- Preview ต้องยังอยู่ระหว่าง Session
- หาก Browser Refresh แล้วภาพหาย ต้องแจ้งผู้ใช้ ไม่ควรทำให้ข้อมูลข้อความหาย

---

## 14. Flow P-07: Step 5 — ข้อมูลผู้แจ้ง

### Choice

```text
รูปแบบการแจ้ง
  ├── ระบุตัวตน
  └── ไม่ระบุตัวตน
```

### ระบุตัวตน

Fields:

- ชื่อ
- เบอร์โทร
- อีเมล ไม่บังคับ
- ช่องทางติดต่อที่สะดวก

Validation:

- ชื่อต้องไม่ว่าง
- เบอร์โทรต้องผ่านรูปแบบที่กำหนด
- อีเมลตรวจเฉพาะเมื่อกรอก
- ช่องทางติดต่อสอดคล้องกับข้อมูลที่ให้

### ไม่ระบุตัวตน

- ซ่อน Fields ส่วนบุคคล
- ล้างค่าที่ไม่ควรส่ง
- แสดงข้อความ:
  - เจ้าหน้าที่อาจไม่สามารถติดต่อขอข้อมูลเพิ่ม
  - ต้องเก็บ Tracking Code ไว้ติดตามเอง
- ยังสามารถส่งข้อมูลเพิ่มเติมภายหลังผ่าน Tracking Code ได้

### Switching Rules

- เมื่อเปลี่ยนจากระบุตัวตนเป็นไม่ระบุตัวตน ต้องแจ้งว่าจะไม่นำข้อมูลติดต่อไปส่ง
- ไม่จำเป็นต้องล้างค่าทันทีจาก UI จนกว่าจะยืนยัน แต่ Payload ต้องไม่รวมข้อมูล
- ห้ามเก็บข้อมูลส่วนบุคคลเกินความจำเป็น

---

## 15. Flow P-08: Step 6 — ตรวจสอบและยืนยัน

### Summary Sections

1. หมวด
2. หัวข้อและรายละเอียด
3. วันที่พบ
4. ความเร่งด่วน
5. สถานที่
6. พิกัด
7. รูปภาพ
8. รูปแบบผู้แจ้ง
9. ข้อมูลติดต่อที่อนุญาต
10. Consent

### Edit Actions

แต่ละ Section มีปุ่ม “แก้ไข” ย้อนกลับไป Step ที่เกี่ยวข้อง

### Consent

- ยืนยันว่าข้อมูลเป็นความจริง
- ยอมรับ Privacy Policy
- ยินยอมให้ใช้ข้อมูลเพื่อประสานงาน
- Link เปิดเอกสารใน Tab หรือ Modal โดยไม่ทำข้อมูลหาย

### Submit Flow

```text
กด “ส่งเรื่อง”
  ↓
ตรวจ Validation ทั้งหมดอีกครั้ง
  ├── ไม่ผ่าน → ไป Step ที่มีปัญหา
  └── ผ่าน → Disable ปุ่ม + Loading
        ↓
      เตรียม Payload
        ↓
      Upload/Create ผ่าน API
        ├── สำเร็จ → ลบ Draft → P-08A Success
        ├── Validation Error → แสดง Field Error
        ├── Rate Limited → แสดงเวลาที่ควรลองใหม่
        ├── Network Error → คงข้อมูล + ปุ่มลองใหม่
        └── Unknown Error → คงข้อมูล + Contact Option
```

### Duplicate Submission Protection

- Disable ปุ่มหลังแตะครั้งแรก
- ใช้ Request ID หรือ Idempotency Key
- หาก Response หายแต่ระบบอาจบันทึกแล้ว ต้องมีวิธีตรวจสอบก่อนส่งซ้ำ
- ห้ามสร้างเรื่องซ้ำจากการ Double Tap

---

## 16. Flow P-08A: ส่งเรื่องสำเร็จ

### Path

`/report-success.html`

### หน้าจอ

- Success Icon
- “ส่งเรื่องเรียบร้อยแล้ว”
- Tracking Code
- ปุ่มคัดลอก
- วันที่และเวลา
- ปุ่มติดตามสถานะ
- ปุ่มกลับหน้าแรก
- คำเตือนให้บันทึกรหัส
- QR Code เป็นฟังก์ชันอนาคต ไม่บังคับใน MVP

### Copy Flow

```text
กดคัดลอกรหัส
  ├── สำเร็จ → Toast “คัดลอกรหัสแล้ว”
  └── ไม่สำเร็จ → เลือกข้อความให้ผู้ใช้คัดลอกเอง
```

### Direct Access Rule

หากเปิด `report-success.html` โดยไม่มีข้อมูล Result:

- ไม่แสดง Tracking Code ปลอม
- แสดงข้อความว่าไม่พบข้อมูลรายการล่าสุด
- มีปุ่มไปหน้าติดตามหรือหน้าแรก

---

## 17. Flow P-09: ติดตามสถานะ

### Path

`/track.html`

### Input

- Tracking Code

### Flow

```text
กรอกรหัส
  ↓
Normalize: Trim + Uppercase
  ↓
Validate Format
  ├── ไม่ผ่าน → Inline Error
  └── ผ่าน → Loading
        ↓
      API report.track
        ├── พบ → track-detail.html
        ├── ไม่พบ → Not Found State
        ├── Rate Limited → Warning
        └── Network Error → Retry
```

### UX Rules

- รองรับ Paste
- ปุ่มค้นหากดง่าย
- มีตัวอย่างรูปแบบรหัส
- ไม่เปิดเผยว่ารหัสใกล้เคียงกับเรื่องจริงหรือไม่
- ห้ามแสดงข้อมูลส่วนบุคคล

### Recent Tracking

อาจเก็บ Tracking Code ล่าสุดใน Local Storage เฉพาะเมื่อผู้ใช้ยินยอมหรือเป็นข้อมูลที่ไม่มีข้อมูลส่วนบุคคลโดยตรง

---

## 18. Flow P-10: ดูรายละเอียดการติดตาม

### Path

`/track-detail.html`

### Data Display

- Tracking Code
- หมวด
- หัวข้อ
- วันที่แจ้ง
- สถานะปัจจุบัน
- Priority ในรูปแบบที่เหมาะสม
- หน่วยงานหรือผู้รับผิดชอบที่เปิดเผยได้
- Timeline
- ผลการดำเนินงาน
- ภาพหลักฐานสาธารณะ
- ปุ่มส่งข้อมูลเพิ่มเติม

### Timeline UI

แต่ละรายการแสดง:

- Status
- ข้อความสาธารณะ
- วันที่และเวลา
- ผู้ดำเนินการในรูปแบบไม่เปิดเผยข้อมูลเกินจำเป็น
- ภาพประกอบที่ Public

### Status Order

```text
รับเรื่องแล้ว
→ กำลังตรวจสอบ
→ มอบหมายแล้ว
→ กำลังดำเนินการ
→ รอข้อมูลเพิ่มเติม (ถ้ามี)
→ ดำเนินการแล้ว
→ ปิดเรื่อง
```

`rejected` และ `duplicate` เป็นเส้นทางพิเศษ

### Special States

| สถานะ | การแสดงผล |
|---|---|
| `waiting` | เน้นกล่อง “ต้องการข้อมูลเพิ่มเติม” |
| `resolved` | แสดงผลการดำเนินงานเด่น |
| `closed` | แสดงว่าเรื่องสิ้นสุดแล้ว |
| `rejected` | แสดงเหตุผลที่เปิดเผยได้ |
| `duplicate` | แจ้งว่าเป็นเรื่องซ้ำ โดยไม่เปิดเผยรหัสเรื่องอื่นเกินจำเป็น |

---

## 19. Flow P-11: ส่งข้อมูลเพิ่มเติม

### Entry

ปุ่มจาก `track-detail.html`

### Fields

- ข้อความเพิ่มเติม
- รูปภาพเพิ่มเติมตาม Limit
- ช่องทางติดต่อ ถ้าเหมาะสม
- Consent

### Flow

```text
เปิด Form/Section
  ↓
กรอกข้อมูล
  ↓
Validate
  ↓
Submit
  ├── สำเร็จ → เพิ่ม Timeline/ข้อความยืนยัน
  ├── เรื่องปิดแล้ว → แจ้งว่าไม่สามารถเพิ่มข้อมูลได้
  ├── Rate Limited → Warning
  └── Error → คงข้อมูล
```

### Rules

- ไม่อนุญาตเมื่อเรื่องถูกปิด หากนโยบายกำหนด
- ข้อมูลเพิ่มต้องผูกกับ Report เดิม
- Admin เห็นรายการใหม่ชัดเจน
- Public Timeline แสดงเฉพาะข้อความที่ผ่านกติกา
- ห้ามให้ผู้แจ้งแก้ Timeline เดิม

---

## 20. Flow P-12: FAQ

### Path

`/faq.html`

### Components

- Search FAQ
- Accordion
- หมวดคำถาม
- ปุ่มไปแจ้งปัญหา
- ปุ่มติดต่อ

### Rules

- Accordion เปิดได้ทีละข้อหรือหลายข้อได้ แต่ต้องสม่ำเสมอ
- ใช้ URL Hash ได้ถ้าต้องการลิงก์ตรง
- หากไม่มีผลค้นหา ให้แสดง Empty State
- FAQ ไม่ควรแทนช่องทางแจ้งปัญหา

---

## 21. Flow P-13: ติดต่อและฉุกเฉิน

### Path

`/contact.html`

### Sections

- ช่องทางติดต่อโครงการ
- Email
- เบอร์โทรโครงการ
- เวลาทำการ
- หมายเลขฉุกเฉิน
- แผนที่หรือที่ตั้ง
- คำเตือนเรื่องเหตุฉุกเฉิน

### Interaction

- ปุ่มโทร ใช้ `tel:`
- ปุ่มอีเมล ใช้ `mailto:`
- ปุ่มเปิดแผนที่
- ปุ่มกลับไปแจ้งปัญหา

### Rule

หมายเลขฉุกเฉินต้องแยกจากช่องทางติดต่อระบบอย่างชัดเจน

---

# PART B — AUTHENTICATION FLOWS

## 22. Flow A-01: Login

### Path

`/admin/login.html`

### Fields

- Username
- Password
- แสดง/ซ่อน Password

### Flow

```text
เปิดหน้า Login
  ↓
ตรวจ Session เดิม
  ├── Valid → Redirect Dashboard
  └── ไม่มี/หมดอายุ → แสดง Form
        ↓
      กรอก Username + Password
        ↓
      Submit
        ├── สำเร็จ → เก็บ Session ตามแนวทางระบบ → Dashboard
        ├── ข้อมูลผิด → Generic Error
        ├── ถูกล็อก → แสดงเวลาหรือข้อความเหมาะสม
        ├── Rate Limited → Warning
        └── Network Error → Retry
```

### Security UX

- Error ต้องไม่บอกว่า Username หรือ Password ส่วนใดผิด
- ห้ามเก็บ Password
- ปุ่ม Login Disable ระหว่างส่ง
- รองรับ Enter
- มี Focus State
- หลัง Login สำเร็จ Redirect ไป Intended Page ได้

---

## 23. Flow A-02: Session Expired

```text
ผู้ใช้กำลังทำงาน
  ↓
API ตอบ SESSION_EXPIRED
  ↓
แสดง Modal
  ├── บันทึก Draft ที่ปลอดภัยได้
  └── ปุ่มเข้าสู่ระบบใหม่
       ↓
     Redirect Login พร้อม returnUrl
```

### Rules

- ห้ามวน Redirect
- หลัง Login กลับหน้าที่ตั้งใจได้
- หากเป็น Form สำคัญ ต้องเตือนเรื่องข้อมูลที่อาจยังไม่บันทึก
- ล้าง Session ฝั่ง Client

---

## 24. Flow A-03: Logout

```text
กดออกจากระบบ
  ↓
Confirmation
  ├── ยกเลิก → อยู่หน้าเดิม
  └── ยืนยัน → API Logout/Revoke
        ↓
      ล้าง Session ฝั่ง Client
        ↓
      Redirect Login
```

หาก API Logout ล้มเหลว ต้องยังล้าง Session Client และแจ้งผู้ใช้ตามเหมาะสม

---

# PART C — ADMIN AND OFFICER FLOWS

## 25. Flow M-01: Admin Dashboard

### Entry

Login สำเร็จ → `/admin/dashboard.html`

### Load Sequence

```text
ตรวจ Session
  ↓
โหลด Current User
  ↓
โหลด Dashboard Summary
  ↓
โหลด Recent Reports
  ↓
โหลด Charts ตามสิทธิ์
```

### Components

- Welcome + ชื่อผู้ใช้
- Last Updated
- Summary Cards
- Urgent Reports
- Overdue Reports
- Recent Reports
- Charts
- Quick Actions

### Quick Actions

- ดูเรื่องใหม่
- ดูงานของฉัน
- ส่งออกรายงาน
- เพิ่มประกาศ ตามสิทธิ์

### Role Differences

- Officer เห็นงานตนเองเป็นหลัก
- Viewer เห็นข้อมูลอ่านอย่างเดียว
- Admin เห็นภาพรวม
- Super Admin เห็นทุกส่วน

---

## 26. Flow M-02: รายการเรื่อง

### Path

`/admin/reports.html`

### Initial State

- Default Page = 1
- Page Size = 20
- Default Sort = Created Date Desc
- อ่าน Filter จาก URL Query ได้

### Flow

```text
เปิดหน้า
  ↓
โหลด Filter Options
  ↓
โหลด Report List
  ├── มีข้อมูล → Table/Card List
  ├── ไม่มีข้อมูล → Empty State
  └── Error → Retry
```

### Search and Filter

- Keyword
- Status
- Category
- Priority
- Assignee
- Date From
- Date To

### Interaction Rules

- Search ใช้ Debounce หรือกดค้นหา
- Filter เปลี่ยนแล้วกลับ Page 1
- ปุ่ม Clear Filters
- URL Query สะท้อน Filter เพื่อแชร์ Link ภายในได้
- Mobile ใช้ Filter Drawer
- Desktop ใช้ Filter Bar

### List Item Action

- คลิก Row/Card → Report Detail
- Quick Status Update ทำเฉพาะเมื่อออกแบบอย่างปลอดภัย
- ห้ามใช้ Action ที่เสี่ยงโดยไม่มี Confirmation

---

## 27. Flow M-03: งานของฉัน

### Path

อาจใช้ `/admin/reports.html?scope=mine`

### Behavior

- Filter `assigned_to = currentUser`
- Officer เข้าแล้วเห็นเฉพาะเรื่องที่ได้รับมอบหมาย
- แสดงงานเร่งด่วนและเกินกำหนดก่อน
- มี Tab:
  - งานทั้งหมด
  - กำลังทำ
  - รอข้อมูล
  - เสร็จแล้ว

---

## 28. Flow M-04: รายละเอียดเรื่อง

### Path

`/admin/report-detail.html?id=REPORT_ID`

### Load

```text
ตรวจ Session + Permission
  ↓
โหลด Report Detail
  ↓
โหลด Attachments
  ↓
โหลด Timeline
  ↓
โหลด Assignment History
  ↓
โหลด Activity ที่เกี่ยวข้องตามสิทธิ์
```

### Layout Desktop

- Main Content: ข้อมูลเรื่อง + Timeline
- Side Panel: Status, Priority, Assignee, Actions

### Layout Mobile

- Summary Header
- Action Bar
- Sections แบบ Accordion หรือ Card
- Sticky Primary Action เฉพาะเมื่อไม่บดบังเนื้อหา

### Sections

1. ข้อมูลเรื่อง
2. สถานที่และแผนที่
3. ข้อมูลผู้แจ้ง
4. รูปภาพ
5. Status และ Priority
6. Assignment
7. Timeline สาธารณะ
8. Internal Notes
9. Attachments
10. History

---

## 29. Flow M-05: คัดกรองเรื่องใหม่

```text
เปิดเรื่อง status=new
  ↓
ตรวจรายละเอียด
  ↓
เลือกการดำเนินการ
  ├── รับตรวจสอบ → reviewing
  ├── มอบหมาย → assigned
  ├── ขอข้อมูลเพิ่ม → waiting
  ├── เรื่องซ้ำ → duplicate
  └── ไม่รับดำเนินการ → rejected
```

### Rules

- `rejected` ต้องมีเหตุผล
- `duplicate` ต้องมี Note ภายในและ Public Message ที่เหมาะสม
- ทุก Action สร้าง Timeline
- ทุก Action สร้าง Activity Log
- การเปลี่ยนสถานะต้องตรวจ State Transition ที่ Backend

---

## 30. Flow M-06: มอบหมายงาน

### Entry

ปุ่ม “มอบหมาย” ใน Report Detail

### Modal Fields

- เจ้าหน้าที่
- หมายเหตุ
- Target Date หรือ Target Days ถ้ามี
- แจ้งเตือนเจ้าหน้าที่ เป็นฟังก์ชันอนาคต

### Flow

```text
เปิด Modal
  ↓
โหลดรายชื่อ Officer ที่ Active
  ↓
เลือกผู้รับผิดชอบ
  ↓
ยืนยัน
  ├── สำเร็จ → Update Assignee + Timeline + Activity Log
  └── Error → Modal คงค่า
```

### Rules

- ห้ามมอบหมายให้ผู้ใช้ Inactive
- Reassign ต้องเก็บประวัติ
- Officer ใหม่ต้องเห็นในงานของฉัน
- สถานะอาจเปลี่ยนเป็น `assigned` ตามกติกา

---

## 31. Flow M-07: เปลี่ยนสถานะ

### Entry

Status Control ใน Report Detail

### Flow

```text
เลือกสถานะใหม่
  ↓
ระบบแสดง Fields ที่จำเป็น
  ├── waiting → Public Message / สิ่งที่ต้องการ
  ├── resolved → Result + Evidence
  ├── closed → Confirmation
  ├── rejected → Reason
  └── duplicate → Duplicate Note
  ↓
ยืนยัน
  ↓
Backend Validate Transition
  ├── สำเร็จ → Refresh Summary + Timeline
  └── ไม่ผ่าน → แสดงเหตุผล
```

### Allowed Transition Baseline

```text
new → reviewing | assigned | waiting | rejected | duplicate
reviewing → assigned | in_progress | waiting | rejected | duplicate
assigned → in_progress | waiting | resolved
in_progress → waiting | resolved
waiting → reviewing | assigned | in_progress | rejected
resolved → closed | in_progress
closed → (ไม่เปลี่ยน เว้นแต่ super_admin และมีเหตุผล)
rejected → reviewing เฉพาะสิทธิ์ที่กำหนด
duplicate → reviewing เฉพาะสิทธิ์ที่กำหนด
```

กติกาสุดท้ายต้องกำหนดใน `API_SPEC.md` และ Backend

---

## 32. Flow M-08: เพิ่ม Timeline Update

### Fields

- Public Message
- Internal Note
- Status Change ไม่บังคับ
- Attachments
- Public Visibility

### Rules

- Public Message คือข้อความที่ประชาชนเห็น
- Internal Note ห้ามส่งกลับ Public API
- Attachment ต้องกำหนด `is_public`
- Officer ต้องเห็น Preview ว่าอะไรจะเปิดเผย
- เมื่อกดบันทึกแล้ว Timeline Refresh

### Error Prevention

- แยกช่อง Public และ Internal ด้วยสี/Label ชัดเจน
- ก่อนบันทึก Public Message อาจมี Preview
- ห้าม Default `is_public=true` สำหรับไฟล์ภายในโดยไม่พิจารณา

---

## 33. Flow M-09: ระบุผลการดำเนินงาน

### Entry

เมื่อเปลี่ยนเป็น `resolved`

### Required

- สรุปผล
- วันที่ดำเนินการ
- ผู้ดำเนินการ
- ภาพหลังดำเนินการ ถ้ามี
- Public Message
- Internal Note ตามต้องการ

### Flow

```text
กรอกผล
  ↓
แนบหลักฐาน
  ↓
Preview ข้อมูลสาธารณะ
  ↓
ยืนยัน resolved
  ↓
สร้าง Timeline + Attachments + Activity Log
```

---

## 34. Flow M-10: ปิดเรื่อง

### Preconditions

- สถานะควรเป็น `resolved`
- มีผลดำเนินการ
- ไม่มีข้อมูลจำเป็นค้าง
- ผู้ใช้มีสิทธิ์

### Flow

```text
กดปิดเรื่อง
  ↓
Confirmation Modal
  ↓
ตรวจ Preconditions
  ├── ผ่าน → closed
  └── ไม่ผ่าน → แจ้งสิ่งที่ต้องทำก่อน
```

### Closed Behavior

- Public เห็นสถานะปิดเรื่อง
- Officer แก้ไขไม่ได้ตามปกติ
- Super Admin อาจ Reopen ด้วยเหตุผลและ Audit Log

---

## 35. Flow M-11: จัดการผู้ใช้งาน

### Path

`/admin/users.html`

### List

- ชื่อแสดง
- Username
- Role
- Status
- Last Login
- Action

### Actions

- เพิ่มผู้ใช้
- แก้ข้อมูล
- เปลี่ยน Role
- Active/Inactive
- Reset Password ตามแนวทางระบบ
- Revoke Sessions

### Safety

- ห้ามแสดง Password
- ห้ามลบ Super Admin คนสุดท้าย
- ผู้ใช้ห้ามลดสิทธิ์ตนเองจนระบบไม่มีผู้ดูแล
- ทุก Action มี Activity Log
- Deactivate ต้องมี Confirmation

---

## 36. Flow M-12: จัดการหมวดหมู่

### Path

`/admin/categories.html`

### Fields

- ชื่อ
- คำอธิบาย
- Icon
- สี
- Default Assignee
- Target Days
- Sort Order
- Active

### Flow

```text
เปิดหน้า
  ↓
โหลดรายการ
  ↓
เพิ่ม/แก้ไข
  ↓
Validate
  ↓
Save
  ├── สำเร็จ → Refresh List + Clear Cache
  └── Error → คง Form
```

### Rules

- ห้ามลบหมวดที่มี Report แบบ Hard Delete
- ใช้ Inactive
- เปลี่ยนชื่อหมวดไม่ทำลาย Report เดิม
- สีต้องผ่าน Contrast
- Sort Order ต้องเป็นตัวเลข

---

## 37. Flow M-13: จัดการประกาศ

### Path

`/admin/announcements.html`

### Fields

- หัวข้อ
- เนื้อหา
- ประเภท
- Start Date
- End Date
- Active

### States

- Draft
- Scheduled
- Active
- Expired
- Inactive

### Rules

- End ต้องไม่ก่อน Start
- Preview ก่อนเผยแพร่
- Public แสดงเฉพาะ Active ในช่วงเวลา
- เนื้อหาต้อง Escape/Sanitize

---

## 38. Flow M-14: ส่งออกข้อมูล

### Path

`/admin/export.html`

### Options

- ประเภทข้อมูล
- Date Range
- Status
- Category
- Assignee
- รวมข้อมูลส่วนบุคคลหรือไม่
- File Format: CSV

### Flow

```text
เลือกเงื่อนไข
  ↓
แสดงจำนวนโดยประมาณ ถ้าทำได้
  ↓
กดส่งออก
  ↓
Confirmation หากรวมข้อมูลส่วนบุคคล
  ↓
Backend Generate
  ├── สำเร็จ → Download
  └── Error → Retry
```

### Rules

- ตรวจ Permission
- Activity Log
- CSV Formula Injection Protection
- Default ไม่รวมข้อมูลส่วนบุคคล
- ชื่อไฟล์มีวันที่และช่วงข้อมูล

---

## 39. Flow M-15: Activity Logs

### Path

`/admin/activity-logs.html`

### Filters

- User
- Action
- Entity Type
- Date Range
- Keyword

### Display

- วันเวลา
- ผู้ใช้
- Action
- Entity
- Detail ที่ไม่เปิดเผย Secret

### Rules

- Read-only
- Pagination
- Viewer ทั่วไปไม่ควรเข้าถึง
- ห้ามแสดง Raw Token, Password หรือ Secret

---

## 40. Flow M-16: Settings

### Path

`/admin/settings.html`

### Sections

- ข้อมูลระบบ
- ช่องทางติดต่อ
- หมายเลขฉุกเฉิน
- ข้อความ Consent
- Privacy/Terms Link
- Upload Limits
- Pagination
- Maintenance Mode
- Public Announcement Config

### Save Flow

```text
แก้ค่า
  ↓
Validate
  ↓
แสดงสรุปการเปลี่ยนแปลง
  ↓
Save
  ├── สำเร็จ → Clear Cache + Activity Log
  └── Error → คงค่า
```

### Safety

- แยกค่าที่ Public อ่านได้กับค่าภายใน
- Secret ห้ามแสดงแบบข้อความเต็ม
- การเปลี่ยนค่าร้ายแรงต้องมี Confirmation
- Maintenance Mode ต้องไม่ล็อก Super Admin ออกจากระบบ

---

# PART D — GLOBAL UI STATES

## 41. Loading State

ทุกหน้าที่เรียก API ต้องมีอย่างน้อยหนึ่งแบบ:

- Skeleton
- Spinner
- Progress Indicator
- Button Loading

### Rules

- ห้ามแสดงหน้าว่าง
- ปุ่ม Submit ต้อง Disable
- Loading เกินเวลาที่กำหนดให้แสดงข้อความเพิ่มเติม
- ห้ามเปิด Modal ซ้อนจากการกดซ้ำ

---

## 42. Empty State

องค์ประกอบ:

- Icon/Illustration
- หัวข้อ
- คำอธิบาย
- ปุ่ม Action

ตัวอย่าง:

- “ยังไม่มีเรื่องแจ้ง”
- “ไม่พบข้อมูลตามตัวกรอง”
- “ยังไม่มีงานที่ได้รับมอบหมาย”
- “ยังไม่มีประกาศ”

Empty State ต้องไม่ใช้ข้อความเดียวกับ Error State

---

## 43. Error State

### ประเภท

1. Inline Field Error
2. Section Error
3. Page Error
4. Toast Error
5. Modal Error

### Rules

- บอกปัญหา
- บอกสิ่งที่ทำต่อได้
- ไม่แสดง Stack Trace
- ไม่โทษผู้ใช้
- คงข้อมูลใน Form
- Focus/Scroll ไปจุดผิด
- รองรับ Retry

---

## 44. Offline State

### Public

- แสดง Offline Banner
- ไม่อนุญาตส่งเรื่องจนเชื่อมต่อ
- คง Draft ข้อความที่ปลอดภัย
- ปุ่มลองใหม่

### Admin

- แสดง Offline Banner
- ปิด Action เขียนข้อมูล
- ข้อมูลที่อ่านอยู่ยังดูได้
- ห้ามแสดงว่าบันทึกสำเร็จหากยังไม่ถึง Backend

---

## 45. Permission Denied State

กรณีไม่มีสิทธิ์:

```text
API → FORBIDDEN
  ↓
แสดงหน้า/กล่อง “คุณไม่มีสิทธิ์เข้าถึงส่วนนี้”
  ↓
ปุ่มกลับ Dashboard
```

ห้ามซ่อน Error จนผู้ใช้สับสน และห้ามเปิดเผยว่ามีข้อมูลอะไรอยู่ใน Resource นั้น

---

## 46. Not Found State

ใช้กับ:

- Tracking Code ไม่พบ
- Report ID ไม่พบ
- Page ไม่พบ

### Public Tracking

แสดง:

- “ไม่พบรหัสติดตามนี้”
- ตรวจสอบตัวอักษรและตัวเลข
- ปุ่มลองใหม่
- ช่องทางติดต่อ

### Admin

แสดง:

- “ไม่พบรายการ หรือรายการอาจถูกย้าย”
- ปุ่มกลับรายการเรื่อง

---

## 47. Confirmation Patterns

ต้องใช้ Confirmation เมื่อ:

- ปิดเรื่อง
- ปฏิเสธเรื่อง
- ทำเครื่องหมายเรื่องซ้ำ
- Deactivate ผู้ใช้
- เปลี่ยน Role สำคัญ
- Logout ขณะมีข้อมูลไม่บันทึก
- ล้าง Draft
- ส่งออกข้อมูลส่วนบุคคล
- เปลี่ยน Settings สำคัญ

Modal ต้องระบุ:

- กำลังทำอะไร
- ผลที่จะเกิด
- ปุ่มยืนยันที่ชัด
- ปุ่มยกเลิก
- หลีกเลี่ยงปุ่ม “ตกลง” ที่ไม่บอกการกระทำ

---

# PART E — FORM AND COMPONENT BEHAVIOR

## 48. Form Pattern

ทุก Field ต้องมี:

- Label
- Required Indicator
- Hint เมื่อจำเป็น
- Error Message
- Disabled State
- Focus State

### Validation Timing

- ไม่แสดง Error ก่อนผู้ใช้แตะ Field
- ตรวจเมื่อ Blur หรือ Submit
- ล้าง Error เมื่อแก้ถูก
- Submit แล้ว Scroll ไป Error แรก

---

## 49. Button Hierarchy

### Primary

- แจ้งปัญหา
- ถัดไป
- ส่งเรื่อง
- บันทึก
- ยืนยัน

### Secondary

- ติดตามสถานะ
- ย้อนกลับ
- ยกเลิก
- ดูรายละเอียด

### Danger

- ปฏิเสธ
- ปิดใช้งาน
- ลบ Draft
- Revoke Session

### Rules

- หนึ่ง Section ไม่ควรมี Primary หลายปุ่ม
- Danger Button ต้องไม่อยู่ชิด Primary โดยไม่มีระยะ
- Loading Button ต้องคงความกว้างเพื่อลด Layout Shift

---

## 50. Toast

ใช้กับ:

- คัดลอกสำเร็จ
- บันทึกสำเร็จ
- อัปเดตสำเร็จ
- Error ที่ไม่บล็อกหน้า

### Rules

- ไม่บัง Bottom Navigation
- ไม่หายเร็วเกินไป
- Error สำคัญใช้ Inline หรือ Modal
- ไม่ใช้ Toast เป็นทางเดียวในการบอกผลสำคัญ

---

## 51. Modal

### Accessibility

- Trap Focus
- ปิดด้วย Escape เมื่อปลอดภัย
- Restore Focus เมื่อปิด
- มี Title
- มีปุ่มปิดที่เข้าถึงได้

### Mobile

- ใช้ Bottom Sheet ได้สำหรับ Action เล็ก
- Confirmation สำคัญใช้ Modal เต็มความกว้างที่เหมาะสม
- ห้ามสูงเกินหน้าจอโดยไม่มี Scroll

---

## 52. Table and Mobile Card

### Desktop

ใช้ Table สำหรับรายการ Admin

### Mobile

แปลงเป็น Card โดยแสดง:

- Tracking Code
- Status
- Title
- Category
- Date
- Assignee
- Priority
- ปุ่มดูรายละเอียด

### Rules

- ห้ามบังคับ Horizontal Scroll หากหลีกเลี่ยงได้
- Status และ Priority ต้องมีทั้งสีและข้อความ
- Sort ใช้ Control แยกบนมือถือ

---

# PART F — URL AND STATE RULES

## 53. URL Rules

### Public

```text
/report.html?category=CAT-001
/track-detail.html?code=KPR-260625-A7F4
```

Tracking Code ใน URL ต้องพิจารณาความเป็นส่วนตัวและไม่ใส่ข้อมูลส่วนบุคคลอื่น

### Admin

```text
/admin/reports.html?page=1&status=new
/admin/report-detail.html?id=REPORT_UUID
```

### Rules

- ไม่ใส่ Token ใน URL
- ไม่ใส่ Password ใน URL
- Filter ควรสะท้อนใน Query
- Return URL ต้อง Validate เพื่อป้องกัน Open Redirect

---

## 54. Browser Back and Refresh

### Multi-step Form

- Back ภายใน Form เปลี่ยน Step โดยไม่สูญข้อมูล
- Browser Back จาก Step แรกกลับหน้าเดิม
- Refresh ต้องกู้ Draft ข้อความได้เท่าที่ปลอดภัย
- ภาพอาจต้องเลือกใหม่หาก Browser ไม่เก็บ Blob

### Admin

- Back กลับรายการพร้อม Filter และ Page เดิม
- หลัง Save Refresh ข้อมูลจาก Server
- ห้ามใช้ข้อมูล Cache เป็นแหล่งจริงหลังแก้ไข

---

## 55. Scroll Behavior

- เปลี่ยน Step แล้ว Scroll Top ของ Form
- Validation Error Scroll ไป Field แรก
- กลับจาก Detail ไป List ควรจำ Scroll Position หากทำได้
- Modal เปิดแล้ว Body ไม่ Scroll
- Anchor Link ต้องคำนึงถึง Sticky Header

---

# PART G — ACCESSIBILITY FLOW

## 56. Keyboard Flow

- Tab Order เป็นธรรมชาติ
- Enter Submit เฉพาะเมื่อเหมาะสม
- Escape ปิด Modal/Drawer
- Space/Enter ใช้งาน Card ที่เป็น Control
- Focus State มองเห็นชัด

---

## 57. Screen Reader

- Stepper มี `aria-current`
- Error ใช้ `aria-describedby`
- Loading ใช้ Live Region ตามเหมาะสม
- Toast สำคัญประกาศผ่าน `aria-live`
- Icon-only Button ต้องมี Accessible Name
- Decorative Image ใช้ Alt ว่าง

---

## 58. Color and Status

ห้ามใช้เพียงสี:

- Status Chip ต้องมีข้อความ
- Priority ต้องมีข้อความหรือ Icon
- Error ต้องมีข้อความ
- Selected Card ต้องมี Border/Icon เพิ่ม

---

# PART H — ANALYTICS AND EVENTS

## 59. Recommended UX Events

หากเพิ่ม Analytics ในอนาคต ให้เก็บเฉพาะข้อมูลที่ไม่ระบุตัวบุคคล เช่น:

- `home_view`
- `report_start`
- `report_step_complete`
- `report_submit_success`
- `report_submit_error`
- `track_search`
- `track_found`
- `track_not_found`
- `admin_login_success`
- `admin_report_status_changed`

### Privacy Rules

- ห้ามส่งชื่อ
- ห้ามส่งเบอร์โทร
- ห้ามส่ง Email
- ห้ามส่งรายละเอียดเรื่อง
- ห้ามส่ง Tracking Code เต็ม
- ต้องแจ้งตาม Privacy Policy หากมี Analytics

---

# PART I — FLOW DIAGRAMS

## 60. Public Main Flow

```text
[หน้าแรก]
   ├── [แจ้งปัญหา]
   │      ↓
   │   [เลือกหมวด]
   │      ↓
   │   [รายละเอียด]
   │      ↓
   │   [สถานที่]
   │      ↓
   │   [รูปภาพ]
   │      ↓
   │   [ข้อมูลผู้แจ้ง]
   │      ↓
   │   [ตรวจสอบ]
   │      ↓
   │   [ส่งสำเร็จ + Tracking Code]
   │      ↓
   │   [ติดตามสถานะ]
   │
   ├── [ติดตามสถานะ]
   │      ↓
   │   [กรอกรหัส]
   │      ↓
   │   [รายละเอียด + Timeline]
   │      ↓
   │   [ส่งข้อมูลเพิ่มเติม]
   │
   ├── [FAQ]
   └── [ติดต่อ/ฉุกเฉิน]
```

---

## 61. Admin Main Flow

```text
[Login]
   ↓
[Dashboard]
   ├── [เรื่องทั้งหมด]
   │      ↓
   │   [ค้นหา/กรอง]
   │      ↓
   │   [รายละเอียดเรื่อง]
   │      ├── คัดกรอง
   │      ├── มอบหมาย
   │      ├── เปลี่ยนสถานะ
   │      ├── เพิ่ม Timeline
   │      ├── เพิ่มหลักฐาน
   │      ├── ระบุผล
   │      └── ปิดเรื่อง
   │
   ├── [งานของฉัน]
   ├── [รายงาน/Export]
   ├── [ผู้ใช้งาน]
   ├── [หมวดหมู่]
   ├── [ประกาศ]
   ├── [Activity Logs]
   └── [ตั้งค่า]
```

---

## 62. Report Lifecycle Flow

```text
[new]
  ├──→ [reviewing]
  │       ├──→ [assigned]
  │       │       └──→ [in_progress]
  │       │                  ├──→ [waiting]
  │       │                  └──→ [resolved]
  │       │                              └──→ [closed]
  │       ├──→ [waiting]
  │       ├──→ [rejected]
  │       └──→ [duplicate]
  ├──→ [assigned]
  ├──→ [waiting]
  ├──→ [rejected]
  └──→ [duplicate]
```

---

# PART J — ACCEPTANCE CRITERIA

## 63. Public Flow Acceptance Criteria

- เข้าใช้งานจากมือถือได้
- CTA หน้าแรกเห็นชัด
- แจ้งปัญหาครบ 6 ขั้น
- ย้อนกลับแล้วข้อมูลไม่หาย
- Draft ทำงานตามข้อกำหนด
- ใช้ GPS หรือกรอกเองได้
- เพิ่มภาพได้สูงสุด 3 รูป
- แจ้งแบบ Anonymous ได้
- ตรวจสอบข้อมูลก่อนส่งได้
- ป้องกันกดส่งซ้ำ
- ได้ Tracking Code
- คัดลอกรหัสได้
- ติดตามและดู Timeline ได้
- ส่งข้อมูลเพิ่มเติมได้
- Error ไม่ทำให้ข้อมูลหาย
- Privacy และ Consent เปิดอ่านได้

---

## 64. Admin Flow Acceptance Criteria

- Login และ Logout ได้
- Session Expired จัดการถูกต้อง
- Role แสดงเมนูถูกต้อง
- Dashboard โหลดข้อมูลตามสิทธิ์
- Search, Filter, Pagination ทำงาน
- กลับจาก Detail แล้วยังคง Filter
- มอบหมายได้
- เปลี่ยนสถานะตาม Transition ได้
- Status ที่ต้องมีเหตุผลบังคับกรอก
- Public Message แยกจาก Internal Note
- แนบ Evidence ได้
- Resolve และ Close ได้
- Activity Log เกิด
- Export ตามสิทธิ์ได้
- Mobile Admin ใช้งานได้

---

## 65. UX Quality Checklist

- [ ] ทุกหน้ามี Page Title
- [ ] ทุก Form Field มี Label
- [ ] ทุกปุ่มมีสถานะ Hover/Focus/Disabled
- [ ] ทุก API มี Loading
- [ ] ทุก List มี Empty State
- [ ] ทุก Error มีทางแก้
- [ ] Mobile 320px ไม่ล้นแนวนอน
- [ ] Bottom Navigation ไม่บัง Content
- [ ] Sticky Element ไม่บัง Field
- [ ] Contrast อ่านง่าย
- [ ] ใช้ภาษาไทยสม่ำเสมอ
- [ ] ไม่มีศัพท์เทคนิคที่ไม่จำเป็น
- [ ] Anonymous Flow ไม่ส่ง PII
- [ ] Public View ไม่แสดง Internal Data
- [ ] Back/Refresh ไม่ทำข้อมูลข้อความหายโดยไม่เตือน
- [ ] Dangerous Action มี Confirmation
- [ ] Session Expired ไม่วน Redirect
- [ ] Keyboard ใช้งานได้
- [ ] Screen Reader อ่านลำดับได้
- [ ] ไม่เกิด Console Error

---

# PART K — DEVELOPMENT HANDOFF

## 66. สิ่งที่ทีมออกแบบต้องส่งมอบ

- Mobile Wireframe
- Desktop Wireframe
- Component Inventory
- Design Tokens
- Status Color Guide
- Prototype Public Flow
- Prototype Admin Flow
- Empty/Error/Loading States
- Responsive Behavior Notes

---

## 67. สิ่งที่ทีมพัฒนาต้องอ้างอิง

- Path ในเอกสารนี้
- Role และ Permission จาก APP_SPEC
- Data Structure จาก DATA_SCHEMA
- Request/Response จาก API_SPEC
- Coding Rules จาก DEVELOPMENT_RULES
- Status Transition ต้องไม่ Hardcode หลายจุด
- UI Text ควรรวมศูนย์เมื่อทำได้
- Config ต้องอ่านจากจุดเดียว

---

## 68. ลำดับการสร้างหน้าจอที่แนะนำ

1. Shared Design Tokens
2. Header / Bottom Navigation / Footer
3. หน้าแรก
4. Report Stepper
5. Report Steps 1–6
6. Success Page
7. Track Search
8. Track Detail + Timeline
9. Contact / FAQ / Privacy / Terms
10. Admin Login
11. Admin Layout
12. Dashboard
13. Report List
14. Report Detail
15. Assignment / Status / Timeline Modals
16. Users
17. Categories
18. Announcements
19. Export
20. Activity Logs
21. Settings
22. Error Pages
23. Responsive and Accessibility Pass

---

## 69. ข้อกำหนดที่ยังต้องยืนยันก่อน Production

- Logo และ Favicon
- Hero Image
- หมายเลขฉุกเฉิน
- เบอร์โทรโครงการ
- เวลาทำการ
- รายชื่อหมู่ที่รองรับ
- รายชื่อหมวดจริง
- Target Days
- ข้อความ Consent
- Privacy Policy
- Terms
- ข้อความ Public Status แต่ละสถานะ
- นโยบายเพิ่มข้อมูลหลังปิดเรื่อง
- นโยบาย Reopen
- วิธีเก็บ Session ฝั่ง Client ที่เลือกใช้จริง

---

## 70. สรุป

UI Flow ของ Khaophang Report ต้องทำให้ประชาชนสามารถ:

1. เข้าใจระบบ
2. แจ้งเรื่องได้ง่าย
3. ไม่สูญข้อมูลระหว่างกรอก
4. ได้รับรหัสติดตาม
5. ตรวจสอบความคืบหน้าได้
6. ส่งข้อมูลเพิ่มเติมได้

และทำให้เจ้าหน้าที่สามารถ:

1. เห็นงานที่ต้องทำ
2. คัดกรองอย่างเป็นระบบ
3. มอบหมาย
4. อัปเดตสถานะ
5. แยกข้อความสาธารณะและภายใน
6. บันทึกผลและหลักฐาน
7. ปิดเรื่อง
8. ตรวจสอบย้อนหลังได้

ทุกหน้าจอต้องยึดบุคลิก:

> เรียบง่าย อบอุ่น เป็นมิตร ใช้สีเขียวธรรมชาติ อ่านง่าย กดง่าย และเหมาะกับการใช้งานจริงในชุมชน

---

**End of UI_FLOW.md**
