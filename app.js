const STORAGE_KEY = "oc-battle-link-prototype-v2";
const DEFAULT_MODEL = "command-r-plus-08-2024";
const SAMPLE_CHARACTER_IDS = new Set(["player", "eira", "shino", "sera"]);
const INTERNAL_CHAT_URL = "/api/cohere/chat";
const INTERNAL_TEST_URL = "/api/cohere/test";

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
    notes: "",
    imageDataUrl: "",
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
  editorCharacterId: "player",
  editorTechniqueIndex: -1,
  selectedEnemyId: "eira",
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
  deleteCharacter: document.getElementById("delete-character"),
  resetCharacter: document.getElementById("reset-character"),
  characterImagePreview: document.getElementById("character-image-preview"),
  characterImageInput: document.getElementById("character-image-input"),
  removeCharacterImage: document.getElementById("remove-character-image"),
  enemyRoster: document.getElementById("enemy-roster"),
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
  relationsList: document.getElementById("relations-list"),
  memoriesList: document.getElementById("memories-list"),
};

init();

function init() {
  bindNavigation();
  bindApiSettings();
  bindCharacterEditor();
  bindBattleControls();
  renderRelationshipBadges();
  renderAll();
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

  elements.removeCharacterImage.addEventListener("click", () => {
    const current = getEditorCharacter();
    updateCharacter(current.id, { ...current, imageDataUrl: "" });
    saveState();
    renderAll();
  });
}

function bindBattleControls() {
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
    const useChat = form.get("useChat") === "on";

    if (!action) {
      appendLog("system", "通知", "行動入力が空です。短くてもいいので、キャラらしい一手を書いてください。");
      renderBattle();
      return;
    }

    await resolveTurn(action, useChat ? chatCategory : null);
    elements.battleForm.reset();
    elements.battleForm.querySelector('input[name="useChat"]').checked = true;
    renderAll();
  });
}

function switchView(viewName) {
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
}

function renderAll() {
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
  renderRelations();
  renderMemories();
  renderHeroSummary();
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
    notes: (form.get("notes") || "").toString(),
    stats: {
      atk: Number(form.get("atk")) || 60,
      spd: Number(form.get("spd")) || 60,
      mind: Number(form.get("mind")) || 60,
      charm: Number(form.get("charm")) || 60,
    },
  };
}

function renderCharacterImage(character) {
  elements.characterImagePreview.innerHTML = character.imageDataUrl
    ? `<img src="${character.imageDataUrl}" alt="${escapeHtml(character.name)}">`
    : "<span>NO IMAGE</span>";
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
  const enemies = state.characters.filter((character) => character.id !== "player");
  elements.enemyRoster.innerHTML = enemies
    .map((enemy) => {
      const relation = getRelation("player", enemy.id);
      const selectedClass = state.selectedEnemyId === enemy.id ? "selected" : "";
      return `
        <button class="enemy-option ${selectedClass}" data-enemy-id="${escapeHtml(enemy.id)}">
          <strong>${escapeHtml(enemy.name)}</strong>
          <div>${escapeHtml(enemy.title || enemy.ability)}</div>
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
  const enemies = state.characters.filter((character) => character.id !== "player");
  elements.relationsList.innerHTML = enemies
    .map((enemy) => {
      const relation = getRelation("player", enemy.id);
      return `
        <article class="relation-card">
          <div class="section-header compact">
            <div>
              <h3>${escapeHtml(enemy.name)}</h3>
              <p class="memory-meta">${escapeHtml(relation.title)}</p>
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

async function resolveTurn(action, chatCategory) {
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
  const chatDelta = chatCategory ? computeChatDelta(chatCategory, battle.lastChatCategory) : null;

  let aiText = null;
  if (canUseApi()) {
    try {
      aiText = await generateAiTurnText({
        battle,
        player,
        enemy,
        relation,
        action,
        chatCategory,
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

  applyStateTransition(battle, relation, playerOutcome, enemyOutcome, chatDelta, chatCategory);

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

  if (chatCategory) {
    battle.logs.push({
      type: "action",
      label: `チャット: ${chatDefinitions[chatCategory].label}`,
      text: `${player.name}「${aiText?.chatLine || generateFallbackChatLine(player, chatCategory, relation)}」`,
    });
    battle.logs.push({
      type: "system",
      label: "相手反応",
      text: `${enemy.name}「${aiText?.enemyReaction || generateFallbackReactionLine(enemy, chatCategory, relation)}」`,
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
    log: `${attacker.name}は${attacker.ability}を鋭く走らせ、${defender.name}へ反撃する。${delta > 8 ? `「${voice.taunt}」` : ""} ${delta > 8
      ? `${defender.name}は対応が一瞬遅れ、痛烈な一撃を受けた。`
      : `${defender.name}は急所を外したが、それでも衝撃を受け止めきれない。`}`,
    summary: `${defender.name}に${damage >= 16 ? "大" : "中"}ダメージ。${attacker.name}のSTAMINA -${staminaCost}。${defender.name}のMENTAL ${mentalShift}。`,
  };
}

function computeChatDelta(chatCategory, lastChatCategory) {
  const chat = chatDefinitions[chatCategory];
  return { ...chat, repeated: lastChatCategory === chatCategory };
}

async function generateAiTurnText(context) {
  const relation = context.relation;
  const prompt = [
    "Generate a JSON object only.",
    "You are the battle narrator for an original character relationship battle game.",
    "Write anime-style prose in Japanese.",
    "Do not change the numeric outcomes. Use the provided outcomes exactly.",
    "",
    "Output keys:",
    'battleLog, battleSummary, chatLine, enemyReaction, counterLog, counterSummary, relationNote, memoryHint',
    "",
    `Turn: ${context.battle.turn}`,
    `Half: ${context.battle.half}`,
    `Player action: ${context.action}`,
    `Chat category: ${context.chatCategory || "none"}`,
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
    "- battleLog should narrate the player's action.",
    "- battleSummary should summarize the numeric result naturally.",
    "- chatLine should sound like the player character.",
    "- enemyReaction should sound like the enemy character.",
    "- counterLog should narrate the enemy counterattack.",
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
    name: character.name,
    title: character.title,
    archetype: character.archetype,
    tone: character.tone,
    personality: character.personality,
    ability: character.ability,
    style: character.style,
    weakness: character.weakness,
    ultimate: character.ultimate,
    likes: character.likes,
    dislikes: character.dislikes,
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
    notes: character.notes,
    stats: character.stats,
  });
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
  const techniqueLead = triggeredTechnique
    ? triggeredTechnique.matchedBy === "exact-name"
      ? `${attacker.name}は技「${triggeredTechnique.technique.name}」を発動し、${action}。`
      : `${attacker.name}は${action}。その動きは技「${triggeredTechnique.technique.name}」として形を結ぶ。`
    : `${attacker.name}は${action}。`;
  if (advantage > 10) {
    return `${techniqueLead} 動きは迷いなく噛み合い、${defender.name}へ${severity}刃を通した。`;
  }
  if (advantage > 0) {
    return `${techniqueLead} 完全な直撃ではないが、${defender.name}の構えを崩しつつ傷を刻む。`;
  }
  return `${techniqueLead} だが${defender.name}も反応し、致命には届かないまま火花だけが散った。`;
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

function getPlayer() {
  return getCharacter("player");
}

function getEditorCharacter() {
  return getCharacter(state.editorCharacterId);
}

function getCharacter(id) {
  return state.characters.find((character) => character.id === id);
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
    notes: "ここに設定メモを書けます。",
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
  Object.keys(state.relations).forEach((key) => {
    if (key.includes(`:${characterId}`) || key.startsWith(`${characterId}:`)) {
      delete state.relations[key];
    }
  });
  if (state.battle?.enemyId === characterId) {
    state.battle = null;
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
