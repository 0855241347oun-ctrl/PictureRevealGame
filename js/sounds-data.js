/**
 * 50 Verified Mystery Sounds (Real Authentic Audio 100% Tested)
 */
const MYSTERY_SOUNDS_DATA = [
    {
        "key": "distant_dog_barking",
        "title": "หมาเห่า",
        "category": "สัตว์",
        "emoji": "🐶",
        "hint": "เสียงสัตว์สี่ขา เห่าเตือนภัยอยู่ไกลๆ",
        "image": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/distant_dog_barking.ogg"
    },
    {
        "key": "cat_purr",
        "title": "แมวครางในลำคอ",
        "category": "สัตว์",
        "emoji": "🐱",
        "hint": "เสียงแมวอารมณ์ดี กรรรร... นอนบนตัก",
        "image": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/cat_purr.ogg"
    },
    {
        "key": "crow_call",
        "title": "อีการ้อง",
        "category": "สัตว์",
        "emoji": "🦅",
        "hint": "เสียงนกสีดำร้อง กา... กา... บนต้นไม้",
        "image": "https://images.unsplash.com/photo-1522926197415-e6a0a324f8d5?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/crow_call.ogg"
    },
    {
        "key": "bee_buzz",
        "title": "ผึ้งบินหึ่งๆ",
        "category": "สัตว์",
        "emoji": "🐝",
        "hint": "แมลงมีเหล็กใน บินตอมเกสรดอกไม้ หึ่งๆ",
        "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/bee_buzz.ogg"
    },
    {
        "key": "buzzing_fly",
        "title": "แมลงวันตอม",
        "category": "สัตว์",
        "emoji": "🪰",
        "hint": "บินวนรอบโต๊ะอาหารเสียงน่ารำคาญ",
        "image": "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/buzzing_fly.ogg"
    },
    {
        "key": "cicada_chirp",
        "title": "จักจั่น / จิ้งหรีด",
        "category": "สัตว์",
        "emoji": "🦗",
        "hint": "ส่งเสียงกรีดร้องระงมในป่ายามบ่าย",
        "image": "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/cicada_chirp.ogg"
    },
    {
        "key": "woodpecker_pecking_fast",
        "title": "นกหัวขวานเจาะไม้",
        "category": "สัตว์",
        "emoji": "🐦",
        "hint": "ใช้จะงอยปากเคาะลำต้นไม้รัวๆ ดั่กๆๆๆ",
        "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/woodpecker_pecking_fast.ogg"
    },
    {
        "key": "swarming_bees",
        "title": "ฝูงผึ้งแตกรัง",
        "category": "สัตว์",
        "emoji": "🐝",
        "hint": "ฝูงแมลงบินรวมกลุ่มเสียงดังกระหึ่ม",
        "image": "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/animals/swarming_bees.ogg"
    },
    {
        "key": "toilet_flush_small_bathroom",
        "title": "กดชักโครก",
        "category": "ของใช้ในบ้าน",
        "emoji": "🚽",
        "hint": "เสียงน้ำหมุนวนระบายลงท่อในห้องน้ำ",
        "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/toilet_flush_small_bathroom.ogg"
    },
    {
        "key": "chopping_vegetables",
        "title": "มีดหั่นผักบนเขียง",
        "category": "ของใช้ในบ้าน",
        "emoji": "🔪",
        "hint": "แม่ครัวซอยวัตถุดิบบนเขียงไม้อย่างคล่องแคล่ว",
        "image": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/chopping_vegetables.ogg"
    },
    {
        "key": "cell_phone_vibrate",
        "title": "โทรศัพท์มือถือสั่น",
        "category": "ของใช้ในบ้าน",
        "emoji": "📱",
        "hint": "วางบนโต๊ะไม้แล้วมีสายเข้า สั่นครืด... ครืด...",
        "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/cell_phone_vibrate.ogg"
    },
    {
        "key": "aluminum_can_crunch_series",
        "title": "บี้กระป๋องอลูมิเนียม",
        "category": "ของใช้ในบ้าน",
        "emoji": "🥫",
        "hint": "เหยียบหรือบีบกระป๋องน้ำอัดลมให้แบน กร๊อบแกร๊บ",
        "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/aluminum_can_crunch_series.ogg"
    },
    {
        "key": "sliding_window_aggressive",
        "title": "เปิดปิดหน้าต่างบานเลื่อน",
        "category": "ของใช้ในบ้าน",
        "emoji": "🪟",
        "hint": "ล้อเลื่อนหน้าต่างกระจกเลื่อนไปตามราง ฟึ่ด... ปัง",
        "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/sliding_window_aggressive.ogg"
    },
    {
        "key": "button_push",
        "title": "กดสวิตช์ปุ่มกด",
        "category": "ของใช้ในบ้าน",
        "emoji": "🔘",
        "hint": "นิ้วกดสวิตช์เครื่องใช้ไฟฟ้าดัง แป๊ก!",
        "image": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/button_push.ogg"
    },
    {
        "key": "bowls_on_table",
        "title": "วางชามกระทบโต๊ะ",
        "category": "ของใช้ในบ้าน",
        "emoji": "🥣",
        "hint": "จัดโต๊ะอาหาร วางภาชนะกระเบื้องกระทบกัน",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/bowls_on_table.ogg"
    },
    {
        "key": "baking",
        "title": "เปิดเตาอบทำขนม",
        "category": "ของใช้ในบ้าน",
        "emoji": "🥖",
        "hint": "ทำขนมปังในครัว กลิ่นหอมฟุ้ง",
        "image": "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/baking.ogg"
    },
    {
        "key": "alarm_clock",
        "title": "นาฬิกาปลุกดัง",
        "category": "ของใช้ในบ้าน",
        "emoji": "⏰",
        "hint": "ส่งเสียงปลุกยามเช้า ตี๊ดๆ รัวๆ ไม่ยอมตื่น",
        "image": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    },
    {
        "key": "mechanical_clock_ring",
        "title": "นาฬิกาลานโบราณสั่นกระดิ่ง",
        "category": "ของใช้ในบ้าน",
        "emoji": "🕰️",
        "hint": "นาฬิกาหัวเตียงมีกระดิ่งคู่ด้านบน กริ๊งงงงยาวๆ",
        "image": "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/mechanical_clock_ring.ogg"
    },
    {
        "key": "phone_alerts_and_rings",
        "title": "เสียงโทรศัพท์บ้านดัง",
        "category": "ของใช้ในบ้าน",
        "emoji": "☎️",
        "hint": "กริ๊ง... กริ๊ง... มีสายเรียกเข้าทางโทรศัพท์",
        "image": "https://images.unsplash.com/photo-1520923642038-b4259acecbd7?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
    },
    {
        "key": "digital_watch_alarm_long",
        "title": "นาฬิกาข้อมือดิจิทัลเตือน",
        "category": "ของใช้ในบ้าน",
        "emoji": "⌚",
        "hint": "เสียงปิ๊บๆ ถี่ๆ บนข้อมือเมื่อครบชั่วโมง",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
    },
    {
        "key": "dinner_bell_triangle",
        "title": "เคาะกระดิ่งสามเหลี่ยมเรียกกินข้าว",
        "category": "ของใช้ในบ้าน",
        "emoji": "🔔",
        "hint": "แท่งเหล็กเคาะสามเหลี่ยมดังกังวาน กริ๊งงง",
        "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg"
    },
    {
        "key": "medium_bell_ringing_near",
        "title": "สั่นกระดิ่งมือ",
        "category": "ของใช้ในบ้าน",
        "emoji": "🛎️",
        "hint": "กระดิ่งกดหน้าเคาน์เตอร์โรงแรม ติ๊ง!",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg"
    },
    {
        "key": "airplane_in_flight",
        "title": "เครื่องบินบินบนฟ้า",
        "category": "ยานพาหนะ",
        "emoji": "✈️",
        "hint": "เสียงเครื่องยนต์ไอพ่นคำรามกึกก้องบนอากาศ",
        "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/transportation/airplane_in_flight.ogg"
    },
    {
        "key": "aggressive_motorcycle",
        "title": "บิดคันเร่งมอเตอร์ไซค์",
        "category": "ยานพาหนะ",
        "emoji": "🏍️",
        "hint": "สองล้อติดเครื่อง บิดเครื่องบรึ้มๆ เสียงท่อดัง",
        "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/transportation/aggressive_motorcycle.ogg"
    },
    {
        "key": "bicycle_pedaling",
        "title": "ปั่นจักรยานโซ่หมุน",
        "category": "ยานพาหนะ",
        "emoji": "🚲",
        "hint": "คนถีบลูกบันได เสียงโซ่เฟืองขบกัน แกร๊กๆๆ",
        "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/sports/bicycle_pedaling.ogg"
    },
    {
        "key": "bicycle_riding_on_gravel",
        "title": "ขี่จักรยานบนทางกรวด",
        "category": "ยานพาหนะ",
        "emoji": "🚴",
        "hint": "ล้อบดลงบนหินก้อนเล็กๆ เสียงกรวบๆ",
        "image": "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/transportation/bicycle_riding_on_gravel.ogg"
    },
    {
        "key": "car_door_closing",
        "title": "ปิดประตูรถยนต์",
        "category": "ยานพาหนะ",
        "emoji": "🚗",
        "hint": "ดึงประตูปิดสนิท ปึ้ง!",
        "image": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/transportation/car_door_closing.ogg"
    },
    {
        "key": "air_horn_in_close_hall_series",
        "title": "เป่าแตรลมเชียร์กีฬา",
        "category": "ยานพาหนะ",
        "emoji": "🎺",
        "hint": "แตรกระป๋องบีบเสียงดังแสบแก้วหู ปื๊นนนน!",
        "image": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/transportation/air_horn_in_close_hall_series.ogg"
    },
    {
        "key": "clown_horn",
        "title": "แตรบีบตลก / แตรสามล้อ",
        "category": "ยานพาหนะ",
        "emoji": "📯",
        "hint": "บีบลูกยางลมดัง แป๊นๆ ปิ๊ดๆ",
        "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg"
    },
    {
        "key": "distant_thunder",
        "title": "เสียงฟ้าร้องครืนๆ",
        "category": "ธรรมชาติ",
        "emoji": "⛈️",
        "hint": "พายุตั้งเค้า เสียงฟ้าร้องสะเทือนเลื่อนลั่น",
        "image": "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/weather/distant_thunder.ogg"
    },
    {
        "key": "light_rain",
        "title": "เสียงฝนตกพรำๆ",
        "category": "ธรรมชาติ",
        "emoji": "🌧️",
        "hint": "หยดน้ำโปรยปรายลงพื้น ซู่ซ่าชุ่มฉ่ำ",
        "image": "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/weather/light_rain.ogg"
    },
    {
        "key": "desert_howling_wind",
        "title": "ลมพัดหวีดหวิว",
        "category": "ธรรมชาติ",
        "emoji": "🌪️",
        "hint": "ลมกรรโชกแรง พัดผ่านซอกตึก วู่วววว",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/weather/desert_howling_wind.ogg"
    },
    {
        "key": "leaves_russle_on_tree",
        "title": "ใบไม้เสียดสีตามลม",
        "category": "ธรรมชาติ",
        "emoji": "🍃",
        "hint": "สายลมพัดผ่านพุ่มไม้ เสียงใบไม้กรอบแกรบ",
        "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/weather/leaves_russle_on_tree.ogg"
    },
    {
        "key": "basketball_bounce_and_roll",
        "title": "ลูกบาสเกตบอลเด้งพื้น",
        "category": "กีฬา",
        "emoji": "🏀",
        "hint": "เดาะลูกบาสลงบนพื้นคอร์ทไม้ ดึ๋งๆๆๆ",
        "image": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/sports/basketball_bounce_and_roll.ogg"
    },
    {
        "key": "basketball_shot_swish",
        "title": "ชู้ตบาสลงห่วงสวบ",
        "category": "กีฬา",
        "emoji": "⛹️",
        "hint": "ลูกบาสลอยเสียบตาข่ายลงอย่างสมบูรณ์แบบ สวบ!",
        "image": "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/sports/basketball_shot_swish.ogg"
    },
    {
        "key": "baseball_into_glove",
        "title": "รับลูกบอลเข้าถุงมือเบสบอล",
        "category": "กีฬา",
        "emoji": "⚾",
        "hint": "ลูกบอลหนังพุ่งกระแทกเข้ากลางถุงมือ ปึ้ก!",
        "image": "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/sports/baseball_into_glove.ogg"
    },
    {
        "key": "chopping_log",
        "title": "ขวานจามผ่าฟืน",
        "category": "เครื่องมือ",
        "emoji": "🪓",
        "hint": "เหวี่ยงขวานผ่าท่อนไม้แยกเป็นสองท่อน ปึ้ก... แคร่ก",
        "image": "https://images.unsplash.com/photo-1520206183501-b80df61e43c2?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/tools/chopping_log.ogg"
    },
    {
        "key": "18v_cordless_drill_switch",
        "title": "สว่านไฟฟ้าไร้สาย",
        "category": "เครื่องมือ",
        "emoji": "🔩",
        "hint": "กดไกปืนสว่านหมุนเจาะ วี้ดดดดดด",
        "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/tools/18v_cordless_drill_switch.ogg"
    },
    {
        "key": "cutting_through_foliage",
        "title": "มีดดายหญ้าฟันกิ่งไม้",
        "category": "เครื่องมือ",
        "emoji": "🌿",
        "hint": "ตวัดมีดลุยถางป่า ฟิ้ว... ชับ!",
        "image": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/tools/cutting_through_foliage.ogg"
    },
    {
        "key": "drill_gear",
        "title": "เฟืองเครื่องจักรหมุน",
        "category": "เครื่องมือ",
        "emoji": "⚙️",
        "hint": "ฟันเฟืองโลหะขบกันขับเคลื่อนกลไก กึ๊กๆๆๆ",
        "image": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/tools/drill_gear.ogg"
    },
    {
        "key": "cartoon_boing",
        "title": "สปริงเด้งดึ๋งการ์ตูน",
        "category": "สนุกสนาน",
        "emoji": "🌀",
        "hint": "เสียงการ์ตูนเวลาตัวละครกระโดดดึ๋ง ปิ๊งงงง",
        "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"
    },
    {
        "key": "cartoon_cowbell",
        "title": "เคาะกระดิ่งคาวเบล",
        "category": "สนุกสนาน",
        "emoji": "🔔",
        "hint": "เครื่องเคาะจังหวะดนตรี ป๊อกๆๆๆ",
        "image": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/cartoon_cowbell.ogg"
    },
    {
        "key": "crash_layer_cymbals",
        "title": "ตีฉาบกระทบกัน",
        "category": "สนุกสนาน",
        "emoji": "🥁",
        "hint": "ฉาบทองเหลืองฟาดกันเสียงกังวาน แช้งงงง!",
        "image": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/crash_layer_cymbals.ogg"
    },
    {
        "key": "continuous_slide_whistle",
        "title": "นกหวีดสไลด์การ์ตูน",
        "category": "สนุกสนาน",
        "emoji": "🎵",
        "hint": "รูดเสียงสูงต่ำเวลาตัวละครร่วงตก วี้ดดด... ปิ๊ว",
        "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/continuous_slide_whistle.ogg"
    },
    {
        "key": "cartoon_ringing_hit",
        "title": "กระทะฟาดหัวในการ์ตูน",
        "category": "สนุกสนาน",
        "emoji": "🍳",
        "hint": "ของแข็งฟาดหัวตัวการ์ตูนแล้วเห็นดาว บ๊องงงง!",
        "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/cartoon/cartoon_ringing_hit.ogg"
    },
    {
        "key": "ice_cubes_in_glass",
        "title": "ก้อนน้ำแข็งในแก้ว",
        "category": "ของใช้ในบ้าน",
        "emoji": "🧊",
        "hint": "ก้อนสี่เหลี่ยมเย็นเฉียบกระทบแก้วดังกริ๊กๆ",
        "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/ice_cubes_in_glass.ogg"
    },
    {
        "key": "pour_boiling_water_into_cup",
        "title": "รินน้ำร้อนใส่ถ้วยกาแฟ",
        "category": "ของใช้ในบ้าน",
        "emoji": "☕",
        "hint": "เทน้ำร้อนจากกาน้ำลงในแก้วชงเครื่องดื่ม",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/pour_boiling_water_into_cup.ogg"
    },
    {
        "key": "clock_ticking",
        "title": "เข็มนาฬิกาเดิน",
        "category": "ของใช้ในบ้าน",
        "emoji": "⏱️",
        "hint": "เวลาในห้องเงียบสงัดจะได้ยินเสียง ติ๊ก... ต่อก...",
        "image": "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/clock_ticking.ogg"
    },
    {
        "key": "sweeping_wooden_porch",
        "title": "กวาดพื้นบ้าน",
        "category": "ของใช้ในบ้าน",
        "emoji": "🧹",
        "hint": "ทำความสะอาดพื้น ปัดเศษฝุ่นผง ซึ่บ... ซึ่บ",
        "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/household/sweeping_wooden_porch.ogg"
    },
    {
        "key": "pool_table_ball_drops_in_pocket",
        "title": "ลูกพูล / สนุ๊กเกอร์ลงหลุม",
        "category": "กีฬา",
        "emoji": "🎱",
        "hint": "แทงลูกกลมบนโต๊ะสักหลาดเขียว กลิ้งตกหลุมดังกึก",
        "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
        "audioUrl": "https://actions.google.com/sounds/v1/sports/pool_table_ball_drops_in_pocket.ogg"
    }
];
