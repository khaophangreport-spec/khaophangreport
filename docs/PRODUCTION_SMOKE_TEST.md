# Production Smoke Test

เอกสารนี้ใช้สำหรับตรวจระบบหลัง deploy ที่ Production URL:

`https://khaophangreport.pages.dev`

ข้อควรระวัง:

- ห้ามบันทึก password, session token, Script Property, Spreadsheet ID, Folder ID หรือค่า secret ใด ๆ ลงในเอกสารนี้
- การทดสอบที่สร้าง/แก้ไขข้อมูลจริงต้องใช้ข้อมูลทดสอบที่ทีมกำหนด และต้องมีแผน cleanup
- Admin API และ flow หลัง login ต้องทดสอบด้วยบัญชีที่ได้รับอนุญาตเท่านั้น
- หากพบ error ให้เก็บ `requestId`, action, HTTP status, error code/message และ screenshot โดยไม่แนบข้อมูลลับ

## ผลตรวจอัตโนมัติรอบล่าสุด

วันที่ตรวจ: 2026-06-28

ขอบเขตที่ตรวจจากเครื่องมือ:

| รายการ | ผล | หมายเหตุ |
| --- | --- | --- |
| Home | ผ่านบางส่วน | `/` ตอบ 200 และ title เป็น `หน้าแรก | Khaophang Report` |
| Public Config | ผ่าน | API ตอบ `ok=true` และไม่พบ key ลับจาก keyword scan |
| Categories | ผ่าน | API ตอบ `ok=true`, พบ 10 รายการ |
| Announcement | ผ่านบางส่วน | API ตอบ `ok=true`, จำนวนประกาศ 0 รายการ ต้องยืนยัน empty state บนหน้าเว็บ |
| หน้า Public | ผ่านบางส่วน | `/report`, `/track`, `/contact` ตอบ 200 |
| หน้า Admin static | ผ่านบางส่วน | `/admin/login`, `/admin/dashboard`, `/admin/reports`, `/admin/report-detail`, `/admin/export` ตอบ 200 |
| 404 Handling | ผ่านบางส่วน | `/does-not-exist-smoke-test` ตอบ 404, `/404` ตอบ 200 |
| health.check | ต้องแก้ก่อน Production จริง | API ตอบ `status=ok` แต่ `environment=development` |

รายการที่ยังไม่ได้ทดสอบจากเครื่องมือ:

- Report Create, Image Upload, Location, Success, Track แบบใช้ข้อมูลจริง
- Login และ Admin flow ทั้งหมด
- Assign, Status, Export, Logout
- Mobile rendering, Browser Console และ Network tab ใน browser จริง

เหตุผล: flow เหล่านี้ต้องใช้บัญชีผู้ดูแลหรือสร้าง/แก้ไขข้อมูลใน production จึงไม่ควรดำเนินการโดยไม่มี credential, test data marker และ cleanup plan ที่ผู้ใช้อนุมัติไว้ชัดเจน

## Blocker ก่อน Go Live

1. `health.check` บน production URL ยังตอบ `environment=development`
2. ให้ตั้งค่า environment ของ Apps Script production เป็น `production` ตามกลไก Script Properties ของโปรเจกต์ แล้วตรวจ `health.check` ซ้ำ
3. ห้าม deploy ซ้ำจนกว่าจะยืนยันว่า Script Properties, Allowed Origin, Spreadsheet และ Drive root เป็นของ production จริง

## Smoke Test Checklist

ใช้ checkbox นี้หลัง deploy ทุกครั้ง

| ลำดับ | รายการ | วิธีตรวจ | ผลที่คาดหวัง | สถานะ |
| --- | --- | --- | --- | --- |
| 1 | Home | เปิด `/` | โหลดหน้าแรกได้, ไม่มี error state | ยังไม่เริ่ม |
| 2 | Public Config | เปิดหน้าแรกหรือเรียกผ่าน UI | ชื่อระบบ/ข้อความสาธารณะแสดงถูก, ไม่มีข้อมูลลับ | ยังไม่เริ่ม |
| 3 | Categories | เปิดหน้าแจ้งปัญหา | หมวดหมู่แสดงครบหรือแสดง empty state ที่เหมาะสม | ยังไม่เริ่ม |
| 4 | Announcement | ตรวจส่วนประกาศ | แสดงประกาศ หรือ empty state ภาษาไทย | ยังไม่เริ่ม |
| 5 | Report Create | ส่งเรื่องทดสอบด้วย marker ที่ทีมกำหนด | สร้างเรื่องสำเร็จ, ได้ tracking code | ยังไม่เริ่ม |
| 6 | Image Upload | แนบรูปทดสอบขนาดเล็ก | upload สำเร็จ, preview/validation ถูกต้อง | ยังไม่เริ่ม |
| 7 | Location | กรอกที่ตั้ง/พิกัด/ลิงก์แผนที่ที่ปลอดภัย | backend รับเฉพาะ URL scheme ที่ปลอดภัย | ยังไม่เริ่ม |
| 8 | Success | ตรวจหน้าหลังส่งเรื่อง | แสดงผลสำเร็จและ tracking code ชัดเจน | ยังไม่เริ่ม |
| 9 | Track | นำ tracking code ไปค้นหา | พบสถานะเรื่อง, ไม่แสดง PII/internal fields | ยังไม่เริ่ม |
| 10 | Login | เข้าหน้า `/admin/login` และ login | เข้าระบบได้ด้วยบัญชีที่มีสิทธิ์ | ยังไม่เริ่ม |
| 11 | Dashboard | เปิด dashboard | summary โหลดสำเร็จ, มี loading/error/empty ตามเหมาะสม | ยังไม่เริ่ม |
| 12 | List | เปิดรายการเรื่อง | filter/sort/pagination ใช้งานได้ | ยังไม่เริ่ม |
| 13 | Detail | เปิดรายละเอียดเรื่องทดสอบ | แสดงข้อมูลตามสิทธิ์, ไม่ leak secret/Drive fields | ยังไม่เริ่ม |
| 14 | Assign | มอบหมายเรื่องทดสอบ | เฉพาะผู้มีสิทธิ์ทำได้, version conflict ทำงาน | ยังไม่เริ่ม |
| 15 | Status | เปลี่ยนสถานะเรื่องทดสอบ | validation ตาม status transition ทำงาน | ยังไม่เริ่ม |
| 16 | Export | ส่งออก CSV | ค่าเริ่มต้นไม่รวม PII, CSV กัน formula injection | ยังไม่เริ่ม |
| 17 | Logout | logout จาก admin | session ถูกออกจากระบบ, กลับเข้า admin ต้อง login ใหม่ | ยังไม่เริ่ม |
| 18 | Mobile | ทดสอบ viewport มือถือ | layout ไม่ล้น, ปุ่ม/ฟอร์มใช้งานได้ | ยังไม่เริ่ม |
| 19 | Console | เปิด DevTools Console | ไม่มี uncaught error หรือ warning สำคัญ | ยังไม่เริ่ม |
| 20 | Network Errors | เปิด DevTools Network | ไม่มี request failed, 4xx/5xx ที่ไม่คาดหวัง | ยังไม่เริ่ม |

## ขั้นตอนทดสอบแบบละเอียด

### Public Flow

1. เปิด browser แบบ incognito ไปที่ `https://khaophangreport.pages.dev`
2. ตรวจหน้าแรก, ข้อความสำคัญ, ประกาศ และปุ่มไปยัง flow แจ้งปัญหา/ติดตามเรื่อง
3. เปิดหน้าแจ้งปัญหา
4. รอ loading จนจบ แล้วตรวจหมวดหมู่
5. กรอกเรื่องทดสอบด้วย marker ที่ทีมกำหนด หลีกเลี่ยงข้อมูลส่วนบุคคลจริง
6. แนบรูปทดสอบที่ไม่มีข้อมูลส่วนบุคคล
7. กรอกตำแหน่งและข้อมูลติดต่อที่เป็นข้อมูลทดสอบ
8. ส่งเรื่องและบันทึก screenshot หน้าสำเร็จ
9. นำ tracking code ไปตรวจในหน้า Track
10. ตรวจว่า Track แสดงเฉพาะข้อมูลสาธารณะ และไม่แสดงข้อมูลภายใน

### Admin Flow

1. เปิด `/admin/login`
2. Login ด้วยบัญชีทดสอบที่ได้รับอนุญาต ห้ามส่ง password กลับมาในรายงาน
3. เปิด Dashboard และตรวจ summary
4. เปิดรายการเรื่อง แล้วค้นหา marker ของเรื่องทดสอบ
5. เปิดรายละเอียดเรื่อง
6. ทดสอบ assign เฉพาะกับเรื่องทดสอบ
7. ทดสอบเปลี่ยนสถานะตาม transition ที่อนุญาต
8. ทดสอบ export โดยเริ่มจากไม่รวมข้อมูลส่วนบุคคล
9. Logout และยืนยันว่ากลับเข้า admin page ต้อง login ใหม่

### Mobile, Console, Network

1. เปิด DevTools แล้วเลือก mobile viewport
2. ทดสอบ Home, Report Create, Track, Login และ List อย่างน้อยหนึ่งรอบ
3. เปิด Console ตลอดการทดสอบ
4. เปิด Network แล้ว filter เป็น `Fetch/XHR`
5. ตรวจว่า API ทุกตัวเรียกผ่าน frontend client กลางของระบบ และไม่มี request ไป Google Sheets โดยตรง
6. บันทึก failed request ทั้งหมด พร้อม action, status, response error code และ requestId

## สิ่งที่ต้องนำกลับมาให้ตรวจ

- Screenshot ของ Home, Report Success, Track, Login, Dashboard, List, Detail และ Mobile viewport
- Console errors/warnings แบบข้อความ ไม่ต้องแนบข้อมูลลับ
- Network failed requests พร้อม method, action, HTTP status, `requestId`, error code/message
- ผล `health.check` หลังแก้ environment แล้ว
- จำนวน category และ announcement ที่เห็นจาก UI
- Tracking code ของเรื่องทดสอบแบบ redact ได้ หากต้องส่งผ่านช่องทางไม่ปลอดภัย
- ยืนยันว่า export CSV เปิดแล้วไม่เกิด formula execution และไม่รวม PII เมื่อไม่ได้เลือก include personal data
- รายการข้อมูลทดสอบที่ต้อง cleanup หลังจบ smoke test
