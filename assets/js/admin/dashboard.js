(function () {
  "use strict";

  const STATUS_LABELS = Object.freeze({
    new: "รับเรื่องแล้ว",
    reviewing: "กำลังตรวจสอบ",
    accepted: "รับดำเนินการ",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    waiting: "รอข้อมูลเพิ่มเติม",
    waiting_info: "รอข้อมูลเพิ่มเติม",
    resolved: "ดำเนินการแล้ว",
    closed: "ปิดเรื่อง",
    rejected: "ไม่รับดำเนินการ",
    duplicate: "เรื่องซ้ำ"
  });

  const CARD_DEFINITIONS = [
    { key: "total", label: "เรื่องทั้งหมด", tone: "primary" },
    { key: "open", label: "กำลังดูแล", tone: "info" },
    { key: "resolved", label: "ดำเนินการแล้ว", tone: "success" },
    { key: "overdue", label: "เกินกำหนด", tone: "warning" },
    { key: "withinTargetPercent", label: "เสร็จตามเป้า", suffix: "%", tone: "success" },
    { key: "averageResolutionHours", label: "เวลาเฉลี่ย", suffix: " ชม.", tone: "neutral" }
  ];
  const DASHBOARD_VILLAGE_NUMBERS = Object.freeze(["1", "2", "3", "4", "5"]);
  const DASHBOARD_CHART_EMPTY_TEXT = "ยังไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ";
  const STATUS_COLORS = Object.freeze({
    new: "#5bc6ba",
    reviewing: "#79b8ff",
    accepted: "#77d4a8",
    assigned: "#9ed7ff",
    in_progress: "#f0c66a",
    waiting: "#f5d58a",
    waiting_info: "#f5d58a",
    resolved: "#2f9e63",
    closed: "#7a9184",
    rejected: "#d88a6a",
    duplicate: "#a8b5ad"
  });
  const CATEGORY_COLORS = Object.freeze(["#2f9e63", "#5bc6ba", "#79b8ff", "#f0c66a", "#8fcf9d"]);
  const DASHBOARD_VIEW_STATES = Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    SUCCESS: "success",
    EMPTY: "empty",
    ERROR: "error"
  });

  const state = {
    user: null,
    scope: "global",
    isLoading: false,
    viewState: DASHBOARD_VIEW_STATES.IDLE,
    loadSequence: 0,
    hasRenderedContent: false,
    latestError: null
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function setText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value === undefined || value === null ? "" : String(value);
    }
  }

  function setHidden(selector, hidden) {
    const element = $(selector);

    if (element) {
      element.hidden = !!hidden;
    }
  }

  function setElementHidden(element, hidden) {
    if (element) {
      element.hidden = !!hidden;
    }
  }

  function setElementText(element, value) {
    if (element) {
      element.textContent = value === undefined || value === null ? "" : String(value);
    }
  }

  function getDashboardStateElements() {
    return {
      root: $(".dashboard-page"),
      loading: $("[data-dashboard-loading]"),
      content: $("[data-dashboard-content]"),
      error: $("[data-dashboard-error]"),
      empty: $("[data-dashboard-empty]"),
      errorMessage: $("[data-dashboard-error-message]")
    };
  }

  function clearDashboardError(elements) {
    const safeElements = elements || getDashboardStateElements();

    state.latestError = null;
    setElementText(safeElements.errorMessage, "");

    if (safeElements.error) {
      safeElements.error.classList.remove("is-active");
    }
  }

  function applyDashboardView(viewState, options) {
    const elements = getDashboardStateElements();
    const safeOptions = options || {};
    const isLoading = viewState === DASHBOARD_VIEW_STATES.LOADING;
    const keepContent = viewState === DASHBOARD_VIEW_STATES.ERROR &&
      state.hasRenderedContent &&
      safeOptions.keepContent === true;

    state.viewState = viewState;
    state.isLoading = isLoading;

    setElementHidden(elements.loading, !isLoading);
    setElementHidden(elements.content, !(viewState === DASHBOARD_VIEW_STATES.SUCCESS || keepContent));
    setElementHidden(elements.error, viewState !== DASHBOARD_VIEW_STATES.ERROR);
    setElementHidden(elements.empty, viewState !== DASHBOARD_VIEW_STATES.EMPTY);

    if (elements.root) {
      elements.root.classList.toggle("is-loading", isLoading);
      elements.root.classList.toggle("is-success", viewState === DASHBOARD_VIEW_STATES.SUCCESS);
      elements.root.classList.toggle("is-empty", viewState === DASHBOARD_VIEW_STATES.EMPTY);
      elements.root.classList.toggle("is-error", viewState === DASHBOARD_VIEW_STATES.ERROR);
      elements.root.dataset.dashboardState = viewState;
    }

    if (elements.loading) {
      if (isLoading) {
        elements.loading.setAttribute("aria-busy", "true");
      } else {
        elements.loading.removeAttribute("aria-busy");
      }
    }

    if (viewState === DASHBOARD_VIEW_STATES.ERROR) {
      if (elements.error) {
        elements.error.classList.add("is-active");
      }
    } else {
      clearDashboardError(elements);
    }

    setControlsDisabled(isLoading);
    updateScopeButtons();
  }

  function clearElement(element) {
    if (!element) {
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    element.textContent = text === undefined || text === null ? "" : String(text);
    return element;
  }

  function formatNumber(value) {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("th-TH", {
      maximumFractionDigits: Number.isInteger(numberValue) ? 0 : 2
    }).format(numberValue);
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();

    if (isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function getUserRole(user) {
    return String(user && user.role ? user.role : "").toLowerCase();
  }

  function canUseGlobalScope(user) {
    return getUserRole(user) !== "officer";
  }

  function resolveInitialScope(user) {
    const params = new URLSearchParams(window.location.search);
    const requestedScope = String(params.get("scope") || "").toLowerCase();

    if (requestedScope === "mine") {
      return "mine";
    }

    if (requestedScope === "global" && canUseGlobalScope(user)) {
      return "global";
    }

    return canUseGlobalScope(user) ? "global" : "mine";
  }

  function updateScopeButtons() {
    $all("[data-dashboard-scope]").forEach(function (button) {
      const scope = button.dataset.dashboardScope;
      const isGlobal = scope === "global";
      const isActive = scope === state.scope;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isGlobal && !canUseGlobalScope(state.user)) {
        button.hidden = true;
      } else {
        button.hidden = false;
      }
    });
  }

  function setLoading(isLoading) {
    applyDashboardView(isLoading ? DASHBOARD_VIEW_STATES.LOADING : DASHBOARD_VIEW_STATES.IDLE);
  }

  function setControlsDisabled(isDisabled) {
    $all("[data-dashboard-retry]").forEach(function (button) {
      button.disabled = !!isDisabled;
    });
  }

  function showError(error) {
    const message = window.KPR_API && typeof window.KPR_API.getErrorMessage === "function"
      ? window.KPR_API.getErrorMessage(error)
      : "ไม่สามารถเชื่อมต่อระบบได้";
    const code = error && error.code ? error.code : "";
    const requestId = error && error.meta && error.meta.requestId ? error.meta.requestId : "";
    const detailParts = [];

    if (code) {
      detailParts.push("รหัส: " + code);
    }

    if (requestId) {
      detailParts.push("Request ID: " + requestId);
    }

    state.latestError = error || {};
    applyDashboardView(DASHBOARD_VIEW_STATES.ERROR, {
      keepContent: state.hasRenderedContent
    });
    setText("[data-dashboard-error-message]", detailParts.length > 0 ? message + " (" + detailParts.join(" | ") + ")" : message);
  }

  function showEmpty() {
    applyDashboardView(DASHBOARD_VIEW_STATES.EMPTY);
  }

  function showContent() {
    state.hasRenderedContent = true;
    applyDashboardView(DASHBOARD_VIEW_STATES.SUCCESS);
  }

  function renderHero(data) {
    const displayName = state.user && state.user.displayName ? state.user.displayName : "ผู้ดูแลระบบ";
    const scopeText = data.scope === "mine"
      ? "แสดงเฉพาะเรื่องที่มอบหมายให้คุณ"
      : "แสดงภาพรวมทุกเรื่องตามสิทธิ์ของคุณ";

    setText("[data-dashboard-user-name]", displayName);
    setText("[data-dashboard-scope-text]", scopeText);
    setText("[data-dashboard-updated-at]", formatDateTime(data.generatedAt));
  }

  function renderCards(cards) {
    const container = $("[data-dashboard-cards]");

    clearElement(container);

    CARD_DEFINITIONS.forEach(function (definition) {
      const card = document.createElement("article");
      card.className = "dashboard-summary-card dashboard-summary-card--" + definition.tone;

      card.appendChild(createTextElement("span", "dashboard-summary-card__label", definition.label));
      card.appendChild(createTextElement(
        "strong",
        "dashboard-summary-card__value",
        formatNumber(cards && cards[definition.key]) + (definition.suffix || "")
      ));

      container.appendChild(card);
    });
  }

  function renderHighlights(cards) {
    const overdue = Number(cards && cards.overdue || 0);
    const urgent = Number(cards && (cards.urgent || cards.critical || cards.overdue) || 0);

    setText("[data-dashboard-urgent-count]", formatNumber(urgent));
    setText(
      "[data-dashboard-urgent-text]",
      urgent > 0 ? "ควรตรวจสอบและจัดลำดับงานก่อน" : "ไม่มีงานเร่งด่วนในตอนนี้"
    );
    setText("[data-dashboard-overdue-count]", formatNumber(overdue));
    setText(
      "[data-dashboard-overdue-text]",
      overdue > 0 ? "มีเรื่องที่เลยกำหนดเป้าหมายแล้ว" : "ไม่มีเรื่องเกินกำหนด"
    );
  }

  function getMaxTotal(items) {
    return Math.max.apply(null, (items || []).map(function (item) {
      return Number(item.total || 0);
    }).concat([1]));
  }

  function formatPercent(value) {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("th-TH", {
      maximumFractionDigits: numberValue >= 10 ? 0 : 1
    }).format(numberValue) + "%";
  }

  function renderChartFallback(container, message) {
    clearElement(container);

    if (container) {
      container.appendChild(createTextElement("p", "dashboard-mini-empty", message || DASHBOARD_CHART_EMPTY_TEXT));
    }
  }

  function safeRenderChart(name, selector, renderer) {
    try {
      renderer();
    } catch (error) {
      logDashboardError("render." + name, error);
      renderChartFallback($(selector));
    }
  }

  function renderBars(selector, items, labelGetter, options) {
    const container = $(selector);
    const safeOptions = options || {};
    const safeItems = (items || []).slice().sort(function (left, right) {
      return Number(right.total || 0) - Number(left.total || 0);
    }).filter(function (item) {
      return safeOptions.includeZero === true || Number(item.total || 0) > 0;
    }).slice(0, safeOptions.limit ? safeOptions.limit : 8);
    const maxTotal = getMaxTotal(safeItems);

    clearElement(container);

    if (safeItems.length === 0) {
      renderChartFallback(container);
      return;
    }

    safeItems.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "dashboard-bar";

      const header = document.createElement("div");
      header.className = "dashboard-bar__header";
      header.appendChild(createTextElement("span", "", labelGetter(item)));
      header.appendChild(createTextElement("strong", "", formatNumber(item.total)));

      const track = document.createElement("div");
      track.className = "dashboard-bar__track";

      const fill = document.createElement("span");
      fill.className = "dashboard-bar__fill";
      fill.style.width = Number(item.total || 0) > 0 ? Math.max((Number(item.total || 0) / maxTotal) * 100, 6) + "%" : "0%";
      fill.style.background = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      track.appendChild(fill);

      row.appendChild(header);
      row.appendChild(track);
      container.appendChild(row);
    });
  }

  function renderDonutChart(items) {
    const container = $("[data-dashboard-status-chart]");
    const safeItems = (items || []).filter(function (item) {
      return item && item.status;
    });
    const positiveItems = safeItems.filter(function (item) {
      return Number(item.total || 0) > 0;
    });
    const legendItems = positiveItems.length > 0 ? positiveItems : safeItems.slice(0, 5);
    const total = positiveItems.reduce(function (sum, item) {
      return sum + Number(item.total || 0);
    }, 0);
    let current = 0;
    const segments = [];

    clearElement(container);

    if (total <= 0 || legendItems.length === 0) {
      renderChartFallback(container);
      return;
    }

    positiveItems.forEach(function (item) {
      const value = Number(item.total || 0);
      const start = current;
      const end = current + (value / total) * 100;
      const color = STATUS_COLORS[item.status] || "#8fcf9d";

      segments.push(color + " " + start + "% " + end + "%");
      current = end;
    });

    const visual = document.createElement("div");
    visual.className = "dashboard-donut-chart__visual";
    visual.style.background = "conic-gradient(" + segments.join(", ") + ")";
    visual.setAttribute("aria-hidden", "true");

    const center = document.createElement("div");
    center.className = "dashboard-donut-chart__center";
    center.appendChild(createTextElement("strong", "", formatNumber(total)));
    center.appendChild(createTextElement("span", "", "ทั้งหมด"));
    visual.appendChild(center);

    const legend = document.createElement("div");
    legend.className = "dashboard-donut-chart__legend";

    legendItems.forEach(function (item) {
      const value = Number(item.total || 0);
      const percent = total > 0 ? (value / total) * 100 : 0;
      const row = document.createElement("div");
      const marker = document.createElement("span");

      row.className = "dashboard-donut-chart__legend-item";
      marker.className = "dashboard-donut-chart__marker";
      marker.style.background = STATUS_COLORS[item.status] || "#8fcf9d";
      row.appendChild(marker);
      row.appendChild(createTextElement("span", "", STATUS_LABELS[item.status] || item.status || "-"));
      row.appendChild(createTextElement("strong", "", formatNumber(value) + " (" + formatPercent(percent) + ")"));
      legend.appendChild(row);
    });

    container.appendChild(visual);
    container.appendChild(legend);
  }

  function normalizeVillageNumber(value) {
    let text = normalizeThaiDigits(String(value || "").trim()).toLowerCase();
    let match;

    if (!text) {
      return "";
    }

    text = text.replace(/\s+/g, " ");

    if (/^[1-5]$/.test(text)) {
      return text;
    }

    match = text.match(/^(?:หมู่(?:ที่)?|ม\.?|moo|village)\s*([1-5])$/);

    if (match && match[1]) {
      return match[1];
    }

    return "";
  }

  function normalizeThaiDigits(value) {
    const digits = {
      "๐": "0",
      "๑": "1",
      "๒": "2",
      "๓": "3",
      "๔": "4",
      "๕": "5",
      "๖": "6",
      "๗": "7",
      "๘": "8",
      "๙": "9"
    };

    return String(value || "").replace(/[๐-๙]/g, function (digit) {
      return digits[digit] || digit;
    });
  }

  function normalizeVillageSummary(items) {
    const totals = {};

    DASHBOARD_VILLAGE_NUMBERS.forEach(function (villageNo) {
      totals[villageNo] = {
        villageKey: villageNo,
        villageNo: villageNo,
        label: "หมู่ " + villageNo,
        total: 0,
        overdue: 0
      };
    });

    (items || []).forEach(function (item) {
      const villageNo = normalizeVillageNumber(item && (item.villageNo || item.villageKey || item.label));

      if (!villageNo) {
        logDashboardWarning("DASHBOARD_INVALID_VILLAGE_IGNORED", {
          value: item && (item.villageNo || item.villageKey || item.label || "")
        });
        return;
      }

      totals[villageNo].total += Number(item.total || 0);
      totals[villageNo].overdue += Number(item.overdue || 0);
    });

    return DASHBOARD_VILLAGE_NUMBERS.map(function (villageNo) {
      return totals[villageNo];
    });
  }

  function renderMonthChart(items) {
    const container = $("[data-dashboard-month-chart]");
    const safeItems = (items || []).filter(function (item) {
      return Number(item.total || 0) > 0;
    }).slice(-12);
    const maxTotal = getMaxTotal(safeItems);

    clearElement(container);

    if (safeItems.length === 0) {
      renderChartFallback(container);
      return;
    }

    safeItems.forEach(function (item) {
      const bar = document.createElement("div");
      bar.className = "dashboard-month-bar";
      bar.setAttribute("title", (item.yearMonth || "-") + ": " + formatNumber(item.total) + " เรื่อง");

      const fill = document.createElement("span");
      fill.style.height = Math.max((Number(item.total || 0) / maxTotal) * 100, 8) + "%";
      bar.appendChild(fill);
      bar.appendChild(createTextElement("strong", "", formatNumber(item.total)));
      bar.appendChild(createTextElement("small", "", item.yearMonth || "-"));
      container.appendChild(bar);
    });
  }

  function getHeatmapMonths(monthItems, villageMonthItems) {
    const monthKeys = {};

    (monthItems || []).forEach(function (item) {
      if (item && item.yearMonth) {
        monthKeys[item.yearMonth] = true;
      }
    });
    (villageMonthItems || []).forEach(function (item) {
      if (item && item.yearMonth) {
        monthKeys[item.yearMonth] = true;
      }
    });

    return Object.keys(monthKeys).sort().slice(-12);
  }

  function normalizeVillageMonthSummary(items, monthItems) {
    const months = getHeatmapMonths(monthItems || [], items || []);
    const totals = {};

    DASHBOARD_VILLAGE_NUMBERS.forEach(function (villageNo) {
      totals[villageNo] = {};
      months.forEach(function (yearMonth) {
        totals[villageNo][yearMonth] = 0;
      });
    });

    (items || []).forEach(function (item) {
      const villageNo = normalizeVillageNumber(item && (item.villageNo || item.villageKey || item.label));
      const yearMonth = item && item.yearMonth ? String(item.yearMonth) : "";

      if (!villageNo || months.indexOf(yearMonth) === -1) {
        return;
      }

      totals[villageNo][yearMonth] += Number(item.total || 0);
    });

    return {
      months: months,
      rows: DASHBOARD_VILLAGE_NUMBERS.map(function (villageNo) {
        return {
          villageNo: villageNo,
          label: "หมู่ " + villageNo,
          values: months.map(function (yearMonth) {
            return {
              yearMonth: yearMonth,
              total: totals[villageNo][yearMonth] || 0
            };
          })
        };
      })
    };
  }

  function renderVillageHeatmap(items, monthItems) {
    const container = $("[data-dashboard-village-chart]");
    if (!Array.isArray(items)) {
      renderChartFallback(container);
      return;
    }

    const summary = normalizeVillageMonthSummary(items || [], monthItems || []);
    const months = summary.months;
    const rows = summary.rows;
    const maxTotal = Math.max.apply(null, rows.reduce(function (values, row) {
      return values.concat(row.values.map(function (item) {
        return Number(item.total || 0);
      }));
    }, [0]));

    clearElement(container);

    if (months.length === 0) {
      renderChartFallback(container);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "dashboard-heatmap__grid";
    grid.style.gridTemplateColumns = "minmax(4.5rem, auto) repeat(" + months.length + ", minmax(3.75rem, 1fr))";

    grid.appendChild(createTextElement("span", "dashboard-heatmap__corner", "พื้นที่"));
    months.forEach(function (yearMonth) {
      grid.appendChild(createTextElement("span", "dashboard-heatmap__month", yearMonth));
    });

    rows.forEach(function (row) {
      grid.appendChild(createTextElement("strong", "dashboard-heatmap__label", row.label));

      row.values.forEach(function (item) {
        const value = Number(item.total || 0);
        const cell = document.createElement("span");
        const level = maxTotal > 0 ? Math.ceil((value / maxTotal) * 4) : 0;

        cell.className = "dashboard-heatmap__cell dashboard-heatmap__cell--level-" + level;
        cell.textContent = formatNumber(value);
        cell.setAttribute("tabindex", "0");
        cell.setAttribute("aria-label", row.label + " เดือน " + item.yearMonth + " มี " + formatNumber(value) + " เรื่อง");
        cell.setAttribute("title", row.label + " / " + item.yearMonth + ": " + formatNumber(value) + " เรื่อง");
        grid.appendChild(cell);
      });
    });

    const legend = document.createElement("div");
    legend.className = "dashboard-heatmap__legend";
    legend.appendChild(createTextElement("span", "", "น้อย"));
    [0, 1, 2, 3, 4].forEach(function (level) {
      const swatch = document.createElement("span");
      swatch.className = "dashboard-heatmap__legend-swatch dashboard-heatmap__cell--level-" + level;
      legend.appendChild(swatch);
    });
    legend.appendChild(createTextElement("span", "", "มาก"));

    container.appendChild(grid);
    container.appendChild(legend);
  }

  function renderRecent(data) {
    const container = $("[data-dashboard-recent]");
    const items = Array.isArray(data && data.recentReports) ? data.recentReports : [];

    clearElement(container);

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dashboard-recent-empty";
      empty.appendChild(createTextElement("strong", "", "ยังไม่มีรายการล่าสุดให้แสดง"));
      empty.appendChild(createTextElement("p", "", "ระบบสรุปชุดนี้ยังไม่ส่งรายละเอียดเรื่องล่าสุดมา หน้ารายการเรื่องแจ้งจะเป็นแหล่งดูงานรายชิ้น"));
      container.appendChild(empty);
      return;
    }

    items.slice(0, 5).forEach(function (item) {
      const row = document.createElement("article");
      row.className = "dashboard-recent-item";
      row.appendChild(createTextElement("strong", "", item.title || item.trackingCode || "เรื่องแจ้ง"));
      row.appendChild(createTextElement("span", "", STATUS_LABELS[item.status] || item.status || "-"));
      row.appendChild(createTextElement("small", "", formatDateTime(item.createdAt)));
      container.appendChild(row);
    });
  }

  function hasPositiveTotal(items) {
    return (items || []).some(function (item) {
      return Number(item && item.total || 0) > 0;
    });
  }

  function hasDashboardData(data) {
    const safeData = data || {};
    const cards = safeData.cards || {};

    if (Number(cards.total || 0) > 0) {
      return true;
    }

    return hasPositiveTotal(safeData.byStatus) ||
      hasPositiveTotal(safeData.byCategory) ||
      hasPositiveTotal(safeData.byMonth) ||
      hasPositiveTotal(safeData.byVillage) ||
      (Array.isArray(safeData.recentReports) && safeData.recentReports.length > 0);
  }

  function renderDashboard(data) {
    const safeData = data || {};
    const cards = safeData.cards || {};

    if (safeData.scope) {
      state.scope = safeData.scope;
    }

    if (!hasDashboardData(safeData)) {
      renderHero(safeData);
      showEmpty();
      return;
    }

    renderHero(safeData);
    renderCards(cards);
    renderHighlights(cards);
    safeRenderChart("month", "[data-dashboard-month-chart]", function () {
      renderMonthChart(safeData.byMonth || []);
    });
    safeRenderChart("status", "[data-dashboard-status-chart]", function () {
      renderDonutChart(safeData.byStatus || []);
    });
    safeRenderChart("category", "[data-dashboard-category-chart]", function () {
      renderBars("[data-dashboard-category-chart]", safeData.byCategory || [], function (item) {
        return item.name || item.code || "ไม่ระบุหมวด";
      }, { limit: 5 });
    });
    safeRenderChart("villageHeatmap", "[data-dashboard-village-chart]", function () {
      renderVillageHeatmap(safeData.byVillageMonth, safeData.byMonth || []);
    });
    renderRecent(safeData);
    showContent();
  }

  async function loadDashboard() {
    if (!window.KPR_API) {
      showError({ code: "NETWORK_ERROR" });
      return;
    }

    const sequence = state.loadSequence + 1;

    state.loadSequence = sequence;
    setLoading(true);

    try {
      const result = await window.KPR_API.read("dashboard.summary", {
        scope: state.scope
      }, {
        withSession: true
      });

      if (sequence !== state.loadSequence) {
        return;
      }

      renderDashboard(result.data || {});
    } catch (error) {
      if (sequence !== state.loadSequence) {
        return;
      }

      logDashboardError("loadDashboard", error);
      showError(error);
    } finally {
      if (sequence === state.loadSequence && state.isLoading) {
        state.isLoading = false;
        setControlsDisabled(false);
        updateScopeButtons();
      }
    }
  }

  function bindScopeControls() {
    $all("[data-dashboard-scope]").forEach(function (button) {
      button.addEventListener("click", function () {
        const nextScope = button.dataset.dashboardScope;

        if (nextScope === state.scope) {
          return;
        }

        if (nextScope === "global" && !canUseGlobalScope(state.user)) {
          return;
        }

        state.scope = nextScope;
        updateScopeButtons();
        loadDashboard();
      });
    });

    const retryButton = $("[data-dashboard-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadDashboard);
    }
  }

  async function init() {
    document.documentElement.dataset.adminPage = "dashboard";
    bindScopeControls();

    if (!window.KPR_AUTH || typeof window.KPR_AUTH.requireAdminSession !== "function") {
      showError({ code: "UNAUTHORIZED" });
      return;
    }

    try {
      state.user = await window.KPR_AUTH.requireAdminSession();
      if (!state.user) {
        setHidden("[data-dashboard-loading]", true);
        return;
      }

      state.scope = resolveInitialScope(state.user);
      updateScopeButtons();
      loadDashboard();
    } catch (error) {
      logDashboardError("init", error);
      showError(error);
    }
  }

  function logDashboardError(stage, error) {
    if (!window.console || typeof window.console.error !== "function") {
      return;
    }

    window.console.error("Dashboard error", {
      stage: stage,
      code: error && error.code ? error.code : "UNKNOWN",
      message: error && error.message ? error.message : String(error || ""),
      requestId: error && error.meta && error.meta.requestId ? error.meta.requestId : ""
    });
  }

  function logDashboardWarning(code, detail) {
    const host = window.location && window.location.hostname ? window.location.hostname : "";
    const isDevelopment = host === "localhost" || host === "127.0.0.1" || window.__KPR_ENABLE_DASHBOARD_TESTS__ === true;

    if (!isDevelopment || !window.console || typeof window.console.warn !== "function") {
      return;
    }

    window.console.warn(code, detail || {});
  }

  function resetDashboardStateForTest(overrides) {
    const safeOverrides = overrides || {};

    state.user = safeOverrides.user || null;
    state.scope = safeOverrides.scope || "global";
    state.isLoading = false;
    state.viewState = DASHBOARD_VIEW_STATES.IDLE;
    state.loadSequence = 0;
    state.hasRenderedContent = !!safeOverrides.hasRenderedContent;
    state.latestError = null;
  }

  if (window.__KPR_ENABLE_DASHBOARD_TESTS__ === true) {
    window.KPR_DASHBOARD_TESTS = {
      viewStates: DASHBOARD_VIEW_STATES,
      state: state,
      hasDashboardData: hasDashboardData,
      applyDashboardView: applyDashboardView,
      clearDashboardError: clearDashboardError,
      showError: showError,
      showEmpty: showEmpty,
      showContent: showContent,
      setLoading: setLoading,
      renderDashboard: renderDashboard,
      normalizeVillageNumber: normalizeVillageNumber,
      normalizeVillageSummary: normalizeVillageSummary,
      normalizeVillageMonthSummary: normalizeVillageMonthSummary,
      renderDonutChart: renderDonutChart,
      renderVillageHeatmap: renderVillageHeatmap,
      renderChartFallback: renderChartFallback,
      safeRenderChart: safeRenderChart,
      loadDashboard: loadDashboard,
      resetState: resetDashboardStateForTest
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
