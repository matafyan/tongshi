/**
 * 一起成事 (Build Together) — Real-time teammate matching
 * Optimized version with step-based UX, improved scoring, and PWA support
 */

(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────
  const state = {
    currentLang: "zh",
    currentStep: 0, // 0=form, 1=matching, 2=connected
    published: false,
    joinedId: null,
    timerInterval: null,
    timerRemaining: 0,
    timerPaused: false,
    intent: {
      alias: randomAlias(),
      category: "ai",
      merchant: "Agent 流程",
      budget: "1小时",
      location: "产品组",
      visibility: "全公司可见",
      needed: 2,
      preferences: ["工程实现", "能推进"],
      tags: ["今天就做", "快速验证", "需要搭档"],
      canPickup: true,
      waitTarget: 20
    },
    matches: []
  };

  // ─── DOM refs (cached once) ────────────────────────────
  const els = {};

  // ─── Data ───────────────────────────────────────────────
  const categories = {
    product: {
      name: "产品增长",
      merchants: ["冷启动验证", "用户访谈", "转化漏斗", "MVP 打磨"],
      budgets: ["30分钟", "1小时", "半天", "本周"],
      preferences: ["产品判断", "原型", "数据分析", "用户研究", "能推进"],
      colors: ["#16a085", "#326fd1", "#f0a735"]
    },
    ai: {
      name: "AI 应用",
      merchants: ["Agent 流程", "提示词实验", "自动化工具", "模型评测", "数据清洗"],
      budgets: ["30分钟", "1小时", "半天", "本周"],
      preferences: ["工程实现", "模型评测", "流程设计", "快速试错", "能推进"],
      colors: ["#326fd1", "#7c5cc4", "#16a085"]
    },
    design: {
      name: "体验设计",
      merchants: ["关键页面", "交互流程", "品牌表达", "可用性测试"],
      budgets: ["30分钟", "1小时", "半天", "本周"],
      preferences: ["视觉设计", "交互设计", "文案表达", "用户共情", "能推进"],
      colors: ["#e85d4f", "#326fd1", "#f0a735"]
    },
    ops: {
      name: "运营落地",
      merchants: ["增长活动", "社群实验", "内容分发", "客户跟进"],
      budgets: ["30分钟", "1小时", "半天", "本周"],
      preferences: ["执行落地", "内容策划", "数据复盘", "资源协调", "能推进"],
      colors: ["#f0a735", "#16a085", "#7c5cc4"]
    },
    business: {
      name: "商业探索",
      merchants: ["客户验证", "定价实验", "合作方案", "Demo 演示"],
      budgets: ["30分钟", "1小时", "半天", "本周"],
      preferences: ["客户洞察", "商务沟通", "方案包装", "能拍板", "能推进"],
      colors: ["#7c5cc4", "#326fd1", "#e85d4f"]
    }
  };

  const tags = ["今天就做", "需要搭档", "可远程", "同项目", "强执行", "深度讨论", "快速验证", "能拍板"];
  const locations = ["产品组", "工程组", "设计组", "运营组", "增长组", "远程协作"];
  const visibilities = ["全公司可见", "同部门可见", "熟人同事可见"];
  const aliases = [
    "想把事做成", "今天就推进", "一起破局", "原型搭档", "增长搭档",
    "行动派同事", "能拍板的人", "快速验证员"
  ];

  const aliasesEn = {
    "想把事做成": "Make-it-happen",
    "今天就推进": "Move Today",
    "一起破局": "Breakthrough Partner",
    "原型搭档": "Prototype Partner",
    "增长搭档": "Growth Partner",
    "行动派同事": "Action Teammate",
    "能拍板的人": "Decision Maker",
    "快速验证员": "Fast Validator"
  };

  const valueText = {
    "产品增长": "Product Growth",
    "冷启动验证": "Cold-start Validation",
    "用户访谈": "User Interviews",
    "转化漏斗": "Conversion Funnel",
    "MVP 打磨": "MVP Polish",
    "AI 应用": "AI Applications",
    "Agent 流程": "Agent Workflow",
    "提示词实验": "Prompt Experiments",
    "自动化工具": "Automation Tooling",
    "模型评测": "Model Evaluation",
    "数据清洗": "Data Cleaning",
    "体验设计": "Experience Design",
    "关键页面": "Key Page",
    "交互流程": "Interaction Flow",
    "品牌表达": "Brand Expression",
    "可用性测试": "Usability Test",
    "运营落地": "Operations Execution",
    "增长活动": "Growth Campaign",
    "社群实验": "Community Experiment",
    "内容分发": "Content Distribution",
    "客户跟进": "Customer Follow-up",
    "商业探索": "Business Exploration",
    "客户验证": "Customer Validation",
    "定价实验": "Pricing Experiment",
    "合作方案": "Partnership Proposal",
    "Demo 演示": "Demo Presentation",
    "30分钟": "30 min",
    "1小时": "1 hour",
    "半天": "Half day",
    "本周": "This week",
    "产品判断": "Product Judgment",
    "原型": "Prototype",
    "数据分析": "Data Analysis",
    "用户研究": "User Research",
    "能推进": "Can Drive",
    "工程实现": "Engineering",
    "流程设计": "Process Design",
    "快速试错": "Rapid Iteration",
    "视觉设计": "Visual Design",
    "交互设计": "Interaction Design",
    "文案表达": "Copywriting",
    "用户共情": "User Empathy",
    "执行落地": "Execution",
    "内容策划": "Content Planning",
    "数据复盘": "Data Review",
    "资源协调": "Resource Coordination",
    "客户洞察": "Customer Insight",
    "商务沟通": "Business Communication",
    "方案包装": "Solution Packaging",
    "能拍板": "Can Decide",
    "今天就做": "Do Today",
    "需要搭档": "Needs Partner",
    "可远程": "Remote OK",
    "同项目": "Same Project",
    "强执行": "Strong Execution",
    "深度讨论": "Deep Discussion",
    "快速验证": "Fast Validation",
    "产品组": "Product Team",
    "工程组": "Engineering Team",
    "设计组": "Design Team",
    "运营组": "Ops Team",
    "增长组": "Growth Team",
    "远程协作": "Remote Collaboration",
    "全公司可见": "Company-wide",
    "同部门可见": "Department only",
    "熟人同事可见": "Known colleagues",
    "用户研究员": "User Researcher",
    "视觉推进器": "Visual Driver",
    "自动化同事": "Automation Teammate",
    "社群实验员": "Community Tester",
    "交互搭档": "Interaction Partner",
    "Demo 冲刺": "Demo Sprinter",
    "评测伙伴": "Evaluation Partner",
    "漏斗医生": "Funnel Doctor",
    "同方向": "Same Direction",
    "同一件事": "Same Thing",
    "同团队": "Same Team",
    "可连接": "Reachable",
    "今天能开始": "Can Start Today",
    "人数合适": "Right Team Size",
    "时间一致": "Same Time Window",
    "时间接近": "Similar Time Window",
    "能力匹配": "Skill Match",
    "决策快": "Fast Decision"
  };

  // Seed data: [alias, category, merchant, budget, location, visibility, preferences[], tags[], canPickup, needed, wait]
  const seedMatches = [
    ["今天就推进", "ai", "Agent 流程", "1小时", "工程组", "全公司可见", ["工程实现", "流程设计"], ["今天就做", "快速验证", "强执行"], true, 1, 8],
    ["原型搭档", "product", "MVP 打磨", "半天", "产品组", "同部门可见", ["产品判断", "原型"], ["同项目", "需要搭档"], true, 2, 16],
    ["用户研究员", "product", "用户访谈", "1小时", "增长组", "全公司可见", ["用户研究", "数据分析"], ["深度讨论", "今天就做"], false, 1, 21],
    ["视觉推进器", "design", "关键页面", "半天", "设计组", "全公司可见", ["视觉设计", "文案表达"], ["快速验证", "强执行"], true, 2, 12],
    ["增长搭档", "ops", "增长活动", "本周", "运营组", "同部门可见", ["执行落地", "数据复盘"], ["同项目", "强执行"], true, 3, 28],
    ["能拍板的人", "business", "客户验证", "1小时", "增长组", "熟人同事可见", ["客户洞察", "能拍板"], ["能拍板", "今天就做"], true, 1, 18],
    ["自动化同事", "ai", "自动化工具", "半天", "工程组", "全公司可见", ["工程实现", "快速试错"], ["可远程", "快速验证"], true, 2, 11],
    ["社群实验员", "ops", "社群实验", "30分钟", "运营组", "全公司可见", ["内容策划", "执行落地"], ["今天就做", "需要搭档"], false, 1, 25],
    ["交互搭档", "design", "交互流程", "1小时", "设计组", "同部门可见", ["交互设计", "用户共情"], ["深度讨论", "同项目"], true, 2, 19],
    ["Demo 冲刺", "business", "Demo 演示", "半天", "远程协作", "全公司可见", ["方案包装", "商务沟通"], ["可远程", "强执行"], true, 1, 14],
    ["评测伙伴", "ai", "模型评测", "1小时", "远程协作", "全公司可见", ["模型评测", "数据清洗"], ["可远程", "快速验证"], true, 2, 23],
    ["漏斗医生", "product", "转化漏斗", "半天", "增长组", "全公司可见", ["数据分析", "能推进"], ["强执行", "同项目"], true, 1, 30]
  ];

  // ─── i18n ──────────────────────────────────────────────
  const uiText = {
    zh: {
      pageTitle: "一起成事 | 实时匹配同事",
      brandTitle: "一起成事",
      brandSubtitle: "实时匹配同事，一起做伟大的事情",
      contact: "想一起做伟大的事，联系 matafyan@qq.com",
      online: "在线",
      collaborators: "可协作",
      currentIntent: "当前想做",
      publishThing: "发布一件要做成的事",
      randomName: "随机昵称",
      alias: "昵称",
      direction: "方向",
      thing: "这件事",
      time: "投入时间",
      team: "团队/地点",
      visibility: "可见范围",
      needed: "还差同事",
      neededSkills: "需要能力",
      signals: "行动信号",
      startToday: "今天能开始",
      expectedResponse: "期望响应",
      startMatching: "开始匹配同事",
      realtimeMatch: "实时匹配",
      matchHeading: "能一起推进的同事",
      published: "实时匹配中",
      unpublished: "未发布",
      empty: "暂无匹配，换个方向或团队试试",
      wait: "等待",
      peopleNeeded: "还差",
      peopleUnit: "人",
      join: "一起做",
      joined: "已连接",
      startedToast: "已开始匹配能一起推进的同事",
      connectedFallback: "已连接同事",
      connectedPrefix: "已连接 ",
      connectedSuffix: "，一起把事做成",
      findingPartner: "正在为你寻找合适的同事...",
      loadingSub: "通常只需几秒",
      connectedTitle: "已连接！",
      connectedSub: "现在可以一起把事做成了",
      startFocusTimer: "开始 25 分钟专注",
      findAnother: "找另一个伙伴",
      focusLabel: "专注中，一起加油",
      pause: "暂停",
      resume: "继续",
      timerDone: "专注完成！一起庆祝一下吧",
      stepDefine: "定义目标",
      stepMatch: "寻找伙伴",
      stepCollaborate: "一起成事"
    },
    en: {
      pageTitle: "Build Together | Real-Time Teammate Matching",
      brandTitle: "Build Together",
      brandSubtitle: "Match with teammates in real time and do something great.",
      contact: "Want to build something great? Contact matafyan@qq.com",
      online: "Online",
      collaborators: "Matches",
      currentIntent: "Current Intent",
      publishThing: "Post one thing to make happen",
      randomName: "Random name",
      alias: "Name",
      direction: "Direction",
      thing: "The thing",
      time: "Time to invest",
      team: "Team / Place",
      visibility: "Visibility",
      needed: "Teammates needed",
      neededSkills: "Needed skills",
      signals: "Action signals",
      startToday: "Can start today",
      expectedResponse: "Expected response",
      startMatching: "Start matching",
      realtimeMatch: "Real-time matching",
      matchHeading: "Teammates who can help move it forward",
      published: "Matching live",
      unpublished: "Not posted",
      empty: "No matches yet. Try another direction or team.",
      wait: "Waiting",
      peopleNeeded: "Need",
      peopleUnit: "more",
      join: "Do it together",
      joined: "Connected",
      startedToast: "Started matching teammates who can move it forward",
      connectedFallback: "Connected with a teammate",
      connectedPrefix: "Connected with ",
      connectedSuffix: ". Time to make it happen.",
      findingPartner: "Finding the right teammate for you...",
      loadingSub: "Usually takes just a few seconds",
      connectedTitle: "Connected!",
      connectedSub: "Now it's time to make it happen together",
      startFocusTimer: "Start 25-min focus session",
      findAnother: "Find another partner",
      focusLabel: "Focusing together, let's go",
      pause: "Pause",
      resume: "Resume",
      timerDone: "Focus session complete! Celebrate your progress",
      stepDefine: "Define Goal",
      stepMatch: "Find Partner",
      stepCollaborate: "Collaborate"
    }
  };

  // ─── Helpers ────────────────────────────────────────────
  function t(key) {
    return uiText[state.currentLang]?.[key] || uiText.zh[key] || key;
  }

  function displayValue(value) {
    if (state.currentLang === "zh") return value;
    return valueText[value] || value;
  }

  function displayAlias(value) {
    if (!value) return value;
    // Find matching alias pair
    for (const [zh, en] of Object.entries(aliasesEn)) {
      if (value.startsWith(zh) || value.startsWith(en)) {
        const sourcePrefix = value.startsWith(zh) ? zh : en;
        const suffix = value.slice(sourcePrefix.length);
        if (suffix && !/^\d+$/.test(suffix)) return value;
        return `${state.currentLang === "zh" ? zh : en}${suffix}`;
      }
    }
    return value;
  }

  function initials(name) {
    if (state.currentLang === "zh") return name.slice(0, 2);
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function randomAlias() {
    const zh = aliases[randomInt(0, aliases.length - 1)];
    const en = aliasesEn[zh];
    const num = randomInt(10, 99);
    return state.currentLang === "zh" ? `${zh}${num}` : `${en}${num}`;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showToast(message) {
    const el = els.toast;
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.classList.remove("visible");
    }, 2400);
  }

  // ─── DOM Cache ──────────────────────────────────────────
  function cacheElements() {
    const ids = [
      "onlineCount", "matchCount", "rerollName",
      "intentForm", "aliasInput", "categorySelect", "merchantSelect",
      "budgetSelect", "locationSelect", "visibilitySelect",
      "neededInput", "preferenceOptions", "tagOptions",
      "pickupToggle", "waitInput", "waitOutput",
      "publishState", "matchList", "toast",
      "loadingState", "connectedWith",
      "startTimerBtn", "newMatchBtn", "focusTimer",
      "timerMinutes", "timerSeconds", "pauseTimerBtn",
      "stepIndicator"
    ];
    ids.forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  // ─── i18n ──────────────────────────────────────────────
  function applyI18n() {
    document.documentElement.lang = state.currentLang === "zh" ? "zh-CN" : "en";
    document.title = t("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (key && uiText[state.currentLang]?.[key]) {
        node.textContent = uiText[state.currentLang][key];
      }
    });
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === state.currentLang);
    });
  }

  // ─── Form Hydration ────────────────────────────────────
  function renderBaseSelectOptions() {
    fillSelect(els.categorySelect, Object.entries(categories).map(([value, cat]) => [value, cat.name]));
    fillSelect(els.locationSelect, locations.map((item) => [item, item]));
    fillSelect(els.visibilitySelect, visibilities.map((item) => [item, item]));
  }

  function updateCategoryOptions() {
    const category = categories[els.categorySelect.value];
    if (!category) return;
    fillSelect(els.merchantSelect, category.merchants.map((item) => [item, item]));
    fillSelect(els.budgetSelect, category.budgets.map((item) => [item, item]));
  }

  function fillSelect(select, options) {
    select.innerHTML = options.map(([value, label]) =>
      `<option value="${value}">${displayValue(label)}</option>`
    ).join("");
  }

  function renderPreferenceOptions() {
    const category = categories[els.categorySelect.value];
    if (!category) return;
    els.preferenceOptions.innerHTML = category.preferences
      .map((item) => {
        const checked = state.intent.preferences.includes(item) ? "checked" : "";
        return `<label class="chip"><input type="checkbox" name="preference" value="${item}" ${checked}><span>${displayValue(item)}</span></label>`;
      })
      .join("");
  }

  function renderTagOptions() {
    els.tagOptions.innerHTML = tags
      .map((item) => {
        const checked = state.intent.tags.includes(item) ? "checked" : "";
        return `<label class="chip"><input type="checkbox" name="tag" value="${item}" ${checked}><span>${displayValue(item)}</span></label>`;
      })
      .join("");
  }

  function setFormValues() {
    const intent = state.intent;
    els.aliasInput.placeholder = t("alias") + "...";
    els.aliasInput.value = displayAlias(intent.alias);
    els.categorySelect.value = intent.category;
    updateCategoryOptions();
    els.merchantSelect.value = intent.merchant;
    els.budgetSelect.value = intent.budget;
    els.locationSelect.value = intent.location;
    els.visibilitySelect.value = intent.visibility;
    els.neededInput.value = intent.needed;
    els.pickupToggle.checked = intent.canPickup;
    els.waitInput.value = intent.waitTarget;
    els.waitOutput.textContent = `${intent.waitTarget}s`;
    renderPreferenceOptions();
    renderTagOptions();
  }

  function updateIntentFromForm() {
    const preferences = [...els.preferenceOptions.querySelectorAll("input:checked")].map((input) => input.value);
    const selectedTags = [...els.tagOptions.querySelectorAll("input:checked")].map((input) => input.value);
    const category = categories[els.categorySelect.value];

    state.intent = {
      alias: els.aliasInput.value.trim() || randomAlias(),
      category: els.categorySelect.value,
      merchant: els.merchantSelect.value,
      budget: els.budgetSelect.value,
      location: els.locationSelect.value,
      visibility: els.visibilitySelect.value,
      needed: Math.max(1, Math.min(4, Number(els.neededInput.value) || 1)),
      preferences: preferences.length ? preferences : [category?.preferences[category.preferences.length - 1] || "能推进"],
      tags: selectedTags.length ? selectedTags : ["今天就做"],
      canPickup: els.pickupToggle.checked,
      waitTarget: Number(els.waitInput.value)
    };
  }

  // ─── Scoring ────────────────────────────────────────────
  function scoreMatch(intent, match) {
    let score = 0;
    const reasons = [];

    // Category match: highest weight
    if (intent.category === match.category) { score += 24; reasons.push("同方向"); }
    // Same specific thing
    if (intent.merchant === match.merchant) { score += 18; reasons.push("同一件事"); }
    // Same team/location
    if (intent.location === match.location) { score += 14; reasons.push("同团队"); }
    // Visibility compatibility
    if (intent.visibility === match.visibility || intent.visibility === "全公司可见" || match.visibility === "全公司可见") {
      score += 8; reasons.push("可连接");
    }
    // Both can start today
    if (intent.canPickup && match.canPickup) { score += 10; reasons.push("今天能开始"); }
    // Online status
    if (match.online) { score += 8; reasons.push("在线"); }
    // Team size compatibility
    if (match.needed <= intent.needed + 1) { score += 6; reasons.push("人数合适"); }

    // Time window compatibility
    const timeGap = budgetDistance(intent, match);
    if (timeGap === 0) { score += 12; reasons.push("时间一致"); }
    else if (timeGap === 1) { score += 9; reasons.push("时间接近"); }

    // Shared tags
    const sharedTags = match.tags.filter((tag) => intent.tags.includes(tag));
    if (sharedTags.length) {
      score += Math.min(16, sharedTags.length * 5);
      reasons.push(...sharedTags.slice(0, 3));
    }

    // Shared preferences (skills)
    const sharedPreferences = match.preferences.filter((item) => intent.preferences.includes(item));
    if (sharedPreferences.length) { score += 7; reasons.push("能力匹配"); }

    // Decision maker bonus
    if (match.preferences.includes("能拍板") || intent.tags.includes("能拍板")) { score += 4; reasons.push("决策快"); }

    // Wait patience bonus (shorter wait = higher score)
    score += Math.max(0, 6 - Math.floor(match.wait / 15));

    return {
      score: Math.min(99, Math.max(0, score)),
      reasons: [...new Set(reasons)].slice(0, 5)
    };
  }

  function budgetDistance(intent, match) {
    const list = categories[intent.category]?.budgets || [];
    const ownIndex = list.indexOf(intent.budget);
    const matchIndex = list.indexOf(match.budget);
    if (ownIndex === -1 || matchIndex === -1) return 99;
    return Math.abs(ownIndex - matchIndex);
  }

  // ─── Ranking ────────────────────────────────────────────
  function getRankedMatches() {
    return state.matches
      .map((match) => {
        const scored = scoreMatch(state.intent, match);
        return { ...match, ...scored };
      })
      .sort((a, b) => b.score - a.score);
  }

  // ─── Rendering ──────────────────────────────────────────
  function render() {
    const ranked = getRankedMatches();
    const online = state.matches.filter((item) => item.online).length + (state.published ? 1 : 0);
    els.onlineCount.textContent = online;
    els.matchCount.textContent = ranked.length;
    els.publishState.textContent = state.published ? t("published") : t("unpublished");
    els.publishState.classList.toggle("active", state.published);
    renderMatchList(ranked);
    updateStepIndicator();
  }

  function renderMatchList(matches) {
    if (!matches.length) {
      els.matchList.innerHTML = `<div class="empty-state">${t("empty")}</div>`;
      return;
    }

    els.matchList.innerHTML = matches
      .slice(0, 8)
      .map((match, index) => {
        const category = categories[match.category];
        const joined = state.joinedId === match.id;
        const reasons = match.reasons
          .map((reason) => `<span class="reason">${displayValue(reason)}</span>`)
          .join("");
        const color = category?.colors?.[index % category.colors.length] || "#16a085";

        return `
          <article class="match-row">
            <div class="avatar" style="background:${color}">${initials(displayValue(match.alias))}</div>
            <div class="match-main">
              <div class="match-title">
                <h3>${displayValue(match.alias)}</h3>
                <span class="score">${match.score}%</span>
              </div>
              <div class="match-meta">${displayValue(category?.name || "")} · ${displayValue(match.merchant)} · ${displayValue(match.budget)} · ${displayValue(match.location)}</div>
              <div class="match-detail">${reasons}</div>
            </div>
            <div class="match-side">
              <span class="wait">${t("wait")} ${match.wait}s · ${t("peopleNeeded")} ${match.needed} ${t("peopleUnit")}</span>
              <button class="match-action ${joined ? "joined" : ""}" type="button" data-join-id="${match.id}">
                ${joined ? t("joined") : t("join")}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function updateStepIndicator() {
    const steps = els.stepIndicator?.querySelectorAll(".step");
    const connectors = els.stepIndicator?.querySelectorAll(".step-connector");
    if (!steps.length) return;

    steps.forEach((step, i) => {
      step.classList.toggle("active", i === state.currentStep);
      step.classList.toggle("completed", i < state.currentStep);
    });
    connectors.forEach((conn, i) => {
      conn.classList.toggle("completed", i < state.currentStep);
    });
  }

  function goToStep(step) {
    state.currentStep = step;
    // Show/hide panels
    els.stepPanel0.style.display = step === 0 ? "" : "none";
    els.stepPanel1.style.display = step === 1 ? "" : "none";
    els.stepPanel2.style.display = step === 2 ? "" : "none";
    updateStepIndicator();
  }

  // ─── Events ─────────────────────────────────────────────
  function attachEvents() {
    // Language toggle
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        updateIntentFromForm();
        state.currentLang = button.dataset.lang;
        applyI18n();
        renderBaseSelectOptions();
        setFormValues();
        render();
      });
    });

    // Category change → update dependent selects
    els.categorySelect.addEventListener("change", () => {
      const category = categories[els.categorySelect.value];
      if (!category) return;
      state.intent.category = els.categorySelect.value;
      state.intent.merchant = category.merchants[0];
      state.intent.budget = category.budgets[Math.min(1, category.budgets.length - 1)];
      state.intent.preferences = [category.preferences[category.preferences.length - 1]];
      updateCategoryOptions();
      setFormValues();
      render();
    });

    // Wait slider
    els.waitInput.addEventListener("input", () => {
      els.waitOutput.textContent = `${els.waitInput.value}s`;
    });

    // Random alias
    els.rerollName.addEventListener("click", () => {
      state.intent.alias = randomAlias();
      els.aliasInput.value = displayAlias(state.intent.alias);
    });

    // Form submit → start matching
    els.intentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateIntentFromForm();
      state.published = true;
      showToast(t("startedToast"));

      // Simulate loading then show matches
      els.loadingState.style.display = "flex";
      els.matchList.innerHTML = "";

      // Small delay for realistic feel
      setTimeout(() => {
        els.loadingState.style.display = "none";
        goToStep(1);
        render();
      }, 800);
    });

    // Join button (delegated)
    els.matchList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-join-id]");
      if (!button) return;
      state.joinedId = button.dataset.joinId;
      const match = state.matches.find((item) => item.id === state.joinedId);
      const msg = match
        ? `${t("connectedPrefix")}${displayValue(match.alias)}${t("connectedSuffix")}`
        : t("connectedFallback");
      showToast(msg);

      // Go to connected step
      setTimeout(() => {
        els.connectedWith.textContent = `${displayValue(match?.alias || "")} · ${displayValue(match?.merchant || "")}`;
        goToStep(2);
        render();
      }, 500);
    });

    // Focus timer
    els.startTimerBtn.addEventListener("click", () => {
      els.focusTimer.style.display = "flex";
      startTimer(25 * 60);
    });

    els.pauseTimerBtn.addEventListener("click", () => {
      if (state.timerPaused) {
        state.timerPaused = false;
        startTimer(state.timerRemaining);
        els.pauseTimerBtn.textContent = t("pause");
      } else {
        clearInterval(state.timerInterval);
        state.timerPaused = true;
        els.pauseTimerBtn.textContent = t("resume");
      }
    });

    // New match (reset)
    els.newMatchBtn.addEventListener("click", () => {
      state.joinedId = null;
      state.published = false;
      state.currentStep = 0;
      clearInterval(state.timerInterval);
      state.timerRemaining = 0;
      state.timerPaused = false;
      els.focusTimer.style.display = "none";
      els.matchList.innerHTML = "";
      els.loadingState.style.display = "none";
      goToStep(0);
      render();
    });
  }

  // ─── Timer ──────────────────────────────────────────────
  function startTimer(seconds) {
    clearInterval(state.timerInterval);
    state.timerRemaining = seconds;
    state.timerPaused = false;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      if (state.timerPaused) return;
      state.timerRemaining--;
      updateTimerDisplay();
      if (state.timerRemaining <= 0) {
        clearInterval(state.timerInterval);
        showToast(t("timerDone"));
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timerRemaining / 60);
    const secs = state.timerRemaining % 60;
    els.timerMinutes.textContent = String(mins).padStart(2, "0");
    els.timerSeconds.textContent = String(secs).padStart(2, "0");
  }

  // ─── Real-time Simulation ───────────────────────────────
  function startRealtime() {
    // Update match data periodically (simulates real-time changes)
    setInterval(() => {
      state.matches = state.matches.map((match) => ({
        ...match,
        wait: Math.max(5, match.wait + randomInt(-4, 6)),
        online: Math.random() > 0.04 ? true : match.online
      }));

      // Occasionally change needed count
      if (Math.random() > 0.56) {
        const index = randomInt(0, state.matches.length - 1);
        state.matches[index] = {
          ...state.matches[index],
          needed: randomInt(1, 4)
        };
      }

      render();
    }, 3600);
  }

  // ─── PWA Registration ──────────────────────────────────
  function registerPWA() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.warn("SW registration failed:", err));
    }

    // Request notification permission for future reminders
    if ("Notification" in navigator && Notification.permission === "default") {
      // Don't ask immediately — wait for user interaction
    }
  }

  // ─── Init ───────────────────────────────────────────────
  function init() {
    cacheElements();
    applyI18n();
    hydrateForm();
    attachEvents();

    // Initialize matches from seed data
    state.matches = seedMatches.map((item, index) => ({
      id: `m${index + 1}`,
      alias: item[0],
      category: item[1],
      merchant: item[2],
      budget: item[3],
      location: item[4],
      visibility: item[5],
      preferences: item[6],
      tags: item[7],
      canPickup: item[8],
      needed: item[9],
      wait: item[10],
      online: true
    }));

    render();
    startRealtime();
    registerPWA();
  }

  function hydrateForm() {
    renderBaseSelectOptions();
    setFormValues();
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
