/**
 * Mimic Party - 20 Audio-Only Funny / Meme Sound Prompts
 * โจทย์มีเฉพาะเสียงฮาๆ เสียงมีม เสียงตลก (ไม่มีสคริปต์ตัวหนังสือให้อ่าน)
 */
const MIMIC_PROMPTS = [
    {
        id: "meme_1",
        title: "เสียงตดทะลุประตู 💨",
        category: "มีมสุดฮา",
        emoji: "💨",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/fart_long_through_door.ogg"
    },
    {
        id: "meme_2",
        title: "เสียงสปริงดีดหน้าเด้งดึ๋ง 🌀",
        category: "มีมการ์ตูน",
        emoji: "🌀",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"
    },
    {
        id: "meme_3",
        title: "เสียงแตรตัวตลกปู๊นๆ 🤡",
        category: "มีมสุดฮา",
        emoji: "🤡",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg"
    },
    {
        id: "meme_4",
        title: "เสียงนกหวีดสไลด์ร่วงหล่น 📉",
        category: "เอฟเฟกต์ตลก",
        emoji: "📉",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/slide_whistle_rise_and_fall.ogg"
    },
    {
        id: "meme_5",
        title: "เสียงตดสั้นปุ๋ง! 🍑",
        category: "มีมสุดฮา",
        emoji: "🍑",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/fart_toot.ogg"
    },
    {
        id: "meme_6",
        title: "เสียงเป็ดยางบีบรัวๆ 🐤",
        category: "เสียงสัตว์ฮาๆ",
        emoji: "🐤",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/rubber_duck_squeak_series.ogg"
    },
    {
        id: "meme_7",
        title: "เสียงตบมุกตึ่งโป๊ะ! 🥁",
        category: "เอฟเฟกต์ตลก",
        emoji: "🥁",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/punchline_drum.ogg"
    },
    {
        id: "meme_8",
        title: "เสียงเอเลี่ยนต่างดาวร้อง 👽",
        category: "เสียงหลุดโลก",
        emoji: "👽",
        audioUrl: "https://actions.google.com/sounds/v1/horror/alien_squawk_echo.ogg"
    },
    {
        id: "meme_9",
        title: "เสียงซอมบี้คำรามแฮร่! 🧟",
        category: "เสียงหลุดโลก",
        emoji: "🧟",
        audioUrl: "https://actions.google.com/sounds/v1/horror/aggressive_zombie_snarls.ogg"
    },
    {
        id: "meme_10",
        title: "เสียงหมาน้อยร้องอ้อนหงิงๆ 🐶",
        category: "เสียงสัตว์ฮาๆ",
        emoji: "🐶",
        audioUrl: "https://actions.google.com/sounds/v1/animals/small_dog_wimper_series.ogg"
    },
    {
        id: "meme_11",
        title: "เสียงอีกาบินผ่านหัว กา..กา.. 🐦‍⬛",
        category: "มีมสุดฮา",
        emoji: "🐦‍⬛",
        audioUrl: "https://actions.google.com/sounds/v1/animals/crow_call.ogg"
    },
    {
        id: "meme_12",
        title: "เสียงลูกโป่งรั่วฟี้~ 🎈",
        category: "เอฟเฟกต์ตลก",
        emoji: "🎈",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/deflate.ogg"
    },
    {
        id: "meme_13",
        title: "เสียงสปริงเด้งเพี้ยนดึ๋งดั๋ง 🤪",
        category: "มีมการ์ตูน",
        emoji: "🤪",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/goofy_spring_bounces.ogg"
    },
    {
        id: "meme_14",
        title: "เสียงสั่นกระดิ่งเรียกกินข้าวรัวๆ 🔔",
        category: "เอฟเฟกต์ตลก",
        emoji: "🔔",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/crazy_dinner_bell.ogg"
    },
    {
        id: "meme_15",
        title: "เสียงนกหวีดไซเรนปั่นป่วน 🚨",
        category: "มีมการ์ตูน",
        emoji: "🚨",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg"
    },
    {
        id: "meme_16",
        title: "เสียงหมูร้องอี๊ดๆ ตกใจ 🐷",
        category: "เสียงสัตว์ฮาๆ",
        emoji: "🐷",
        audioUrl: "https://actions.google.com/sounds/v1/animals/animal_squealing.ogg"
    },
    {
        id: "meme_17",
        title: "เสียงนกฮูกทักตอนดึก ฮูก..ฮูก 🦉",
        category: "เสียงสัตว์ฮาๆ",
        emoji: "🦉",
        audioUrl: "https://actions.google.com/sounds/v1/animals/owl_hooting.ogg"
    },
    {
        id: "meme_18",
        title: "เสียงยืดหน้ายืดแก้มดึ๋งๆ 😬",
        category: "มีมการ์ตูน",
        emoji: "😬",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/face_stretch.ogg"
    },
    {
        id: "meme_19",
        title: "เสียงสัตว์ประหลาดง่วงนอนหาว 👹",
        category: "เสียงหลุดโลก",
        emoji: "👹",
        audioUrl: "https://actions.google.com/sounds/v1/horror/monster_alien_grunt_sleepy.ogg"
    },
    {
        id: "meme_20",
        title: "เสียงจุ๊บดึงตัวดูดดังป๊อก! 🪠",
        category: "เอฟเฟกต์ตลก",
        emoji: "🪠",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/suction_cup_pull.ogg"
    }
];
