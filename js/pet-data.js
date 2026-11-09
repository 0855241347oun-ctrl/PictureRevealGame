/**
 * pet-data.js - ข้อมูลการ์ดสัตว์เลี้ยง และการ์ดพิเศษสำหรับเกม "วัดใจแต้มสัตว์เลี้ยง"
 * แต้มพลังไม่เกิน 3,000 (ตั้งแต่ 50 ถึง 2,990)
 * คำใบ้กว้างๆ ชวนสับสน (Deceptive / Broad Clues) เพื่อความมันส์ในการบลัฟฟ์
 */

// 🐾 รายการการ์ดสัตว์เลี้ยง (Pet Cards) 53 ตัว (แต้มไม่เกิน 3,000)
const PET_CARDS = [
    // --- หมวดคำใบ้: "ตัวเล็ก" (มีทั้งตัวกาก 60+ และตัวโหดพิษมรณะ 2,950) ---
    { id: 1, name: "ยุงลาย", emoji: "🦟", power: 60, clue: "ตัวเล็ก" },
    { id: 2, name: "มดแดงไฟ", emoji: "🐜", power: 120, clue: "ตัวเล็ก" },
    { id: 3, name: "หนูบ้าน", emoji: "🐀", power: 200, clue: "ตัวเล็ก" },
    { id: 4, name: "หมึกบลูริง", emoji: "🐙", power: 2750, clue: "ตัวเล็ก" },
    { id: 5, name: "กบลูกศรพิษสีทอง", emoji: "🐸", power: 2880, clue: "ตัวเล็ก" },
    { id: 6, name: "แมงกะพุนกล่อง", emoji: "🪼", power: 2950, clue: "ตัวเล็ก" },

    // --- หมวดคำใบ้: "สัตว์กินพืช" (มีทั้งตัวนุ่มนิ่ม และสัตว์บกชนรถคว่ำ 2,980) ---
    { id: 7, name: "หนอนผีเสื้อ", emoji: "🐛", power: 80, clue: "สัตว์กินพืช" },
    { id: 8, name: "กระต่ายป่า", emoji: "🐰", power: 380, clue: "สัตว์กินพืช" },
    { id: 9, name: "กวางดาว", emoji: "🦌", power: 950, clue: "สัตว์กินพืช" },
    { id: 10, name: "ควายป่าไบซัน", emoji: "🦬", power: 2450, clue: "สัตว์กินพืช" },
    { id: 11, name: "ฮิปโปโปเตมัส", emoji: "🦛", power: 2800, clue: "สัตว์กินพืช" },
    { id: 12, name: "แรดขาวแอฟริกา", emoji: "🦏", power: 2900, clue: "สัตว์กินพืช" },
    { id: 13, name: "ช้างแอฟริกา", emoji: "🐘", power: 2980, clue: "สัตว์กินพืช" },

    // --- หมวดคำใบ้: "สัตว์น้ำ" (มีตั้งแต่ปลาทอง ยันนักล่าแห่งมหาสมุทร 2,990) ---
    { id: 14, name: "ปลาทอง", emoji: "🐠", power: 90, clue: "สัตว์น้ำ" },
    { id: 15, name: "กุ้งแม่น้ำ", emoji: "🦐", power: 160, clue: "สัตว์น้ำ" },
    { id: 16, name: "ปลาหมึกกล้วย", emoji: "🦑", power: 550, clue: "สัตว์น้ำ" },
    { id: 17, name: "ปิรันยาแดง", emoji: "🐟", power: 1450, clue: "สัตว์น้ำ" },
    { id: 18, name: "ฉลามหัวค้อน", emoji: "🦈", power: 2500, clue: "สัตว์น้ำ" },
    { id: 19, name: "ฉลามขาวนักล่า", emoji: "🦈", power: 2850, clue: "สัตว์น้ำ" },
    { id: 20, name: "วาฬเพชฌฆาต (ออร์กา)", emoji: "🐋", power: 2990, clue: "สัตว์น้ำ" },

    // --- หมวดคำใบ้: "บินได้" (มีแมลงวัน ยันอินทรียักษ์ 2,750) ---
    { id: 21, name: "แมลงวันหัวเขียว", emoji: "🪰", power: 50, clue: "บินได้" },
    { id: 22, name: "ผีเสื้อแสนสวย", emoji: "🦋", power: 140, clue: "บินได้" },
    { id: 23, name: "นกพิราบ", emoji: "🐦", power: 420, clue: "บินได้" },
    { id: 24, name: "นกฮูกนักล่า", emoji: "🦉", power: 1600, clue: "บินได้" },
    { id: 25, name: "เหยี่ยวเพเรกริน", emoji: "🦅", power: 2400, clue: "บินได้" },
    { id: 26, name: "นกอินทรีทองคำ", emoji: "🦅", power: 2750, clue: "บินได้" },

    // --- หมวดคำใบ้: "สัตว์สี่ขา" (มีหนูแฮมสเตอร์ ยันเสือโคร่ง 2,950) ---
    { id: 27, name: "หนูแฮมสเตอร์", emoji: "🐹", power: 150, clue: "สัตว์สี่ขา" },
    { id: 28, name: "แมวบ้าน", emoji: "🐱", power: 700, clue: "สัตว์สี่ขา" },
    { id: 29, name: "สุนัขบีเกิ้ล", emoji: "🐶", power: 1050, clue: "สัตว์สี่ขา" },
    { id: 30, name: "หมูป่าเขี้ยวยาว", emoji: "🐗", power: 1950, clue: "สัตว์สี่ขา" },
    { id: 31, name: "หมาป่าอัลฟ่า", emoji: "🐺", power: 2550, clue: "สัตว์สี่ขา" },
    { id: 32, name: "เสือดาวหิมะ", emoji: "🐆", power: 2700, clue: "สัตว์สี่ขา" },
    { id: 33, name: "เสือโคร่งเบงกอล", emoji: "🐅", power: 2900, clue: "สัตว์สี่ขา" },
    { id: 34, name: "หมีขั้วโลกขาว", emoji: "🐻‍❄️", power: 2950, clue: "สัตว์สี่ขา" },

    // --- หมวดคำใบ้: "ชอบนอน" (สลอธ vs ราชาสิงโต 2,920) ---
    { id: 35, name: "หอยทาก", emoji: "🐌", power: 60, clue: "ชอบนอน" },
    { id: 36, name: "สลอธสามนิ้ว", emoji: "🦥", power: 180, clue: "ชอบนอน" },
    { id: 37, name: "หมีโคอาล่า", emoji: "🐨", power: 480, clue: "ชอบนอน" },
    { id: 38, name: "หมีแพนด้ายักษ์", emoji: "🐼", power: 2100, clue: "ชอบนอน" },
    { id: 39, name: "สิงโตเจ้าป่า", emoji: "🦁", power: 2920, clue: "ชอบนอน" },

    // --- หมวดคำใบ้: "สัตว์มีพิษ" (ผึ้ง vs งูจงอาง 2,850) ---
    { id: 40, name: "ผึ้งน้อย", emoji: "🐝", power: 220, clue: "สัตว์มีพิษ" },
    { id: 41, name: "ตะขาบขายาว", emoji: "🐛", power: 850, clue: "สัตว์มีพิษ" },
    { id: 42, name: "แมงป่องยักษ์", emoji: "🦂", power: 2250, clue: "สัตว์มีพิษ" },
    { id: 43, name: "งูจงอางยักษ์", emoji: "🐍", power: 2850, clue: "สัตว์มีพิษ" },

    // --- หมวดคำใบ้: "สัตว์เลื้อยคลาน" (จิ้งจก vs อนาคอนดา 2,920) ---
    { id: 44, name: "จิ้งจกบ้าน", emoji: "🦎", power: 90, clue: "สัตว์เลื้อยคลาน" },
    { id: 45, name: "กิ้งก่าคาเมเลียน", emoji: "🦎", power: 320, clue: "สัตว์เลื้อยคลาน" },
    { id: 46, name: "เต่ายักษ์กาลาปากอส", emoji: "🐢", power: 1350, clue: "สัตว์เลื้อยคลาน" },
    { id: 47, name: "มังกรโคโมโด", emoji: "🦎", power: 2680, clue: "สัตว์เลื้อยคลาน" },
    { id: 48, name: "จระเข้น้ำเค็ม", emoji: "🐊", power: 2860, clue: "สัตว์เลื้อยคลาน" },
    { id: 49, name: "งูยักษ์อนาคอนดา", emoji: "🐍", power: 2920, clue: "สัตว์เลื้อยคลาน" },

    // --- หมวดคำใบ้: "มีขนปุย" (ลูกเจี๊ยบ vs ลิงกอริลลา 2,800) ---
    { id: 50, name: "ลูกเจี๊ยบ", emoji: "🐤", power: 80, clue: "มีขนปุย" },
    { id: 51, name: "กระรอกบิน", emoji: "🐿️", power: 380, clue: "มีขนปุย" },
    { id: 52, name: "แกะปุยเมฆ", emoji: "🐑", power: 750, clue: "มีขนปุย" },
    { id: 53, name: "ลิงกอริลลาหลังเงิน", emoji: "🦍", power: 2800, clue: "มีขนปุย" }
];

// ⚡ การ์ดพิเศษ (Special Modifier Cards) ปรับสมดุลตามคำสั่ง:
// - ทอง & น้ำเงิน: การ์ดบวก (+) เหลือแค่ 3 ใบ (เสี่ยงสูง ลุ้นหนัก)
// - เขียว: การ์ดลบ (-) เหลือแค่ 3 ใบ
// - ขาว: การ์ดลบ (-) เหลือแค่ 2 ใบ (เซฟสุด)
const SPECIAL_CARDS = {
    // ⚪ การ์ดสีขาว (Common) - บวก 4 ใบ, ลบเหลือ 2 ใบ
    white: [
        { id: "w1", tier: "white", name: "กล้วยหอมเพิ่มแรง", val: 100, text: "+100", icon: "🍌" },
        { id: "w2", tier: "white", name: "อาหารเม็ดชั้นดี", val: 150, text: "+150", icon: "🥩" },
        { id: "w3", tier: "white", name: "นมสดเสริมกระดูก", val: 80, text: "+80", icon: "🥛" },
        { id: "w4", tier: "white", name: "ขนมนกกระจอก", val: 120, text: "+120", icon: "🥨" },
        { id: "w5", tier: "white", name: "หาวนอนเฉื่อยชา", val: -80, text: "-80", icon: "🥱" },
        { id: "w6", tier: "white", name: "สะดุดขาตัวเอง", val: -120, text: "-120", icon: "🐾" }
    ],

    // 🟢 การ์ดสีเขียว (Uncommon) - บวก 4 ใบ, ลบเหลือ 3 ใบ
    green: [
        { id: "g1", tier: "green", name: "ยาวิ่งสปีดบูสต์", val: 250, text: "+250", icon: "⚡" },
        { id: "g2", tier: "green", name: "เกราะกระดองเต่า", val: 300, text: "+300", icon: "🛡️" },
        { id: "g3", tier: "green", name: "สมุนไพรป่าลึก", val: 280, text: "+280", icon: "🌿" },
        { id: "g4", tier: "green", name: "กระโดดข้ามรั้ว", val: 200, text: "+200", icon: "🦘" },
        { id: "g5", tier: "green", name: "ท้องร่วงกะทันหัน", val: -180, text: "-180", icon: "🤢" },
        { id: "g6", tier: "green", name: "ติดใยแมงมุมเหนียว", val: -250, text: "-250", icon: "🕸️" },
        { id: "g7", tier: "green", name: "หนามทิ่มฝ่าเท้า", val: -220, text: "-220", icon: "🌵" }
    ],

    // 🔵 การ์ดสีน้ำเงิน (Rare) - บวกเหลือแค่ 3 ใบ, ลบ 4 ใบ
    blue: [
        { id: "b1", tier: "blue", name: "มงกุฎจ่าฝูงไร้พ่าย", val: 500, text: "+500", icon: "👑" },
        { id: "b2", tier: "blue", name: "พายุหมุนคลั่ง", val: 600, text: "+600", icon: "🌪️" },
        { id: "b3", tier: "blue", name: "เขี้ยวสายฟ้าฟาด", val: 550, text: "+550", icon: "⚡" },
        { id: "b5", tier: "blue", name: "ตกหลุมพรางนายพราน", val: -400, text: "-400", icon: "🕳️" },
        { id: "b6", tier: "blue", name: "โดนโซ่ตรวนขึงขัง", val: -480, text: "-480", icon: "⛓️" },
        { id: "b7", tier: "blue", name: "โดนพิษงูกัดขา", val: -420, text: "-420", icon: "🧪" },
        { id: "b8", tier: "blue", name: "หมอกควันตาพร่ามัว", val: -350, text: "-350", icon: "🌫️" }
    ],

    // 🟡 การ์ดสีทอง (Legendary) - บวกเหลือแค่ 3 ใบ, ลบ 4 ใบ
    gold: [
        { id: "l1", tier: "gold", name: "🌟 อวตารเทพจุติ", val: 900, text: "+900", icon: "🌟" },
        { id: "l2", tier: "gold", name: "☄️ อุกกาบาตบรรพกาล", val: 800, text: "+800", icon: "☄️" },
        { id: "l3", tier: "gold", name: "🐲 พลังมังกรหลับตื่น", val: 750, text: "+750", icon: "🐲" },
        { id: "l5", tier: "gold", name: "💀 คำสาปปีศาจมรณะ", val: -700, text: "-700", icon: "💀" },
        { id: "l6", tier: "gold", name: "🌋 ธรณีสูบลาวาเดือด", val: -600, text: "-600", icon: "🌋" },
        { id: "l7", tier: "gold", name: "❄️ แช่แข็งยุคน้ำแข็ง", val: -550, text: "-550", icon: "❄️" },
        { id: "l8", tier: "gold", name: "🖤 หลุมดำดูดกลืนพลัง", val: -800, text: "-800", icon: "🕳️" }
    ]
};

// รวมการ์ดพิเศษทั้งหมดเข้าเป็น Pool เดียว สำหรับสุ่มตามน้ำหนัก (Weight)
// ขาว (42%), เขียว (30%), น้ำเงิน (20%), ทอง (8%)
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

// ฟังก์ชันวิเคราะห์ระดับขอบการ์ดสัตว์ (Pet Card Border)
function getPetBorderInfo(power) {
    if (power >= 2500) {
        return {
            tier: 'gold',
            color: '#eab308',
            label: '🟡 ขอบทอง'
        };
    } else if (power >= 1200) {
        return {
            tier: 'blue',
            color: '#3b82f6',
            label: '🔵 ขอบน้ำเงิน'
        };
    } else {
        return {
            tier: 'white',
            color: '#cbd5e1',
            label: '⚪ ขอบเงิน'
        };
    }
}

// ฟังก์ชันวิเคราะห์ระดับขอบการ์ดพิเศษ (Special Modifier Card Border)
function getSpecialBorderInfo(tier) {
    switch (tier) {
        case 'gold':
            return {
                tier: 'gold',
                color: '#eab308',
                label: '🟡 ขอบทอง'
            };
        case 'blue':
            return {
                tier: 'blue',
                color: '#3b82f6',
                label: '🔵 ขอบน้ำเงิน'
            };
        case 'green':
            return {
                tier: 'green',
                color: '#22c55e',
                label: '🟢 ขอบเขียว'
            };
        default:
            return {
                tier: 'white',
                color: '#cbd5e1',
                label: '⚪ ขอบขาว'
            };
    }
}
