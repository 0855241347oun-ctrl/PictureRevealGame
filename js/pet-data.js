/**
 * pet-data.js - ข้อมูลการ์ดสัตว์เลี้ยง และการ์ดพิเศษสำหรับเกม "วัดใจแต้มสัตว์เลี้ยง"
 * แต้มพลังแบบเฟ้อๆ หลักร้อยถึงเกือบเจ็ดพัน (ไม่เกิน 7,000)
 * คำใบ้กว้างๆ ชวนสับสน (Deceptive / Broad Clues) เพื่อความมันส์ในการบลัฟฟ์
 */

// 🐾 รายการการ์ดสัตว์เลี้ยง (Pet Cards) 50 ตัว
const PET_CARDS = [
    // --- หมวดคำใบ้: "ตัวเล็ก" (มีทั้งตัวกาก 100+ และตัวโหดพิษมรณะ 6,800+) ---
    { id: 1, name: "ยุงลาย", emoji: "🦟", power: 150, clue: "ตัวเล็ก" },
    { id: 2, name: "มดแดงไฟ", emoji: "🐜", power: 280, clue: "ตัวเล็ก" },
    { id: 3, name: "หนูบ้าน", emoji: "🐀", power: 450, clue: "ตัวเล็ก" },
    { id: 4, name: "หมึกบลูริง", emoji: "🐙", power: 6550, clue: "ตัวเล็ก" },
    { id: 5, name: "กบลูกศรพิษสีทอง", emoji: "🐸", power: 6780, clue: "ตัวเล็ก" },
    { id: 6, name: "แมงกะพุนกล่อง", emoji: "🪼", power: 6920, clue: "ตัวเล็ก" },

    // --- หมวดคำใบ้: "สัตว์กินพืช" (มีทั้งตัวนุ่มนิ่ม และสัตว์บกชนรถคว่ำ) ---
    { id: 7, name: "หนอนผีเสื้อ", emoji: "🐛", power: 180, clue: "สัตว์กินพืช" },
    { id: 8, name: "กระต่ายป่า", emoji: "🐰", power: 850, clue: "สัตว์กินพืช" },
    { id: 9, name: "กวางดาว", emoji: "🦌", power: 2100, clue: "สัตว์กินพืช" },
    { id: 10, name: "ควายป่าไบซัน", emoji: "🦬", power: 5800, clue: "สัตว์กินพืช" },
    { id: 11, name: "ฮิปโปโปเตมัส", emoji: "🦛", power: 6650, clue: "สัตว์กินพืช" },
    { id: 12, name: "แรดขาวแอฟริกา", emoji: "🦏", power: 6800, clue: "สัตว์กินพืช" },
    { id: 13, name: "ช้างแอฟริกา", emoji: "🐘", power: 6950, clue: "สัตว์กินพืช" },

    // --- หมวดคำใบ้: "สัตว์น้ำ" (มีตั้งแต่ปลาทอง ยันนักล่าแห่งมหาสมุทร) ---
    { id: 14, name: "ปลาทอง", emoji: "🐠", power: 220, clue: "สัตว์น้ำ" },
    { id: 15, name: "กุ้งแม่น้ำ", emoji: "🦐", power: 390, clue: "สัตว์น้ำ" },
    { id: 16, name: "ปลาหมึกกล้วย", emoji: "🦑", power: 1250, clue: "สัตว์น้ำ" },
    { id: 17, name: "ปิรันยาแดง", emoji: "🐟", power: 3400, clue: "สัตว์น้ำ" },
    { id: 18, name: "ฉลามหัวค้อน", emoji: "🦈", power: 5900, clue: "สัตว์น้ำ" },
    { id: 19, name: "ฉลามขาวนักล่า", emoji: "🦈", power: 6750, clue: "สัตว์น้ำ" },
    { id: 20, name: "วาฬเพชฌฆาต (ออร์กา)", emoji: "🐋", power: 6980, clue: "สัตว์น้ำ" },

    // --- หมวดคำใบ้: "บินได้" (มีแมลงวัน ยันอินทรียักษ์) ---
    { id: 21, name: "แมลงวันหัวเขียว", emoji: "🪰", power: 130, clue: "บินได้" },
    { id: 22, name: "ผีเสื้อแสนสวย", emoji: "🦋", power: 320, clue: "บินได้" },
    { id: 23, name: "นกพิราบ", emoji: "🐦", power: 980, clue: "บินได้" },
    { id: 24, name: "นกฮูกนักล่า", emoji: "🦉", power: 3800, clue: "บินได้" },
    { id: 25, name: "เหยี่ยวเพเรกริน", emoji: "🦅", power: 5700, clue: "บินได้" },
    { id: 26, name: "นกอินทรีทองคำ", emoji: "🦅", power: 6500, clue: "บินได้" },

    // --- หมวดคำใบ้: "สัตว์สี่ขา" (มีหนูแฮมสเตอร์ ยันเสือโคร่ง) ---
    { id: 27, name: "หนูแฮมสเตอร์", emoji: "🐹", power: 350, clue: "สัตว์สี่ขา" },
    { id: 28, name: "แมวบ้าน", emoji: "🐱", power: 1650, clue: "สัตว์สี่ขา" },
    { id: 29, name: "สุนัขบีเกิ้ล", emoji: "🐶", power: 2400, clue: "สัตว์สี่ขา" },
    { id: 30, name: "หมูป่าเขี้ยวยาว", emoji: "🐗", power: 4600, clue: "สัตว์สี่ขา" },
    { id: 31, name: "หมาป่าอัลฟ่า", emoji: "🐺", power: 5950, clue: "สัตว์สี่ขา" },
    { id: 32, name: "เสือดาวหิมะ", emoji: "🐆", power: 6400, clue: "สัตว์สี่ขา" },
    { id: 33, name: "เสือโคร่งเบงกอล", emoji: "🐅", power: 6850, clue: "สัตว์สี่ขา" },
    { id: 34, name: "หมีขั้วโลกขาว", emoji: "🐻‍❄️", power: 6900, clue: "สัตว์สี่ขา" },

    // --- หมวดคำใบ้: "ชอบนอน" (สลอธ vs ราชาสิงโต) ---
    { id: 35, name: "หอยทาก", emoji: "🐌", power: 140, clue: "ชอบนอน" },
    { id: 36, name: "สลอธสามนิ้ว", emoji: "🦥", power: 420, clue: "ชอบนอน" },
    { id: 37, name: "หมีโคอาล่า", emoji: "🐨", power: 1100, clue: "ชอบนอน" },
    { id: 38, name: "หมีแพนด้ายักษ์", emoji: "🐼", power: 4900, clue: "ชอบนอน" },
    { id: 39, name: "สิงโตเจ้าป่า", emoji: "🦁", power: 6880, clue: "ชอบนอน" },

    // --- หมวดคำใบ้: "สัตว์มีพิษ" (ผึ้ง vs งูจงอาง) ---
    { id: 40, name: "ผึ้งน้อย", emoji: "🐝", power: 520, clue: "สัตว์มีพิษ" },
    { id: 41, name: "ตะขาบขายาว", emoji: "🐛", power: 1950, clue: "สัตว์มีพิษ" },
    { id: 42, name: "แมงป่องยักษ์", emoji: "🦂", power: 5300, clue: "สัตว์มีพิษ" },
    { id: 43, name: "งูจงอางยักษ์", emoji: "🐍", power: 6700, clue: "สัตว์มีพิษ" },

    // --- หมวดคำใบ้: "สัตว์เลื้อยคลาน" (จิ้งจก vs อนาคอนดา) ---
    { id: 44, name: "จิ้งจกบ้าน", emoji: "🦎", power: 210, clue: "สัตว์เลื้อยคลาน" },
    { id: 45, name: "กิ้งก่าคาเมเลียน", emoji: "🦎", power: 750, clue: "สัตว์เลื้อยคลาน" },
    { id: 46, name: "เต่ายักษ์กาลาปากอส", emoji: "🐢", power: 3100, clue: "สัตว์เลื้อยคลาน" },
    { id: 47, name: "มังกรโคโมโด", emoji: "🦎", power: 6350, clue: "สัตว์เลื้อยคลาน" },
    { id: 48, name: "จระเข้น้ำเค็ม", emoji: "🐊", power: 6720, clue: "สัตว์เลื้อยคลาน" },
    { id: 49, name: "งูยักษ์อนาคอนดา", emoji: "🐍", power: 6850, clue: "สัตว์เลื้อยคลาน" },

    // --- หมวดคำใบ้: "มีขนปุย" (ลูกเจี๊ยบ vs ลิงกอริลลา) ---
    { id: 50, name: "ลูกเจี๊ยบ", emoji: "🐤", power: 190, clue: "มีขนปุย" },
    { id: 51, name: "กระรอกบิน", emoji: "🐿️", power: 880, clue: "มีขนปุย" },
    { id: 52, name: "แกะปุยเมฆ", emoji: "🐑", power: 1750, clue: "มีขนปุย" },
    { id: 53, name: "ลิงกอริลลาหลังเงิน", emoji: "🦍", power: 6600, clue: "มีขนปุย" }
];

// ⚡ การ์ดพิเศษ (Special Modifier Cards) แบ่ง 4 สีตามระดับ
// ค่าบัฟ (+) และดีบัฟ (-) สเกลหลักร้อยถึงสองพัน เพื่อความเร้าใจ
const SPECIAL_CARDS = {
    // ⚪ การ์ดสีขาว (Common) - ผลเบาๆ ไม่หวือหวา
    white: [
        { id: "w1", tier: "white", name: "กล้วยหอมเพิ่มแรง", val: 200, text: "+200", icon: "🍌" },
        { id: "w2", tier: "white", name: "อาหารเม็ดชั้นดี", val: 350, text: "+350", icon: "🥩" },
        { id: "w3", tier: "white", name: "นมสดเสริมกระดูก", val: 150, text: "+150", icon: "🥛" },
        { id: "w4", tier: "white", name: "ขนมนกกระจอก", val: 250, text: "+250", icon: "🥨" },
        { id: "w5", tier: "white", name: "หาวนอนเฉื่อยชา", val: -150, text: "-150", icon: "🥱" },
        { id: "w6", tier: "white", name: "สะดุดขาตัวเอง", val: -250, text: "-250", icon: "🐾" },
        { id: "w7", tier: "white", name: "คันหูเกาไม่หยุด", val: -200, text: "-200", icon: "🪰" },
        { id: "w8", tier: "white", name: "กินน้ำผิดจังหวะ", val: -100, text: "-100", icon: "💧" }
    ],

    // 🟢 การ์ดสีเขียว (Uncommon) - ผลปานกลาง เริ่มมีผลต่อการพลิกเกม
    green: [
        { id: "g1", tier: "green", name: "ยาวิ่งสปีดบูสต์", val: 550, text: "+550", icon: "⚡" },
        { id: "g2", tier: "green", name: "เกราะกระดองเต่า", val: 700, text: "+700", icon: "🛡️" },
        { id: "g3", tier: "green", name: "สมุนไพรป่าลึก", val: 600, text: "+600", icon: "🌿" },
        { id: "g4", tier: "green", name: "กระโดดข้ามรั้ว", val: 450, text: "+450", icon: "🦘" },
        { id: "g5", tier: "green", name: "ท้องร่วงกะทันหัน", val: -400, text: "-400", icon: "🤢" },
        { id: "g6", tier: "green", name: "ติดใยแมงมุมเหนียว", val: -550, text: "-550", icon: "🕸️" },
        { id: "g7", tier: "green", name: "หนามทิ่มฝ่าเท้า", val: -500, text: "-500", icon: "🌵" },
        { id: "g8", tier: "green", name: "กลิ่นตดเพื่อนข้างๆ", val: -350, text: "-350", icon: "💨" }
    ],

    // 🔵 การ์ดสีน้ำเงิน (Rare) - ผลแรงมาก พลิกสถานการณ์ได้ทันตา
    blue: [
        { id: "b1", tier: "blue", name: "มงกุฎจ่าฝูงไร้พ่าย", val: 1100, text: "+1,100", icon: "👑" },
        { id: "b2", tier: "blue", name: "พายุหมุนคลั่ง", val: 1350, text: "+1,350", icon: "🌪️" },
        { id: "b3", tier: "blue", name: "เขี้ยวสายฟ้าฟาด", val: 1200, text: "+1,200", icon: "⚡" },
        { id: "b4", tier: "blue", name: "สัญชาตญาณสัตว์ป่า", val: 950, text: "+950", icon: "👁️" },
        { id: "b5", tier: "blue", name: "ตกหลุมพรางนายพราน", val: -850, text: "-850", icon: "🕳️" },
        { id: "b6", tier: "blue", name: "โดนโซ่ตรวนขึงขัง", val: -1000, text: "-1,000", icon: "⛓️" },
        { id: "b7", tier: "blue", name: "โดนพิษงูกัดขา", val: -900, text: "-900", icon: "🧪" },
        { id: "b8", tier: "blue", name: "หมอกควันตาพร่ามัว", val: -750, text: "-750", icon: "🌫️" }
    ],

    // 🟡 การ์ดสีทอง (Legendary) - ผลลัพธ์ระดับตำนาน พลิกฟ้าคว่ำแผ่นดิน
    gold: [
        { id: "l1", tier: "gold", name: "🌟 อวตารเทพจุติ", val: 2000, text: "+2,000", icon: "🌟" },
        { id: "l2", tier: "gold", name: "☄️ อุกกาบาตบรรพกาล", val: 1800, text: "+1,800", icon: "☄️" },
        { id: "l3", tier: "gold", name: "🐲 พลังมังกรหลับตื่น", val: 1650, text: "+1,650", icon: "🐲" },
        { id: "l4", tier: "gold", name: "🔥 เปลวเพลิงสุริยะ", val: 1500, text: "+1,500", icon: "🔥" },
        { id: "l5", tier: "gold", name: "💀 คำสาปปีศาจมรณะ", val: -1500, text: "-1,500", icon: "💀" },
        { id: "l6", tier: "gold", name: "🌋 ธรณีสูบลาวาเดือด", val: -1350, text: "-1,350", icon: "🌋" },
        { id: "l7", tier: "gold", name: "❄️ แช่แข็งยุคน้ำแข็ง", val: -1200, text: "-1,200", icon: "❄️" },
        { id: "l8", tier: "gold", name: "🖤 หลุมดำดูดกลืนพลัง", val: -1800, text: "-1,800", icon: "🕳️" }
    ]
};

// รวมการ์ดพิเศษทั้งหมดเข้าเป็น Pool เดียว สำหรับสุ่มตามน้ำหนัก (Weight)
// ขาว (45%), เขียว (30%), น้ำเงิน (18%), ทอง (7%)
function getRandomSpecialCard() {
    const rand = Math.random() * 100;
    let tier = 'white';
    if (rand < 42) {
        tier = 'white';
    } else if (rand < 72) {
        tier = 'green';
    } else if (rand < 92) {
        tier = 'blue';
    } else {
        tier = 'gold';
    }
    const pool = SPECIAL_CARDS[tier];
    const card = pool[Math.floor(Math.random() * pool.length)];
    return { ...card };
}

// สุ่มการ์ดสัตว์ 1 ใบ
function getRandomPetCard(excludeId = null) {
    let card;
    do {
        card = PET_CARDS[Math.floor(Math.random() * PET_CARDS.length)];
    } while (excludeId && card.id === excludeId && PET_CARDS.length > 1);
    return { ...card };
}
