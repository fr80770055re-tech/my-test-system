// 🌟 商城商品清單：學生主頁與教師後台共用同一份，新增或調價只要改這裡
import baseBearImg from '../assets/guest_dog_01.png';
import guy from '../assets/maebon3_nureokaki_05.PNG'; 
import whitehorse from '../assets/thing_whitepegasus_01.PNG';
import brave from '../assets/person_brave_01.PNG';
import seaman from '../assets/person_bisyamon_01.PNG';
import bboy from '../assets/person_bboy_03.PNG';
import moneyIconImg from '../assets/money.png'; 
import presentImg from '../assets/event_present_01.png';
import boiledEggImg from '../assets/food_boiledegg_01.png';
import haniwaImg from '../assets/other_haniwa_01-1.png';
import lanternImg from '../assets/other_izakayalantern_01.png';
import medal1Img from '../assets/other_medal_01.png';
import medal2Img from '../assets/other_medal_02.png';
import medal3Img from '../assets/other_medal_03.png';
import alpacaImg from '../assets/thing_alpaca_03.png';
import dachshund1Img from '../assets/thing_dachshund_01.png';
import dachshund2Img from '../assets/thing_dachshund_02.png';
import monkeyImg from '../assets/thing_monkey_01.png';
import chargespotPersonImg from '../assets/chargespot_person_02.png';
import chargespotStandImg from '../assets/chargespot_stand_01.png';
import hachiImg from '../assets/hachi3.png';
import hitoImg from '../assets/hito.gif';
import kabochaImg from '../assets/kabocha.png';
import maede01Img from '../assets/maede_maedes_01.png';
import maede02Img from '../assets/maede_maedes_02.png';
import maede03Img from '../assets/maede_maedes_03.png';
import maede04Img from '../assets/maede_maedes_04.png';
import maede05Img from '../assets/maede_maedes_05.png';
import maede06Img from '../assets/maede_maedes_06.png';
import maede07Img from '../assets/maede_maedes_07.png';
import maede08Img from '../assets/maede_maedes_08.png';
import maede09Img from '../assets/maede_maedes_09.png';
import maede10Img from '../assets/maede_maedes_10.png';
import maede11Img from '../assets/maede_maedes_11.png';
import avatarBaebonHeart from '../assets/baebon3.png';
import avatarWorker from '../assets/chargespot_person_01.png';
import avatarDiver from '../assets/chargespot_person_03.png';
import avatarPumpkinHero from '../assets/kabocha-new.png';
import avatarIdolFan from '../assets/maebon3_aidoruhikushi.png';
import avatarPicassoFace from '../assets/maebon3_ashida_01.png';
import avatarIceCreamGirl from '../assets/maebon3_chikagugawa_07.png';
import avatarGondolaRider from '../assets/maebon3_gondola1_11.png';
import avatarSuperGorilla from '../assets/maebon3_gorigoriru_25.png';
import avatarPainter from '../assets/maebon3_muttsuri_33.png';
import avatarBenten from '../assets/person_benten_01.png';
import avatarGoddess from '../assets/person_goddess_01.png';
import avatarKappa from '../assets/person_kappa_01.png';
import avatarSwimGirl from '../assets/person_swimsuit_girl_03.png';
import avatarFrogHat from '../assets/person_underwear_froghatman_01.png';
import avatarSailor from '../assets/person_underwear_sailor.png';
import avatarWedding from '../assets/person_wedding_dress_01.png';
import avatarFestival from '../assets/person_yamagasa_01.png';
import avatarRedNinja from '../assets/redhatwithsword.png';
import avatarKingImg from '../assets/pearson_king_01.png';
import avatarPostmanImg from '../assets/person_postman_01.png';
import avatarOfficeWorkerImg from '../assets/pearson_office_worker_01.png';
import avatarBoyImg from '../assets/maede_boy_01.png';
import avatarLadyImg from '../assets/pearson_lady_01.png';
import avatarSumoImg from '../assets/person_smo-wrestler_01.png';
import avatarPinkPegasusImg from '../assets/thing_pinkpegasus_01.png';
import accLobsterImg from '../assets/thing_iseebi_01.png';
import accShimaenagaImg from '../assets/thing_shimaenaga.png';
import accHedgehogImg from '../assets/thing_hedgehog.png';
import accWhiteCatImg from '../assets/thing_cats_13.png';
import accPeacockImg from '../assets/thing_peacock_03.png';
import avatarKintaroImg from '../assets/person_kintaro_01.png';
import avatarIdolImg from '../assets/person_idol_01.png';
import avatarPatissierImg from '../assets/person_patissier_01.png';
import avatarPrimitiveManImg from '../assets/person_primitiveman_01.png';
import avatarVegetableShopImg from '../assets/person_vegetableshop_01.png';
import avatarDrumbandImg from '../assets/person_drumband_02.png';
import accCapybaraImg from '../assets/thing_capybbara_01.png';
import accSlothImg from '../assets/thing_sloth_01.png';
import accOctopusImg from '../assets/thing_octopus_01.png';
import accSeahorseImg from '../assets/thing_seahorse_01.png';
import accFrogImg from '../assets/thing_frog_01.png';

export const SHOP_ITEMS = [
  { id: 'base_bear', type: 'base', name: '經典小狗', imageUrl: baseBearImg, price: 0 },
  { id: 'whitehorse', type: 'base', name: '白馬', imageUrl: whitehorse, price: 200 },
  { id: 'guy', type: 'base', name: '小臭臉', imageUrl: guy, price: 150 },
  { id: 'brave', type: 'base', name: '勇士', imageUrl: brave, price: 180 },
  { id: 'seaman', type: 'base', name: '海大王', imageUrl: seaman, price: 160 },
  { id: 'bboy', type: 'base', name: '街頭少年', imageUrl: bboy, price: 170 },
  { id: 'avatar_heart', name: '史萊姆愛心怪', price: 180, imageUrl: avatarBaebonHeart, type: 'base', desc: '看起來壞壞但其實很善良！' },
  { id: 'avatar_pumpkin', name: '南瓜頭勇者', price: 190, imageUrl: avatarPumpkinHero, type: 'base', desc: '萬聖節限定的神秘英雄。' },
  { id: 'avatar_picasso', name: '畢卡索拼圖人', price: 120, imageUrl: avatarPicassoFace, type: 'base', desc: '充滿藝術氣息的抽象臉孔！' },
  { id: 'avatar_gorilla', name: '進擊的大猩猩', price: 150, imageUrl: avatarSuperGorilla, type: 'base', desc: '力大無窮，解題速度加倍(心理作用)！' },
  { id: 'avatar_goddess', name: '智慧女神', price: 150, imageUrl: avatarGoddess, type: 'base', desc: '手持真理之杖，守護著知識的殿堂。' },
  { id: 'avatar_benten', name: '財藝神弁天', price: 160, imageUrl: avatarBenten, type: 'base', desc: '帶來好運與才華的傳說神祇！' },
  { id: 'avatar_kappa', name: '河童小弟', price: 180, imageUrl: avatarKappa, type: 'base', desc: '最喜歡吃小黃瓜，頭頂的盤子不能乾掉喔！' },
  { id: 'avatar_redninja', name: '赤影忍者', price: 250, imageUrl: avatarRedNinja, type: 'base', desc: '身手敏捷，斬斷所有數學難題！' },
  { id: 'avatar_painter', name: '天才老畫家', price: 190, imageUrl: avatarPainter, type: 'base', desc: '用畫筆彩繪出無限的創意。' },
  { id: 'avatar_festival', name: '祭典熱血男', price: 185, imageUrl: avatarFestival, type: 'base', desc: '充滿朝氣，最喜歡熱鬧的節慶！' },
  { id: 'avatar_froghat', name: '青蛙頭套男', price: 170, imageUrl: avatarFrogHat, type: 'base', desc: '雖然穿著內褲，但戴上青蛙帽就很勇敢！' },
  { id: 'avatar_sailor', name: '水手服男孩', price: 175, imageUrl: avatarSailor, type: 'base', desc: '揮舞旗幟，準備向偉大航道出發。' },
  { id: 'avatar_swimgirl', name: '陽光泳裝女孩', price: 180, imageUrl: avatarSwimGirl, type: 'base', desc: '夏天就是要去海邊玩水啊！' },
  { id: 'avatar_wedding', name: '浪漫新娘', price: 200, imageUrl: avatarWedding, type: 'base', desc: '最華麗的純白禮服，商城中的夢幻逸品！' },
  { id: 'avatar_worker', name: '熱血搬運工', price: 160, imageUrl: avatarWorker, type: 'base', desc: '腳踏實地，一步一步賺金幣。' },
  { id: 'avatar_diver', name: '深海潛水員', price: 170, imageUrl: avatarDiver, type: 'base', desc: '準備好潛入知識的海洋了嗎？' },
  { id: 'avatar_idol_fan', name: '熱血追星族', price: 165, imageUrl: avatarIdolFan, type: 'base', desc: '帶著螢光棒為自己加油打氣！' },
  { id: 'avatar_icecream', name: '冰淇淋女孩', price: 175, imageUrl: avatarIceCreamGirl, type: 'base', desc: '答對題目就來口甜甜的冰淇淋吧。' },
  { id: 'avatar_gondola', name: '貢多拉船夫', price: 185, imageUrl: avatarGondolaRider, type: 'base', desc: '帶著寵物一起悠閒地渡河。' },
  { id: 'acc_present', type: 'accessory', name: '驚喜禮物盒', imageUrl: presentImg, price: 30 },
  { id: 'acc_boiled_egg', type: 'accessory', name: '半熟水煮蛋', imageUrl: boiledEggImg, price: 15 },
  { id: 'acc_haniwa', type: 'accessory', name: '復古埴輪', imageUrl: haniwaImg, price: 40 },
  { id: 'acc_lantern', type: 'accessory', name: '居酒屋燈籠', imageUrl: lanternImg, price: 45 },
  { id: 'acc_medal_gold', type: 'accessory', name: '冠軍金牌', imageUrl: medal1Img, price: 100 },
  { id: 'acc_medal_silver', type: 'accessory', name: '亞軍銀牌', imageUrl: medal2Img, price: 80 },
  { id: 'acc_medal_bronze', type: 'accessory', name: '季軍銅牌', imageUrl: medal3Img, price: 60 },
  { id: 'acc_alpaca', type: 'accessory', name: '呆萌羊駝', imageUrl: alpacaImg, price: 70 },
  { id: 'acc_dachshund1', type: 'accessory', name: '棕臘腸', imageUrl: dachshund1Img, price: 55 },
  { id: 'acc_dachshund2', type: 'accessory', name: '黑臘腸', imageUrl: dachshund2Img, price: 55 },
  { id: 'acc_monkey', type: 'accessory', name: '淘氣小猴', imageUrl: monkeyImg, price: 50 },
  { id: 'acc_person_02', name: '科技小人', price: 20, imageUrl: chargespotPersonImg, type: 'accessory' },
  { id: 'acc_stand_01', name: '能量立牌', price: 15, imageUrl: chargespotStandImg, type: 'accessory' },
  { id: 'acc_hachi', name: '萌萌小黃狗', price: 45, imageUrl: hachiImg, type: 'accessory' },
  { id: 'acc_hito', name: '動感火柴人', price: 160, imageUrl: hitoImg, type: 'accessory' },
  { id: 'acc_kabocha', name: '搞怪南瓜', price: 25, imageUrl: kabochaImg, type: 'accessory' },
  { id: 'acc_maede_01', name: '變裝精靈 01', price: 35, imageUrl: maede01Img, type: 'accessory' },
  { id: 'acc_maede_02', name: '變裝精靈 02', price: 35, imageUrl: maede02Img, type: 'accessory' },
  { id: 'acc_maede_03', name: '變裝精靈 03', price: 35, imageUrl: maede03Img, type: 'accessory' },
  { id: 'acc_maede_04', name: '變裝精靈 04', price: 35, imageUrl: maede04Img, type: 'accessory' },
  { id: 'acc_maede_05', name: '變裝精靈 05', price: 35, imageUrl: maede05Img, type: 'accessory' },
  { id: 'acc_maede_06', name: '變裝精靈 06', price: 35, imageUrl: maede06Img, type: 'accessory' },
  { id: 'acc_maede_07', name: '變裝精靈 07', price: 35, imageUrl: maede07Img, type: 'accessory' },
  { id: 'acc_maede_08', name: '變裝精靈 08', price: 35, imageUrl: maede08Img, type: 'accessory' },
  { id: 'acc_maede_09', name: '變裝精靈 09', price: 35, imageUrl: maede09Img, type: 'accessory' },
  { id: 'acc_maede_10', name: '變裝精靈 10', price: 35, imageUrl: maede10Img, type: 'accessory' },
  { id: 'acc_maede_11', name: '變裝精靈 11', price: 35, imageUrl: maede11Img, type: 'accessory' },
  { id: 'avatar_king', name: '威嚴國王', price: 245, imageUrl: avatarKingImg, type: 'base', desc: '威風凜凜，號令天下的最高統治者！' },
  { id: 'avatar_postman', name: '認真郵差', price: 205, imageUrl: avatarPostmanImg, type: 'base', desc: '風雨無阻，準時送達每一份知識包裹。' },
  { id: 'avatar_officeworker', name: '上班族戰士', price: 210, imageUrl: avatarOfficeWorkerImg, type: 'base', desc: '認真打拼，為了達成業績（金幣）而努力！' },
  { id: 'avatar_boy', name: '活潑男孩', price: 200, imageUrl: avatarBoyImg, type: 'base', desc: '天真無邪，充滿好奇心的少年。' },
  { id: 'avatar_lady', name: '氣質千金', price: 230, imageUrl: avatarLadyImg, type: 'base', desc: '優雅氣質，舉手投足都是貴族風範。' },
  { id: 'avatar_sumo', name: '相撲力士', price: 220, imageUrl: avatarSumoImg, type: 'base', desc: '力大無窮，穩如泰山！' },
  { id: 'avatar_pinkpegasus', name: '粉紅飛馬', price: 250, imageUrl: avatarPinkPegasusImg, type: 'base', desc: '傳說中的粉紅色天馬，優雅地翱翔天際。' },
  { id: 'acc_lobster', name: '龍蝦大將', price: 65, imageUrl: accLobsterImg, type: 'accessory', desc: '揮舞著大螯，霸氣十足的海中戰士。' },
  { id: 'acc_shimaenaga', name: '雪白小鳥', price: 70, imageUrl: accShimaenagaImg, type: 'accessory', desc: '雪白圓滾滾，森林中的可愛精靈鳥。' },
  { id: 'acc_hedgehog', name: '呆萌刺蝟', price: 60, imageUrl: accHedgehogImg, type: 'accessory', desc: '圓滾滾又帶刺，讓人忍不住想抱抱（小心）！' },
  { id: 'acc_whitecat', name: '白色小貓', price: 75, imageUrl: accWhiteCatImg, type: 'accessory', desc: '慵懶可愛，隨時準備討摸摸。' },
  { id: 'acc_peacock', name: '華麗孔雀', price: 90, imageUrl: accPeacockImg, type: 'accessory', desc: '展開華麗羽翼，全場最亮眼的焦點！' },
  { id: 'avatar_kintaro', name: '怪力金太郎', price: 235, imageUrl: avatarKintaroImg, type: 'base', desc: '力大無窮的民間傳說英雄，據說能與熊摔角！' },
  { id: 'avatar_idol', name: '閃亮偶像', price: 220, imageUrl: avatarIdolImg, type: 'base', desc: '舞台上閃閃發光，粉絲們的心中偶像。' },
  { id: 'avatar_patissier', name: '甜點主廚', price: 205, imageUrl: avatarPatissierImg, type: 'base', desc: '製作出讓人幸福的甜點大師。' },
  { id: 'avatar_primitiveman', name: '原始人', price: 200, imageUrl: avatarPrimitiveManImg, type: 'base', desc: '來自遠古時代，充滿原始野性的力量！' },
  { id: 'avatar_vegetableshop', name: '蔬果老闆', price: 210, imageUrl: avatarVegetableShopImg, type: 'base', desc: '新鮮蔬果每日直送，社區的好鄰居。' },
  { id: 'avatar_drumband', name: '鼓笛隊指揮', price: 245, imageUrl: avatarDrumbandImg, type: 'base', desc: '揮舞指揮棒，帶領隊伍邁向勝利！' },
  { id: 'acc_capybara', name: '悠閒水豚君', price: 85, imageUrl: accCapybaraImg, type: 'accessory', desc: '泡在溫泉裡也不奇怪，天生一副悠閒臉。' },
  { id: 'acc_sloth', name: '慢吞吞樹懶', price: 70, imageUrl: accSlothImg, type: 'accessory', desc: '慢慢來比較快，樹懶的生活哲學。' },
  { id: 'acc_octopus', name: '八腳章魚', price: 65, imageUrl: accOctopusImg, type: 'accessory', desc: '八隻腳靈活運用，解題效率加倍？' },
  { id: 'acc_seahorse', name: '優雅海馬', price: 60, imageUrl: accSeahorseImg, type: 'accessory', desc: '優雅漂浮在海中的神秘小生物。' },
  { id: 'acc_frog', name: '呱呱青蛙', price: 65, imageUrl: accFrogImg, type: 'accessory', desc: '呱呱呱，池塘裡的活力歌手。' },
];

export const DEFAULT_BASE_URL = baseBearImg;
export { moneyIconImg };
