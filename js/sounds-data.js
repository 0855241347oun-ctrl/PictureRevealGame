/**
 * 50 Mystery Sounds Database
 * รวบรวม 50 เสียงคุ้นหูระดับง่าย พร้อมคำเฉลย หมวดหมู่ รูปภาพ และคำใบ้
 */
const MYSTERY_SOUNDS_DATA = [
    // --- 🐾 หมวด 1: สัตว์ (1-10) ---
    {
        id: 1,
        title: "แมว",
        category: "สัตว์",
        emoji: "🐱",
        hint: "สัตว์เลี้ยงขนฟูสี่ขา ร้องอ้อนเจ้าของ",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/cat_purr_and_meow.ogg"
    },
    {
        id: 2,
        title: "สุนัข / หมาเห่า",
        category: "สัตว์",
        emoji: "🐶",
        hint: "สัตว์เลี้ยงผู้ซื่อสัตย์ เห่าเตือนภัยหน้าบ้าน",
        image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/dog_barking.ogg"
    },
    {
        id: 3,
        title: "ไก่ขัน",
        category: "สัตว์",
        emoji: "🐔",
        hint: "สัตว์ปีกที่ส่งเสียงปลุกทุกคนในตอนเช้า",
        image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/rooster_crowing.ogg"
    },
    {
        id: 4,
        title: "เป็ด",
        category: "สัตว์",
        emoji: "🦆",
        hint: "สัตว์ปีกว่ายน้ำ ร้องก้าบ ๆ",
        image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/duck_quack.ogg"
    },
    {
        id: 5,
        title: "วัว",
        category: "สัตว์",
        emoji: "🐮",
        hint: "สัตว์ในฟาร์มตัวใหญ่ที่ให้นม ร้องมอ ๆ",
        image: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/cow_moo.ogg"
    },
    {
        id: 6,
        title: "กบ / อึ่งอ่าง",
        category: "สัตว์",
        emoji: "🐸",
        hint: "สัตว์ครึ่งบกครึ่งน้ำ ส่งเสียงดังหลังฝนตก",
        image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/frog_ribbit.ogg"
    },
    {
        id: 7,
        title: "ช้าง",
        category: "สัตว์",
        emoji: "🐘",
        hint: "สัตว์ประจำชาติไทย ตัวใหญ่มีงวง พ่นลมเสียงแหลม",
        image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/elephant_trumpeting.ogg"
    },
    {
        id: 8,
        title: "ม้า",
        category: "สัตว์",
        emoji: "🐴",
        hint: "สัตว์สี่ขาวิ่งเร็ว ส่งเสียงฮี้ ๆ กิ๊กก๊อก",
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/horse_whinny.ogg"
    },
    {
        id: 9,
        title: "หมู",
        category: "สัตว์",
        emoji: "🐷",
        hint: "สัตว์ตัวอ้วนจมูกกลม ร้องอู๊ด ๆ ในเล้า",
        image: "https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/pig_snort.ogg"
    },
    {
        id: 10,
        title: "ยุง",
        category: "สัตว์",
        emoji: "🦟",
        hint: "แมลงตัวเล็กที่บินเสียงหึ่ง ๆ ข้างหูตอนกลางคืน",
        image: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/animals/mosquito_buzz.ogg"
    },

    // --- 🏠 หมวด 2: ของใช้ในบ้าน & ประจำวัน (11-20) ---
    {
        id: 11,
        title: "กริ่งหน้าบ้าน / ออดประตู",
        category: "ของใช้ในบ้าน",
        emoji: "🔔",
        hint: "กดเมื่อมีแขกมาเยือนหน้าบ้าน (ติ๊งต่อง)",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/doorbell_chime.ogg"
    },
    {
        id: 12,
        title: "ชักโครก",
        category: "ของใช้ในบ้าน",
        emoji: "🚽",
        hint: "อยู่ในห้องน้ำ กดหลังทำธุระเสร็จ",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/toilet_flush.ogg"
    },
    {
        id: 13,
        title: "เปิดกระป๋องน้ำอัดลม",
        category: "ของใช้ในบ้าน",
        emoji: "🥫",
        hint: "ดึงห่วงอลูมิเนียมแล้วมีเสียงซ่าสดชื่น",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/soda_can_open.ogg"
    },
    {
        id: 14,
        title: "นาฬิกาปลุก",
        category: "ของใช้ในบ้าน",
        emoji: "⏰",
        hint: "อุปกรณ์ข้างเตียงที่ดังปลุกเราทุกเช้า",
        image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/alarm_clock_ringing.ogg"
    },
    {
        id: 15,
        title: "รูดซิป",
        category: "ของใช้ในบ้าน",
        emoji: "🎒",
        hint: "พบได้บนกระเป๋าเป้หรือเสื้อกันหนาว",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/zipper_close.ogg"
    },
    {
        id: 16,
        title: "พิมพ์คีย์บอร์ด",
        category: "ของใช้ในบ้าน",
        emoji: "⌨️",
        hint: "นิ้วกดแป้นพิมพ์คอมพิวเตอร์อย่างรวดเร็ว",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/keyboard_typing_fast.ogg"
    },
    {
        id: 17,
        title: "กรรไกรตัดกระดาษ",
        category: "ของใช้ในบ้าน",
        emoji: "✂️",
        hint: "อุปกรณ์ใบมีดคู่ใช้ตัดสิ่งของ (ฉับ... ฉับ)",
        image: "https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/scissors_cutting_paper.ogg"
    },
    {
        id: 18,
        title: "ไม้กวาดกวาดพื้น",
        category: "ของใช้ในบ้าน",
        emoji: "🧹",
        hint: "ทำความสะอาดพื้นบ้านปัดฝุ่นผง (ซึ่บ... ซึ่บ)",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/broom_sweeping_floor.ogg"
    },
    {
        id: 19,
        title: "ไดร์เป่าผม",
        category: "ของใช้ในบ้าน",
        emoji: "💨",
        hint: "เปิดลมร้อนเป่าผมหลังสระผมเสร็จ",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/hair_dryer_run.ogg"
    },
    {
        id: 20,
        title: "เปิดประตูมีเสียงเอี๊ยด",
        category: "ของใช้ในบ้าน",
        emoji: "🚪",
        hint: "บานพับประตูเก่าที่ไม่ได้หยอดน้ำมันมันจะดัง...",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/doors/door_creaking_open.ogg"
    },

    // --- 🍳 หมวด 3: ครัว & อาหาร (21-30) ---
    {
        id: 21,
        title: "ทอดอาหารในน้ำมันเดือด",
        category: "ครัวและอาหาร",
        emoji: "🍳",
        hint: "ใส่อาหารลงกระทะน้ำมันร้อน ๆ ดังซู่ซ่า",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/bacon_sizzle.ogg"
    },
    {
        id: 22,
        title: "เคี้ยวขนมกรุบกรอบ / มันฝรั่งทอด",
        category: "ครัวและอาหาร",
        emoji: "🥔",
        hint: "กินของขบเคี้ยวในปากดังกร๊อบ ๆ แกร๊บ ๆ",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/eating_crunchy_food.ogg"
    },
    {
        id: 23,
        title: "เทน้ำใส่แก้ว",
        category: "ครัวและอาหาร",
        emoji: "🥤",
        hint: "รินน้ำดื่มจากขวดลงในแก้ว (จ๊อก ๆ ๆ)",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/water_pouring_glass.ogg"
    },
    {
        id: 24,
        title: "เครื่องปิ้งขนมปังเด้ง",
        category: "ครัวและอาหาร",
        emoji: "🍞",
        hint: "เครื่องใช้ไฟฟ้าทำอาหารเช้า ดีดขนมปังขึ้นมาดังป๊อง!",
        image: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/toaster_pop_up.ogg"
    },
    {
        id: 25,
        title: "กาต้มน้ำเดือดหวีดร้อง",
        category: "ครัวและอาหาร",
        emoji: "🫖",
        hint: "น้ำร้อนเต็มที่แล้วจะส่งเสียงหวีดลมเตือน",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/kettle_whistle.ogg"
    },
    {
        id: 26,
        title: "มีดหั่นผักบนเขียง",
        category: "ครัวและอาหาร",
        emoji: "🔪",
        hint: "แม่ครัวซอยวัตถุดิบบนเขียงไม้อย่างรวดเร็ว (ปึ๊ก ๆ ๆ)",
        image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/cutting_vegetables_board.ogg"
    },
    {
        id: 27,
        title: "ดูดน้ำด้วยหลอดจนหมดแก้ว",
        category: "ครัวและอาหาร",
        emoji: "🧃",
        hint: "ดูดน้ำก้นแก้วปนน้ำแข็งดังซู๊ดดดด... กริ๊ก ๆ",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/slurping_through_straw.ogg"
    },
    {
        id: 28,
        title: "ตอกไข่ใส่ชาม",
        category: "ครัวและอาหาร",
        emoji: "🥚",
        hint: "เคาะเปลือกไข่เป๊าะ แล้วหยดลงในภาชนะ",
        image: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/egg_cracking.ogg"
    },
    {
        id: 29,
        title: "เปิดจุกคอร์กขวดไวน์",
        category: "ครัวและอาหาร",
        emoji: "🍾",
        hint: "ดึงจุกไม้ออกจากปากขวดแก้วดัง ป๊อก!",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/cork_pop.ogg"
    },
    {
        id: 30,
        title: "จุดไฟแช็ก",
        category: "ครัวและอาหาร",
        emoji: "🔥",
        hint: "หมุนล้อเหล็กประกายไฟดัง แชะ... ฟึ่บ",
        image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/household/lighter_flick.ogg"
    },

    // --- 🚗 หมวด 4: ยานพาหนะ & คมนาคม (31-40) ---
    {
        id: 31,
        title: "แตรรถยนต์",
        category: "ยานพาหนะ",
        emoji: "🚗",
        hint: "กดพวงมาลัยเพื่อเตือนคันอื่นบนถนน (ปี๊น ๆ)",
        image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/car_horn.ogg"
    },
    {
        id: 32,
        title: "ไซเรนรถพยาบาล / รถกู้ภัย",
        category: "ยานพาหนะ",
        emoji: "🚑",
        hint: "รถฉุกเฉินเปิดไฟขอทางฉุกเฉิน (วี้หว่อ... วี้หว่อ)",
        image: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/emergency/ambulance_siren.ogg"
    },
    {
        id: 33,
        title: "รถไฟหวูด & แล่นบนราง",
        category: "ยานพาหนะ",
        emoji: "🚂",
        hint: "ยานพาหนะยาวบนรางเหล็ก เป่าหวูดปู๊น ๆ",
        image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/train_horn_and_passing.ogg"
    },
    {
        id: 34,
        title: "เฮลิคอปเตอร์",
        category: "ยานพาหนะ",
        emoji: "🚁",
        hint: "อากาศยานมีใบพัดหมุนบนหลังคา (พั่บ ๆ ๆ ๆ)",
        image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/helicopter_flying_by.ogg"
    },
    {
        id: 35,
        title: "กระดิ่งจักรยาน",
        category: "ยานพาหนะ",
        emoji: "🚲",
        hint: "คนปั่นสองล้อดีดนิ้วส่งสัญญาณ (กริ๊ง ๆ)",
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/bicycle_bell_ring.ogg"
    },
    {
        id: 36,
        title: "เครื่องบินไอพ่นบินผ่าน",
        category: "ยานพาหนะ",
        emoji: "✈️",
        hint: "ยานยนต์บินข้ามท้องฟ้า เสียงคำรามกึกก้อง",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/airplane_flyover.ogg"
    },
    {
        id: 37,
        title: "สตาร์ทเครื่องยนต์รถยนต์",
        category: "ยานพาหนะ",
        emoji: "🔑",
        hint: "บิดกุญแจรถยนต์ตอนเครื่องเย็น (ชึ่ง ๆ ๆ บรึ้ม!)",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/car_engine_starting.ogg"
    },
    {
        id: 38,
        title: "รถยนต์เบรกกะทันหัน",
        category: "ยานพาหนะ",
        emoji: "🛑",
        hint: "ยางรถยนต์เสียดสีกับถนนดัง เอี๊ยดดดด!",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/car_skid_and_screech.ogg"
    },
    {
        id: 39,
        title: "หวูดเรือกลไฟ / เรือเดินสมุทร",
        category: "ยานพาหนะ",
        emoji: "🚢",
        hint: "เรือลำใหญ่แล่นออกจากท่าเทียบเรือ (หวูดทุ้มต่ำ)",
        image: "https://images.unsplash.com/photo-1505705694340-019e1e335916?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/ship_fog_horn.ogg"
    },
    {
        id: 40,
        title: "รถจักรยานยนต์เร่งเครื่อง",
        category: "ยานพาหนะ",
        emoji: "🏍️",
        hint: "มอเตอร์ไซค์บิดคันเร่งออกตัวเสียงดัง",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/transportation/motorcycle_drive_by.ogg"
    },

    // --- 👤 หมวด 5: มนุษย์ ร่างกาย & ธรรมชาติ (41-50) ---
    {
        id: 41,
        title: "คนจาม",
        category: "คนและธรรมชาติ",
        emoji: "🤧",
        hint: "คัดจมูกแล้วกลั้นไม่อยู่ (ฮัด... ชิ้ววว!)",
        image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/sneeze.ogg"
    },
    {
        id: 42,
        title: "เสียงปรบมือ / ตบมือ",
        category: "คนและธรรมชาติ",
        emoji: "👏",
        hint: "แสดงความยินดีหรือชื่นชมหลังการแสดงจบ",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/clapping_applause.ogg"
    },
    {
        id: 43,
        title: "คนนอนกรน",
        category: "คนและธรรมชาติ",
        emoji: "😴",
        hint: "เสียงคนหลับลึก หายใจทางคอดังคร่อกกก",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/snoring_heavy.ogg"
    },
    {
        id: 44,
        title: "เสียงหัวเราะ",
        category: "คนและธรรมชาติ",
        emoji: "😂",
        hint: "อารมณ์ดีเมื่อได้ฟังเรื่องตลก ฮ่า ๆ ๆ",
        image: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/group_laughing.ogg"
    },
    {
        id: 45,
        title: "คนหาว",
        category: "คนและธรรมชาติ",
        emoji: "🥱",
        hint: "อาการตอนง่วงนอน อ้าปากสูดลมหายใจยาว",
        image: "https://images.unsplash.com/photo-1520206183501-b80df61e43c2?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/man_yawn.ogg"
    },
    {
        id: 46,
        title: "ผิวปาก",
        category: "คนและธรรมชาติ",
        emoji: "😗",
        hint: "ทำปากจู๋แล้วพ่นลมเป็นท่วงทำนอง",
        image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/human_voices/whistle_tune.ogg"
    },
    {
        id: 47,
        title: "ฟ้าร้อง / ฟ้าผ่า",
        category: "คนและธรรมชาติ",
        emoji: "⚡",
        hint: "ปรากฏการณ์บนท้องฟ้าตอนพายุเข้า ดังเปรี้ยง!",
        image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/weather/thunder_crack.ogg"
    },
    {
        id: 48,
        title: "ฝนตกหนัก",
        category: "คนและธรรมชาติ",
        emoji: "🌧️",
        hint: "หยดน้ำจากฟากฟ้าตกลงมาใส่หลังคาซู่ซ่า",
        image: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/weather/heavy_rain.ogg"
    },
    {
        id: 49,
        title: "คลื่นทะเลซัดชายหาด",
        category: "คนและธรรมชาติ",
        emoji: "🌊",
        hint: "น้ำทะเลสาดกระทบหาดทรายขาว (ซู่... ซ่า...)",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/water/ocean_waves.ogg"
    },
    {
        id: 50,
        title: "เสียงเดินเหยียบใบไม้แห้ง",
        category: "คนและธรรมชาติ",
        emoji: "🍂",
        hint: "ย่ำเท้าเข้าไปในป่าที่มีใบไม้ร่วงกองบนพื้น (กรอบแกรบ)",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
        audioUrl: "https://actions.google.com/sounds/v1/foley/footsteps_on_dry_leaves.ogg"
    }
];

// Fallback Synthetic SFX in case network is disconnected
function playFallbackSynth(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
    } catch (e) {}
}
