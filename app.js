const STORAGE_KEY = "oc-battle-link-prototype-v2";
const DEFAULT_MODEL = "command-r-plus-08-2024";
const SAMPLE_CHARACTER_IDS = new Set(["player", "eira", "shino", "sera"]);
const INTERNAL_CHAT_URL = "/api/cohere/chat";
const INTERNAL_TEST_URL = "/api/cohere/test";
const COMMUNITY_SNAPSHOT_URL = "/api/community";
const COMMUNITY_PUBLISH_CHARACTER_URL = "/api/community/character/publish";
const COMMUNITY_PUBLISH_POST_URL = "/api/community/post/publish";
const COMMUNITY_POST_COMMENT_URL = "/api/community/post/comment";

const relationshipLabels = [
  "初対面",
  "顔見知り",
  "戦友",
  "親友",
  "ライバル",
  "宿敵",
  "認めた強者",
  "再戦を望む相手",
];

const chatDefinitions = {
  greeting: { label: "挨拶", friendship: 1, rivalry: 0, respect: 0, caution: -1, heat: 2 },
  taunt: { label: "挑発", friendship: -1, rivalry: 3, respect: 0, caution: 1, heat: 8 },
  resolve: { label: "意気込み", friendship: 0, rivalry: 1, respect: 1, caution: 0, heat: 4 },
  thanks: { label: "感謝", friendship: 3, rivalry: -1, respect: 1, caution: -1, heat: 3 },
  praise: { label: "賞賛", friendship: 1, rivalry: 0, respect: 3, caution: -1, heat: 3 },
  apology: { label: "謝罪", friendship: 2, rivalry: -2, respect: 0, caution: -1, heat: 2 },
  concern: { label: "心配", friendship: 2, rivalry: -1, respect: 0, caution: -1, heat: 3 },
  rematch: { label: "再戦要求", friendship: 0, rivalry: 2, respect: 2, caution: 0, heat: 6 },
};

const charaverseGenres = [
  { key: "daily", label: "日常" },
  { key: "cooking", label: "料理" },
  { key: "training", label: "訓練" },
  { key: "victory", label: "勝利報告" },
  { key: "defeat", label: "敗北報告" },
  { key: "thanks", label: "感謝" },
  { key: "complaint", label: "文句" },
  { key: "worry", label: "悩み" },
  { key: "boast", label: "自慢" },
  { key: "question", label: "質問" },
  { key: "battle", label: "バトル後の感想" },
];

const charaverseMoods = [
  { key: "bright", label: "明るい" },
  { key: "shy", label: "照れ" },
  { key: "proud", label: "自慢" },
  { key: "calm", label: "しんみり" },
  { key: "taunt", label: "挑発" },
  { key: "cute", label: "かわいい" },
];

const intervalChoices = [
  { key: "recognize", label: "認める", friendship: 2, rivalry: 0, respect: 3, caution: -1, heat: 4 },
  { key: "taunt", label: "挑発する", friendship: -1, rivalry: 4, respect: 0, caution: 1, heat: 8 },
  { key: "silent", label: "黙る", friendship: 0, rivalry: 1, respect: 0, caution: 1, heat: 2 },
  { key: "concern", label: "心配する", friendship: 3, rivalry: -1, respect: 0, caution: -1, heat: 3 },
  { key: "declare", label: "本気を出す宣言", friendship: 0, rivalry: 2, respect: 2, caution: 1, heat: 6 },
];

const archetypeVoices = {
  cool: {
    descriptor: "感情を抑えて冷静に状況を読む",
    greeting: "礼儀は通しておく。まずは互いの力量を見せてもらう",
    taunt: "その程度で揺らぐなら、最初から刃を握るべきじゃない",
    resolve: "ここから先は一手も無駄にしない",
    thanks: "礼は言っておく。今の判断は悪くなかった",
    praise: "実力は認める。だからこそ、油断はしない",
    apology: "今の判断は私の落ち度だ。次で修正する",
    concern: "無理をするな。崩れた瞬間を見逃すほど甘くない",
    rematch: "次はもっと高い精度で越えてみせる",
  },
  tsundere: {
    descriptor: "棘のある言い方をするが、本音は意外と優しい",
    greeting: "別に楽しみにしてたわけじゃないけど、手は抜かないから",
    taunt: "なによ、その程度？ まだ本気じゃないって言いたいの？",
    resolve: "今さら怖じ気づくわけないでしょ。最後までやるわ",
    thanks: "べ、別に感謝してるわけじゃないから。でも、助かった",
    praise: "ちょっとはやるじゃない。だからって調子に乗らないでよね",
    apology: "今のは悪かったわよ。次はミスしないから",
    concern: "勘違いしないで。心配っていうか、見てて危なっかしいだけ",
    rematch: "次こそは私が勝つんだから。逃げるんじゃないわよ",
  },
  gentle: {
    descriptor: "相手の感情を受け止めながら戦う",
    greeting: "よろしくね。ちゃんと向き合って戦えたら嬉しいな",
    taunt: "そんなに急がなくてもいいよ。あなたの本気、ちゃんと受け止めるから",
    resolve: "怖くても退かない。あなたと戦う意味を見つけたい",
    thanks: "ありがとう。あなたがいてくれて、少し安心したよ",
    praise: "強いね。正面から戦えて、ちょっと嬉しい",
    apology: "ごめんね。今のは私の配慮が足りなかった",
    concern: "大丈夫？ 無茶を続けると、本当に壊れちゃうよ",
    rematch: "また戦おう。今度はもっと分かり合える気がする",
  },
  rough: {
    descriptor: "荒々しく踏み込み、言葉でも圧をかける",
    greeting: "いい目してるじゃねぇか。なら遠慮なく行くぞ",
    taunt: "止まって見えるな。そんな足で俺に追いつけるか？",
    resolve: "ここから先は力比べだ。食らいついてこい",
    thanks: "チッ、礼は言わねぇ。けど借りは返す",
    praise: "悪くねぇ一撃だった。だからこそ、叩き斬りがいがある",
    apology: "今のは俺のミスだ。次はまとめて取り返す",
    concern: "ふらついてんぞ。立てねぇなら叩き潰す前に下がれ",
    rematch: "終わりじゃねぇ。次はもっとデカい火花を散らそうぜ",
  },
  proud: {
    descriptor: "自尊心が強く、認める時ほど言葉が鋭い",
    greeting: "名乗る価値がある相手なら、私も本気で応えるわ",
    taunt: "その程度で私を測ったつもり？ 滑稽ね",
    resolve: "勝つのは当然。その上で、記憶に残る戦いにしてあげる",
    thanks: "助力には礼を言うわ。でも、それで対等になったつもりはしないで",
    praise: "認めましょう。少なくとも、凡百の敵とは違う",
    apology: "今のは見誤ったわ。次は二度と外さない",
    concern: "崩れるにはまだ早いわ。私が勝つ価値を下げないで",
    rematch: "再戦を望むなら受けて立つ。次は完全な形でね",
  },
};

function makeCharacter(overrides = {}) {
  return {
    id: "",
    name: "",
    title: "",
    age: "",
    gender: "",
    firstPerson: "",
    secondPerson: "",
    archetype: "cool",
    faction: "",
    tone: "",
    personality: "",
    ability: "",
    style: "",
    weakness: "",
    ultimate: "",
    origin: "",
    likes: "",
    dislikes: "",
    hobbies: "",
    mannerisms: "",
    favoritePhrase: "",
    hatedPhrase: "",
    angerReaction: "",
    praiseReaction: "",
    tauntReaction: "",
    gratitudeStyle: "",
    defeatStyle: "",
    victoryStyle: "",
    snsHandle: "",
    snsBio: "",
    notes: "",
    imageDataUrl: "",
    snsImageDataUrl: "",
    chatImageDataUrl: "",
    techniques: [],
    stats: { atk: 60, spd: 60, mind: 60, charm: 60 },
    ...overrides,
    techniques: Array.isArray(overrides.techniques)
      ? overrides.techniques.map((technique) => makeTechnique(technique))
      : [],
    stats: {
      atk: 60,
      spd: 60,
      mind: 60,
      charm: 60,
      ...(overrides.stats || {}),
    },
  };
}

const sampleCharacters = [
  makeCharacter({
    id: "player",
    name: "黒羽レイ",
    title: "影羽の切先",
    age: "19",
    gender: "男性",
    firstPerson: "俺",
    secondPerson: "君",
    archetype: "cool",
    faction: "宵羽学区・独立戦闘科",
    tone: "少し柔らかいクール口調",
    personality: "静かに相手を観察してから動く。無茶はしないが、仲間が絡むと踏み込みが深くなる。",
    ability: "影と黒羽根を操る。視界妨害、足場干渉、近接斬撃が得意。",
    style: "高機動の近接奇襲。影を踏ませて位置をずらし、背後を取る。",
    weakness: "正面からの持久戦と広範囲光学攻撃に弱い。",
    ultimate: "黒翼断章",
    origin: "夜の空域で起きた事故の生還者。以後、影と同期する異能が発現した。",
    likes: "静かな屋上、夜風、ホットココア",
    dislikes: "人を駒扱いする言い方、眩しすぎる空間",
    hobbies: "羽根の手入れ、戦闘記録の見返し",
    mannerisms: "考える時に羽根を一枚だけ指で回す",
    favoritePhrase: "悪くない",
    hatedPhrase: "つまらない",
    angerReaction: "声量は上がらないが、刃の間合いが急に詰まる。",
    praiseReaction: "一瞬だけ目線を逸らし、短く礼を返す。",
    tauntReaction: "露骨には乗らず、次の一手で返そうとする。",
    gratitudeStyle: "礼は言っておく。借りは戦いで返す。",
    defeatStyle: "膝をついても相手の癖を観察し、次の糸口を探す。",
    victoryStyle: "深追いせず、静かに刃を収める。",
    notes: "しのとの関係を戦友寄りに育てたい。エイラとはライバル路線、セラとは警戒と尊敬が混ざる方向。",
    techniques: [
      {
        id: createId(),
        name: "黒羽散し",
        type: "牽制",
        aliases: "黒い羽を散らす,影羽で視界を奪う,羽根で目くらまし",
        staminaCost: 8,
        power: 3,
        effect: "視界妨害からの奇襲。警戒値を上げやすい。",
        description: "黒い羽根を散らして相手の視界を切り裂き、その隙に位置をずらす。",
      },
    ],
    stats: { atk: 76, spd: 88, mind: 73, charm: 62 },
  }),
  makeCharacter({
    id: "eira",
    name: "早瀬エイラ",
    title: "紫雷の断刃",
    age: "21",
    gender: "女性",
    firstPerson: "私",
    secondPerson: "貴方",
    archetype: "proud",
    faction: "対異能迎撃局・実戦班",
    tone: "鋭く抑制された女剣士口調",
    personality: "誇り高く、勝敗に対して非常に真摯。挑発には強いが、認めた相手には執着も生まれる。",
    ability: "紫の光刃を圧縮展開する。加速踏み込みからの連斬が主軸。",
    style: "高速接近からの連斬。最短距離で致命圏へ入る。",
    weakness: "長期戦でスタミナ消耗が重く、自傷を伴う覚醒は危険。",
    ultimate: "ヴァイオレットオーバードライブ",
    origin: "軍属の家系で育ち、結果でしか評価されない戦場を生き抜いてきた。",
    likes: "鍛錬、明確な勝敗、よく研がれた刀身",
    dislikes: "手加減、曖昧な判断、哀れみ",
    hobbies: "剣の整備、独自の踏み込み反復",
    mannerisms: "不機嫌になると刃の角度が低くなる",
    favoritePhrase: "結果で示しなさい",
    hatedPhrase: "手加減",
    angerReaction: "冷静さを保ったまま速度だけが上がる。",
    praiseReaction: "素直には喜ばないが、実力を認めた証として記録する。",
    tauntReaction: "表情は崩さず、次の一撃の精度を上げる。",
    gratitudeStyle: "助力には礼を言う。でも、それで対等になったつもりはしないで。",
    defeatStyle: "敗北を記録に変え、次回の再現防止に使う。",
    victoryStyle: "相手の強みを短く評し、次の課題を切り分ける。",
    notes: "レイ相手だとライバル色が強い。挑発で熱が上がるほど言葉も鋭くなる。",
    techniques: [
      {
        id: createId(),
        name: "紫電断",
        type: "斬撃",
        aliases: "紫の刃で斬る,光刃を最大出力で振るう,紫雷の斬撃",
        staminaCost: 12,
        power: 6,
        effect: "高速接近からの高火力斬撃。",
        description: "紫の光刃を圧縮し、踏み込みと同時に断ち切る。",
      },
    ],
    stats: { atk: 83, spd: 91, mind: 75, charm: 55 },
  }),
  makeCharacter({
    id: "shino",
    name: "雪代しの",
    title: "白夜の氷灯",
    age: "18",
    gender: "女性",
    firstPerson: "私",
    secondPerson: "あなた",
    archetype: "gentle",
    faction: "白群寮・補助戦術専攻",
    tone: "柔らかい博多寄りの優しい口調",
    personality: "穏やかで面倒見がよい。心配や感謝に敏感で、守る理由があるほど強くなる。",
    ability: "氷結結界と温度制御。守りと支援が得意。",
    style: "守りながら反撃する中距離戦。氷で足場と流れを変える。",
    weakness: "近距離の瞬発火力勝負は苦手。",
    ultimate: "白夜結界",
    origin: "雪原地帯の生存圏で育ち、守るための異能制御を学んだ。",
    likes: "あたたかい飲み物、人の笑顔、星空",
    dislikes: "置き去りにする判断、無意味な流血",
    hobbies: "編み物、氷片で小物を作ること",
    mannerisms: "安心すると語尾が少し柔らかくなる",
    favoritePhrase: "だいじょうぶ",
    hatedPhrase: "どうでもいい",
    angerReaction: "怒鳴らず、静かに空気温度を落とす。",
    praiseReaction: "照れながらも素直に嬉しそうに笑う。",
    tauntReaction: "傷つくが、相手の痛みも見ようとする。",
    gratitudeStyle: "ありがとう。あなたがいてくれて、少し安心したよ。",
    defeatStyle: "悔しさを飲み込みつつ、相手の強さを認める。",
    victoryStyle: "相手を気遣いながら、無理をしないよう声を掛ける。",
    notes: "レイとは戦友候補。模擬戦でも友情値が上がりやすい。",
    techniques: [
      {
        id: createId(),
        name: "氷刃",
        type: "氷結斬撃",
        aliases: "氷の刃,氷の刃を飛ばす,氷の斬撃",
        staminaCost: 10,
        power: 5,
        effect: "氷属性の単体攻撃。命中時に相手の警戒が上がりやすい。",
        description: "氷の刃を飛ばして直撃させる。似た描写でもこの技として判定されやすい。",
      },
    ],
    stats: { atk: 68, spd: 60, mind: 89, charm: 80 },
  }),
  makeCharacter({
    id: "sera",
    name: "セラ・ノワール",
    title: "零解析者",
    age: "22",
    gender: "女性",
    firstPerson: "私",
    secondPerson: "貴女",
    archetype: "cool",
    faction: "零式観測機関",
    tone: "冷徹な解析者口調",
    personality: "感情より構造を重視するが、理解不能な相手には強い興味を持つ。",
    ability: "氷結解析と行動予測。観測結果を戦術に変換する。",
    style: "観測からの精密制圧。相手の癖を見抜いて崩す。",
    weakness: "予測不能な感情行動に対応が遅れることがある。",
    ultimate: "ゼロ・アルゴリズム",
    origin: "人ではなく現象を読む教育を受け、戦闘も観測対象として扱ってきた。",
    likes: "整列した記録、静かな研究室、再現性",
    dislikes: "非合理、情報の欠損、雑音",
    hobbies: "戦闘ログの注釈付け、観測メモ",
    mannerisms: "思考が深まると指先でリズムを刻む",
    favoritePhrase: "解析対象",
    hatedPhrase: "気分",
    angerReaction: "声色は変わらないが、言葉が一段階冷える。",
    praiseReaction: "評価として受け取り、次の観測項目に反映する。",
    tauntReaction: "無意味と切り捨てつつ、内心では反証したくなる。",
    gratitudeStyle: "協力には感謝するわ。合理的判断として。",
    defeatStyle: "解析不能として一度受け止め、次回に再定義する。",
    victoryStyle: "結果を淡々と確認し、次の仮説へ移行する。",
    notes: "レイには警戒と興味。エイラとは因縁寄りの共同戦線も似合う。",
    techniques: [
      {
        id: createId(),
        name: "零域観測",
        type: "解析",
        aliases: "行動解析,予測線を引く,観測で封じる",
        staminaCost: 9,
        power: 4,
        effect: "予測と拘束の複合技。防御や回避の布石に向く。",
        description: "敵の動線を観測し、氷の解析線で逃げ道を狭める。",
      },
    ],
    stats: { atk: 71, spd: 72, mind: 95, charm: 48 },
  }),
];

const defaultState = {
  settings: {
    model: DEFAULT_MODEL,
    temperature: 0.7,
    maxTokens: 900,
    useApi: true,
    apiStatus: "サーバー側 Command R+ 未接続",
  },
  customCharacterCount: 0,
  communityProfileId: `profile-${createId()}`,
  communityProfileName: "匿名オーナー",
  communityStatus: "公開ステータス: まだ共有していません",
  communityFeedStatus: "公開投稿: 読み込み前",
  editorCharacterId: "player",
  editorTechniqueIndex: -1,
  selectedEnemyId: "eira",
  chatActorId: "player",
  chatSelectedId: "eira",
  characters: sampleCharacters,
  relations: {
    "player:eira": {
      friendship: 8,
      rivalry: 22,
      respect: 11,
      caution: 18,
      title: "ライバル候補",
      lastMemory: "以前の模擬戦で互いの速度を警戒した",
    },
    "player:shino": {
      friendship: 24,
      rivalry: 2,
      respect: 16,
      caution: 3,
      title: "顔見知り",
      lastMemory: "訓練後に互いの戦い方を褒め合った",
    },
    "player:sera": {
      friendship: 3,
      rivalry: 16,
      respect: 14,
      caution: 26,
      title: "警戒対象",
      lastMemory: "レイの影をセラが解析対象として記憶した",
    },
  },
  memories: [
    {
      id: createId(),
      opponentId: "eira",
      title: "挑発しても崩れなかった相手",
      body: "早瀬エイラは挑発を受けても剣速を鈍らせず、むしろ集中を増していた。",
      timestamp: new Date().toISOString(),
    },
    {
      id: createId(),
      opponentId: "shino",
      title: "一言で空気が和らいだ",
      body: "雪代しのに礼を返したことで、レイは戦場でも伝わる温度差を知った。",
      timestamp: new Date().toISOString(),
    },
  ],
  chats: {
    "player:eira": [
      {
        id: createId(),
        sender: "character",
        text: "次に剣を交える前に確認しておくわ。貴方、今日は本気で来るのよね？",
        timestamp: new Date().toISOString(),
      },
    ],
    "player:shino": [
      {
        id: createId(),
        sender: "character",
        text: "この前の模擬戦、楽しかったよ。次は戦う前にも少し話せたら嬉しいな。",
        timestamp: new Date().toISOString(),
      },
    ],
  },
  battleRecords: {},
  charaverseComposer: {
    authorId: "player",
    genre: "daily",
    mood: "bright",
    sharePublic: false,
  },
  charaversePosts: [],
  communityCharacters: [],
  communityPosts: [],
  chatMeta: {},
  charaverseFollows: {},
  charaverseProfileView: null,
  charaverseReplyContext: null,
  battle: null,
};

let state = loadState();

const elements = {
  navButtons: [...document.querySelectorAll(".nav-btn")],
  views: [...document.querySelectorAll(".view")],
  relationshipBadges: document.getElementById("relationship-badges"),
  apiForm: document.getElementById("api-form"),
  apiStatus: document.getElementById("api-status"),
  heroApiSummary: document.getElementById("hero-api-summary"),
  testApiButton: document.getElementById("test-api"),
  characterForm: document.getElementById("character-form"),
  editorCharacterSelect: document.getElementById("editor-character-select"),
  characterPreview: document.getElementById("character-preview"),
  techniqueNameInput: document.getElementById("technique-name-input"),
  techniqueTypeInput: document.getElementById("technique-type-input"),
  techniqueAliasesInput: document.getElementById("technique-aliases-input"),
  techniqueStaminaInput: document.getElementById("technique-stamina-input"),
  techniquePowerInput: document.getElementById("technique-power-input"),
  techniqueEffectInput: document.getElementById("technique-effect-input"),
  techniqueDescriptionInput: document.getElementById("technique-description-input"),
  techniqueList: document.getElementById("technique-list"),
  clearTechnique: document.getElementById("clear-technique"),
  saveTechnique: document.getElementById("save-technique"),
  createCharacter: document.getElementById("create-character"),
  publishCharacter: document.getElementById("publish-character"),
  deleteCharacter: document.getElementById("delete-character"),
  resetCharacter: document.getElementById("reset-character"),
  communityStatus: document.getElementById("community-status"),
  characterImagePreview: document.getElementById("character-image-preview"),
  characterImageInput: document.getElementById("character-image-input"),
  removeCharacterImage: document.getElementById("remove-character-image"),
  characterSnsImagePreview: document.getElementById("character-sns-image-preview"),
  characterSnsImageInput: document.getElementById("character-sns-image-input"),
  removeCharacterSnsImage: document.getElementById("remove-character-sns-image"),
  characterChatImagePreview: document.getElementById("character-chat-image-preview"),
  characterChatImageInput: document.getElementById("character-chat-image-input"),
  removeCharacterChatImage: document.getElementById("remove-character-chat-image"),
  enemyRoster: document.getElementById("enemy-roster"),
  battleEnemySelect: document.getElementById("battle-enemy-select"),
  battleMatchupBanner: document.getElementById("battle-matchup-banner"),
  battleMeta: document.getElementById("battle-meta"),
  startBattle: document.getElementById("start-battle"),
  playerCard: document.getElementById("player-card"),
  enemyCard: document.getElementById("enemy-card"),
  battleLog: document.getElementById("battle-log"),
  battleForm: document.getElementById("battle-form"),
  battleSubmit: document.getElementById("battle-submit"),
  battleAiMode: document.getElementById("battle-ai-mode"),
  heatMeter: document.getElementById("heat-meter"),
  intervalBanner: document.getElementById("interval-banner"),
  intervalActions: document.getElementById("interval-actions"),
  chatActorSelect: document.getElementById("chat-actor-select"),
  chatTargetSelect: document.getElementById("chat-target-select"),
  chatContactList: document.getElementById("chat-contact-list"),
  chatThreadHeader: document.getElementById("chat-thread-header"),
  chatThread: document.getElementById("chat-thread"),
  chatForm: document.getElementById("chat-form"),
  chatSend: document.getElementById("chat-send"),
  charaverseForm: document.getElementById("charaverse-form"),
  charaverseAuthorSelect: document.getElementById("charaverse-author-select"),
  charaverseGenreSelect: document.getElementById("charaverse-genre-select"),
  charaverseMoodSelect: document.getElementById("charaverse-mood-select"),
  charaverseRawInput: document.getElementById("charaverse-raw-input"),
  charaverseSharePublic: document.getElementById("charaverse-share-public"),
  charaverseReroll: document.getElementById("charaverse-reroll"),
  charaverseRefreshCommunity: document.getElementById("charaverse-refresh-community"),
  charaverseRefreshCommunityInline: document.getElementById("charaverse-refresh-community-inline"),
  charaversePreview: document.getElementById("charaverse-preview"),
  communityFeedStatus: document.getElementById("community-feed-status"),
  charaverseProfilePanel: document.getElementById("charaverse-profile-panel"),
  charaverseTimeline: document.getElementById("charaverse-timeline"),
  relationsList: document.getElementById("relations-list"),
  memoriesList: document.getElementById("memories-list"),
};

init();

function init() {
  bindNavigation();
  bindApiSettings();
  bindCharacterEditor();
  bindBattleControls();
  bindRelationshipChat();
  bindCharaverse();
  renderRelationshipBadges();
  renderAll();
  void syncCommunitySnapshot();
}

function bindNavigation() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
}

function bindApiSettings() {
  fillApiForm();

  elements.apiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(elements.apiForm);
    state.settings.model = (form.get("model") || DEFAULT_MODEL).toString().trim() || DEFAULT_MODEL;
    state.settings.temperature = Number(form.get("temperature")) || 0.7;
    state.settings.maxTokens = Number(form.get("maxTokens")) || 900;
    state.settings.useApi = form.get("useApi") === "on";
    state.settings.apiStatus = state.settings.useApi
      ? `保存済み: ${state.settings.model} / サーバープロキシ使用`
      : "ローカル演出モード";
    saveState();
    renderAll();
  });

  elements.testApiButton.addEventListener("click", async () => {
    const form = new FormData(elements.apiForm);
    const model = (form.get("model") || DEFAULT_MODEL).toString().trim() || DEFAULT_MODEL;

    setApiStatus("接続テスト中です...", false);
    elements.testApiButton.disabled = true;

    try {
      const result = await testServerApi(model);
      setApiStatus(`接続成功: ${result.model}`, false, true);
    } catch (error) {
      setApiStatus(`接続失敗: ${error.message}`, true);
    } finally {
      elements.testApiButton.disabled = false;
    }
  });
}

function bindCharacterEditor() {
  elements.editorCharacterSelect.addEventListener("change", () => {
    state.editorCharacterId = elements.editorCharacterSelect.value;
    state.editorTechniqueIndex = -1;
    saveState();
    renderAll();
  });

  elements.createCharacter.addEventListener("click", () => {
    const newCharacter = buildNewCustomCharacter();
    state.characters.push(newCharacter);
    state.editorCharacterId = newCharacter.id;
    state.editorTechniqueIndex = -1;
    state.selectedEnemyId = newCharacter.id;
    saveState();
    renderAll();
  });

  elements.publishCharacter.addEventListener("click", async () => {
    await publishCurrentCharacter();
  });

  elements.deleteCharacter.addEventListener("click", () => {
    const current = getEditorCharacter();
    if (!current || SAMPLE_CHARACTER_IDS.has(current.id)) {
      appendSystemNotice("サンプルキャラとマイキャラは削除できません。");
      return;
    }

    state.characters = state.characters.filter((character) => character.id !== current.id);
    cleanupCharacterData(current.id);
    state.editorCharacterId = "player";
    state.editorTechniqueIndex = -1;

    const availableEnemy = state.characters.find((character) => character.id !== "player");
    if (state.selectedEnemyId === current.id && availableEnemy) {
      state.selectedEnemyId = availableEnemy.id;
    }

    saveState();
    renderAll();
  });

  elements.characterForm.addEventListener("input", () => {
    const draft = formCharacterFromEditor();
    renderCharacterPreview(draft);
  });

  elements.characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = formCharacterFromEditor();
    updateCharacter(draft.id, draft);
    saveState();
    renderAll();
  });

  elements.resetCharacter.addEventListener("click", () => {
    const targetId = state.editorCharacterId;
    const sample = sampleCharacters.find((character) => character.id === targetId);
    const resetCharacter = sample || buildEmptyCharacterTemplate(targetId);
    updateCharacter(targetId, resetCharacter);
    state.editorTechniqueIndex = -1;
    saveState();
    renderAll();
  });

  elements.saveTechnique.addEventListener("click", () => {
    saveTechniqueFromEditor();
  });

  elements.clearTechnique.addEventListener("click", () => {
    state.editorTechniqueIndex = -1;
    renderTechniqueBuilder(getEditorCharacter());
  });

  elements.techniqueList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-technique-action]");
    if (!actionButton) {
      return;
    }

    const index = Number(actionButton.dataset.techniqueIndex);
    const actionType = actionButton.dataset.techniqueAction;
    const character = getEditorCharacter();
    if (!character || !character.techniques[index]) {
      return;
    }

    if (actionType === "edit") {
      state.editorTechniqueIndex = index;
      renderTechniqueBuilder(character);
      return;
    }

    if (actionType === "delete") {
      const techniques = character.techniques.filter((_, techniqueIndex) => techniqueIndex !== index);
      updateCharacter(character.id, { ...character, techniques });
      state.editorTechniqueIndex = -1;
      saveState();
      renderAll();
    }
  });

  elements.characterImageInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await resizeImageFile(file, 640, 0.84);
      const current = getEditorCharacter();
      updateCharacter(current.id, { ...current, imageDataUrl: dataUrl });
      saveState();
      renderAll();
    } catch (error) {
      appendSystemNotice(`画像の読み込みに失敗しました: ${error.message}`);
    } finally {
      elements.characterImageInput.value = "";
    }
  });

  elements.characterSnsImageInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await resizeImageFile(file, 320, 0.9);
      const current = getEditorCharacter();
      updateCharacter(current.id, { ...current, snsImageDataUrl: dataUrl });
      saveState();
      renderAll();
    } catch (error) {
      appendSystemNotice(`SNSアイコンの読み込みに失敗しました: ${error.message}`);
    } finally {
      elements.characterSnsImageInput.value = "";
    }
  });

  elements.characterChatImageInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await resizeImageFile(file, 320, 0.9);
      const current = getEditorCharacter();
      updateCharacter(current.id, { ...current, chatImageDataUrl: dataUrl });
      saveState();
      renderAll();
    } catch (error) {
      appendSystemNotice(`チャットアイコンの読み込みに失敗しました: ${error.message}`);
    } finally {
      elements.characterChatImageInput.value = "";
    }
  });

  elements.removeCharacterImage.addEventListener("click", () => {
    const current = getEditorCharacter();
    updateCharacter(current.id, { ...current, imageDataUrl: "" });
    saveState();
    renderAll();
  });

  elements.removeCharacterSnsImage.addEventListener("click", () => {
    const current = getEditorCharacter();
    updateCharacter(current.id, { ...current, snsImageDataUrl: "" });
    saveState();
    renderAll();
  });

  elements.removeCharacterChatImage.addEventListener("click", () => {
    const current = getEditorCharacter();
    updateCharacter(current.id, { ...current, chatImageDataUrl: "" });
    saveState();
    renderAll();
  });
}

function bindBattleControls() {
  elements.battleEnemySelect.addEventListener("change", () => {
    state.selectedEnemyId = elements.battleEnemySelect.value;
    saveState();
    renderAll();
  });

  elements.startBattle.addEventListener("click", () => {
    startBattle();
    switchView("battle");
  });

  elements.battleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.battle || state.battle.finished || state.battle.intervalPending || state.battle.pending) {
      return;
    }

    const form = new FormData(elements.battleForm);
    const action = (form.get("action") || "").toString().trim();
    const chatCategory = (form.get("chatCategory") || "greeting").toString();
    const customBattleLine = (form.get("customBattleLine") || "").toString().trim();
    const useChat = form.get("useChat") === "on";

    if (!action) {
      appendLog("system", "通知", "行動入力が空です。短くてもいいので、キャラらしい一手を書いてください。");
      renderBattle();
      return;
    }

    await resolveTurn(action, useChat ? chatCategory : null, useChat ? customBattleLine : "");
    elements.battleForm.reset();
    elements.battleForm.querySelector('input[name="useChat"]').checked = true;
    renderAll();
  });
}

function bindRelationshipChat() {
  elements.chatActorSelect.addEventListener("change", () => {
    state.chatActorId = elements.chatActorSelect.value;
    ensureChatPairState();
    saveState();
    renderAll();
  });

  elements.chatTargetSelect.addEventListener("change", () => {
    state.chatSelectedId = elements.chatTargetSelect.value;
    ensureChatPairState();
    saveState();
    renderAll();
  });

  elements.chatContactList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-target]");
    if (!button) {
      return;
    }

    state.chatSelectedId = button.dataset.chatTarget;
    ensureChatPairState();
    saveState();
    renderAll();
  });

  elements.chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentTarget = getChatTargetCharacter();
    if (!currentTarget) {
      return;
    }

    const form = new FormData(elements.chatForm);
    const message = (form.get("message") || "").toString().trim();
    if (!message) {
      return;
    }

    await sendRelationshipChat(message, getChatActorCharacter()?.id || "player", currentTarget.id);
    elements.chatForm.reset();
    renderAll();
  });
}

function bindCharaverse() {
  elements.charaverseAuthorSelect.addEventListener("change", () => {
    state.charaverseComposer.authorId = elements.charaverseAuthorSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseGenreSelect.addEventListener("change", () => {
    state.charaverseComposer.genre = elements.charaverseGenreSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseMoodSelect.addEventListener("change", () => {
    state.charaverseComposer.mood = elements.charaverseMoodSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseRawInput.addEventListener("input", () => {
    renderCharaversePreview();
  });

  elements.charaverseSharePublic.addEventListener("change", () => {
    state.charaverseComposer.sharePublic = elements.charaverseSharePublic.checked;
    saveState();
  });

  elements.charaverseReroll.addEventListener("click", async () => {
    await renderCharaversePreview(true);
  });

  elements.charaverseRefreshCommunity.addEventListener("click", async () => {
    await syncCommunitySnapshot(true);
  });

  elements.charaverseRefreshCommunityInline.addEventListener("click", async () => {
    await syncCommunitySnapshot(true);
  });

  elements.charaverseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createCharaversePost();
  });

  elements.charaverseTimeline.addEventListener("click", async (event) => {
    const profileTrigger = event.target.closest("[data-profile-open]");
    if (profileTrigger) {
      handleProfileOpen(profileTrigger);
      return;
    }

    const replyTrigger = event.target.closest("[data-charaverse-reply]");
    if (replyTrigger) {
      const post = getAnyCharaversePost(replyTrigger.dataset.charaverseReplyPost);
      const comment = findCommentInPost(post, replyTrigger.dataset.charaverseReply);
      if (post && comment) {
        const commenter = getCharacter(comment.commenterId) || comment.commenterSnapshot || { name: "誰か" };
        setReplyContext(post.id, comment.id, commenter.name || "誰か");
      }
      return;
    }

    const likeButton = event.target.closest("[data-charaverse-like]");
    if (likeButton) {
      await handleCharaverseLike(likeButton.dataset.charaverseLike);
      return;
    }

    const commentButton = event.target.closest("[data-charaverse-comment]");
    if (commentButton) {
      await handleCharaverseManualComment(commentButton.dataset.charaverseComment);
      return;
    }

    const deleteButton = event.target.closest("[data-charaverse-delete]");
    if (deleteButton) {
      deleteCharaversePost(deleteButton.dataset.charaverseDelete);
    }
  });

  elements.charaverseProfilePanel.addEventListener("click", async (event) => {
    const closeButton = event.target.closest("[data-charaverse-profile-close]");
    if (closeButton) {
      closeCharaverseProfile();
      return;
    }

    const followButton = event.target.closest("[data-charaverse-follow]");
    if (followButton) {
      toggleProfileFollow(followButton.dataset.charaverseFollow);
      return;
    }

    const profileTrigger = event.target.closest("[data-profile-open]");
    if (profileTrigger) {
      handleProfileOpen(profileTrigger);
      return;
    }

    const replyTrigger = event.target.closest("[data-charaverse-reply]");
    if (replyTrigger) {
      const post = getAnyCharaversePost(replyTrigger.dataset.charaverseReplyPost);
      const comment = findCommentInPost(post, replyTrigger.dataset.charaverseReply);
      if (post && comment) {
        const commenter = getCharacter(comment.commenterId) || comment.commenterSnapshot || { name: "誰か" };
        setReplyContext(post.id, comment.id, commenter.name || "誰か");
      }
      return;
    }

    const commentButton = event.target.closest("[data-charaverse-comment]");
    if (commentButton) {
      await handleCharaverseManualComment(commentButton.dataset.charaverseComment);
    }
  });
}

function switchView(viewName) {
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
}

function renderAll() {
  ensureSelectedCharacterState();
  fillApiForm();
  fillCharacterTargetOptions();
  fillCharacterForm(getEditorCharacter());
  renderCharacterPreview(getEditorCharacter());
  renderCharacterImage(getEditorCharacter());
  renderTechniqueBuilder(getEditorCharacter());
  renderTechniqueList(getEditorCharacter());
  renderCharacterEditorActions();
  renderEnemyRoster();
  renderBattle();
  fillChatParticipants();
  renderRelationshipChat();
  fillCharaverseComposer();
  renderCommunityStatus();
  renderCharaversePreview();
  renderCharaverseProfilePanel();
  renderCharaverseTimeline();
  renderRelations();
  renderMemories();
  renderHeroSummary();
}

function renderCommunityStatus() {
  elements.communityStatus.textContent = state.communityStatus || "公開ステータス: 未設定";
  elements.communityFeedStatus.textContent = state.communityFeedStatus || "公開投稿: 未取得";
}

function renderCharaverseProfilePanel() {
  const profile = state.charaverseProfileView;
  if (!profile) {
    elements.charaverseProfilePanel.classList.add("hidden");
    elements.charaverseProfilePanel.innerHTML = "";
    return;
  }

  const posts = getProfilePosts(profile.key);
  const viewerId = getProfileViewerId();
  const following = isFollowingProfile(viewerId, profile.key);
  const isSelf = profile.key === `character:${viewerId}`;

  elements.charaverseProfilePanel.classList.remove("hidden");
  elements.charaverseProfilePanel.innerHTML = `
    <div class="charaverse-profile-hero">
      <div class="charaverse-profile-main">
        ${renderAvatarMarkup(getCharacterSnsIcon(profile), profile.name, "sns-profile")}
        <div class="charaverse-profile-copy">
          <p class="eyebrow">Profile</p>
          <h3>${escapeHtml(profile.name)}</h3>
          <div class="charaverse-profile-handle">${escapeHtml(profile.handle || "@profile")}</div>
          <p>${escapeHtml(profile.bio)}</p>
          <div class="charaverse-post-meta">
            ${profile.title ? `<span class="charaverse-tag">${escapeHtml(profile.title)}</span>` : ""}
            ${profile.faction ? `<span class="charaverse-tag">${escapeHtml(profile.faction)}</span>` : ""}
            <span class="charaverse-tag">投稿 ${posts.length}</span>
          </div>
        </div>
      </div>
      <div class="charaverse-profile-actions">
        <button class="secondary-btn" type="button" data-charaverse-profile-close="true">閉じる</button>
        ${isSelf ? "" : `<button class="primary-btn" type="button" data-charaverse-follow="${escapeHtml(profile.key)}">${following ? "フォロー解除" : "フォローする"}</button>`}
      </div>
    </div>
    <div class="charaverse-profile-posts">
      ${posts.length
        ? posts.map((post) => renderCharaversePost(post)).join("")
        : `<div class="charaverse-post-card"><strong>まだ投稿がありません</strong><div>このプロフィールに紐づく投稿はまだありません。</div></div>`}
    </div>
  `;
}

function getCharacterProfileKey(character) {
  if (!character) return "";
  return character.isCommunity
    ? `community-character:${character.communityEntryId || character.id}`
    : `character:${character.id}`;
}

function getPostAuthorProfileKey(post) {
  if (!post) return "";
  if (post.scope === "community") {
    return `community-author:${post.profileId || "public"}:${post.authorSnapshot?.id || post.authorId || post.id}`;
  }
  return `character:${post.authorId}`;
}

function getCommenterProfileKey(post, comment) {
  if (comment?.commenterSnapshot && !getCharacter(comment.commenterId)) {
    return `community-commenter:${post.profileId || "public"}:${comment.commenterSnapshot.id || comment.commenterId || comment.id}`;
  }
  return `character:${comment?.commenterId || ""}`;
}

function buildProfileDescriptor({ key, character = null, post = null, snapshot = null, profileName = "", profileId = "" }) {
  const sourceCharacter = character || snapshot || getPostAuthorCharacter(post);
  return {
    key,
    profileId,
    profileName,
    name: sourceCharacter?.name || "不明",
    handle: sourceCharacter?.snsHandle || `@${normalizeTechniqueText(sourceCharacter?.name || "profile").slice(0, 16) || "profile"}`,
    bio: sourceCharacter?.snsBio || sourceCharacter?.notes || sourceCharacter?.personality || "プロフィールはまだ静かなまま。",
    title: sourceCharacter?.title || "",
    archetype: sourceCharacter?.archetype || "cool",
    faction: sourceCharacter?.faction || "",
    tone: sourceCharacter?.tone || "",
    imageDataUrl: sourceCharacter?.imageDataUrl || "",
    snsImageDataUrl: sourceCharacter?.snsImageDataUrl || sourceCharacter?.imageDataUrl || "",
    chatImageDataUrl: sourceCharacter?.chatImageDataUrl || sourceCharacter?.snsImageDataUrl || sourceCharacter?.imageDataUrl || "",
    sourceCharacter,
  };
}

function openCharaverseProfile(descriptor) {
  state.charaverseProfileView = descriptor;
  saveState();
  renderAll();
}

function buildProfileDescriptor({ key, character = null, post = null, snapshot = null, profileName = "", profileId = "" }) {
  const sourceCharacter = character || snapshot || getPostAuthorCharacter(post);
  return {
    key,
    profileId,
    profileName,
    name: sourceCharacter?.name || "荳肴・",
    handle: sourceCharacter?.snsHandle || snapshot?.snsHandle || `@${normalizeTechniqueText(sourceCharacter?.name || "profile").slice(0, 16) || "profile"}`,
    bio: sourceCharacter?.snsBio || snapshot?.snsBio || sourceCharacter?.notes || sourceCharacter?.personality || "繝励Ο繝輔ぅ繝ｼ繝ｫ縺ｯ縺ｾ縺髱吶°縺ｪ縺ｾ縺ｾ縲・",
    title: sourceCharacter?.title || "",
    archetype: sourceCharacter?.archetype || "cool",
    faction: sourceCharacter?.faction || "",
    tone: sourceCharacter?.tone || "",
    imageDataUrl: sourceCharacter?.imageDataUrl || "",
    snsImageDataUrl: sourceCharacter?.snsImageDataUrl || sourceCharacter?.imageDataUrl || "",
    chatImageDataUrl: sourceCharacter?.chatImageDataUrl || sourceCharacter?.snsImageDataUrl || sourceCharacter?.imageDataUrl || "",
    sourceCharacter,
  };
}

function closeCharaverseProfile() {
  state.charaverseProfileView = null;
  saveState();
  renderAll();
}

function getProfilePosts(profileKey) {
  return getMergedCharaversePosts()
    .filter((post) => getPostAuthorProfileKey(post) === profileKey)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getProfileViewerId() {
  return state.charaverseComposer.authorId || "player";
}

function isFollowingProfile(viewerId, profileKey) {
  return Boolean(state.charaverseFollows?.[`${viewerId}:${profileKey}`]);
}

function toggleProfileFollow(profileKey) {
  const viewerId = getProfileViewerId();
  if (!viewerId || !profileKey || profileKey === `character:${viewerId}`) {
    return;
  }
  const key = `${viewerId}:${profileKey}`;
  state.charaverseFollows[key] = !state.charaverseFollows[key];
  saveState();
  renderAll();
}

function setReplyContext(postId, commentId, targetName) {
  state.charaverseReplyContext = {
    postId,
    commentId,
    targetName,
  };
  saveState();
  renderAll();
}

function clearReplyContext() {
  state.charaverseReplyContext = null;
  saveState();
  renderAll();
}

function renderHeroSummary() {
  if (state.settings.useApi) {
    elements.heroApiSummary.textContent = `Server Proxy / ${state.settings.model || DEFAULT_MODEL}`;
  } else {
    elements.heroApiSummary.textContent = "ローカル演出モード";
  }
}

function renderRelationshipBadges() {
  elements.relationshipBadges.innerHTML = relationshipLabels
    .map((label) => `<span class="badge">${escapeHtml(label)}</span>`)
    .join("");
}

function fillApiForm() {
  elements.apiForm.model.value = state.settings.model || DEFAULT_MODEL;
  elements.apiForm.temperature.value = state.settings.temperature ?? 0.7;
  elements.apiForm.maxTokens.value = state.settings.maxTokens ?? 900;
  elements.apiForm.useApi.checked = Boolean(state.settings.useApi);
  setApiStatus(state.settings.apiStatus || "サーバー側 Command R+ 未接続", false, state.settings.useApi);
}

function setApiStatus(message, isError = false, isSuccess = false) {
  elements.apiStatus.textContent = message;
  elements.apiStatus.classList.toggle("error", Boolean(isError));
  elements.apiStatus.classList.toggle("success", Boolean(isSuccess));
}

function fillCharacterTargetOptions() {
  elements.editorCharacterSelect.innerHTML = state.characters
    .map((character) => {
      const suffix = SAMPLE_CHARACTER_IDS.has(character.id) ? "" : " [Custom]";
      return `<option value="${escapeHtml(character.id)}">${escapeHtml(character.name)}${suffix}</option>`;
    })
    .join("");
  elements.editorCharacterSelect.value = state.editorCharacterId;
}

function renderCharacterEditorActions() {
  const current = getEditorCharacter();
  const isProtected = !current || SAMPLE_CHARACTER_IDS.has(current.id);
  elements.deleteCharacter.disabled = isProtected;
  elements.deleteCharacter.title = isProtected ? "このキャラは削除できません" : "";
  elements.resetCharacter.textContent = SAMPLE_CHARACTER_IDS.has(current?.id)
    ? "初期状態に戻す"
    : "空の状態に戻す";
}

function fillCharacterForm(character) {
  const form = elements.characterForm;
  form.name.value = character.name;
  form.title.value = character.title;
  form.age.value = character.age;
  form.gender.value = character.gender;
  form.firstPerson.value = character.firstPerson;
  form.secondPerson.value = character.secondPerson;
  form.archetype.value = character.archetype;
  form.faction.value = character.faction;
  form.tone.value = character.tone;
  form.personality.value = character.personality;
  form.ability.value = character.ability;
  form.style.value = character.style;
  form.weakness.value = character.weakness;
  form.ultimate.value = character.ultimate;
  form.origin.value = character.origin;
  form.likes.value = character.likes;
  form.dislikes.value = character.dislikes;
  form.hobbies.value = character.hobbies;
  form.mannerisms.value = character.mannerisms;
  form.favoritePhrase.value = character.favoritePhrase;
  form.hatedPhrase.value = character.hatedPhrase;
  form.angerReaction.value = character.angerReaction;
  form.praiseReaction.value = character.praiseReaction;
  form.tauntReaction.value = character.tauntReaction;
  form.gratitudeStyle.value = character.gratitudeStyle;
  form.defeatStyle.value = character.defeatStyle;
  form.victoryStyle.value = character.victoryStyle;
  form.snsHandle.value = character.snsHandle || "";
  form.snsBio.value = character.snsBio || "";
  form.notes.value = character.notes;
  form.atk.value = character.stats.atk;
  form.spd.value = character.stats.spd;
  form.mind.value = character.stats.mind;
  form.charm.value = character.stats.charm;
}

function formCharacterFromEditor() {
  const form = new FormData(elements.characterForm);
  const base = getEditorCharacter();

  return {
    ...base,
    id: state.editorCharacterId,
    name: (form.get("name") || "").toString(),
    title: (form.get("title") || "").toString(),
    age: (form.get("age") || "").toString(),
    gender: (form.get("gender") || "").toString(),
    firstPerson: (form.get("firstPerson") || "").toString(),
    secondPerson: (form.get("secondPerson") || "").toString(),
    archetype: (form.get("archetype") || "cool").toString(),
    faction: (form.get("faction") || "").toString(),
    tone: (form.get("tone") || "").toString(),
    personality: (form.get("personality") || "").toString(),
    ability: (form.get("ability") || "").toString(),
    style: (form.get("style") || "").toString(),
    weakness: (form.get("weakness") || "").toString(),
    ultimate: (form.get("ultimate") || "").toString(),
    origin: (form.get("origin") || "").toString(),
    likes: (form.get("likes") || "").toString(),
    dislikes: (form.get("dislikes") || "").toString(),
    hobbies: (form.get("hobbies") || "").toString(),
    mannerisms: (form.get("mannerisms") || "").toString(),
    favoritePhrase: (form.get("favoritePhrase") || "").toString(),
    hatedPhrase: (form.get("hatedPhrase") || "").toString(),
    angerReaction: (form.get("angerReaction") || "").toString(),
    praiseReaction: (form.get("praiseReaction") || "").toString(),
    tauntReaction: (form.get("tauntReaction") || "").toString(),
    gratitudeStyle: (form.get("gratitudeStyle") || "").toString(),
    defeatStyle: (form.get("defeatStyle") || "").toString(),
    victoryStyle: (form.get("victoryStyle") || "").toString(),
    snsHandle: (form.get("snsHandle") || "").toString(),
    snsBio: (form.get("snsBio") || "").toString(),
    notes: (form.get("notes") || "").toString(),
    imageDataUrl: base.imageDataUrl || "",
    snsImageDataUrl: base.snsImageDataUrl || "",
    chatImageDataUrl: base.chatImageDataUrl || "",
    stats: {
      atk: Number(form.get("atk")) || 60,
      spd: Number(form.get("spd")) || 60,
      mind: Number(form.get("mind")) || 60,
      charm: Number(form.get("charm")) || 60,
    },
  };
}

function getCharacterSnsIcon(character) {
  return character?.snsImageDataUrl || character?.imageDataUrl || "";
}

function getCharacterChatIcon(character) {
  return character?.chatImageDataUrl || character?.snsImageDataUrl || character?.imageDataUrl || "";
}

function renderAvatarMarkup(src, label, variant = "default") {
  const safeLabel = escapeHtml(label || "icon");
  const content = src
    ? `<img src="${src}" alt="${safeLabel}">`
    : `<span>${safeLabel.slice(0, 2)}</span>`;
  return `<div class="avatar-shell ${variant}">${content}</div>`;
}

function renderCharacterImage(character) {
  elements.characterImagePreview.innerHTML = character.imageDataUrl
    ? `<img src="${character.imageDataUrl}" alt="${escapeHtml(character.name)}">`
    : "<span>NO IMAGE</span>";
  elements.characterSnsImagePreview.innerHTML = getCharacterSnsIcon(character)
    ? `<img src="${getCharacterSnsIcon(character)}" alt="${escapeHtml(character.name)} SNS icon">`
    : "<span>SNS</span>";
  elements.characterChatImagePreview.innerHTML = getCharacterChatIcon(character)
    ? `<img src="${getCharacterChatIcon(character)}" alt="${escapeHtml(character.name)} chat icon">`
    : "<span>CHAT</span>";
}

function renderCharacterPreview(character) {
  const voice = archetypeVoices[character.archetype] || archetypeVoices.cool;
  const techniquePreview = character.techniques.length
    ? character.techniques.map((technique) => technique.name).join(" / ")
    : "未登録";
  elements.characterPreview.innerHTML = `
    <h3>${escapeHtml(character.name)}${character.title ? ` / ${escapeHtml(character.title)}` : ""}</h3>
    <p>${escapeHtml(character.personality || voice.descriptor)}</p>
    <p><strong>所属:</strong> ${escapeHtml(character.faction || "未設定")}</p>
    <p><strong>能力:</strong> ${escapeHtml(character.ability || "未設定")}</p>
    <p><strong>戦闘:</strong> ${escapeHtml(character.style || "未設定")}</p>
    <p><strong>奥義:</strong> ${escapeHtml(character.ultimate || "未設定")}</p>
    <p><strong>技:</strong> ${escapeHtml(techniquePreview)}</p>
    <p><strong>備考:</strong> ${escapeHtml(character.notes || "なし")}</p>
    <p><strong>サンプル台詞:</strong> 「${escapeHtml(character.gratitudeStyle || voice.thanks)}」</p>
  `;
}

function renderTechniqueBuilder(character) {
  const currentTechnique = state.editorTechniqueIndex >= 0 ? character.techniques[state.editorTechniqueIndex] : null;
  elements.techniqueNameInput.value = currentTechnique?.name || "";
  elements.techniqueTypeInput.value = currentTechnique?.type || "";
  elements.techniqueAliasesInput.value = currentTechnique?.aliases || "";
  elements.techniqueStaminaInput.value = currentTechnique?.staminaCost ?? 10;
  elements.techniquePowerInput.value = currentTechnique?.power ?? 4;
  elements.techniqueEffectInput.value = currentTechnique?.effect || "";
  elements.techniqueDescriptionInput.value = currentTechnique?.description || "";
  elements.saveTechnique.textContent = state.editorTechniqueIndex >= 0 ? "技を更新" : "技を登録";
}

function renderTechniqueList(character) {
  if (!character.techniques.length) {
    elements.techniqueList.innerHTML = `<div class="technique-card"><strong>技なし</strong><div>まだ技は登録されていません。</div></div>`;
    return;
  }

  elements.techniqueList.innerHTML = character.techniques
    .map((technique, index) => `
      <article class="technique-card">
        <div class="section-header compact">
          <div>
            <h3>${escapeHtml(technique.name)}</h3>
            <p class="memory-meta">${escapeHtml(technique.type || "未分類")}</p>
          </div>
        </div>
        <div class="technique-meta">
          <span class="technique-tag">消費 ${technique.staminaCost}</span>
          <span class="technique-tag">威力補正 ${technique.power}</span>
          ${technique.aliases ? `<span class="technique-tag">別名 ${escapeHtml(technique.aliases)}</span>` : ""}
        </div>
        <p><strong>効果:</strong> ${escapeHtml(technique.effect || "未設定")}</p>
        <p><strong>演出メモ:</strong> ${escapeHtml(technique.description || "未設定")}</p>
        <div class="technique-actions">
          <button class="secondary-btn" type="button" data-technique-action="edit" data-technique-index="${index}">編集</button>
          <button class="secondary-btn" type="button" data-technique-action="delete" data-technique-index="${index}">削除</button>
        </div>
      </article>
    `)
    .join("");
}

function saveTechniqueFromEditor() {
  const character = getEditorCharacter();
  const name = elements.techniqueNameInput.value.trim();
  if (!name) {
    appendSystemNotice("技名を入れてください。");
    return;
  }

  const technique = makeTechnique({
    id: state.editorTechniqueIndex >= 0 ? character.techniques[state.editorTechniqueIndex]?.id : createId(),
    name,
    type: elements.techniqueTypeInput.value.trim(),
    aliases: elements.techniqueAliasesInput.value.trim(),
    staminaCost: Number(elements.techniqueStaminaInput.value) || 0,
    power: Number(elements.techniquePowerInput.value) || 0,
    effect: elements.techniqueEffectInput.value.trim(),
    description: elements.techniqueDescriptionInput.value.trim(),
  });

  const techniques = [...character.techniques];
  if (state.editorTechniqueIndex >= 0 && techniques[state.editorTechniqueIndex]) {
    techniques[state.editorTechniqueIndex] = technique;
  } else {
    techniques.push(technique);
  }

  updateCharacter(character.id, { ...character, techniques });
  state.editorTechniqueIndex = -1;
  saveState();
  renderAll();
}

function renderEnemyRoster() {
  const enemies = getBattleOpponents();
  elements.battleEnemySelect.innerHTML = enemies
    .map((enemy) => `<option value="${escapeHtml(enemy.id)}">${escapeHtml(enemy.name)}${enemy.isCommunity ? " [公開]" : ""}</option>`)
    .join("");
  elements.battleEnemySelect.value = state.selectedEnemyId;

  elements.enemyRoster.innerHTML = enemies
    .map((enemy) => {
      const relation = getRelation("player", enemy.id);
      const selectedClass = state.selectedEnemyId === enemy.id ? "selected" : "";
      return `
        <button class="enemy-option ${selectedClass}" data-enemy-id="${escapeHtml(enemy.id)}">
          <strong>${escapeHtml(enemy.name)}</strong>
          <div>${escapeHtml(enemy.title || enemy.ability)}${enemy.isCommunity ? ` / 公開元 ${escapeHtml(enemy.profileName || "匿名オーナー")}` : ""}</div>
          <small>${escapeHtml(relation.title)} / 友情 ${relation.friendship} / 因縁 ${relation.rivalry}</small>
        </button>
      `;
    })
    .join("");

  [...elements.enemyRoster.querySelectorAll(".enemy-option")].forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedEnemyId = button.dataset.enemyId;
      saveState();
      renderAll();
    });
  });

  const enemy = getCharacter(state.selectedEnemyId);
  const relation = getRelation("player", enemy.id);
  elements.battleMatchupBanner.innerHTML = `
    <strong>${escapeHtml(getPlayer().name)}</strong>
    <span> VS </span>
    <strong>${escapeHtml(enemy.name)}</strong>
    <div class="memory-meta">${escapeHtml(relation.title)} / 友情 ${relation.friendship} / 因縁 ${relation.rivalry} / 尊敬 ${relation.respect}</div>
  `;
  elements.battleMeta.innerHTML = `
    <li><strong>現在の相手:</strong> ${escapeHtml(enemy.name)}</li>
    <li><strong>関係:</strong> ${escapeHtml(relation.title)}</li>
    <li><strong>最後の記憶:</strong> ${escapeHtml(relation.lastMemory)}</li>
    <li><strong>AI演出:</strong> ${escapeHtml(getAiModeText())}</li>
  `;
}

function renderBattle() {
  const player = getPlayer();
  const enemy = getCharacter(state.selectedEnemyId);
  const battle = state.battle;
  elements.battleAiMode.textContent = getAiModeText();

  if (!enemy) {
    elements.playerCard.innerHTML = renderFighterCard(player, null);
    elements.enemyCard.innerHTML = `<strong>対戦相手なし</strong><div>キャラを追加して相手を選んでください。</div>`;
    elements.battleLog.innerHTML = `
      <div class="log-entry system">
        <strong>待機中</strong>
        <div>対戦相手がいません。キャラ編集からキャラを追加するか、既存キャラを選んでください。</div>
      </div>
    `;
    elements.heatMeter.textContent = "HEAT 0";
    elements.intervalBanner.classList.add("hidden");
    elements.battleSubmit.disabled = true;
    return;
  }

  if (!battle) {
    elements.playerCard.innerHTML = renderFighterCard(player, null);
    elements.enemyCard.innerHTML = renderFighterCard(enemy, null);
    elements.battleLog.innerHTML = `
      <div class="log-entry system">
        <strong>待機中</strong>
        <div>相手を選んで「バトル開始」を押すと、前半から試合が始まります。</div>
      </div>
    `;
    elements.heatMeter.textContent = "HEAT 0";
    elements.intervalBanner.classList.add("hidden");
    elements.battleSubmit.disabled = false;
    return;
  }

  const battleEnemy = getCharacter(battle.enemyId);
  elements.playerCard.innerHTML = renderFighterCard(player, battle.playerState);
  elements.enemyCard.innerHTML = renderFighterCard(battleEnemy, battle.enemyState);
  elements.battleLog.innerHTML = battle.logs.map(renderLog).join("");
  elements.heatMeter.textContent = `HEAT ${battle.heat}`;
  elements.battleSubmit.disabled = Boolean(battle.pending || battle.finished || battle.intervalPending);

  if (battle.intervalPending) {
    renderIntervalChoices();
    elements.intervalBanner.classList.remove("hidden");
  } else {
    elements.intervalBanner.classList.add("hidden");
  }
}

function renderRelationshipChat() {
  const actor = getChatActorCharacter();
  const contacts = state.characters.filter((character) => character.id !== state.chatActorId);
  elements.chatContactList.innerHTML = contacts
    .map((character) => {
      const relation = getRelation(state.chatActorId, character.id);
      const thread = getChatThread(state.chatActorId, character.id);
      const lastMessage = thread.at(-1);
      const activeClass = state.chatSelectedId === character.id ? "active" : "";
      return `
        <button class="chat-contact ${activeClass}" data-chat-target="${escapeHtml(character.id)}">
          <div class="chat-contact-avatar">
            ${renderAvatarMarkup(getCharacterChatIcon(character), character.name, "contact")}
          </div>
          <div class="chat-contact-top">
            <strong>${escapeHtml(character.name)}</strong>
            <span class="badge">${escapeHtml(relation.title)}</span>
          </div>
          <div class="chat-contact-preview">${escapeHtml(lastMessage?.text || "まだ会話していません。")}</div>
        </button>
      `;
    })
    .join("");

  const target = getChatTargetCharacter();
  if (!actor || !target) {
    elements.chatThreadHeader.innerHTML = "<h3>会話相手がいません</h3>";
    elements.chatThread.innerHTML = "";
    elements.chatSend.disabled = true;
    return;
  }

  const relation = getRelation(actor.id, target.id);
  const thread = getChatThread(actor.id, target.id);
  elements.chatThreadHeader.innerHTML = `
    <p class="eyebrow">LINE-like Relationship Chat</p>
    <div class="chat-thread-identity">
      ${renderAvatarMarkup(getCharacterChatIcon(target), target.name, "thread-header")}
      <div>
        <h2>${escapeHtml(actor.name)} → ${escapeHtml(target.name)}</h2>
        <p>${escapeHtml(relation.title)} / 友情 ${relation.friendship} / 因縁 ${relation.rivalry} / 尊敬 ${relation.respect} / 警戒 ${relation.caution}</p>
      </div>
    </div>
  `;
  elements.chatThread.innerHTML = renderChatThread(thread, actor, target);
  elements.chatSend.disabled = false;
}

function fillChatParticipants() {
  ensureChatPairState();
  elements.chatActorSelect.innerHTML = state.characters
    .map((character) => `<option value="${escapeHtml(character.id)}">${escapeHtml(character.name)}</option>`)
    .join("");
  elements.chatActorSelect.value = state.chatActorId;

  const targets = state.characters.filter((character) => character.id !== state.chatActorId);
  elements.chatTargetSelect.innerHTML = targets
    .map((character) => `<option value="${escapeHtml(character.id)}">${escapeHtml(character.name)}</option>`)
    .join("");
  elements.chatTargetSelect.value = state.chatSelectedId;
}

function renderChatThread(thread, actor, target) {
  if (!thread.length) {
    return `<div class="chat-dayline">まだ会話はありません</div>`;
  }

  const items = [];
  let lastDay = "";
  thread.forEach((message) => {
    const day = formatChatDay(message.timestamp);
    if (day !== lastDay) {
      items.push(`<div class="chat-dayline">${escapeHtml(day)}</div>`);
      lastDay = day;
    }
    const isActorLine = message.sender === "user";
    const speaker = isActorLine
      ? (getCharacter(message.speakerId) || actor)
      : (getCharacter(message.speakerId) || target);
    const icon = isActorLine ? getCharacterChatIcon(speaker || actor) : getCharacterChatIcon(speaker || target);
    items.push(`
      <article class="chat-line ${isActorLine ? "user" : "character"}">
        ${renderAvatarMarkup(icon, speaker?.name || "icon", "thread")}
        <div class="chat-bubble ${isActorLine ? "user" : "character"}">
          <div>${escapeHtml(message.text)}</div>
          <span class="chat-bubble-meta">${escapeHtml((message.speakerName || speaker?.name || "") + " / " + formatTimeOnly(message.timestamp))}</span>
        </div>
      </article>
    `);
  });
  return items.join("");
}

function fillCharaverseComposer() {
  elements.charaverseAuthorSelect.innerHTML = state.characters
    .map((character) => `<option value="${escapeHtml(character.id)}">${escapeHtml(character.name)}</option>`)
    .join("");
  elements.charaverseGenreSelect.innerHTML = charaverseGenres
    .map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`)
    .join("");
  elements.charaverseMoodSelect.innerHTML = charaverseMoods
    .map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`)
    .join("");

  if (!getCharacter(state.charaverseComposer.authorId)) {
    state.charaverseComposer.authorId = "player";
  }

  elements.charaverseAuthorSelect.value = state.charaverseComposer.authorId;
  elements.charaverseGenreSelect.value = state.charaverseComposer.genre;
  elements.charaverseMoodSelect.value = state.charaverseComposer.mood;
  elements.charaverseSharePublic.checked = Boolean(state.charaverseComposer.sharePublic);
}

async function renderCharaversePreview(forceAi = false) {
  const author = getCharacter(elements.charaverseAuthorSelect.value || state.charaverseComposer.authorId || "player");
  const rawInput = String(elements.charaverseRawInput.value || "").trim();
  const genre = elements.charaverseGenreSelect.value || state.charaverseComposer.genre;
  const mood = elements.charaverseMoodSelect.value || state.charaverseComposer.mood;

  state.charaverseComposer.authorId = author?.id || "player";
  state.charaverseComposer.genre = genre;
  state.charaverseComposer.mood = mood;

  if (!author) {
    elements.charaversePreview.innerHTML = "<p>投稿キャラを選んでください。</p>";
    return;
  }

  if (!rawInput) {
    elements.charaversePreview.innerHTML = `<p><strong>${escapeHtml(author.name)}</strong> として投稿する内容を入力すると、ここにキャラバース風のプレビューが出ます。</p>`;
    return;
  }

  let preview = null;
  if (forceAi && canUseApi()) {
    try {
      preview = await generateAiCharaversePost({ author, rawInput, genre, mood });
    } catch (error) {
      state.settings.apiStatus = `キャラバース投稿はローカル変換へ切替: ${error.message}`;
    }
  }

  if (!preview) {
    preview = generateLocalCharaversePost(author, rawInput, genre, mood);
  }

  elements.charaversePreview.innerHTML = `
    <p class="eyebrow">Preview</p>
    <strong>${escapeHtml(author.name)} / ${escapeHtml(resolveCharaverseLabel(genre))}</strong>
    <div>${escapeHtml(preview.postText)}</div>
    <div class="charaverse-post-meta">
      ${(preview.tags || []).map((tag) => `<span class="charaverse-tag">#${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderCharaverseTimeline() {
  const posts = [...getMergedCharaversePosts()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (!posts.length) {
    elements.charaverseTimeline.innerHTML = `<div class="charaverse-post-card"><strong>まだ投稿がありません</strong><div>最初のキャラバース投稿を作ると、ここにキャラたちの生活が流れ始めます。</div></div>`;
    return;
  }

  elements.charaverseTimeline.innerHTML = posts
    .map((post) => renderCharaversePost(post))
    .join("");
}

function renderCharaverseComments(post) {
  const comments = post.comments || [];
  const byParent = new Map();
  comments.forEach((comment) => {
    const parentKey = comment.parentCommentId || "root";
    if (!byParent.has(parentKey)) {
      byParent.set(parentKey, []);
    }
    byParent.get(parentKey).push(comment);
  });

  const renderBranch = (parentId = "root", depth = 0) => {
    const branch = byParent.get(parentId) || [];
    return branch.map((comment) => {
      const commenter = getCharacter(comment.commenterId) || comment.commenterSnapshot || null;
      const replies = renderBranch(comment.id, depth + 1);
      return `
        <div class="charaverse-comment depth-${Math.min(depth, 3)}">
          <button class="avatar-button" type="button" data-profile-open="true" data-profile-role="commenter" data-post-id="${escapeHtml(post.id)}" data-comment-id="${escapeHtml(comment.id)}">
            ${renderAvatarMarkup(getCharacterSnsIcon(commenter), commenter?.name || "誰か", "sns-comment")}
          </button>
          <div class="charaverse-comment-body">
            <strong>${escapeHtml(commenter?.name || "誰か")}</strong>
            ${comment.replyToName ? `<div class="memory-meta">@${escapeHtml(comment.replyToName)} への返信</div>` : ""}
            <div>${escapeHtml(comment.text)}</div>
            <div class="charaverse-comment-tools">
              <span class="chat-bubble-meta">${escapeHtml(formatTimeOnly(comment.timestamp || new Date().toISOString()))}</span>
              <button class="secondary-btn tiny-btn" type="button" data-charaverse-reply="${escapeHtml(comment.id)}" data-charaverse-reply-post="${escapeHtml(post.id)}">リプライ</button>
            </div>
            ${replies ? `<div class="charaverse-comment-children">${replies}</div>` : ""}
          </div>
        </div>
      `;
    }).join("");
  };

  return renderBranch();
}

function renderCharaversePost(post) {
  const author = getCharacter(post.authorId) || post.authorSnapshot || null;
  const isCommunityPost = post.scope === "community";
  const participantOptions = state.characters
    .filter((character) => character.id !== (author?.id || post.authorId))
    .map((character) => `<option value="${escapeHtml(character.id)}">${escapeHtml(character.name)}</option>`)
    .join("");
  const reactions = (post.reactions || [])
    .map((reaction) => {
      const reactor = getCharacter(reaction.reactorId);
      return `<span class="charaverse-reaction-chip">${escapeHtml(reactor?.name || "誰か")}「${escapeHtml(reaction.reactionLabel)}」</span>`;
    })
    .join("");
  const comments = renderCharaverseComments(post);
  const replyContext = state.charaverseReplyContext && state.charaverseReplyContext.postId === post.id
    ? state.charaverseReplyContext
    : null;

  return `
    <article class="charaverse-post-card ${isCommunityPost ? "community" : ""}">
      <div class="charaverse-post-head">
        <button class="avatar-button" type="button" data-profile-open="true" data-profile-role="author" data-post-id="${escapeHtml(post.id)}">
          ${renderAvatarMarkup(getCharacterSnsIcon(author), author?.name || "不明", "sns-post")}
        </button>
        <div class="charaverse-post-identity">
          <strong>${escapeHtml(author?.name || "不明")}</strong>
          ${(author?.snsHandle || post.authorSnapshot?.snsHandle) ? `<div class="charaverse-profile-handle">${escapeHtml(author?.snsHandle || post.authorSnapshot?.snsHandle)}</div>` : ""}
          <div class="charaverse-post-head-meta">
            <span class="badge">${escapeHtml(resolveCharaverseLabel(post.genre))}</span>
            <span class="community-pill">${isCommunityPost ? "PUBLIC" : "LOCAL"}</span>
            <span class="memory-meta">${escapeHtml(formatTimeOnly(post.timestamp))}</span>
          </div>
        </div>
      </div>
      ${isCommunityPost ? `<div class="community-readonly">公開元: ${escapeHtml(post.profileName || "匿名オーナー")}</div>` : ""}
      <div>${escapeHtml(post.postText)}</div>
      <div class="charaverse-post-meta">
        ${(post.tags || []).map((tag) => `<span class="charaverse-tag">#${escapeHtml(tag)}</span>`).join("")}
      </div>
      ${isCommunityPost ? `
        <div class="charaverse-actions">
          <select class="charaverse-inline-select" data-charaverse-actor="${escapeHtml(post.id)}">
            ${participantOptions}
          </select>
          <span class="community-readonly">公開投稿です。コメントすると、ほかの人にも見える形で残ります。</span>
        </div>
      ` : `
        <div class="charaverse-actions">
          <select class="charaverse-inline-select" data-charaverse-actor="${escapeHtml(post.id)}">
            ${participantOptions}
          </select>
          <button class="secondary-btn" type="button" data-charaverse-like="${escapeHtml(post.id)}">いいねする</button>
          <button class="secondary-btn" type="button" data-charaverse-delete="${escapeHtml(post.id)}">投稿を削除</button>
        </div>
      `}
      ${reactions ? `<div class="charaverse-reactions">${reactions}</div>` : ""}
      ${isCommunityPost ? `
        <div class="charaverse-comment-box">
          ${replyContext ? `
            <div class="reply-context-pill">
              <span>@${escapeHtml(replyContext.targetName)} への返信</span>
              <button class="secondary-btn tiny-btn" type="button" data-charaverse-reply-cancel="true">解除</button>
            </div>
          ` : ""}
          <textarea rows="3" data-charaverse-comment-input="${escapeHtml(post.id)}" placeholder="親の入力：この公開投稿へのコメント内容"></textarea>
          <div class="charaverse-manual-tools">
            <button class="primary-btn" type="button" data-charaverse-comment="${escapeHtml(post.id)}">公開コメント送信</button>
          </div>
        </div>
      ` : `
        <div class="charaverse-comment-box">
          ${replyContext ? `
            <div class="reply-context-pill">
              <span>@${escapeHtml(replyContext.targetName)} への返信</span>
              <button class="secondary-btn tiny-btn" type="button" data-charaverse-reply-cancel="true">解除</button>
            </div>
          ` : ""}
          <textarea rows="3" data-charaverse-comment-input="${escapeHtml(post.id)}" placeholder="親の入力：この投稿へのコメント内容"></textarea>
          <div class="charaverse-manual-tools">
            <button class="primary-btn" type="button" data-charaverse-comment="${escapeHtml(post.id)}">コメント送信</button>
          </div>
        </div>
      `}
      ${comments ? `<div class="charaverse-comments">${comments}</div>` : ""}
    </article>
  `;
}

async function createCharaversePost() {
  const authorId = elements.charaverseAuthorSelect.value || state.charaverseComposer.authorId || "player";
  const author = getCharacter(authorId);
  const rawInput = String(elements.charaverseRawInput.value || "").trim();
  const genre = elements.charaverseGenreSelect.value || state.charaverseComposer.genre;
  const mood = elements.charaverseMoodSelect.value || state.charaverseComposer.mood;
  const sharePublic = elements.charaverseSharePublic.checked;

  if (!author || !rawInput) {
    return;
  }

  let generated = null;
  if (canUseApi()) {
    try {
      generated = await generateAiCharaversePost({ author, rawInput, genre, mood });
      state.settings.apiStatus = `キャラバース生成: ${state.settings.model}`;
    } catch (error) {
      state.settings.apiStatus = `キャラバース投稿はローカル変換へ切替: ${error.message}`;
    }
  }
  if (!generated) {
    generated = generateLocalCharaversePost(author, rawInput, genre, mood);
  }

  const post = {
    id: createId(),
    scope: "local",
    authorId: author.id,
    authorSnapshot: buildPostAuthorSnapshot(author),
    genre,
    mood,
    rawInput,
    postText: generated.postText,
    tags: generated.tags || [],
    emotion: generated.emotion || mood,
    timestamp: new Date().toISOString(),
    reactions: [],
    comments: [],
  };

  runCharaverseAutoActivity(post);
  state.charaversePosts.unshift(post);
  state.charaversePosts = state.charaversePosts.slice(0, 40);
  saveMemory(author.id, `キャラバース投稿: ${author.name}`, `${author.name}が「${resolveCharaverseLabel(genre)}」の投稿をした。`);
  elements.charaverseRawInput.value = "";
  state.charaverseComposer.sharePublic = sharePublic;

  if (sharePublic) {
    await publishCharaversePost(post, author);
  }

  saveState();
  renderAll();
  switchView("charaverse");
}

function buildPostAuthorSnapshot(character) {
  return {
    id: character.id,
    name: character.name,
    title: character.title,
    archetype: character.archetype,
    tone: character.tone,
    faction: character.faction,
    snsHandle: character.snsHandle || "",
    snsBio: character.snsBio || "",
    imageDataUrl: character.imageDataUrl || "",
    snsImageDataUrl: character.snsImageDataUrl || "",
    chatImageDataUrl: character.chatImageDataUrl || "",
  };
}

function getMergedCharaversePosts() {
  return [
    ...(state.charaversePosts || []).map((post) => ({ ...post, scope: post.scope || "local" })),
    ...(state.communityPosts || []).map((post) => ({ ...post, scope: "community" })),
  ];
}

function buildCommunityCharacter(entry) {
  return makeCharacter({
    ...(entry.character || {}),
    id: `community:${entry.id}`,
    sourceCharacterId: entry.sourceCharacterId,
    communityEntryId: entry.id,
    profileId: entry.profileId,
    profileName: entry.profileName,
    publishedAt: entry.publishedAt,
    isCommunity: true,
  });
}

function buildCommunityPost(entry) {
  return {
    id: `community:${entry.id}`,
    communityEntryId: entry.id,
    scope: "community",
    profileId: entry.profileId,
    profileName: entry.profileName,
    publishedAt: entry.publishedAt,
    authorId: entry.authorId ? `community-post-author:${entry.id}:${entry.authorId}` : "",
    authorSnapshot: entry.authorSnapshot || null,
    genre: entry.genre || "daily",
    mood: entry.mood || "bright",
    rawInput: entry.rawInput || "",
    postText: entry.postText || "",
    tags: entry.tags || [],
    timestamp: entry.timestamp || entry.publishedAt || new Date().toISOString(),
    reactions: [],
    comments: Array.isArray(entry.comments) ? entry.comments : [],
  };
}

async function syncCommunitySnapshot(showSuccess = false) {
  try {
    const payload = await fetchJson(COMMUNITY_SNAPSHOT_URL);
    const allCharacters = payload.characters || [];
    const allPosts = payload.posts || [];
    const remoteCharacters = allCharacters.filter((entry) => entry.profileId !== state.communityProfileId);
    const ownPosts = allPosts.filter((entry) => entry.profileId === state.communityProfileId);
    const remotePosts = allPosts.filter((entry) => entry.profileId !== state.communityProfileId);
    ownPosts.forEach((entry) => mergeOwnPublishedPost(entry));
    state.communityCharacters = remoteCharacters.map((entry) => buildCommunityCharacter(entry));
    state.communityPosts = remotePosts.map((entry) => buildCommunityPost(entry));
    state.communityFeedStatus = showSuccess || !state.communityFeedStatus || /読み込み前|失敗/.test(state.communityFeedStatus)
      ? `公開投稿: ${state.communityPosts.length}件 / 公開キャラ: ${state.communityCharacters.length}体`
      : state.communityFeedStatus;
    saveState();
    renderAll();
  } catch (error) {
    state.communityFeedStatus = `公開投稿の取得に失敗: ${error.message}`;
    saveState();
    renderCommunityStatus();
  }
}

async function publishCurrentCharacter() {
  const character = getEditorCharacter();
  if (!character) {
    return;
  }

  try {
    await postJson(COMMUNITY_PUBLISH_CHARACTER_URL, {
      profileId: state.communityProfileId,
      profileName: getCommunityProfileName(),
      character,
    });
    state.communityStatus = `${character.name} を公開しました`;
    await syncCommunitySnapshot(true);
    saveState();
    renderAll();
  } catch (error) {
    state.communityStatus = `公開失敗: ${error.message}`;
    saveState();
    renderCommunityStatus();
  }
}

async function publishCharaversePost(post, author) {
  try {
    const payload = await postJson(COMMUNITY_PUBLISH_POST_URL, {
      profileId: state.communityProfileId,
      profileName: getCommunityProfileName(),
      post: {
        authorId: author.id,
        authorSnapshot: buildPostAuthorSnapshot(author),
        genre: post.genre,
        mood: post.mood,
        rawInput: post.rawInput,
        postText: post.postText,
        tags: post.tags,
        timestamp: post.timestamp,
      },
    });
    if (payload?.entry?.id) {
      post.communityEntryId = payload.entry.id;
    }
    state.communityStatus = `${author.name} の投稿を公開しました`;
    await syncCommunitySnapshot(true);
  } catch (error) {
    state.communityStatus = `投稿の公開失敗: ${error.message}`;
  }
}

function mergeOwnPublishedPost(entry) {
  const localPost = (state.charaversePosts || []).find((post) =>
    post.communityEntryId === entry.id
    || (
      post.authorId === entry.authorId
      && post.timestamp === entry.timestamp
      && post.postText === entry.postText
    )
  );
  if (!localPost) {
    return;
  }
  localPost.communityEntryId = entry.id;
  localPost.comments = Array.isArray(entry.comments) ? entry.comments : localPost.comments || [];
}

function getCommunityProfileName() {
  if (state.communityProfileName && state.communityProfileName !== "匿名オーナー") {
    return state.communityProfileName;
  }
  const player = getPlayer();
  state.communityProfileName = `${player?.name || "匿名"}の親`;
  return state.communityProfileName;
}

function getCharaversePost(postId) {
  return (state.charaversePosts || []).find((post) => post.id === postId) || null;
}

function getCommunityCharaversePost(postId) {
  return (state.communityPosts || []).find((post) => post.id === postId) || null;
}

function getAnyCharaversePost(postId) {
  return getCharaversePost(postId) || getCommunityCharaversePost(postId);
}

function findCommentInPost(post, commentId) {
  return (post?.comments || []).find((comment) => comment.id === commentId) || null;
}

function handleProfileOpen(trigger) {
  const post = getAnyCharaversePost(trigger.dataset.postId || "");
  if (!post) return;

  if (trigger.dataset.profileRole === "author") {
    const author = getPostAuthorCharacter(post);
    openCharaverseProfile(buildProfileDescriptor({
      key: getPostAuthorProfileKey(post),
      character: author,
      post,
      snapshot: post.authorSnapshot || null,
      profileName: post.profileName || "",
      profileId: post.profileId || "",
    }));
    return;
  }

  const comment = findCommentInPost(post, trigger.dataset.commentId || "");
  if (!comment) return;
  const commenter = getCharacter(comment.commenterId) || comment.commenterSnapshot || null;
  openCharaverseProfile(buildProfileDescriptor({
    key: getCommenterProfileKey(post, comment),
    character: commenter,
    snapshot: comment.commenterSnapshot || null,
    profileName: comment.profileName || post.profileName || "",
    profileId: comment.profileId || post.profileId || "",
  }));
}

function getPostAuthorCharacter(post) {
  if (!post) return null;
  const author = getCharacter(post.authorId);
  if (author) return author;
  const snapshot = post.authorSnapshot || {};
  const derivedId = post.scope === "community"
    ? `community-author:${post.communityEntryId || post.id}:${snapshot.id || "author"}`
    : (snapshot.id || post.authorId || `author:${post.id}`);
  return makeCharacter({
    id: derivedId,
    name: snapshot.name || "不明",
    title: snapshot.title || "",
    archetype: snapshot.archetype || "cool",
    tone: snapshot.tone || "",
    faction: snapshot.faction || "",
    snsHandle: snapshot.snsHandle || "",
    snsBio: snapshot.snsBio || "",
    imageDataUrl: snapshot.imageDataUrl || "",
    snsImageDataUrl: snapshot.snsImageDataUrl || "",
    chatImageDataUrl: snapshot.chatImageDataUrl || "",
  });
}

function deleteCharaversePost(postId) {
  state.charaversePosts = (state.charaversePosts || []).filter((post) => post.id !== postId);
  saveState();
  renderAll();
}

async function handleCharaverseLike(postId) {
  const post = getCharaversePost(postId);
  if (!post) return;
  const actorSelect = document.querySelector(`[data-charaverse-actor="${postId}"]`);
  const reactor = getCharacter(actorSelect?.value || "");
  const author = getCharacter(post.authorId);
  if (!reactor || !author || reactor.id === author.id) return;

  const relation = getRelation(reactor.id, author.id);
  const reaction = buildCharaverseReaction(reactor, author, relation, post, "like");
  post.reactions = (post.reactions || []).filter((item) => item.reactorId !== reactor.id);
  post.reactions.push(reaction);
  applyRelationDelta(relation, reaction.delta);
  relation.title = resolveRelationshipTitle(relation);
  relation.lastMemory = reaction.memory;
  saveMemory(author.id, `キャラバースいいね: ${reactor.name}`, reaction.memory);
  saveState();
  renderAll();
}

async function handleCharaverseManualComment(postId) {
  const post = getAnyCharaversePost(postId);
  if (!post) return;
  const actorSelect = document.querySelector(`[data-charaverse-actor="${postId}"]`);
  const input = document.querySelector(`[data-charaverse-comment-input="${postId}"]`);
  const commenter = getCharacter(actorSelect?.value || "");
  const author = getPostAuthorCharacter(post);
  const rawInput = String(input?.value || "").trim();
  if (!commenter || !author || !rawInput || commenter.id === author.id) return;

  const relation = getRelation(commenter.id, author.id);
  let text = "";
  if (canUseApi()) {
    try {
      const generated = await generateAiCharaverseComment({ commenter, author, relation, post, rawInput });
      text = generated.commentText;
      state.settings.apiStatus = `キャラバースコメント生成: ${state.settings.model}`;
    } catch (error) {
      state.settings.apiStatus = `キャラバースコメントはローカル補正へ切替: ${error.message}`;
    }
  }
  if (!text) {
    text = generateLocalManualCharaverseComment(commenter, author, rawInput);
  }

  const delta = inferCharaverseCommentDelta(post, relation, text);
  const commentEntry = {
    id: createId(),
    commenterId: commenter.id,
    commenterSnapshot: buildPostAuthorSnapshot(commenter),
    text,
    timestamp: new Date().toISOString(),
    delta,
    memory: `${commenter.name}が${author.name}のキャラバース投稿に手動コメントした`,
  };

  if (post.scope === "community") {
    await publishCommunityComment(post, author, commenter, commentEntry);
  } else {
    post.comments = post.comments || [];
    post.comments.push(commentEntry);
    applyRelationDelta(relation, delta);
    relation.title = resolveRelationshipTitle(relation);
    relation.lastMemory = `${commenter.name}が${author.name}のキャラバース投稿にコメントした`;
    saveMemory(author.id, `キャラバース手動コメント: ${commenter.name}`, relation.lastMemory);
    saveState();
  }

  if (input) input.value = "";
  renderAll();
}

async function publishCommunityComment(post, author, commenter, commentEntry) {
  const relation = getRelation(commenter.id, author.id);
  try {
    await postJson(COMMUNITY_POST_COMMENT_URL, {
      profileId: state.communityProfileId,
      profileName: getCommunityProfileName(),
      postId: post.communityEntryId || String(post.id || "").replace(/^community:/, ""),
      comment: commentEntry,
    });
    applyRelationDelta(relation, commentEntry.delta);
    relation.title = resolveRelationshipTitle(relation);
    relation.lastMemory = `${commenter.name}が${author.name}の公開投稿にコメントした`;
    saveMemory(author.id, `公開コメント: ${commenter.name}`, relation.lastMemory);
    state.communityStatus = `${commenter.name} の公開コメントを送信しました`;
    await syncCommunitySnapshot(true);
    saveState();
  } catch (error) {
    state.communityStatus = `公開コメント失敗: ${error.message}`;
    saveState();
    renderCommunityStatus();
  }
}

function resolveCharaverseLabel(genreKey) {
  return charaverseGenres.find((item) => item.key === genreKey)?.label || genreKey;
}

function generateLocalCharaversePost(author, rawInput, genre, mood) {
  const firstPerson = author.firstPerson || author.name;
  const moodLeadMap = {
    bright: `${firstPerson}からの記録です。`,
    shy: `ちょっと照れるけど、${firstPerson}の記録を残しておきます。`,
    proud: `${firstPerson}としては、今日はかなり出来がよかったです。`,
    calm: `静かに残しておきたいことがあります。`,
    taunt: `${firstPerson}から一つだけ言っておきます。`,
    cute: `${firstPerson}の小さな報告です。`,
  };
  const archetypeTailMap = {
    cool: "……悪くない結果だった。",
    tsundere: "べ、別に見てほしくて書いてるわけじゃないけど。",
    gentle: "誰かにやさしく届いたら嬉しいです。",
    rough: "まあ、悪くなかったってことだ。",
    proud: "これくらいは当然と言っていい。",
  };

  const lead = moodLeadMap[mood] || `${firstPerson}の記録です。`;
  const tail = archetypeTailMap[author.archetype] || "今日はそんなところです。";
  const postText = `${lead}\n${rawInput}\n${tail}`;
  return {
    postText,
    tags: [resolveCharaverseLabel(genre), charaverseMoods.find((item) => item.key === mood)?.label || mood].filter(Boolean),
    emotion: mood,
  };
}

function runCharaverseAutoActivity(post) {
  const author = getCharacter(post.authorId);
  if (!author) return;

  const others = state.characters.filter((character) => character.id !== author.id);
  const sorted = others
    .map((character) => ({
      character,
      relation: getRelation(character.id, author.id),
      score: getRelation(character.id, author.id).friendship + getRelation(character.id, author.id).respect + randomBetween(0, 6),
    }))
    .sort((left, right) => right.score - left.score);

  sorted.slice(0, Math.min(2, sorted.length)).forEach(({ character, relation }) => {
    const reactionType = chooseCharaverseReactionType(character, relation, post);
    const reaction = buildCharaverseReaction(character, author, relation, post, reactionType);
    post.reactions.push(reaction);
    applyRelationDelta(relation, reaction.delta);
    relation.title = resolveRelationshipTitle(relation);
    relation.lastMemory = reaction.memory;
    saveMemory(author.id, `キャラバース反応: ${character.name}`, reaction.memory);
  });

  sorted.slice(0, Math.min(2, sorted.length)).forEach(({ character, relation }, index) => {
    if (index > 0 && randomBetween(0, 100) < 45) return;
    const comment = buildCharaverseComment(character, author, relation, post);
    post.comments.push(comment);
    applyRelationDelta(relation, comment.delta);
    relation.title = resolveRelationshipTitle(relation);
    relation.lastMemory = comment.memory;
    saveMemory(author.id, `キャラバースコメント: ${character.name}`, comment.memory);
  });
}

function chooseCharaverseReactionType(character, relation, post) {
  if (post.genre === "training" || post.genre === "battle") {
    return relation.rivalry >= 18 ? "rematch" : "respect";
  }
  if (post.genre === "defeat" || post.genre === "worry") {
    return "cheer";
  }
  if (relation.respect >= 18) return "respect";
  if (relation.rivalry >= 20) return "rematch";
  return "like";
}

function buildCharaverseReaction(character, author, relation, post, type) {
  const labelMap = {
    like: {
      cool: "悪くない",
      tsundere: "ちょっとは認める",
      gentle: "よか投稿やね",
      rough: "気に入った",
      proud: "評価に値する",
    },
    cheer: {
      cool: "無理はするな",
      tsundere: "心配してないけど",
      gentle: "応援しとるけん",
      rough: "へこむなよ",
      proud: "立て直しなさい",
    },
    respect: {
      cool: "……やるじゃん",
      tsundere: "少しはやるのね",
      gentle: "すごかねぇ",
      rough: "見直した",
      proud: "実力は認める",
    },
    rematch: {
      cool: "次は俺が勝つ",
      tsundere: "次は負けない",
      gentle: "また勝負したかね",
      rough: "次は正面から来い",
      proud: "再戦を申請する",
    },
  };
  const archetypeKey = character.archetype in archetypeVoices ? character.archetype : "cool";
  const reactionLabel = labelMap[type]?.[archetypeKey] || "いいね";
  const deltaMap = {
    like: { friendship: 1, rivalry: 0, respect: 0, caution: 0 },
    cheer: { friendship: 2, rivalry: 0, respect: 0, caution: -1 },
    respect: { friendship: 0, rivalry: 0, respect: 2, caution: 0 },
    rematch: { friendship: 0, rivalry: 2, respect: 1, caution: 1 },
  };

  return {
    id: createId(),
    reactorId: character.id,
    reactionType: type,
    reactionLabel,
    reactionText: `${character.name}が${author.name}の投稿に「${reactionLabel}」と反応した。`,
    delta: deltaMap[type],
    memory: `${character.name}が${author.name}の投稿に「${reactionLabel}」と反応した`,
  };
}

function buildCharaverseComment(character, author, relation, post) {
  const text = generateLocalCharaverseComment(character, author, relation, post);
  const delta = inferCharaverseCommentDelta(post, relation, text);
  return {
    id: createId(),
    commenterId: character.id,
    text,
    delta,
    memory: `${character.name}が${author.name}のキャラバース投稿にコメントした`,
  };
}

function generateLocalCharaverseComment(character, author, relation, post) {
  const first = character.firstPerson || character.name;
  const genreLabel = resolveCharaverseLabel(post.genre);

  if (post.genre === "cooking") {
    if (relation.friendship >= 18) return `${author.name}らしい味になりそうだな。……次は${first}にも一口くらい回してくれ。`;
    if (relation.respect >= 18) return `調理の完成度は悪くない。${genreLabel}の投稿としても見応えがある。`;
    return `料理の記録か。こういう日常が見える投稿は嫌いじゃない。`;
  }
  if (post.genre === "training" || post.genre === "battle") {
    if (relation.rivalry >= 20) return `その報告、覚えておく。次に並ぶ時は、同じ結果にはさせない。`;
    return `訓練の積み重ねが見えるな。次に会う時の動きが少し楽しみになった。`;
  }
  if (post.genre === "defeat") {
    return relation.friendship >= 16
      ? `悔しさを隠さず書けるのは強さだと思う。次はもっといい報告にしよう。`
      : `敗北をちゃんと記録するのは悪くない。そこから先をどう変えるかだ。`;
  }
  if (post.genre === "thanks") {
    return `${author.name}がそういう言葉を表に出すの、少し意外だ。……でも、悪くない。`;
  }
  if (post.genre === "complaint") {
    return relation.rivalry >= 18
      ? `その棘、少しは似合ってる。けど言い切るなら最後まで通せ。`
      : `文句の中にも本音が見えるな。少し落ち着いてから読み返すのもありだ。`;
  }
  if (post.genre === "question") {
    return `${first}ならこう考える。……でも、${author.name}がどう答えを出すかも気になるな。`;
  }

  return relation.friendship >= 18
    ? `こういう投稿、前よりずっと${author.name}らしく見える。続きをまた読みたい。`
    : `${author.name}の今が少し見える投稿だった。記録として残しておく価値はある。`;
}

function generateLocalManualCharaverseComment(commenter, author, rawInput) {
  const archetypeTailMap = {
    cool: "……そういうところは、嫌いじゃない。",
    tsundere: "べ、別に本気で褒めてるわけじゃないけど。",
    gentle: "やさしく届いたら嬉しかね。",
    rough: "まあ、言いたいことはそれだ。",
    proud: "そのくらいの言葉なら残してもいい。",
  };
  return `${rawInput}\n${archetypeTailMap[commenter.archetype] || `${commenter.name}はそう思った。`}`;
}

function inferCharaverseCommentDelta(post, relation, text) {
  const delta = { friendship: 1, rivalry: 0, respect: 0, caution: 0 };
  if (/(すご|悪くない|見応え|完成度|認め)/.test(text)) delta.respect += 2;
  if (/(次|再戦|同じ結果にはさせない)/.test(text)) delta.rivalry += 2;
  if (/(一口|読みたい|悪くない|らしい)/.test(text)) delta.friendship += 1;
  if (post.genre === "defeat" || post.genre === "worry") delta.friendship += 1;
  if (relation.rivalry >= 22 && post.genre === "battle") delta.caution += 1;
  return delta;
}

async function sendRelationshipChat(message, actorId, targetId) {
  const actor = getCharacter(actorId);
  const target = getCharacter(targetId);
  const relation = getRelation(actorId, targetId);
  const thread = getChatThread(actorId, targetId);
  const chatMeta = getChatMeta(actorId, targetId);
  const battleBundle = actorId === "player" ? getBattleRecordBundle(targetId) : getEmptyBattleRecordBundle();
  const delta = analyzeChatMessageEffect(message, relation);
  const inferredTopic = inferConversationTopic(message, target);

  thread.push({
    id: createId(),
    sender: "user",
    speakerRole: "actor",
    speakerId: actor.id,
    speakerName: actor.name,
    text: message,
    timestamp: new Date().toISOString(),
  });

  applyRelationDelta(relation, delta);
  relation.title = resolveRelationshipTitle(relation);

  let replyPayload = null;
  if (canUseApi()) {
    try {
      replyPayload = await generateAiRelationshipReply({
        actor,
        target,
        relation,
        playerMessage: message,
        thread,
        chatMeta,
        battleBundle,
        inferredTopic,
      });
      state.settings.apiStatus = `会話生成成功: ${state.settings.model}`;
    } catch (error) {
      state.settings.apiStatus = `会話はローカル応答に切替: ${error.message}`;
    }
  }

  const rawReplyText = replyPayload?.reply || generateBattleAwareRelationshipReply(actor, target, relation, message, delta, chatMeta, battleBundle, inferredTopic);
  const diversifiedReply = diversifyRelationshipReply({
    actorId,
    targetId,
    target,
    relation,
    replyText: rawReplyText,
    inferredTopic,
    chatMeta,
    battleBundle,
  });
  const replyText = diversifiedReply.text;
  thread.push({
    id: createId(),
    sender: "character",
    speakerRole: "target",
    speakerId: target.id,
    speakerName: target.name,
    text: replyText,
    timestamp: new Date().toISOString(),
  });

  relation.lastMemory = replyPayload?.memoryHint || buildChatMemoryHint(target, delta);
  relation.title = resolveRelationshipTitle(relation);
  updateChatMeta(actorId, targetId, {
    userMessage: message,
    replyText,
    inferredTopic,
    moveType: replyPayload?.moveType || "local",
    nextHook: replyPayload?.nextHook || "",
    anchorKey: diversifiedReply.anchorKey || "",
  });
  saveMemory(targetId, `会話: ${actor?.name || "誰か"} → ${target.name}`, relation.lastMemory, actorId);
  saveState();
}

function buildNamedRelationshipThread(actor, target, thread) {
  return (thread || []).slice(-8).map((message) => {
    const isActorLine = message.sender === "user";
    const fallbackSpeaker = isActorLine ? actor : target;
    return {
      speakerRole: message.speakerRole || (isActorLine ? "actor" : "target"),
      speakerId: message.speakerId || fallbackSpeaker?.id || "",
      speakerName: message.speakerName || fallbackSpeaker?.name || "",
      text: message.text || "",
      timestamp: message.timestamp || "",
    };
  });
}

function analyzeChatMessageEffect(message, relation) {
  const delta = { friendship: 0, rivalry: 0, respect: 0, caution: 0 };
  const normalized = normalizeTechniqueText(message);

  if (/(ありがとう|助かった|感謝|うれしい|嬉しい)/.test(message)) {
    delta.friendship += 2;
    delta.respect += 1;
  }
  if (/(すごい|強い|尊敬|認め|かっこいい|さすが)/.test(message)) {
    delta.respect += 2;
    delta.friendship += 1;
  }
  if (/(ごめん|悪かった|謝る)/.test(message)) {
    delta.friendship += 1;
    delta.rivalry -= 1;
    delta.caution -= 1;
  }
  if (/(心配|大丈夫|無理しない|休んで)/.test(message)) {
    delta.friendship += 2;
    delta.caution -= 1;
  }
  if (/(倒す|負けない|挑発|煽|かかってこい|次は勝つ)/.test(message)) {
    delta.rivalry += 2;
    delta.respect += 1;
    delta.caution += 1;
  }
  if (/(嫌い|信用できない|怖い|警戒)/.test(message) || normalized.includes("きらい")) {
    delta.friendship -= 1;
    delta.caution += 2;
  }

  if (!Object.values(delta).some((value) => value !== 0)) {
    if (relation.friendship >= 20) delta.friendship += 1;
    else if (relation.rivalry >= 20) delta.rivalry += 1;
    else delta.respect += 1;
  }

  return delta;
}

function generateLocalRelationshipReply(actor, target, relation, message, delta, chatMeta, battleBundle, inferredTopic) {
  const warm = relation.friendship >= 24;
  const hostile = relation.rivalry >= 24 || relation.caution >= 24;
  const respectful = relation.respect >= 18;
  const voice = archetypeVoices[target.archetype] || archetypeVoices.cool;
  const lastMemory = relation.lastMemory || "";
  const recentMemories = getRelevantMemories(target.id, 2);
  const recentThread = getChatThread(actor.id, target.id).slice(-4).map((item) => item.text).join(" ");
  const conversationMove = chooseLocalConversationMove(target, relation, chatMeta, inferredTopic);
  const forwardHook = buildForwardHook(target, relation, inferredTopic, conversationMove);

  if (/この前|前に|さっき|前回/.test(message)) {
    if (lastMemory) {
      return `覚えている。${lastMemory}……あの時の余韻、まだ胸の奥に沈んだままだ。${forwardHook}`;
    }
  }

  if (recentMemories.some((memory) => /挑発|因縁|屈辱/.test(memory.body)) && delta.friendship > 0) {
    return `今さら優しくされても、すぐに全部が変わるわけじゃない。でも……前よりは、ちゃんと聞く気がある。言葉の温度くらいは、もう見誤らない。${forwardHook}`;
  }

  if (recentThread && /ありがとう|助かった/.test(recentThread) && delta.friendship > 0) {
    return `また礼を言うのね。そういう積み重ねは、嫌いじゃない。少しずつだけど、確かに伝わってる。${forwardHook}`;
  }

  if (delta.friendship >= 2 && warm) {
    if (target.archetype === "gentle") return `えへへ、そう言ってもらえると嬉しいな。胸の奥にふわっと灯りがともるみたい。あなたと話す時間、けっこう好きかも。${forwardHook}`;
    if (target.archetype === "cool") return `そういう言葉は嫌いじゃない。静かだけど、ちゃんと届いた。今のやり取りは覚えておく。${forwardHook}`;
  }

  if (delta.respect >= 2 && respectful) {
    if (target.archetype === "proud") return `見る目はあるのね。そこまで言うなら、次はもっと高いところで受けて立つわ。言葉だけで終わる評価なんて、私には似合わないもの。${forwardHook}`;
    return `その評価は軽く扱わない。言葉の重さは、戦場で返すのが一番正しい。次は結果でも返そう。${forwardHook}`;
  }

  if (delta.rivalry >= 2 && hostile) {
    if (target.archetype === "proud") return `その挑発、嫌いじゃないわ。胸の奥で火花が弾けるくらいにはね。なら次は本当に折りに行く。覚悟しておきなさい。${forwardHook}`;
    if (target.archetype === "rough") return `いいじゃねぇか。そういう火花の方が、話してても血が熱くなる。${forwardHook}`;
    return `また煽るのね。でも、そのくらいの火種がある方が次は面白い。静かに終わる関係なんて、たぶん似合わない。${forwardHook}`;
  }

  if (delta.caution > 0 && relation.caution >= 20) {
    return `……その言葉、まだ測っているところ。軽々しく踏み込むつもりはない。けれど、完全に閉ざすほどでもなくなってきた。${forwardHook}`;
  }

  if (/戦い|バトル|模擬戦|次/.test(message)) {
    return warm
      ? `次に戦う時は、今より少しだけ息を合わせられる気がする。${forwardHook}`
      : hostile
        ? `次があるなら、今度はもっとはっきり決着をつける。${forwardHook}`
        : `次に向けて、少し準備をしておく。話したぶんだけ見えたものもある。${forwardHook}`;
  }

  if (warm) {
    return `${voice.greeting} ……ってほど堅くはないか。こうして話す時間も、悪くないね。戦いの時とは違う顔が見えるのも、少し新鮮だ。${forwardHook}`;
  }

  if (hostile) {
    return `${voice.resolve} ただ、勘違いしないで。馴れ合うつもりはまだない。でも言葉を交わすたび、刃の交わり方は少しずつ変わっていく。${forwardHook}`;
  }

  if (respectful) {
    return `あなたの言葉は軽くは扱わない。${voice.praise} そういう一言が、案外いちばん深く残ることもある。${forwardHook}`;
  }

  return `${voice.resolve} でも、今の話は覚えておく。言葉は短くても、残るものは案外大きい。${forwardHook}`;
}

function generateBattleAwareRelationshipReply(actor, target, relation, message, delta, chatMeta, battleBundle, inferredTopic) {
  const lastBattle = battleBundle?.last;
  const battleTalk = inferredTopic === "battle" || /勝|負|圧勝|惨敗|接戦|前の戦い|この前の戦い/.test(message);

  if (battleTalk && lastBattle) {
    const forwardHook = buildForwardHook(target, relation, inferredTopic, chooseLocalConversationMove(target, relation, chatMeta, inferredTopic));
    const playerWonLast = lastBattle.result === "win";
    const decisive = lastBattle.outcomeType === "decisive";
    const close = lastBattle.outcomeType === "close";

    if (playerWonLast) {
      if (decisive) return `……前の戦いのことを言っているのね。あれは認めるしかない、完全にあなたの流れだった。だからこそ、次に同じ形では終わらせない。${forwardHook}`;
      if (close) return `覚えてる。ほんの一手ぶん、あなたが上だった戦い。あの決着の薄さが、まだ胸に残ってる。${forwardHook}`;
      return `あの勝負はあなたが取った。けれど、差そのものはもう見えている。次はそこをひっくり返すだけよ。${forwardHook}`;
    }

    if (decisive) return `あの戦いは私の勝ちだったし、しかもかなりはっきり差が出た。……でも、それで終わりだとは思っていないから、こうして話している。${forwardHook}`;
    if (close) return `前は私が勝った。でも、あれは余裕のある勝ち方じゃなかった。次にやれば、もっと危ういところまで行く気がしてる。${forwardHook}`;
    return `勝敗だけ見れば前は私が上だった。でも、あなたの動きはちゃんと残ってる。だから軽くは見ていない。${forwardHook}`;
  }

  return generateLocalRelationshipReply(actor, target, relation, message, delta, chatMeta, battleBundle, inferredTopic);
}

function buildChatMemoryHint(target, delta) {
  if (delta.friendship >= 2) {
    return `${target.name}は会話の中で少しだけ心を開いた`;
  }
  if (delta.rivalry >= 2) {
    return `${target.name}は会話の挑発を新たな火種として記憶した`;
  }
  if (delta.respect >= 2) {
    return `${target.name}は言葉の端から実力への敬意を感じ取った`;
  }
  if (delta.caution >= 2) {
    return `${target.name}はまだ警戒を解かず、言葉の裏を探っていた`;
  }
  return `${target.name}と短い会話を交わし、戦いの外側の温度が少しだけ見えた`;
}

function chooseLocalConversationMove(target, relation, chatMeta, inferredTopic) {
  const recentTopics = chatMeta.recentTopics || [];
  const repeatedTopic = recentTopics.slice(-2).every((topic) => topic && topic === inferredTopic);
  if (relation.rivalry >= 24 && chatMeta.lastMove !== "challenge") return "challenge";
  if (relation.friendship >= 24 && chatMeta.turns >= 3 && chatMeta.lastMove !== "invite") return "invite";
  if (inferredTopic === "battle" && chatMeta.lastMove !== "reflect") return relation.respect >= 18 ? "reflect" : "ask";
  if (inferredTopic === "technique" && chatMeta.lastMove !== "reveal") return "reveal";
  if (repeatedTopic) return chatMeta.lastMove === "ask" ? "reveal" : "ask";
  if ((chatMeta.turns || 0) % 3 === 1) return "reveal";
  if (relation.respect >= 18 && chatMeta.lastMove !== "reflect") return "reflect";
  return "ask";
}

function buildForwardHook(target, relation, inferredTopic, moveType) {
  const technique = target.techniques[0]?.name || "";
  const hobby = splitCommaLikeText(target.hobbies)[0] || "";
  const like = splitCommaLikeText(target.likes)[0] || "";

  if (moveType === "challenge") {
    return technique
      ? ` 次はその時、${technique}にどう返すつもりなの？`
      : " 次にぶつかる時、どんな勝ち方を考えてるの？";
  }

  if (moveType === "invite") {
    return hobby
      ? ` ……今度、戦いの話だけじゃなく${hobby}のことも聞かせてくれる？`
      : " ……今度は戦う前に、少し落ち着いて話してみる？";
  }

  if (moveType === "reveal") {
    return like
      ? ` 私は${like}の時だけ、少し気が緩む。あなたにもそういうものってある？`
      : " そういう時、あなたは何を支えにしてるの？";
  }

  if (moveType === "reflect") {
    return inferredTopic === "battle"
      ? " あの戦いで、あなた自身は何が一番変わったと思う？"
      : " その言葉、あなたの中ではどういう意味を持ってるの？";
  }

  if (inferredTopic === "technique" && technique) {
    return ` ところで、${technique}みたいな技って、あなたはどう受けるのが得意？`;
  }

  if (inferredTopic === "daily" && hobby) {
    return ` 戦いの外だと、${hobby}をしてる時のあなたってどんな感じなの？`;
  }

  return " それで、あなたは次にどうしたい？";
}

function inferConversationTopic(message, target) {
  if (/(技|奥義|戦い|バトル|模擬戦|訓練|勝つ|負け)/.test(message)) return "battle";
  if (/(氷|影|刃|解析|能力|術式)/.test(message)) return "technique";
  if (/(好き|趣味|休み|普段|食べ|飲み|休日)/.test(message)) return "daily";
  if (/(怖い|寂しい|嬉しい|悲しい|怒|不安|信じ)/.test(message)) return "emotion";
  if (target.faction && message.includes(target.faction)) return "faction";
  return "general";
}

function getChatMeta(actorId, targetId) {
  const key = getChatKey(actorId, targetId);
  if (!state.chatMeta[key]) {
    state.chatMeta[key] = {
      turns: 0,
      lastTopic: "general",
      lastMove: "",
      lastHook: "",
      recentTopics: [],
      recentAnchors: [],
      recentReplySignatures: [],
      lastUserMessage: "",
      lastReply: "",
    };
  }
  return state.chatMeta[key];
}

function updateChatMeta(actorId, targetId, { userMessage, replyText, inferredTopic, moveType, nextHook, anchorKey }) {
  const meta = getChatMeta(actorId, targetId);
  meta.turns += 1;
  meta.lastTopic = inferredTopic || meta.lastTopic || "general";
  meta.lastMove = moveType || meta.lastMove || "";
  meta.lastHook = nextHook || "";
  meta.recentTopics = [...(meta.recentTopics || []), inferredTopic || "general"].slice(-6);
  meta.recentAnchors = [...(meta.recentAnchors || []), anchorKey || ""].filter(Boolean).slice(-6);
  meta.recentReplySignatures = [...(meta.recentReplySignatures || []), generateReplySignature(replyText || "")].filter(Boolean).slice(-6);
  meta.lastUserMessage = userMessage || "";
  meta.lastReply = replyText || "";
}

function splitCommaLikeText(value) {
  return String(value || "")
    .split(/[、,，\/／]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectCharacterAnchors(target) {
  const anchors = [];
  const pushAnchor = (key, topic, label, value) => {
    if (!value) return;
    anchors.push({ key, topic, label, value: String(value).trim() });
  };

  pushAnchor("ability", "battle", "能力", target.ability);
  pushAnchor("style", "battle", "戦闘スタイル", target.style);
  pushAnchor("weakness", "battle", "弱点", target.weakness);
  pushAnchor("ultimate", "battle", "奥義", target.ultimate);
  pushAnchor("faction", "faction", "所属", target.faction);
  pushAnchor("origin", "history", "出自", target.origin);
  pushAnchor("personality", "emotion", "性格", target.personality);
  pushAnchor("tone", "emotion", "口調", target.tone);
  pushAnchor("favoritePhrase", "speech", "好きな言い回し", target.favoritePhrase);
  pushAnchor("hatedPhrase", "speech", "嫌いな言い回し", target.hatedPhrase);
  pushAnchor("likes", "daily", "好きなもの", splitCommaLikeText(target.likes)[0]);
  pushAnchor("dislikes", "daily", "嫌いなもの", splitCommaLikeText(target.dislikes)[0]);
  pushAnchor("hobbies", "daily", "趣味", splitCommaLikeText(target.hobbies)[0]);
  pushAnchor("mannerisms", "speech", "癖", target.mannerisms);
  pushAnchor("notes", "history", "備考", firstSentence(target.notes));

  (target.techniques || []).slice(0, 3).forEach((technique, index) => {
    pushAnchor(`technique_${index}`, "technique", "技", technique.name);
    pushAnchor(`technique_effect_${index}`, "technique", "技の効果", technique.effect);
  });

  return anchors.filter((item) => item.value);
}

function firstSentence(value) {
  return String(value || "")
    .split(/[。.!?\n]/)
    .map((item) => item.trim())
    .find(Boolean) || "";
}

function generateReplySignature(text) {
  return normalizeTechniqueText(String(text || "")).slice(0, 48);
}

function calculateReplySimilarity(left, right) {
  const a = new Set((left || "").match(/.{1,2}/g) || []);
  const b = new Set((right || "").match(/.{1,2}/g) || []);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((item) => b.has(item)).length;
  return overlap / Math.max(a.size, b.size);
}

function selectCharacterAnchor(target, inferredTopic, chatMeta) {
  const anchors = collectCharacterAnchors(target);
  const recentAnchors = new Set(chatMeta.recentAnchors || []);
  const byTopic = anchors.filter((item) => item.topic === inferredTopic && !recentAnchors.has(item.key));
  if (byTopic.length) return byTopic[0];
  const fresh = anchors.find((item) => !recentAnchors.has(item.key));
  return fresh || anchors[0] || null;
}

function buildAnchorSentence(target, anchor) {
  if (!anchor) return "";
  const name = target.name;
  switch (anchor.label) {
    case "技":
      return `${name}はふっと目を細める。「${anchor.value}の話をされると、さすがに無視はできないな」`;
    case "趣味":
      return `少しだけ空気がやわらぐ。「${anchor.value}のことなら、戦い抜きでも話せるかもしれない」`;
    case "所属":
      return `${name}は一拍だけ間を置いた。「${anchor.value}にいる以上、その話は私にとって軽くない」`;
    case "出自":
      return `${name}の声音がわずかに変わる。「${anchor.value}……そこに触れるなら、少しはちゃんと話してもいい」`;
    case "好きなもの":
      return `ふと表情がほどける。「${anchor.value}の話を出されると、さすがに調子が狂うな」`;
    case "嫌いなもの":
      return `${name}は肩をすくめる。「${anchor.value}だけは今でも好きになれない」`;
    case "能力":
      return `${name}は指先を見つめた。「${anchor.value}って、言葉にすると案外ごまかせないものだ」`;
    default:
      return `${name}は視線を揺らす。「${anchor.value}……そのあたりが、今の私を形作ってるのかもしれない」`;
  }
}

function diversifyRelationshipReply({ actorId, targetId, target, replyText, inferredTopic, chatMeta }) {
  const thread = getChatThread(actorId, targetId);
  const recentCharacterReplies = thread
    .filter((item) => item.sender === "character")
    .slice(-3)
    .map((item) => item.text);
  const signature = generateReplySignature(replyText);
  const tooShort = String(replyText || "").length < 26;
  const tooGeneric = /(そう|悪くない|話は聞いている|次の言葉次第|覚えている)/.test(replyText || "");
  const tooSimilar = recentCharacterReplies.some((item) => calculateReplySimilarity(signature, generateReplySignature(item)) >= 0.7);

  if (!tooShort && !tooGeneric && !tooSimilar) {
    return { text: replyText, anchorKey: "" };
  }

  const anchor = selectCharacterAnchor(target, inferredTopic, chatMeta);
  if (!anchor) {
    return { text: replyText, anchorKey: "" };
  }

  const anchorSentence = buildAnchorSentence(target, anchor);
  const normalizedReply = String(replyText || "").trim();
  const merged = tooShort || tooSimilar
    ? `${anchorSentence} ${normalizedReply}`.trim()
    : `${normalizedReply} ${anchorSentence}`.trim();

  return {
    text: merged,
    anchorKey: anchor.key,
  };
}

function renderIntervalChoices() {
  elements.intervalActions.innerHTML = intervalChoices
    .map((choice) => `<button class="interval-choice" data-choice="${escapeHtml(choice.key)}">${escapeHtml(choice.label)}</button>`)
    .join("");

  [...elements.intervalActions.querySelectorAll(".interval-choice")].forEach((button) => {
    button.addEventListener("click", () => {
      resolveInterval(button.dataset.choice);
      renderAll();
    });
  });
}

function renderRelations() {
  const enemies = getBattleOpponents();
  elements.relationsList.innerHTML = enemies
    .map((enemy) => {
      const relation = getRelation("player", enemy.id);
      return `
        <article class="relation-card">
          <div class="section-header compact">
            <div>
              <h3>${escapeHtml(enemy.name)}</h3>
              <p class="memory-meta">${escapeHtml(relation.title)}${enemy.isCommunity ? ` / 公開元 ${escapeHtml(enemy.profileName || "匿名オーナー")}` : ""}</p>
            </div>
            <span class="badge">${escapeHtml(resolveRelationshipTitle(relation))}</span>
          </div>
          <div class="stat-row">
            <div class="stat-pill"><strong>友情</strong><br>${relation.friendship}</div>
            <div class="stat-pill"><strong>因縁</strong><br>${relation.rivalry}</div>
            <div class="stat-pill"><strong>尊敬</strong><br>${relation.respect}</div>
            <div class="stat-pill"><strong>警戒</strong><br>${relation.caution}</div>
          </div>
          <p><strong>最後の出来事:</strong> ${escapeHtml(relation.lastMemory)}</p>
        </article>
      `;
    })
    .join("");
}

function renderMemories() {
  const sortedMemories = [...state.memories].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  elements.memoriesList.innerHTML = sortedMemories
    .map((memory) => {
      const opponent = getCharacter(memory.opponentId);
      return `
        <article class="memory-card">
          <div class="section-header compact">
            <div>
              <h3>${escapeHtml(memory.title)}</h3>
              <p class="memory-meta">${escapeHtml(opponent ? opponent.name : "記録不明")} / ${escapeHtml(formatDate(memory.timestamp))}</p>
            </div>
          </div>
          <p>${escapeHtml(memory.body)}</p>
        </article>
      `;
    })
    .join("");
}

function renderFighterCard(character, battleState) {
  const relation = character.id === "player" ? null : getRelation("player", character.id);
  const stats = battleState
    ? `
      <div class="stat-row">
        <div class="stat-pill"><strong>HP</strong><br>${battleState.hp}</div>
        <div class="stat-pill"><strong>STAMINA</strong><br>${battleState.stamina}</div>
        <div class="stat-pill"><strong>MENTAL</strong><br>${battleState.mental}</div>
        <div class="stat-pill"><strong>覚醒</strong><br>${battleState.awaken}</div>
      </div>
    `
    : `
      <div class="stat-row">
        <div class="stat-pill"><strong>ATK</strong><br>${character.stats.atk}</div>
        <div class="stat-pill"><strong>SPD</strong><br>${character.stats.spd}</div>
        <div class="stat-pill"><strong>MIND</strong><br>${character.stats.mind}</div>
        <div class="stat-pill"><strong>CHARM</strong><br>${character.stats.charm}</div>
      </div>
    `;

  return `
    <div class="fighter-header">
      <div class="fighter-thumb">
        ${character.imageDataUrl
          ? `<img src="${character.imageDataUrl}" alt="${escapeHtml(character.name)}">`
          : `<span>NO<br>IMAGE</span>`}
      </div>
      <div>
        <p class="eyebrow">${escapeHtml(character.tone || "未設定")}</p>
        <h3>${escapeHtml(character.name)}</h3>
        <p>${escapeHtml(character.title || character.ability || "能力未設定")}</p>
        ${character.isCommunity ? `<p class="memory-meta">公開元: ${escapeHtml(character.profileName || "匿名オーナー")}</p>` : ""}
        ${relation ? `<p><strong>関係:</strong> ${escapeHtml(relation.title)}</p>` : ""}
      </div>
    </div>
    <p><strong>能力:</strong> ${escapeHtml(character.ability || "未設定")}</p>
    <p><strong>戦闘:</strong> ${escapeHtml(character.style || "未設定")}</p>
    ${stats}
  `;
}

function renderLog(entry) {
  return `
    <article class="log-entry ${entry.type}">
      <strong>${escapeHtml(entry.label)}</strong>
      <div>${escapeHtml(entry.text)}</div>
    </article>
  `;
}

function startBattle() {
  const player = getPlayer();
  const enemy = getCharacter(state.selectedEnemyId);
  if (!enemy) {
    appendSystemNotice("対戦相手がまだ選ばれていません。");
    return;
  }
  const relation = getRelation("player", enemy.id);
  state.battle = {
    enemyId: enemy.id,
    turn: 1,
    half: "front",
    heat: 0,
    finished: false,
    pending: false,
    intervalPending: false,
    playerState: { hp: 100, stamina: 100, mental: 100, awaken: 0 },
    enemyState: { hp: 100, stamina: 100, mental: 100, awaken: 0 },
    logs: [
      {
        type: "system",
        label: "バトル開始",
        text: `${player.name} VS ${enemy.name}。関係は「${relation.title}」。${openingLine(player, enemy, relation)}`,
      },
    ],
    lastChatCategory: null,
  };
  saveState();
  renderBattle();
}

async function resolveTurn(action, chatCategory, customBattleLine = "") {
  const battle = state.battle;
  if (!battle) return;

  battle.pending = true;
  renderBattle();

  const player = getPlayer();
  const enemy = getCharacter(battle.enemyId);
  const relation = getRelation("player", enemy.id);

  const playerOutcome = evaluateAction(player, enemy, relation, action, battle.turn, battle.half);
  const enemyOutcome = enemyCounterAction(
    enemy,
    player,
    relation,
    battle.turn,
    battle.half,
    playerOutcome.playerStateAfter,
    playerOutcome.enemyStateAfter,
  );
  const battleSpeech = buildBattleSpeechInput(chatCategory, customBattleLine, battle.lastChatCategory, relation);
  const chatDelta = battleSpeech ? battleSpeech.delta : null;

  let aiText = null;
  if (canUseApi()) {
    try {
      aiText = await generateAiTurnText({
        battle,
        player,
        enemy,
        relation,
        action,
        chatCategory: battleSpeech?.category || null,
        customBattleLine: battleSpeech?.line || "",
        playerOutcome,
        enemyOutcome,
        chatDelta,
      });
      state.settings.apiStatus = `演出生成成功: ${state.settings.model}`;
    } catch (error) {
      state.settings.apiStatus = `API失敗のためローカル演出へ切替: ${error.message}`;
      aiText = null;
    }
  }

  applyStateTransition(battle, relation, playerOutcome, enemyOutcome, chatDelta, battleSpeech?.category || null);

  battle.logs.push({
    type: "action",
    label: `ターン ${battle.turn} / ${battle.half === "front" ? "前半" : "後半"}`,
    text: aiText?.battleLog || playerOutcome.log,
  });
  battle.logs.push({
    type: "system",
    label: "判定",
    text: aiText?.battleSummary || playerOutcome.summary,
  });

  if (battleSpeech) {
    battle.logs.push({
      type: "action",
      label: battleSpeech.label,
      text: `${player.name}「${aiText?.chatLine || generateFallbackBattleSpeech(player, battleSpeech, relation)}」`,
    });
    battle.logs.push({
      type: "system",
      label: "相手反応",
      text: `${enemy.name}「${aiText?.enemyReaction || generateFallbackReactionLine(enemy, battleSpeech.category || "resolve", relation, battleSpeech.line)}」`,
    });
  } else {
    battle.logs.push({
      type: "action",
      label: `${enemy.name}の言葉`,
      text: aiText?.enemyInterjection || `${enemy.name}「${generateBattleInterjection(enemy, relation, playerOutcome, battle)}」`,
    });
  }

  if (enemyOutcome) {
    battle.logs.push({
      type: "action",
      label: `${enemy.name}の反撃`,
      text: aiText?.counterLog || enemyOutcome.log,
    });
    battle.logs.push({
      type: "system",
      label: "戦況",
      text: aiText?.counterSummary || enemyOutcome.summary,
    });
  }

  if (aiText?.relationNote) {
    battle.logs.push({
      type: "system",
      label: "関係ログ",
      text: aiText.relationNote,
    });
  }

  clampBattleState(battle.playerState);
  clampBattleState(battle.enemyState);
  relation.title = resolveRelationshipTitle(relation);

  if (shouldFinishBattle(battle)) {
    finishBattle(aiText?.memoryHint);
  } else if (battle.turn === 3 && battle.half === "front") {
    battle.intervalPending = true;
    battle.logs.push({
      type: "system",
      label: "インターバル",
      text: "前半終了。相手の呼吸と感情が変わる瞬間だ。ここでの一言が後半を左右する。",
    });
  } else {
    advanceTurn();
  }

  battle.pending = false;
  saveState();
}

function applyStateTransition(battle, relation, playerOutcome, enemyOutcome, chatDelta, chatCategory) {
  battle.playerState = structuredClone(playerOutcome.playerStateAfter);
  battle.enemyState = structuredClone(playerOutcome.enemyStateAfter);

  relation.friendship += playerOutcome.relationDelta.friendship;
  relation.rivalry += playerOutcome.relationDelta.rivalry;
  relation.respect += playerOutcome.relationDelta.respect;
  relation.caution += playerOutcome.relationDelta.caution;

  if (chatDelta) {
    relation.friendship += chatDelta.friendship;
    relation.rivalry += chatDelta.rivalry;
    relation.respect += chatDelta.respect;
    relation.caution += chatDelta.caution;
    battle.heat += chatDelta.heat;

    if (battle.lastChatCategory === chatCategory) {
      relation.friendship -= Math.max(0, chatDelta.friendship - 1);
      relation.rivalry -= Math.max(0, chatDelta.rivalry - 1);
      battle.logs.push({
        type: "system",
        label: "反復補正",
        text: "同じカテゴリを続けて使ったため、関係変化は少し薄まった。",
      });
    }
  }

  if (enemyOutcome) {
    battle.playerState = structuredClone(enemyOutcome.playerStateAfter);
    battle.enemyState = structuredClone(enemyOutcome.enemyStateAfter);
  }

  updateAwakenFromState(battle.playerState, battle.enemyState);
  battle.lastChatCategory = chatCategory || battle.lastChatCategory;
}

function resolveInterval(choiceKey) {
  const battle = state.battle;
  const enemy = getCharacter(battle.enemyId);
  const relation = getRelation("player", enemy.id);
  const choice = intervalChoices.find((item) => item.key === choiceKey);
  if (!choice) return;

  relation.friendship += choice.friendship;
  relation.rivalry += choice.rivalry;
  relation.respect += choice.respect;
  relation.caution += choice.caution;
  battle.heat += choice.heat;
  relation.title = resolveRelationshipTitle(relation);
  relation.lastMemory = `インターバルで「${choice.label}」を選び、空気が変化した`;

  battle.logs.push({
    type: "action",
    label: "インターバル会話",
    text: `${getPlayer().name}は「${choice.label}」を選んだ。${enemy.name}の視線がわずかに変わる。`,
  });

  battle.intervalPending = false;
  battle.half = "back";
  battle.turn = 4;
  saveMemory(enemy.id, `インターバルで${choice.label}`, relation.lastMemory);
  saveState();
}

function finishBattle(memoryHint = "") {
  const battle = state.battle;
  const enemy = getCharacter(battle.enemyId);
  const relation = getRelation("player", enemy.id);
  const playerWon = battle.enemyState.hp <= battle.playerState.hp;
  const battleRecord = summarizeBattleRecord(battle, enemy.id, playerWon);
  battle.finished = true;

  const postEvent = resolvePostBattleEvent(relation, playerWon, enemy, memoryHint);
  relation.friendship += postEvent.friendship;
  relation.rivalry += postEvent.rivalry;
  relation.respect += postEvent.respect;
  relation.caution += postEvent.caution;
  relation.title = resolveRelationshipTitle(relation);
  relation.lastMemory = postEvent.memory;

  battle.logs.push({
    type: "system",
    label: "決着",
    text: postEvent.log,
  });

  saveBattleRecord(enemy.id, battleRecord);
  saveMemory(enemy.id, postEvent.title, postEvent.memory);
}

function resolvePostBattleEvent(relation, playerWon, enemy, memoryHint) {
  if (relation.friendship >= 22 && relation.rivalry <= 18) {
    return {
      title: "戦友の気配",
      friendship: 12,
      rivalry: 0,
      respect: 3,
      caution: -2,
      memory: memoryHint || `${enemy.name}は戦闘後、隣に立てる相手としてレイを意識した`,
      log: `${enemy.name}は武器を下ろし、静かに手を差し出した。「次は敵じゃなく、隣で戦ってみたい」`,
    };
  }

  if (relation.rivalry >= 26) {
    return {
      title: "因縁が刻まれた",
      friendship: -1,
      rivalry: 18,
      respect: 4,
      caution: 4,
      memory: memoryHint || `${enemy.name}はこの戦いを忘れない屈辱として記録した`,
      log: `${enemy.name}は血の滲む拳を握りしめた。「この屈辱、絶対に忘れない」`,
    };
  }

  if (relation.respect >= 18) {
    return {
      title: "認めた強者",
      friendship: 2,
      rivalry: 2,
      respect: 15,
      caution: 1,
      memory: memoryHint || `${enemy.name}はレイを、ただの敵ではない強者として記憶した`,
      log: `${enemy.name}は静かに武器を下ろした。「認めよう。お前は、ただの敵じゃない」`,
    };
  }

  return {
    title: playerWon ? "競り勝った記憶" : "敗北を刻んだ相手",
    friendship: playerWon ? 1 : 0,
    rivalry: 6,
    respect: 5,
    caution: 3,
    memory: memoryHint || (playerWon
      ? `${enemy.name}は敗れながらも再戦を望む視線を向けた`
      : `${enemy.name}に敗北し、次は越えたい壁として記憶した`),
    log: playerWon
      ? `勝利のあとも空気は切れない。${enemy.name}の視線には、次を求める火が残っている。`
      : `${getPlayer().name}は膝をついた。${enemy.name}の勝利は、新たな物語の始まりとして刻まれる。`,
  };
}

function evaluateAction(attacker, defender, relation, action, turn, half) {
  const actorState = structuredClone(state.battle.playerState);
  const enemyState = structuredClone(state.battle.enemyState);
  const triggeredTechnique = detectTriggeredTechnique(action, attacker);
  const techniquePowerBonus = triggeredTechnique ? triggeredTechnique.technique.power * 1.6 + triggeredTechnique.matchScore : 0;
  const keywordBoost = keywordScore(action, attacker, triggeredTechnique) + techniquePowerBonus;
  const riskPenalty = riskScore(action);
  const attackWeight = attacker.stats.atk * 0.42 + attacker.stats.spd * 0.28 + attacker.stats.mind * 0.18 + keywordBoost;
  const defenseWeight = defender.stats.spd * 0.25 + defender.stats.mind * 0.3 + relation.caution * 0.35;
  const advantage = attackWeight - defenseWeight - riskPenalty + randomBetween(-8, 8);
  const techniqueSituationCost = triggeredTechnique ? calculateTechniqueSituationCost(action, triggeredTechnique.technique, half, turn) : 0;
  const damage = clamp(Math.round(10 + advantage / 5 + (triggeredTechnique?.technique.power || 0) * 0.8), 4, 32);
  const staminaCost = clamp(
    Math.round(
      8 +
      Math.max(0, riskPenalty / 4) +
      (half === "back" ? 2 : 0) +
      (triggeredTechnique?.technique.staminaCost || 0) +
      techniqueSituationCost
    ),
    5,
    36,
  );
  const mentalShift = advantage > 10 ? -2 : advantage < -5 ? 2 : 0;
  const relationDelta = {
    friendship: action.includes("守") || action.includes("助") ? 2 : 0,
    rivalry: action.includes("挑") || action.includes("斬") || triggeredTechnique ? 2 : 1,
    respect: advantage > 5 ? 2 + (triggeredTechnique ? 1 : 0) : 1,
    caution: advantage > 0 ? 3 + (triggeredTechnique ? 1 : 0) : 1,
  };

  enemyState.hp -= damage;
  actorState.stamina -= staminaCost;
  enemyState.mental += mentalShift;
  clampBattleState(actorState);
  clampBattleState(enemyState);

  const severity = advantage > 12 ? "深く" : advantage > 2 ? "浅く" : "かろうじて";
  const damageWord = damage >= 20 ? "大ダメージ" : damage >= 11 ? "中ダメージ" : "小ダメージ";
  const actionFlavor = actionFlavorText(attacker, defender, action, advantage, severity, triggeredTechnique);

  return {
    advantage,
    damage,
    staminaCost,
    triggeredTechnique,
    techniqueSituationCost,
    mentalShift,
    relationDelta,
    playerStateAfter: actorState,
    enemyStateAfter: enemyState,
    log: actionFlavor,
    summary: `${triggeredTechnique ? `技「${triggeredTechnique.technique.name}」発動。` : ""}${defender.name}に${damageWord}。${attacker.name}のSTAMINA -${staminaCost}。${defender.name}の警戒値 +${relationDelta.caution}。`,
  };
}

function enemyCounterAction(attacker, defender, relation, turn, half, playerStateBase, enemyStateBase) {
  if (enemyStateBase.hp <= 0) return null;

  const playerState = structuredClone(playerStateBase);
  const enemyState = structuredClone(enemyStateBase);

  const aggression = relation.rivalry + (half === "back" ? 8 : 0) + enemyState.awaken / 3;
  const precision = attacker.stats.mind * 0.36 + attacker.stats.spd * 0.26 + aggression * 0.18;
  const defense = defender.stats.spd * 0.24 + defender.stats.mind * 0.24 + randomBetween(-6, 6);
  const delta = precision - defense;
  const damage = clamp(Math.round(8 + delta / 6), 5, 24);
  const staminaCost = clamp(Math.round(7 + aggression / 12), 6, 16);
  const mentalShift = relation.rivalry >= 20 ? -3 : -1;
  const voice = archetypeVoices[attacker.archetype] || archetypeVoices.cool;

  playerState.hp -= damage;
  enemyState.stamina -= staminaCost;
  playerState.mental += mentalShift;
  clampBattleState(playerState);
  clampBattleState(enemyState);

  return {
    damage,
    staminaCost,
    mentalShift,
    playerStateAfter: playerState,
    enemyStateAfter: enemyState,
    log: `${attacker.name}は${attacker.ability}を鋭く走らせ、${defender.name}へ反撃する。\n${attacker.name}「${delta > 8 ? voice.taunt : voice.resolve}」\n${delta > 8
      ? `${defender.name}は対応が一瞬遅れ、痛烈な一撃を受けた。`
      : `${defender.name}は急所を外したが、それでも衝撃を受け止めきれない。`}`,
    summary: `${defender.name}に${damage >= 16 ? "大" : "中"}ダメージ。${attacker.name}のSTAMINA -${staminaCost}。${defender.name}のMENTAL ${mentalShift}。`,
  };
}

function computeChatDelta(chatCategory, lastChatCategory) {
  const chat = chatDefinitions[chatCategory];
  return { ...chat, repeated: lastChatCategory === chatCategory };
}

function buildBattleSpeechInput(chatCategory, customBattleLine, lastChatCategory, relation) {
  if (customBattleLine) {
    const inferredCategory = inferBattleSpeechCategory(customBattleLine, chatCategory);
    const delta = {
      ...analyzeChatMessageEffect(customBattleLine, relation),
      repeated: lastChatCategory === inferredCategory,
      heat: calculateBattleSpeechHeat(customBattleLine, inferredCategory),
    };
    return {
      category: inferredCategory,
      line: customBattleLine,
      label: `自由台詞${inferredCategory ? ` / ${chatDefinitions[inferredCategory]?.label || inferredCategory}` : ""}`,
      delta,
      custom: true,
    };
  }

  if (!chatCategory) {
    return null;
  }

  return {
    category: chatCategory,
    line: "",
    label: `チャット: ${chatDefinitions[chatCategory].label}`,
    delta: computeChatDelta(chatCategory, lastChatCategory),
    custom: false,
  };
}

function generateBattleInterjection(enemy, relation, playerOutcome, battle) {
  const voice = archetypeVoices[enemy.archetype] || archetypeVoices.cool;
  const pressureHigh = playerOutcome.damage >= 18;
  const cautious = relation.caution >= 22;
  const rivalrous = relation.rivalry >= 22;

  if (pressureHigh && cautious) {
    return `${voice.resolve} ……今の一手、軽く見ていたら危なかった。`;
  }

  if (pressureHigh && rivalrous) {
    return `${voice.taunt} その程度じゃ終われないわ。もっと見せなさい。`;
  }

  if (battle.half === "back" && rivalrous) {
    return `熱が上がる。${voice.resolve} ここからが本番よ。`;
  }

  if (playerOutcome.triggeredTechnique) {
    return `${playerOutcome.triggeredTechnique.technique.name}……なるほど。そう来るのね。`;
  }

  return `${voice.resolve} まだ、読み切れない。だからこそ面白い。`;
}

function generateCounterAfterLine(enemy, relation, enemyOutcome, battle) {
  const voice = archetypeVoices[enemy.archetype] || archetypeVoices.cool;
  const heavyHit = enemyOutcome.damage >= 16;
  const rivalryHigh = relation.rivalry >= 28;
  const backHalf = battle.half === "back";

  if (heavyHit && rivalryHigh) {
    return `${voice.taunt} ほら、そんな顔をするな。ここからが本番だろう？`;
  }

  if (heavyHit && backHalf) {
    return `${voice.resolve} まだ倒れないなら、次はもっと深く踏み込むだけだ。`;
  }

  if (relation.friendship >= 24) {
    return `……いい反応だ。簡単には折れないって、ちゃんと分かってる。`;
  }

  if (relation.caution >= 24) {
    return `${voice.resolve} 今ので終わったと思わないで。次はもっと正確に仕留める。`;
  }

  return `${voice.resolve} その程度じゃ、まだ私を黙らせられない。`;
}

function inferBattleSpeechCategory(line, fallbackCategory = "resolve") {
  if (/(ありがとう|感謝|助かった)/.test(line)) return "thanks";
  if (/(認め|すごい|強い|見事|さすが)/.test(line)) return "praise";
  if (/(ごめん|悪かった|謝)/.test(line)) return "apology";
  if (/(大丈夫|心配|無理するな|休め)/.test(line)) return "concern";
  if (/(倒す|負けない|挑発|煽|かかってこい|黙れ)/.test(line)) return "taunt";
  if (/(次|再戦|また戦)/.test(line)) return "rematch";
  if (/(よろしく|初めまして|会えて)/.test(line)) return "greeting";
  return fallbackCategory || "resolve";
}

function calculateBattleSpeechHeat(line, category) {
  let heat = chatDefinitions[category]?.heat || 4;
  if (/[！？!！]/.test(line)) heat += 1;
  if (/(絶対|必ず|今度こそ|本気)/.test(line)) heat += 2;
  if (/(静かに|落ち着いて|ちゃんと)/.test(line)) heat -= 1;
  return clamp(heat, 1, 10);
}

function generateFallbackBattleSpeech(player, battleSpeech, relation) {
  if (battleSpeech.custom && battleSpeech.line) {
    return battleSpeech.line;
  }
  return generateFallbackChatLine(player, battleSpeech.category || "resolve", relation);
}

async function generateAiTurnText(context) {
  const relation = context.relation;
  const historySnapshot = buildRelationshipHistorySnapshot("player", context.enemy.id, {
    includeBattle: true,
    battle: context.battle,
  });
  const prompt = [
    "Generate a JSON object only.",
    "You are the battle narrator for an original character relationship battle game.",
    "Write Japanese prose that feels like a fusion of a novel and a game log.",
    "Use light-novel style narration, sensory detail, emotion, and dramatic rhythm.",
    "Do not change the numeric outcomes. Use the provided outcomes exactly.",
    "Strongly prioritize consistency with previous battles, chats, memories, and the full character sheets.",
    "",
    "Output keys:",
    'battleLog, battleSummary, chatLine, enemyReaction, enemyInterjection, counterLog, counterSummary, relationNote, memoryHint',
    "",
    `Turn: ${context.battle.turn}`,
    `Half: ${context.battle.half}`,
    `Player action: ${context.action}`,
    `Chat category: ${context.chatCategory || "none"}`,
    `Direct battle line: ${context.customBattleLine || "none"}`,
    `Triggered technique: ${context.playerOutcome.triggeredTechnique ? JSON.stringify({
      name: context.playerOutcome.triggeredTechnique.technique.name,
      type: context.playerOutcome.triggeredTechnique.technique.type,
      effect: context.playerOutcome.triggeredTechnique.technique.effect,
      description: context.playerOutcome.triggeredTechnique.technique.description,
      matchedBy: context.playerOutcome.triggeredTechnique.matchedBy,
      matchScore: context.playerOutcome.triggeredTechnique.matchScore,
      extraSituationCost: context.playerOutcome.techniqueSituationCost,
    }) : "none"}`,
    "",
    `Player sheet: ${compactCharacterSheet(context.player)}`,
    `Enemy sheet: ${compactCharacterSheet(context.enemy)}`,
    `Relation now: friendship ${relation.friendship}, rivalry ${relation.rivalry}, respect ${relation.respect}, caution ${relation.caution}, title ${relation.title}`,
    `Last remembered event: ${relation.lastMemory}`,
    `Relationship history snapshot: ${historySnapshot}`,
    "",
    `Player action outcome: damage_to_enemy ${context.playerOutcome.damage}, player_stamina_cost ${context.playerOutcome.staminaCost}, enemy_mental_change ${context.playerOutcome.mentalShift}, relation_delta ${JSON.stringify(context.playerOutcome.relationDelta)}`,
    context.chatDelta
      ? `Chat effect delta: ${JSON.stringify({
          friendship: context.chatDelta.friendship,
          rivalry: context.chatDelta.rivalry,
          respect: context.chatDelta.respect,
          caution: context.chatDelta.caution,
          repeated: context.chatDelta.repeated,
        })}`
      : "Chat effect delta: none",
    context.enemyOutcome
      ? `Enemy counter outcome: damage_to_player ${context.enemyOutcome.damage}, enemy_stamina_cost ${context.enemyOutcome.staminaCost}, player_mental_change ${context.enemyOutcome.mentalShift}`
      : "Enemy counter outcome: none",
    "",
    "Requirements:",
    "- battleLog should narrate the player's action with novel-like dramatic texture and should usually include spoken lines from either side.",
    "- use the full character settings, including speech habits, likes, dislikes, origin, reactions, techniques, and notes, when choosing wording.",
    "- battleSummary should summarize the numeric result naturally but still read like fiction.",
    "- if Direct battle line is present, chatLine should preserve its intent and wording instead of replacing it with a category template.",
    "- chatLine should sound like the player character.",
    "- enemyReaction should sound like the enemy character and answer the emotional content of the line.",
    "- enemyInterjection should provide a spoken reaction from the enemy about the battle situation itself, not just repeat enemyReaction.",
    "- enemyInterjection should feel like part of an ongoing verbal exchange and should move the tension forward.",
    "- counterLog should narrate the enemy counterattack with momentum, cinematic clarity, and should usually include the enemy speaking.",
    "- counterSummary should summarize its numeric result naturally.",
    "- relationNote should describe relationship/emotional movement in one sentence.",
    "- memoryHint should be a short sentence suitable for a memory log.",
  ].join("\n");

  const text = await fetchCohereJson({
    model: state.settings.model,
    temperature: state.settings.temperature,
    maxTokens: state.settings.maxTokens,
    responseSchema: {
      type: "object",
      required: [
        "battleLog",
        "battleSummary",
        "chatLine",
        "enemyReaction",
        "enemyInterjection",
        "counterLog",
        "counterSummary",
        "relationNote",
        "memoryHint",
      ],
      properties: {
        battleLog: { type: "string" },
        battleSummary: { type: "string" },
        chatLine: { type: "string" },
        enemyReaction: { type: "string" },
        enemyInterjection: { type: "string" },
        counterLog: { type: "string" },
        counterSummary: { type: "string" },
        relationNote: { type: "string" },
        memoryHint: { type: "string" },
      },
    },
    messages: [
      { role: "system", content: "Return only a JSON object that follows the user's requested keys." },
      { role: "user", content: prompt },
    ],
  });

  return JSON.parse(text);
}

async function generateAiRelationshipReply({ actor, target, relation, playerMessage, thread, chatMeta, battleBundle, inferredTopic }) {
  const historySnapshot = buildRelationshipHistorySnapshot(actor.id, target.id, {
    includeBattle: false,
  });
  const namedThread = buildNamedRelationshipThread(actor, target, thread);
  const recentCharacterReplies = thread
    .filter((item) => item.sender === "character")
    .slice(-3)
    .map((item) => item.text);
  const availableAnchors = collectCharacterAnchors(target).slice(0, 10);
  const prompt = [
    "Generate a JSON object only.",
    "You are writing a Japanese messenger-app reply for an original character relationship game.",
    "Reflect the target character's personality, tone, memories, and current relationship values.",
    "Strongly prioritize consistency with previous chats, battle memories, full character settings, and the most recent relationship history.",
    "Do not only mirror the user's emotion. Move the conversation forward.",
    "The tone should feel like a fusion of a novel scene and an in-game conversation.",
    "Use the full character sheet, not just the current mood.",
    "The actor and target are different people. Never swap them, merge them, or make the target praise themself.",
    "Only the target character may speak in reply.",
    "",
    "Output keys:",
    "reply, moodNote, memoryHint, moveType, nextHook",
    "",
    `Actor character: ${compactCharacterSheet(actor)}`,
    `Target character: ${compactCharacterSheet(target)}`,
    `Relationship: friendship ${relation.friendship}, rivalry ${relation.rivalry}, respect ${relation.respect}, caution ${relation.caution}, title ${relation.title}`,
    `Last remembered event: ${relation.lastMemory}`,
    `Battle record summary: ${JSON.stringify(battleBundle)}`,
    `Relationship history snapshot: ${historySnapshot}`,
    `Conversation meta: ${JSON.stringify(chatMeta)}`,
    `Inferred topic: ${inferredTopic}`,
    `Player message: ${playerMessage}`,
    `Recent named thread: ${JSON.stringify(namedThread)}`,
    `Recent character replies to avoid repeating: ${JSON.stringify(recentCharacterReplies)}`,
    `Character-specific anchors you may use: ${JSON.stringify(availableAnchors)}`,
    "",
    "Requirements:",
    "- reply should be 2 to 4 Japanese sentences with light-novel flavor, while still fitting a messenger app.",
    "- reply is the target character speaking to the actor character above. Do not confuse their identities.",
    "- reply must do one clear forward move: ask a specific follow-up question, reveal a new detail, propose an action, or revisit a remembered event with new nuance.",
    "- avoid repeating the same emotional phrase as the last few replies.",
    "- use concrete details from memories, hobbies, techniques, faction, origin, speech habits, or prior battles when possible.",
    "- when possible, bring in at least one character-specific anchor so different characters do not sound interchangeable.",
    "- do not reuse the same hook or sentence opening as the immediately previous character reply.",
    "- when prior battle results are relevant, understand who won or lost, whether it was close or decisive, and let that affect the tone naturally.",
    "- never confuse who won and who lost in previous battles.",
    "- moodNote should summarize the emotional reaction in one sentence.",
    "- memoryHint should be a short sentence suitable for a memory log.",
    "- moveType should be one of ask, reveal, invite, challenge, reflect.",
    "- nextHook should be a short phrase describing what topic the reply opens next.",
  ].join("\n");

  const text = await fetchCohereJson({
    model: state.settings.model,
    temperature: Math.max(0.85, state.settings.temperature),
    maxTokens: 420,
    responseSchema: {
      type: "object",
      required: ["reply", "moodNote", "memoryHint", "moveType", "nextHook"],
      properties: {
        reply: { type: "string" },
        moodNote: { type: "string" },
        memoryHint: { type: "string" },
        moveType: { type: "string" },
        nextHook: { type: "string" },
      },
    },
    messages: [
      { role: "system", content: "Return only a JSON object that follows the requested keys." },
      { role: "user", content: prompt },
    ],
  });

  return JSON.parse(text);
}

async function generateAiCharaversePost({ author, rawInput, genre, mood }) {
  const prompt = [
    "Generate a JSON object only.",
    "You are a Character-Verse social post converter for an original character game.",
    "Convert the raw parent input into a Japanese social post written by the character themself.",
    "Keep the meaning, but make it feel like the character is posting on their own SNS.",
    `Character sheet: ${compactCharacterSheet(author)}`,
    `Genre: ${resolveCharaverseLabel(genre)}`,
    `Mood: ${charaverseMoods.find((item) => item.key === mood)?.label || mood}`,
    `Raw input: ${rawInput}`,
    "Requirements:",
    "- postText should be 2 to 4 short Japanese sentences.",
    "- keep the character's first person, speaking style, and personality.",
    "- do not make it sound like the parent is posting.",
    "- tags should be short Japanese tags without #.",
    "- emotion should be one short Japanese word or phrase.",
  ].join("\n");

  const text = await fetchCohereJson({
    model: state.settings.model,
    temperature: Math.max(0.8, state.settings.temperature),
    maxTokens: 280,
    responseSchema: {
      type: "object",
      required: ["postText", "tags", "emotion"],
      properties: {
        postText: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        emotion: { type: "string" },
      },
    },
    messages: [
      { role: "system", content: "Return only a JSON object that follows the requested keys." },
      { role: "user", content: prompt },
    ],
  });

  return JSON.parse(text);
}

async function generateAiCharaverseComment({ commenter, author, relation, post, rawInput }) {
  const prompt = [
    "Generate a JSON object only.",
    "You are a Character-Verse comment converter for an original character game.",
    "Convert the raw parent input into a Japanese comment written by the commenter character themself.",
    `Commenter sheet: ${compactCharacterSheet(commenter)}`,
    `Author sheet: ${compactCharacterSheet(author)}`,
    `Relationship: friendship ${relation.friendship}, rivalry ${relation.rivalry}, respect ${relation.respect}, caution ${relation.caution}, title ${relation.title}`,
    `Post genre: ${resolveCharaverseLabel(post.genre)}`,
    `Post text: ${post.postText}`,
    `Raw parent comment intent: ${rawInput}`,
    "Requirements:",
    "- commentText should be 1 to 2 Japanese sentences.",
    "- keep the commenter's tone and personality.",
    "- react naturally to the post instead of sounding generic.",
    "- do not make it excessively aggressive.",
  ].join("\n");

  const text = await fetchCohereJson({
    model: state.settings.model,
    temperature: Math.max(0.8, state.settings.temperature),
    maxTokens: 220,
    responseSchema: {
      type: "object",
      required: ["commentText"],
      properties: {
        commentText: { type: "string" },
      },
    },
    messages: [
      { role: "system", content: "Return only a JSON object that follows the requested keys." },
      { role: "user", content: prompt },
    ],
  });

  return JSON.parse(text);
}

async function fetchCohereJson({ model, temperature, maxTokens, messages, responseSchema }) {
  const response = await fetch(INTERNAL_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      maxTokens,
      responseSchema,
      messages,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = payload?.text;
  if (!text) {
    throw new Error("プロキシ応答にテキストがありません");
  }

  return text;
}

function compactCharacterSheet(character) {
  return JSON.stringify({
    id: character.id,
    name: character.name,
    title: character.title,
    age: character.age,
    gender: character.gender,
    firstPerson: character.firstPerson,
    secondPerson: character.secondPerson,
    archetype: character.archetype,
    faction: character.faction,
    tone: character.tone,
    personality: character.personality,
    ability: character.ability,
    style: character.style,
    weakness: character.weakness,
    ultimate: character.ultimate,
    origin: character.origin,
    likes: character.likes,
    dislikes: character.dislikes,
    hobbies: character.hobbies,
    techniques: character.techniques,
    mannerisms: character.mannerisms,
    favoritePhrase: character.favoritePhrase,
    hatedPhrase: character.hatedPhrase,
    angerReaction: character.angerReaction,
    praiseReaction: character.praiseReaction,
    tauntReaction: character.tauntReaction,
    gratitudeStyle: character.gratitudeStyle,
    defeatStyle: character.defeatStyle,
    victoryStyle: character.victoryStyle,
    snsHandle: character.snsHandle,
    snsBio: character.snsBio,
    notes: character.notes,
    hasImage: Boolean(character.imageDataUrl),
    hasSnsIcon: Boolean(character.snsImageDataUrl),
    hasChatIcon: Boolean(character.chatImageDataUrl),
    stats: character.stats,
  });
}

function buildRelationshipHistorySnapshot(actorId, targetId, options = {}) {
  const relation = getRelation(actorId, targetId);
  const chatMeta = getChatMeta(actorId, targetId);
  const battleBundle = actorId === "player" ? getBattleRecordBundle(targetId) : getEmptyBattleRecordBundle();
  const memories = getRelevantMemories(targetId, 6)
    .map((memory) => ({
      title: memory.title,
      body: memory.body,
      timestamp: memory.timestamp,
    }));
  const chatDigest = getChatThread(actorId, targetId)
    .slice(-8)
    .map((message) => ({
      sender: message.sender,
      speakerRole: message.speakerRole || (message.sender === "user" ? "actor" : "target"),
      speakerId: message.speakerId || "",
      speakerName: message.speakerName || "",
      text: message.text,
      timestamp: message.timestamp,
    }));

  const payload = {
    relationTitle: relation.title,
    relationValues: {
      friendship: relation.friendship,
      rivalry: relation.rivalry,
      respect: relation.respect,
      caution: relation.caution,
    },
    conversationMeta: chatMeta,
    lastMemory: relation.lastMemory,
    battleHistory: battleBundle,
    recentMemories: memories,
    recentChat: chatDigest,
  };

  if (options.includeBattle && options.battle) {
    payload.currentBattleLog = options.battle.logs
      .slice(-8)
      .map((entry) => ({
        label: entry.label,
        text: entry.text,
      }));
  }

  return JSON.stringify(payload);
}

function getRelevantMemories(targetId, limit = 6) {
  return [...state.memories]
    .filter((memory) => memory.opponentId === targetId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function getBattleRecordBundle(targetId) {
  const records = [...(state.battleRecords[targetId] || [])]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const total = records.length;
  const wins = records.filter((record) => record.result === "win").length;
  const losses = records.filter((record) => record.result === "loss").length;
  const decisiveWins = records.filter((record) => record.result === "win" && record.outcomeType === "decisive").length;
  const decisiveLosses = records.filter((record) => record.result === "loss" && record.outcomeType === "decisive").length;
  const closeBattles = records.filter((record) => record.outcomeType === "close").length;
  const last = records[0] || null;

  return {
    total,
    wins,
    losses,
    decisiveWins,
    decisiveLosses,
    closeBattles,
    last,
    recent: records.slice(0, 5),
  };
}

function getEmptyBattleRecordBundle() {
  return {
    total: 0,
    wins: 0,
    losses: 0,
    decisiveWins: 0,
    decisiveLosses: 0,
    closeBattles: 0,
    last: null,
    recent: [],
  };
}

function summarizeBattleRecord(battle, enemyId, playerWon) {
  const hpGap = Math.abs(battle.playerState.hp - battle.enemyState.hp);
  const staminaGap = Math.abs(battle.playerState.stamina - battle.enemyState.stamina);
  let outcomeType = "standard";

  if (hpGap <= 10) {
    outcomeType = "close";
  } else if (hpGap >= 35 || (hpGap >= 24 && staminaGap >= 20)) {
    outcomeType = "decisive";
  }

  return {
    id: createId(),
    opponentId: enemyId,
    result: playerWon ? "win" : "loss",
    outcomeType,
    playerHp: battle.playerState.hp,
    enemyHp: battle.enemyState.hp,
    playerStamina: battle.playerState.stamina,
    enemyStamina: battle.enemyState.stamina,
    heat: battle.heat,
    turn: battle.turn,
    half: battle.half,
    timestamp: new Date().toISOString(),
  };
}

function saveBattleRecord(targetId, record) {
  if (!state.battleRecords[targetId]) {
    state.battleRecords[targetId] = [];
  }
  state.battleRecords[targetId].push(record);
  state.battleRecords[targetId] = state.battleRecords[targetId]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 24);
}

function generateFallbackChatLine(character, chatCategory, relation) {
  const voice = archetypeVoices[character.archetype] || archetypeVoices.cool;
  let line = character.gratitudeStyle && chatCategory === "thanks"
    ? character.gratitudeStyle
    : voice[chatCategory] || voice.resolve;

  if (chatCategory === "praise" && relation.rivalry >= 20) {
    line += "……認めたくはないけどな";
  }
  if (chatCategory === "rematch" && relation.respect >= 16) {
    line += " 次はもっと高いところでぶつかろう";
  }
  return line;
}

function generateFallbackReactionLine(character, chatCategory, relation) {
  const voice = archetypeVoices[character.archetype] || archetypeVoices.cool;
  if (chatCategory === "thanks" && character.archetype === "gentle") {
    return "そう言ってもらえると、少し嬉しい";
  }
  if (chatCategory === "taunt" && relation.rivalry >= 20) {
    return "その言葉、次の一撃で後悔させるわ";
  }
  if (chatCategory === "apology" && character.archetype === "proud") {
    return "謝る暇があるなら、次の手で示しなさい";
  }
  return voice.resolve;
}

function openingLine(player, enemy, relation) {
  if (relation.rivalry >= 20) {
    return `${enemy.name}は因縁を隠さず刃を構える。「また貴方なのね。今度こそ結果で黙らせるわ」`;
  }
  if (relation.friendship >= 18) {
    return `${enemy.name}は柔らかく息を吐いた。「今日は手加減なしだよ。それでも、少し楽しみ」`;
  }
  return "初対面に近い空気だ。ここでの言動が、次の物語を決めるかもしれない。";
}

function actionFlavorText(attacker, defender, action, advantage, severity, triggeredTechnique) {
  const attackerLine = generateActionLine(attacker, triggeredTechnique, advantage);
  const defenderLine = generateDefenseLine(defender, advantage);
  const techniqueLead = triggeredTechnique
    ? triggeredTechnique.matchedBy === "exact-name"
      ? `${attacker.name}は技「${triggeredTechnique.technique.name}」を発動した。\n${attacker.name}「${attackerLine}」\n${action}`
      : `${attacker.name}は${action}。\nその動きは技「${triggeredTechnique.technique.name}」として形を結ぶ。\n${attacker.name}「${attackerLine}」`
    : `${attacker.name}は${action}。\n${attacker.name}「${attackerLine}」`;
  if (advantage > 10) {
    return `${techniqueLead}\n${defender.name}「${defenderLine}」\n動きは迷いなく噛み合い、${defender.name}へ${severity}刃を通した。`;
  }
  if (advantage > 0) {
    return `${techniqueLead}\n${defender.name}「${defenderLine}」\n完全な直撃ではないが、${defender.name}の構えを崩しつつ傷を刻む。`;
  }
  return `${techniqueLead}\n${defender.name}「${defenderLine}」\nだが${defender.name}も反応し、致命には届かないまま火花だけが散った。`;
}

function keywordScore(action, attacker, triggeredTechnique = null) {
  let score = 0;
  if (action.includes("影") && attacker.ability.includes("影")) score += 10;
  if ((action.includes("氷") || action.includes("凍")) && attacker.ability.includes("氷")) score += 10;
  if (action.includes("高速") || action.includes("背後") || action.includes("回り込")) score += attacker.stats.spd * 0.08;
  if (action.includes("観察") || action.includes("読む") || action.includes("解析")) score += attacker.stats.mind * 0.08;
  if (action.includes("守") || action.includes("庇う")) score += attacker.stats.mind * 0.06;
  if (triggeredTechnique) score += 6;
  return score;
}

function generateActionLine(character, triggeredTechnique, advantage) {
  const voice = archetypeVoices[character.archetype] || archetypeVoices.cool;
  if (triggeredTechnique) {
    if (advantage > 8) return `${triggeredTechnique.technique.name}で押し切る。`;
    if (advantage > 0) return `${triggeredTechnique.technique.name}、通す。`;
    return `${triggeredTechnique.technique.name}……まだ浅いか。`;
  }
  if (advantage > 8) return voice.resolve;
  if (advantage > 0) return "逃がさない。";
  return "……読まれたか。";
}

function generateDefenseLine(character, advantage) {
  const voice = archetypeVoices[character.archetype] || archetypeVoices.cool;
  if (advantage > 10) {
    if (character.archetype === "proud") return "今のは、少しだけ見事だったわ。";
    if (character.archetype === "gentle") return "っ……でも、まだ倒れないよ。";
    return "その一撃、軽くは見られない。";
  }
  if (advantage > 0) {
    return "まだ、踏み込みが甘い。";
  }
  return voice.taunt;
}

function riskScore(action) {
  const riskyWords = ["即死", "無敵", "絶対", "完全停止", "一撃で倒", "消し飛ば"];
  return riskyWords.filter((word) => action.includes(word)).length * 18;
}

function updateAwakenFromState(playerState, enemyState) {
  [playerState, enemyState].forEach((item) => {
    const hpMissing = 100 - item.hp;
    const mentalDrop = 100 - item.mental;
    item.awaken = clamp(Math.round(hpMissing * 0.4 + mentalDrop * 0.35), 0, 100);
  });
}

function shouldFinishBattle(battle) {
  return battle.playerState.hp <= 0 || battle.enemyState.hp <= 0 || (battle.turn >= 6 && !battle.intervalPending);
}

function advanceTurn() {
  const battle = state.battle;
  battle.turn += 1;
  if (battle.turn >= 4) battle.half = "back";
}

function resolveRelationshipTitle(relation) {
  if (relation.rivalry >= 60) return "宿敵";
  if (relation.friendship >= 60) return "親友";
  if (relation.respect >= 36 && relation.rivalry >= 20) return "認めた強者";
  if (relation.rivalry >= 28 && relation.respect >= 18) return "ライバル";
  if (relation.friendship >= 24 && relation.respect >= 12) return "戦友";
  if (relation.caution >= 24) return "警戒対象";
  if (relation.rivalry >= 18) return "ライバル候補";
  return "顔見知り";
}

function getRelation(sourceId, targetId) {
  const key = `${sourceId}:${targetId}`;
  if (!state.relations[key]) {
    state.relations[key] = {
      friendship: 0,
      rivalry: 0,
      respect: 0,
      caution: 0,
      title: "初対面",
      lastMemory: "まだ目立った記憶はない",
    };
  }
  return state.relations[key];
}

function applyRelationDelta(relation, delta) {
  relation.friendship += delta.friendship || 0;
  relation.rivalry += delta.rivalry || 0;
  relation.respect += delta.respect || 0;
  relation.caution += delta.caution || 0;
  relation.friendship = clamp(relation.friendship, 0, 100);
  relation.rivalry = clamp(relation.rivalry, 0, 100);
  relation.respect = clamp(relation.respect, 0, 100);
  relation.caution = clamp(relation.caution, 0, 100);
}

function getChatKey(actorId, targetId) {
  return `${actorId}:${targetId}`;
}

function getChatThread(actorId, targetId) {
  const key = getChatKey(actorId, targetId);
  if (!state.chats[key]) {
    state.chats[key] = [];
  }
  return state.chats[key];
}

function getChatActorCharacter() {
  return getCharacter(state.chatActorId);
}

function getChatTargetCharacter() {
  return getCharacter(state.chatSelectedId);
}

function ensureChatPairState() {
  const actorFallback = getCharacter(state.chatActorId) || getCharacter("player") || state.characters[0] || null;
  if (!actorFallback) return;
  state.chatActorId = actorFallback.id;

  const targets = state.characters.filter((character) => character.id !== state.chatActorId);
  const fallbackTarget = targets[0] || null;
  if (!getCharacter(state.chatSelectedId) || state.chatSelectedId === state.chatActorId) {
    state.chatSelectedId = fallbackTarget?.id || "";
  }
}

function ensureSelectedCharacterState() {
  const enemies = getBattleOpponents();
  const fallbackEnemy = enemies[0] || null;

  if (!getCharacter(state.selectedEnemyId) || state.selectedEnemyId === "player") {
    state.selectedEnemyId = fallbackEnemy?.id || "";
  }

  ensureChatPairState();

  if (!getCharacter(state.editorCharacterId)) {
    state.editorCharacterId = "player";
  }
}

function getPlayer() {
  return getCharacter("player");
}

function getEditorCharacter() {
  return getCharacter(state.editorCharacterId);
}

function getBattleOpponents() {
  return [
    ...state.characters.filter((character) => character.id !== "player"),
    ...(state.communityCharacters || []),
  ];
}

function getCharacter(id) {
  return state.characters.find((character) => character.id === id)
    || (state.communityCharacters || []).find((character) => character.id === id);
}

function updateCharacter(id, newCharacter) {
  state.characters = state.characters.map((character) => {
    if (character.id !== id) return character;
    return makeCharacter(newCharacter);
  });
}

function makeTechnique(overrides = {}) {
  return {
    id: overrides.id || createId(),
    name: overrides.name || "",
    type: overrides.type || "",
    aliases: overrides.aliases || "",
    staminaCost: Number(overrides.staminaCost) || 0,
    power: Number(overrides.power) || 0,
    effect: overrides.effect || "",
    description: overrides.description || "",
  };
}

function buildNewCustomCharacter() {
  state.customCharacterCount = (state.customCharacterCount || 0) + 1;
  const number = state.customCharacterCount;
  return makeCharacter(buildBaseCustomCharacterFields({
    id: `custom-${createId()}`,
    name: `新規キャラ${number}`,
  }));
}

function buildEmptyCharacterTemplate(id) {
  const current = getCharacter(id);
  return makeCharacter({
    ...buildBaseCustomCharacterFields(),
    id,
    name: current?.name || "新規キャラ",
    title: "",
    imageDataUrl: "",
    notes: "",
  });
}

function buildBaseCustomCharacterFields(overrides = {}) {
  return {
    title: "未完成の挑戦者",
    age: "",
    gender: "",
    firstPerson: "私",
    secondPerson: "あなた",
    archetype: "cool",
    faction: "フリー",
    tone: "まだ定まっていない口調",
    personality: "これから設定が育っていく新規キャラクター。",
    ability: "能力未設定",
    style: "戦闘スタイル未設定",
    weakness: "",
    ultimate: "",
    origin: "",
    likes: "",
    dislikes: "",
    hobbies: "",
    mannerisms: "",
    favoritePhrase: "",
    hatedPhrase: "",
    angerReaction: "",
    praiseReaction: "",
    tauntReaction: "",
    gratitudeStyle: "",
    defeatStyle: "",
    victoryStyle: "",
    snsHandle: "",
    snsBio: "",
    notes: "ここに設定メモを書けます。",
    snsImageDataUrl: "",
    chatImageDataUrl: "",
    techniques: [],
    stats: { atk: 60, spd: 60, mind: 60, charm: 60 },
    ...overrides,
  };
}

function detectTriggeredTechnique(action, character) {
  const actionNormalized = normalizeTechniqueText(action);
  if (!actionNormalized || !character.techniques.length) {
    return null;
  }

  let bestMatch = null;

  character.techniques.forEach((technique) => {
    const candidates = [
      { text: technique.name, source: "exact-name" },
      ...splitTechniqueAliases(technique.aliases).map((alias) => ({ text: alias, source: "alias" })),
      ...extractTechniqueHintPhrases(technique.effect).map((phrase) => ({ text: phrase, source: "effect" })),
      ...extractTechniqueHintPhrases(technique.description).map((phrase) => ({ text: phrase, source: "description" })),
    ].filter((item) => item.text);

    candidates.forEach((candidate) => {
      const candidateNormalized = normalizeTechniqueText(candidate.text);
      if (!candidateNormalized || candidateNormalized.length < 2) {
        return;
      }

      let score = 0;
      let matchedBy = candidate.source;
      if (actionNormalized.includes(candidateNormalized)) {
        score = candidate.source === "exact-name" ? 20 : 18;
      } else if (isOrderedSubsequence(candidateNormalized, actionNormalized)) {
        score = candidate.source === "exact-name" ? 15 : 12;
        matchedBy = `${candidate.source}-subsequence`;
      } else {
        const overlap = keywordOverlapScore(actionNormalized, candidateNormalized);
        if (overlap >= 2) {
          score = overlap * 3;
          matchedBy = `${candidate.source}-overlap`;
        }
      }

      if (!score) {
        return;
      }

      if (!bestMatch || score > bestMatch.matchScore) {
        bestMatch = {
          technique,
          matchedText: candidate.text,
          matchedBy,
          matchScore: score,
        };
      }
    });
  });

  return bestMatch;
}

function calculateTechniqueSituationCost(action, technique, half, turn) {
  let extraCost = 0;
  if (half === "back") extraCost += 2;
  if (turn >= 4) extraCost += 1;
  if (/全力|最大|一気に|連続|乱舞|叩き込|直撃/.test(action)) extraCost += 2;
  if (/慎重|牽制|軽く|様子見/.test(action)) extraCost -= 1;
  if (technique.power >= 8) extraCost += 1;
  return clamp(extraCost, -1, 5);
}

function splitTechniqueAliases(value) {
  return String(value || "")
    .split(/[,\n、，／/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractTechniqueHintPhrases(value) {
  return String(value || "")
    .split(/[。\n、，,／/・]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function normalizeTechniqueText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function isOrderedSubsequence(needle, haystack) {
  let pointer = 0;
  for (const char of haystack) {
    if (char === needle[pointer]) {
      pointer += 1;
      if (pointer >= needle.length) {
        return true;
      }
    }
  }
  return false;
}

function keywordOverlapScore(actionNormalized, candidateNormalized) {
  const fragments = [];
  for (let index = 0; index < candidateNormalized.length - 1; index += 1) {
    fragments.push(candidateNormalized.slice(index, index + 2));
  }
  return [...new Set(fragments)].filter((fragment) => actionNormalized.includes(fragment)).length;
}

function cleanupCharacterData(characterId) {
  state.memories = state.memories.filter((memory) => memory.opponentId !== characterId);
  state.charaversePosts = (state.charaversePosts || [])
    .filter((post) => post.authorId !== characterId)
    .map((post) => ({
      ...post,
      reactions: (post.reactions || []).filter((reaction) => reaction.reactorId !== characterId),
      comments: (post.comments || []).filter((comment) => comment.commenterId !== characterId),
    }));
  Object.keys(state.relations).forEach((key) => {
    if (key.includes(`:${characterId}`) || key.startsWith(`${characterId}:`)) {
      delete state.relations[key];
    }
  });
  if (state.battle?.enemyId === characterId) {
    state.battle = null;
  }
  Object.keys(state.chats).forEach((key) => {
    if (key.includes(`${characterId}:`) || key.endsWith(`:${characterId}`)) {
      delete state.chats[key];
    }
  });
  delete state.battleRecords[characterId];
  Object.keys(state.chatMeta).forEach((key) => {
    if (key.includes(`${characterId}:`) || key.endsWith(`:${characterId}`)) {
      delete state.chatMeta[key];
    }
  });
  if (state.chatActorId === characterId) {
    state.chatActorId = "player";
  }
  if (state.chatSelectedId === characterId) {
    const fallback = state.characters.find((character) => character.id !== "player" && character.id !== characterId);
    state.chatSelectedId = fallback?.id || "";
  }
}

function appendLog(type, label, text) {
  if (!state.battle) return;
  state.battle.logs.push({ type, label, text });
}

function appendSystemNotice(text) {
  if (state.battle) {
    appendLog("system", "通知", text);
  }
}

function saveMemory(opponentId, title, body) {
  state.memories.push({
    id: createId(),
    opponentId,
    title,
    body,
    timestamp: new Date().toISOString(),
  });
}

function clampBattleState(item) {
  item.hp = clamp(item.hp, 0, 100);
  item.stamina = clamp(item.stamina, 0, 100);
  item.mental = clamp(item.mental, 0, 100);
  item.awaken = clamp(item.awaken, 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatChatDay(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function formatTimeOnly(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function canUseApi() {
  return Boolean(state.settings.useApi && state.settings.model);
}

function getAiModeText() {
  return canUseApi() ? `Command R+ Proxy (${state.settings.model})` : "ローカル演出";
}

async function testServerApi(model) {
  const response = await fetch(INTERNAL_TEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return payload;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function resizeImageFile(file, maxSize = 640, quality = 0.84) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/webp", quality);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ファイルを読めませんでした"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像として読み込めませんでした"));
    image.src = src;
  });
}

async function handleCharaverseManualComment(postId) {
  const post = getAnyCharaversePost(postId);
  if (!post) return;
  const actorSelect = document.querySelector(`[data-charaverse-actor="${postId}"]`);
  const input = document.querySelector(`[data-charaverse-comment-input="${postId}"]`);
  const commenter = getCharacter(actorSelect?.value || "");
  const author = getPostAuthorCharacter(post);
  const rawInput = String(input?.value || "").trim();
  if (!commenter || !author || !rawInput || commenter.id === author.id) return;

  const relation = getRelation(commenter.id, author.id);
  let text = "";
  if (canUseApi()) {
    try {
      const generated = await generateAiCharaverseComment({ commenter, author, relation, post, rawInput });
      text = generated.commentText;
      state.settings.apiStatus = `繧ｭ繝｣繝ｩ繝舌・繧ｹ繧ｳ繝｡繝ｳ繝育函謌・ ${state.settings.model}`;
    } catch (error) {
      state.settings.apiStatus = `繧ｭ繝｣繝ｩ繝舌・繧ｹ繧ｳ繝｡繝ｳ繝医・繝ｭ繝ｼ繧ｫ繝ｫ陬懈ｭ｣縺ｸ蛻・崛: ${error.message}`;
    }
  }
  if (!text) {
    text = generateLocalManualCharaverseComment(commenter, author, rawInput);
  }

  const delta = inferCharaverseCommentDelta(post, relation, text);
  const replyContext = state.charaverseReplyContext?.postId === post.id
    ? state.charaverseReplyContext
    : null;
  const commentEntry = {
    id: createId(),
    commenterId: commenter.id,
    commenterSnapshot: buildPostAuthorSnapshot(commenter),
    profileId: state.communityProfileId,
    profileName: getCommunityProfileName(),
    text,
    timestamp: new Date().toISOString(),
    parentCommentId: replyContext?.commentId || "",
    replyToName: replyContext?.targetName || "",
    delta,
    memory: `${commenter.name} が ${author.name} の投稿にコメントした`,
  };

  if (post.scope === "community") {
    await publishCommunityComment(post, author, commenter, commentEntry);
  } else {
    post.comments = post.comments || [];
    post.comments.push(commentEntry);
    applyRelationDelta(relation, delta);
    relation.title = resolveRelationshipTitle(relation);
    relation.lastMemory = `${commenter.name} が ${author.name} の投稿にコメントした`;
    saveMemory(author.id, `繧ｭ繝｣繝｣繝舌・繧ｹ謇句虚繧ｳ繝｡繝ｳ繝・ ${commenter.name}`, relation.lastMemory);
    saveState();
  }

  if (input) input.value = "";
  if (replyContext) {
    clearReplyContext();
    return;
  }
  renderAll();
}

function bindCharaverse() {
  elements.charaverseAuthorSelect.addEventListener("change", () => {
    state.charaverseComposer.authorId = elements.charaverseAuthorSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseGenreSelect.addEventListener("change", () => {
    state.charaverseComposer.genre = elements.charaverseGenreSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseMoodSelect.addEventListener("change", () => {
    state.charaverseComposer.mood = elements.charaverseMoodSelect.value;
    saveState();
    renderAll();
  });

  elements.charaverseRawInput.addEventListener("input", () => {
    renderCharaversePreview();
  });

  elements.charaverseSharePublic.addEventListener("change", () => {
    state.charaverseComposer.sharePublic = elements.charaverseSharePublic.checked;
    saveState();
  });

  elements.charaverseReroll.addEventListener("click", async () => {
    await renderCharaversePreview(true);
  });

  elements.charaverseRefreshCommunity.addEventListener("click", async () => {
    await syncCommunitySnapshot(true);
  });

  elements.charaverseRefreshCommunityInline.addEventListener("click", async () => {
    await syncCommunitySnapshot(true);
  });

  elements.charaverseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createCharaversePost();
  });

  const bindReplyActions = async (event) => {
    const profileTrigger = event.target.closest("[data-profile-open]");
    if (profileTrigger) {
      handleProfileOpen(profileTrigger);
      return true;
    }

    const replyTrigger = event.target.closest("[data-charaverse-reply]");
    if (replyTrigger) {
      const post = getAnyCharaversePost(replyTrigger.dataset.charaverseReplyPost);
      const comment = findCommentInPost(post, replyTrigger.dataset.charaverseReply);
      if (post && comment) {
        const commenter = getCharacter(comment.commenterId) || comment.commenterSnapshot || { name: "隱ｰ縺・" };
        setReplyContext(post.id, comment.id, commenter.name || "隱ｰ縺・");
      }
      return true;
    }

    const replyCancelButton = event.target.closest("[data-charaverse-reply-cancel]");
    if (replyCancelButton) {
      clearReplyContext();
      return true;
    }

    return false;
  };

  elements.charaverseTimeline.addEventListener("click", async (event) => {
    if (await bindReplyActions(event)) return;

    const likeButton = event.target.closest("[data-charaverse-like]");
    if (likeButton) {
      await handleCharaverseLike(likeButton.dataset.charaverseLike);
      return;
    }

    const commentButton = event.target.closest("[data-charaverse-comment]");
    if (commentButton) {
      await handleCharaverseManualComment(commentButton.dataset.charaverseComment);
      return;
    }

    const deleteButton = event.target.closest("[data-charaverse-delete]");
    if (deleteButton) {
      deleteCharaversePost(deleteButton.dataset.charaverseDelete);
    }
  });

  elements.charaverseProfilePanel.addEventListener("click", async (event) => {
    const closeButton = event.target.closest("[data-charaverse-profile-close]");
    if (closeButton) {
      closeCharaverseProfile();
      return;
    }

    const followButton = event.target.closest("[data-charaverse-follow]");
    if (followButton) {
      toggleProfileFollow(followButton.dataset.charaverseFollow);
      return;
    }

    if (await bindReplyActions(event)) return;

    const commentButton = event.target.closest("[data-charaverse-comment]");
    if (commentButton) {
      await handleCharaverseManualComment(commentButton.dataset.charaverseComment);
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);

    const parsed = JSON.parse(raw);
    const mergedSampleCharacters = sampleCharacters.map((sample) => {
      const saved = parsed.characters?.find((item) => item.id === sample.id) || {};
      return makeCharacter({ ...sample, ...saved, stats: { ...sample.stats, ...(saved.stats || {}) } });
    });
    const customCharacters = (parsed.characters || [])
      .filter((item) => !SAMPLE_CHARACTER_IDS.has(item.id))
      .map((item) => makeCharacter(item));
    const characters = [...mergedSampleCharacters, ...customCharacters];

    return {
      ...structuredClone(defaultState),
      ...parsed,
      settings: {
        ...structuredClone(defaultState.settings),
        ...(parsed.settings || {}),
      },
      characters,
      customCharacterCount: Number(parsed.customCharacterCount) || customCharacters.length || 0,
      charaverseComposer: {
        ...structuredClone(defaultState.charaverseComposer),
        ...(parsed.charaverseComposer || {}),
      },
      charaversePosts: parsed.charaversePosts || structuredClone(defaultState.charaversePosts),
      communityCharacters: (parsed.communityCharacters || []).map((item) => makeCharacter(item)),
      communityPosts: parsed.communityPosts || structuredClone(defaultState.communityPosts),
      chats: parsed.chats || structuredClone(defaultState.chats),
      battleRecords: parsed.battleRecords || structuredClone(defaultState.battleRecords),
      chatMeta: parsed.chatMeta || structuredClone(defaultState.chatMeta),
      battle: parsed.battle || null,
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
