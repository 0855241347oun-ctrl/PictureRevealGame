/**
 * pet-data.js - ข้อมูลการ์ดสัตว์เลี้ยง และการ์ดพิเศษสำหรับเกม "วัดใจแต้มสัตว์เลี้ยง"
 * แต้มพลังไม่เกิน 3,000 (ตั้งแต่ 50 ถึง 2,990)
 * คำใบ้กว้างๆ ชวนสับสน (Deceptive / Broad Clues) เพื่อความมันส์ในการบลัฟฟ์
 * รวม 8 หมวดคำใบ้ จำนวน 72 ใบ:
 * - ⚪ ขอบเงิน (แต้มต่ำ < 1,000): 48 ใบ (66.7% - ครองเด็ค บลัฟฟ์มันส์)
 * - 🔵 ขอบน้ำเงิน (แต้มกลาง 1,000 - 2,499): 16 ใบ (22.2% - ตัวเก่งของหายาก)
 * - 🟡 ขอบทอง (แต้มบอส 2,500 - 2,990): 8 ใบ (11.1% - บอสตำนาน หมวดละ 1 ตัว)
 */

// 🐾 รายการการ์ดสัตว์เลี้ยง (Pet Cards) 72 ตัว แบ่งเป็น 8 หมวดคำใบ้
const PET_CARDS = [
    // --- หมวด 1: "ตัวเล็ก" (ยุงลาย 50 ยัน แมงกะพุนกล่อง 2,850) ---
    { id: 1, name: "ยุงลาย", emoji: "🦟", power: 50, clue: "ตัวเล็ก" },
    { id: 2, name: "มดแดงไฟ", emoji: "🐜", power: 120, clue: "ตัวเล็ก" },
    { id: 3, name: "หนูบ้าน", emoji: "🐀", power: 250, clue: "ตัวเล็ก" },
    { id: 4, name: "ตั๊กแตนตำข้าว", emoji: "🦗", power: 480, clue: "ตัวเล็ก" },
    { id: 5, name: "บุ้งพิษขนฟู", emoji: "🐛", power: 580, clue: "ตัวเล็ก" },
    { id: 6, name: "หมึกบลูริง", emoji: "🐙", power: 850, clue: "ตัวเล็ก" },
    { id: 7, name: "แมงมุมแม่ม่ายดำ", emoji: "🕷️", power: 1200, clue: "ตัวเล็ก" },
    { id: 8, name: "กบลูกศรพิษสีทอง", emoji: "🐸", power: 1650, clue: "ตัวเล็ก" },
    { id: 9, name: "แมงกะพุนกล่อง", emoji: "🪼", power: 2850, clue: "ตัวเล็ก" },

    // --- หมวด 2: "สัตว์กินพืช" (หนอนผีเสื้อ 60 ยัน ช้างแอฟริกา 2,980) ---
    { id: 10, name: "หนอนผีเสื้อ", emoji: "🐛", power: 60, clue: "สัตว์กินพืช" },
    { id: 11, name: "กระต่ายป่า", emoji: "🐰", power: 280, clue: "สัตว์กินพืช" },
    { id: 12, name: "แกะภูเขา", emoji: "🐑", power: 520, clue: "สัตว์กินพืช" },
    { id: 13, name: "คาปิบาร่าเพื่อนแท้", emoji: "🦫", power: 680, clue: "สัตว์กินพืช" },
    { id: 14, name: "กวางดาว", emoji: "🦌", power: 850, clue: "สัตว์กินพืช" },
    { id: 15, name: "ควายป่าไบซัน", emoji: "🦬", power: 950, clue: "สัตว์กินพืช" },
    { id: 16, name: "แรดขาวแอฟริกา", emoji: "🦏", power: 2100, clue: "สัตว์กินพืช" },
    { id: 17, name: "ฮิปโปโปเตมัส", emoji: "🦛", power: 2350, clue: "สัตว์กินพืช" },
    { id: 18, name: "ช้างแอฟริกา", emoji: "🐘", power: 2980, clue: "สัตว์กินพืช" },

    // --- หมวด 3: "สัตว์น้ำ" (ปลาทอง 70 ยัน วาฬออร์กา 2,990) ---
    { id: 19, name: "ปลาทอง", emoji: "🐠", power: 70, clue: "สัตว์น้ำ" },
    { id: 20, name: "กุ้งแม่น้ำ", emoji: "🦐", power: 180, clue: "สัตว์น้ำ" },
    { id: 21, name: "ปลาหมึกกล้วย", emoji: "🦑", power: 420, clue: "สัตว์น้ำ" },
    { id: 22, name: "ปลากระเบนราหู", emoji: "🐡", power: 720, clue: "สัตว์น้ำ" },
    { id: 23, name: "ปิรันยาแดง", emoji: "🐟", power: 780, clue: "สัตว์น้ำ" },
    { id: 24, name: "แมวน้ำเสือดาว", emoji: "🦭", power: 920, clue: "สัตว์น้ำ" },
    { id: 25, name: "ฉลามหัวค้อน", emoji: "🦈", power: 1650, clue: "สัตว์น้ำ" },
    { id: 26, name: "ฉลามขาวนักล่า", emoji: "🦈", power: 2300, clue: "สัตว์น้ำ" },
    { id: 27, name: "วาฬเพชฌฆาต (ออร์กา)", emoji: "🐋", power: 2990, clue: "สัตว์น้ำ" },

    // --- หมวด 4: "บินได้" (แมลงวัน 50 ยัน พญาแร้งแอนดีส 2,880) ---
    { id: 28, name: "แมลงวันหัวเขียว", emoji: "🪰", power: 50, clue: "บินได้" },
    { id: 29, name: "ผีเสื้อแสนสวย", emoji: "🦋", power: 110, clue: "บินได้" },
    { id: 30, name: "นกพิราบ", emoji: "🐦", power: 320, clue: "บินได้" },
    { id: 31, name: "นกฮูกนักล่า", emoji: "🦉", power: 620, clue: "บินได้" },
    { id: 32, name: "ค้างคาวแม่ไก่", emoji: "🦇", power: 650, clue: "บินได้" },
    { id: 33, name: "ห่านป่าหัวร้อน", emoji: "🪿", power: 850, clue: "บินได้" },
    { id: 34, name: "เหยี่ยวเพเรกริน", emoji: "🦅", power: 1750, clue: "บินได้" },
    { id: 35, name: "นกอินทรีทองคำ", emoji: "🦅", power: 2200, clue: "บินได้" },
    { id: 36, name: "พญาแร้งแอนดีส", emoji: "🦅", power: 2880, clue: "บินได้" },

    // --- หมวด 5: "สัตว์สี่ขา" (หนูแฮมสเตอร์ 120 ยัน หมีขั้วโลก 2,950) ---
    { id: 37, name: "หนูแฮมสเตอร์", emoji: "🐹", power: 120, clue: "สัตว์สี่ขา" },
    { id: 38, name: "แมวบ้าน", emoji: "🐱", power: 380, clue: "สัตว์สี่ขา" },
    { id: 39, name: "สุนัขบีเกิ้ล", emoji: "🐶", power: 680, clue: "สัตว์สี่ขา" },
    { id: 40, name: "ม้าป่ามัสแตง", emoji: "🐎", power: 780, clue: "สัตว์สี่ขา" },
    { id: 41, name: "ไฮยีน่าล่าฝูง", emoji: "🐺", power: 920, clue: "สัตว์สี่ขา" },
    { id: 42, name: "หมูป่าเขี้ยวยาว", emoji: "🐗", power: 950, clue: "สัตว์สี่ขา" },
    { id: 43, name: "หมาป่าอัลฟ่า", emoji: "🐺", power: 1850, clue: "สัตว์สี่ขา" },
    { id: 44, name: "เสือดาวหิมะ", emoji: "🐆", power: 2300, clue: "สัตว์สี่ขา" },
    { id: 45, name: "หมีขั้วโลกขาว", emoji: "🐻‍❄️", power: 2950, clue: "สัตว์สี่ขา" },

    // --- หมวด 6: "ชอบนอน" (หอยทาก 60 ยัน สิงโตเจ้าป่า 2,920) ---
    { id: 46, name: "หอยทาก", emoji: "🐌", power: 60, clue: "ชอบนอน" },
    { id: 47, name: "สลอธสามนิ้ว", emoji: "🦥", power: 150, clue: "ชอบนอน" },
    { id: 48, name: "หมีโคอาล่า", emoji: "🐨", power: 350, clue: "ชอบนอน" },
    { id: 49, name: "ตัวกินมดยักษ์", emoji: "🦡", power: 550, clue: "ชอบนอน" },
    { id: 50, name: "ตัวโอพัสซัม", emoji: "🦡", power: 600, clue: "ชอบนอน" },
    { id: 51, name: "หมาจิ้งจอกจำศีล", emoji: "🦊", power: 880, clue: "ชอบนอน" },
    { id: 52, name: "หมีแพนด้ายักษ์", emoji: "🐼", power: 1500, clue: "ชอบนอน" },
    { id: 53, name: "หมีกริซลี่จำศีล", emoji: "🐻", power: 2150, clue: "ชอบนอน" },
    { id: 54, name: "สิงโตเจ้าป่า", emoji: "🦁", power: 2920, clue: "ชอบนอน" },

    // --- หมวด 7: "สัตว์มีพิษ" (ผึ้งน้อย 180 ยัน งูไทปัน 2,940) ---
    { id: 55, name: "ผึ้งน้อย", emoji: "🐝", power: 180, clue: "สัตว์มีพิษ" },
    { id: 56, name: "มดตะนอยต่อยเจ็บ", emoji: "🐜", power: 320, clue: "สัตว์มีพิษ" },
    { id: 57, name: "ตะขาบขายาว", emoji: "🐛", power: 650, clue: "สัตว์มีพิษ" },
    { id: 58, name: "ปลากระเบนธงพิษ", emoji: "🐡", power: 680, clue: "สัตว์มีพิษ" },
    { id: 59, name: "แมงป่องยักษ์", emoji: "🦂", power: 850, clue: "สัตว์มีพิษ" },
    { id: 60, name: "ตัวต่อหัวเสือ", emoji: "🐝", power: 900, clue: "สัตว์มีพิษ" },
    { id: 61, name: "งูหางกระดิ่ง", emoji: "🐍", power: 1650, clue: "สัตว์มีพิษ" },
    { id: 62, name: "งูจงอางยักษ์", emoji: "🐍", power: 2350, clue: "สัตว์มีพิษ" },
    { id: 63, name: "งูไทปันโพ้นทะเล", emoji: "🐍", power: 2940, clue: "สัตว์มีพิษ" },

    // --- หมวด 8: "สัตว์เลื้อยคลาน" (จิ้งจก 80 ยัน อนาคอนดา 2,930) ---
    { id: 64, name: "จิ้งจกบ้าน", emoji: "🦎", power: 80, clue: "สัตว์เลื้อยคลาน" },
    { id: 65, name: "กิ้งก่าคาเมเลียน", emoji: "🦎", power: 220, clue: "สัตว์เลื้อยคลาน" },
    { id: 66, name: "ตุ๊กแกบ้าน", emoji: "🦎", power: 450, clue: "สัตว์เลื้อยคลาน" },
    { id: 67, name: "กิ้งก่าบาซิลิสก์", emoji: "🦎", power: 580, clue: "สัตว์เลื้อยคลาน" },
    { id: 68, name: "เต่ายักษ์กาลาปากอส", emoji: "🐢", power: 850, clue: "สัตว์เลื้อยคลาน" },
    { id: 69, name: "งูเหลือมยักษ์", emoji: "🐍", power: 920, clue: "สัตว์เลื้อยคลาน" },
    { id: 70, name: "มังกรโคโมโด", emoji: "🦎", power: 1950, clue: "สัตว์เลื้อยคลาน" },
    { id: 71, name: "จระเข้น้ำเค็ม", emoji: "🐊", power: 2400, clue: "สัตว์เลื้อยคลาน" },
    { id: 72, name: "งูยักษ์อนาคอนดา", emoji: "🐍", power: 2930, clue: "สัตว์เลื้อยคลาน" }
];

// ⚡ การ์ดพิเศษ (Special Modifier Cards) ปรับสมดุลลดลง 20%:
// - ทอง & น้ำเงิน: การ์ดบวก (+) มีแค่ 3 ใบ (เสี่ยงสูง ลุ้นหนัก)
// - เขียว: การ์ดลบ (-) มี 3 ใบ
// - ขาว: การ์ดลบ (-) มี 2 ใบ (เซฟสุด)
const SPECIAL_CARDS = {
    // ⚪ การ์ดสีขาว (Common - ออก 42%) - บวก 4 ใบ, ลบ 2 ใบ
    white: [
        { id: "w1", tier: "white", name: "กล้วยหอมเพิ่มแรง", val: 40, text: "+40", icon: "🍌" },
        { id: "w2", tier: "white", name: "นมสดเสริมกระดูก", val: 80, text: "+80", icon: "🥛" },
        { id: "w3", tier: "white", name: "ขนมนกกระจอก", val: 120, text: "+120", icon: "🥨" },
        { id: "w4", tier: "white", name: "อาหารเม็ดชั้นดี", val: 160, text: "+160", icon: "🥩" },
        { id: "w5", tier: "white", name: "หาวนอนเฉื่อยชา", val: -40, text: "-40", icon: "🥱" },
        { id: "w6", tier: "white", name: "สะดุดขาตัวเอง", val: -80, text: "-80", icon: "🐾" }
    ],

    // 🟢 การ์ดสีเขียว (Uncommon - ออก 30%) - บวก 4 ใบ, ลบ 3 ใบ
    green: [
        { id: "g1", tier: "green", name: "กระโดดข้ามรั้ว", val: 200, text: "+200", icon: "🦘" },
        { id: "g2", tier: "green", name: "ยาวิ่งสปีดบูสต์", val: 240, text: "+240", icon: "⚡" },
        { id: "g3", tier: "green", name: "สมุนไพรป่าลึก", val: 280, text: "+280", icon: "🌿" },
        { id: "g4", tier: "green", name: "เกราะกระดองเต่า", val: 320, text: "+320", icon: "🛡️" },
        { id: "g5", tier: "green", name: "ท้องร่วงกะทันหัน", val: -120, text: "-120", icon: "🤢" },
        { id: "g6", tier: "green", name: "หนามทิ่มฝ่าเท้า", val: -160, text: "-160", icon: "🌵" },
        { id: "g7", tier: "green", name: "ติดใยแมงมุมเหนียว", val: -200, text: "-200", icon: "🕸️" }
    ],

    // 🔵 การ์ดสีน้ำเงิน (Rare - ออก 20%) - บวก 3 ใบ, ลบ 4 ใบ
    blue: [
        { id: "b1", tier: "blue", name: "เขี้ยวสายฟ้าฟาด", val: 400, text: "+400", icon: "⚡" },
        { id: "b2", tier: "blue", name: "พายุหมุนคลั่ง", val: 480, text: "+480", icon: "🌪️" },
        { id: "b3", tier: "blue", name: "มงกุฎจ่าฝูงไร้พ่าย", val: 550, text: "+550", icon: "👑" },
        { id: "b5", tier: "blue", name: "หมอกควันตาพร่ามัว", val: -240, text: "-240", icon: "🌫️" },
        { id: "b6", tier: "blue", name: "ตกหลุมพรางนายพราน", val: -320, text: "-320", icon: "🕳️" },
        { id: "b7", tier: "blue", name: "โดนพิษงูกัดขา", val: -400, text: "-400", icon: "🧪" },
        { id: "b8", tier: "blue", name: "โดนโซ่ตรวนขึงขัง", val: -480, text: "-480", icon: "⛓️" }
    ],

    // 🟡 การ์ดสีทอง (Legendary - ออก 8%) - บวก 3 ใบ, ลบ 4 ใบ
    gold: [
        { id: "l1", tier: "gold", name: "🐲 พลังมังกรหลับตื่น", val: 650, text: "+650", icon: "🐲" },
        { id: "l2", tier: "gold", name: "☄️ อุกกาบาตบรรพกาล", val: 800, text: "+800", icon: "☄️" },
        { id: "l3", tier: "gold", name: "🌟 อวตารเทพจุติ", val: 950, text: "+950", icon: "🌟" },
        { id: "l5", tier: "gold", name: "❄️ แช่แข็งยุคน้ำแข็ง", val: -400, text: "-400", icon: "❄️" },
        { id: "l6", tier: "gold", name: "🌋 ธรณีสูบลาวาเดือด", val: -550, text: "-550", icon: "🌋" },
        { id: "l7", tier: "gold", name: "💀 คำสาปปีศาจมรณะ", val: -700, text: "-700", icon: "💀" },
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
    } else if (power >= 1000) {
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
