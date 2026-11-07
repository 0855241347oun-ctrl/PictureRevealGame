/**
 * Mimic Party - 20 Default Prompts & Custom Prompts Management
 */
const MIMIC_PROMPTS = [
    { id: 1, text: "ยายกินลำไย น้ำลายยายไหลย้อย", category: "ลิ้นพันกัน", difficulty: "ปานกลาง" },
    { id: 2, text: "ชามเขียวคว่ำเช้า ชามขาวคว่ำค่ำ", category: "ลิ้นพันกัน", difficulty: "ยาก" },
    { id: 3, text: "เช้าฟาดผัดฟัก เย็นฟาดฟักผัด", category: "ลิ้นพันกัน", difficulty: "ยาก" },
    { id: 4, text: "หมูร้องอู๊ดๆ หมาเห่าโฮ่งๆ ไก่ขันเอกอีเอ้กเอ้ก", category: "เสียงสัตว์", difficulty: "ง่าย" },
    { id: 5, text: "กบกระโดดตกกะละมังน้ำดังจ๋อม", category: "เสียงฮาๆ", difficulty: "ง่าย" },
    { id: 6, text: "ยักษ์ใหญ่ไล่ยักษ์เล็ก ยักษ์เล็กไล่ยักษ์ใหญ่", category: "ลิ้นพันกัน", difficulty: "ปานกลาง" },
    { id: 7, text: "รถยนต์วิ่งวนบนถนนชนต้นตาล", category: "ลิ้นพันกัน", difficulty: "ปานกลาง" },
    { id: 8, text: "ลิงจ๋อขอกล้วยหอมทองสองลูก", category: "เสียงสัตว์", difficulty: "ง่าย" },
    { id: 9, text: "กินมันติดเหงือก กินเผือกติดฟัน", category: "ลิ้นพันกัน", difficulty: "ง่าย" },
    { id: 10, text: "ปลาทองว่ายน้ำป๋อมแป๋มในบ่อบัว", category: "น่ารัก", difficulty: "ง่าย" },
    { id: 11, text: "เป็ดเดินเซไปชนตูดไก่กุ๊กๆ", category: "เสียงฮาๆ", difficulty: "ง่าย" },
    { id: 12, text: "แมวเหมียวปีนขึ้นเสาไฟฟ้าตอนฝนตก", category: "เสียงสัตว์", difficulty: "ง่าย" },
    { id: 13, text: "ผีเสื้อขยับปีกบินดุ๊กดิ๊กไปมา", category: "น่ารัก", difficulty: "ง่าย" },
    { id: 14, text: "จิ้งจกทักจุ๊ๆ อยู่บนหลังคาบ้าน", category: "เสียงสัตว์", difficulty: "ง่าย" },
    { id: 15, text: "กระต่ายหูยาวกระโดดดึ๋งๆ ในทุ่งหญ้า", category: "น่ารัก", difficulty: "ง่าย" },
    { id: 16, text: "ยุงกัดก้นลิงจนลิงร้องเจี๊ยกๆ", category: "เสียงฮาๆ", difficulty: "ง่าย" },
    { id: 17, text: "หมีกินน้ำผึ้งจนพุงป่องอ้วนกลม", category: "น่ารัก", difficulty: "ง่าย" },
    { id: 18, text: "รถไฟแล่นเร็วฉึกฉักปู๊นๆ ข้ามสะพาน", category: "เลียนเสียง", difficulty: "ง่าย" },
    { id: 19, text: "ทะเลสีครามคลื่นซัดซู่ซ่าริมหาดทราย", category: "เลียนเสียง", difficulty: "ปานกลาง" },
    { id: 20, text: "ช้างพ่นน้ำใส่หน้าคุณครูดังฟู่", category: "เสียงฮาๆ", difficulty: "ง่าย" }
];
