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
const aliases = ["想把事做成", "今天就推进", "一起破局", "原型搭档", "增长搭档", "行动派同事", "能拍板的人", "快速验证员"];

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

const state = {
  published: false,
  joinedId: null,
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
  matches: seedMatches.map((item, index) => ({
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
  }))
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateForm();
  attachEvents();
  render();
  startRealtime();
});

function cacheElements() {
  [
    "onlineCount",
    "matchCount",
    "bestScore",
    "rerollName",
    "intentForm",
    "aliasInput",
    "categorySelect",
    "merchantSelect",
    "budgetSelect",
    "locationSelect",
    "visibilitySelect",
    "neededInput",
    "preferenceOptions",
    "tagOptions",
    "pickupToggle",
    "waitInput",
    "waitOutput",
    "publishState",
    "matchList",
    "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function hydrateForm() {
  fillSelect(els.categorySelect, Object.entries(categories).map(([value, category]) => [value, category.name]));
  fillSelect(els.locationSelect, locations.map((item) => [item, item]));
  fillSelect(els.visibilitySelect, visibilities.map((item) => [item, item]));
  setFormValues();
}

function setFormValues() {
  const intent = state.intent;
  els.aliasInput.value = intent.alias;
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

function updateCategoryOptions() {
  const category = categories[els.categorySelect.value];
  fillSelect(els.merchantSelect, category.merchants.map((item) => [item, item]));
  fillSelect(els.budgetSelect, category.budgets.map((item) => [item, item]));
}

function fillSelect(select, options) {
  select.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function renderPreferenceOptions() {
  const category = categories[els.categorySelect.value];
  els.preferenceOptions.innerHTML = category.preferences
    .map((item) => {
      const checked = state.intent.preferences.includes(item) ? "checked" : "";
      return `<label class="chip"><input type="checkbox" name="preference" value="${item}" ${checked}><span>${item}</span></label>`;
    })
    .join("");
}

function renderTagOptions() {
  els.tagOptions.innerHTML = tags
    .map((item) => {
      const checked = state.intent.tags.includes(item) ? "checked" : "";
      return `<label class="chip"><input type="checkbox" name="tag" value="${item}" ${checked}><span>${item}</span></label>`;
    })
    .join("");
}

function attachEvents() {
  els.categorySelect.addEventListener("change", () => {
    const category = categories[els.categorySelect.value];
    state.intent.category = els.categorySelect.value;
    state.intent.merchant = category.merchants[0];
    state.intent.budget = category.budgets[Math.min(1, category.budgets.length - 1)];
    state.intent.preferences = [category.preferences[category.preferences.length - 1]];
    updateCategoryOptions();
    setFormValues();
    render();
  });

  els.waitInput.addEventListener("input", () => {
    els.waitOutput.textContent = `${els.waitInput.value}s`;
  });

  els.rerollName.addEventListener("click", () => {
    els.aliasInput.value = randomAlias();
  });

  els.intentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateIntentFromForm();
    state.published = true;
    showToast("已开始匹配能一起推进的同事");
    render();
  });

  els.matchList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-join-id]");
    if (!button) return;
    state.joinedId = button.dataset.joinId;
    const match = state.matches.find((item) => item.id === state.joinedId);
    showToast(match ? `已连接 ${match.alias}，一起把事做成` : "已连接同事");
    render();
  });
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
    needed: Number(els.neededInput.value),
    preferences: preferences.length ? preferences : [category.preferences[category.preferences.length - 1]],
    tags: selectedTags.length ? selectedTags : ["今天就做"],
    canPickup: els.pickupToggle.checked,
    waitTarget: Number(els.waitInput.value)
  };
}

function render() {
  const ranked = getRankedMatches();
  const online = state.matches.filter((item) => item.online).length + (state.published ? 1 : 0);
  els.onlineCount.textContent = online;
  els.matchCount.textContent = ranked.length;
  els.bestScore.textContent = `${ranked[0]?.score || 0}%`;
  els.publishState.textContent = state.published ? "实时匹配中" : "未发布";
  els.publishState.classList.toggle("active", state.published);
  renderMatchList(ranked);
}

function getRankedMatches() {
  return state.matches
    .map((match) => ({ ...match, ...scoreMatch(state.intent, match) }))
    .sort((a, b) => b.score - a.score);
}

function scoreMatch(intent, match) {
  let score = 0;
  const reasons = [];

  if (intent.category === match.category) add(24, "同方向");
  if (intent.merchant === match.merchant) add(18, "同一件事");
  if (intent.location === match.location) add(14, "同团队");
  if (intent.visibility === match.visibility || intent.visibility === "全公司可见" || match.visibility === "全公司可见") add(8, "可连接");
  if (intent.canPickup && match.canPickup) add(10, "今天能开始");
  if (match.online) add(8, "在线");
  if (match.needed <= intent.needed + 1) add(6, "人数合适");

  const timeGap = budgetDistance(intent, match);
  if (timeGap === 0) add(12, "时间一致");
  if (timeGap === 1) add(9, "时间接近");

  const sharedTags = match.tags.filter((tag) => intent.tags.includes(tag));
  if (sharedTags.length) {
    score += Math.min(16, sharedTags.length * 5);
    reasons.push(...sharedTags.slice(0, 3));
  }

  const sharedPreferences = match.preferences.filter((item) => intent.preferences.includes(item));
  if (sharedPreferences.length) add(7, "能力匹配");
  if (match.preferences.includes("能拍板") || intent.tags.includes("能拍板")) add(4, "决策快");

  score += Math.max(0, 6 - Math.floor(match.wait / 15));

  return {
    score: Math.min(99, score),
    reasons: [...new Set(reasons)].slice(0, 5)
  };

  function add(points, reason) {
    score += points;
    reasons.push(reason);
  }
}

function budgetDistance(intent, match) {
  const list = categories[intent.category]?.budgets || [];
  const ownIndex = list.indexOf(intent.budget);
  const matchIndex = list.indexOf(match.budget);
  if (ownIndex === -1 || matchIndex === -1) return 99;
  return Math.abs(ownIndex - matchIndex);
}

function renderMatchList(matches) {
  if (!matches.length) {
    els.matchList.innerHTML = `<div class="empty-state">暂无匹配，换个方向或团队试试</div>`;
    return;
  }

  els.matchList.innerHTML = matches
    .slice(0, 8)
    .map((match, index) => {
      const category = categories[match.category];
      const joined = state.joinedId === match.id;
      const reasons = match.reasons.map((reason) => `<span class="reason">${reason}</span>`).join("");
      const color = category.colors[index % category.colors.length];
      return `
        <article class="match-row">
          <div class="avatar" style="background:${color}">${match.alias.slice(0, 2)}</div>
          <div class="match-main">
            <div class="match-title">
              <h3>${match.alias}</h3>
              <span class="score">${match.score}%</span>
            </div>
            <div class="match-meta">${category.name} · ${match.merchant} · ${match.budget} · ${match.location}</div>
            <div class="match-detail">${reasons}</div>
          </div>
          <div class="match-side">
            <span class="wait">等待 ${match.wait}s · 还差 ${match.needed} 人</span>
            <button class="match-action ${joined ? "joined" : ""}" type="button" data-join-id="${match.id}">
              ${joined ? "已连接" : "一起做"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function startRealtime() {
  setInterval(() => {
    state.matches = state.matches.map((match) => ({
      ...match,
      wait: Math.max(5, match.wait + randomInt(-4, 6)),
      online: Math.random() > 0.04 ? true : match.online
    }));

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

function randomAlias() {
  return `${aliases[randomInt(0, aliases.length - 1)]}${randomInt(10, 99)}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 1600);
}
