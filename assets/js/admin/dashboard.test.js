const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createClassList(element) {
  const classes = new Set();

  return {
    add: function (className) {
      classes.add(className);
    },
    remove: function (className) {
      classes.delete(className);
    },
    contains: function (className) {
      return classes.has(className);
    },
    toggle: function (className, enabled) {
      if (enabled) {
        classes.add(className);
      } else {
        classes.delete(className);
      }
    },
    toArray: function () {
      return Array.from(classes);
    }
  };
}

function createElement(tagName) {
  const element = {
    tagName: tagName,
    hidden: false,
    disabled: false,
    textContent: "",
    className: "",
    dataset: {},
    style: {},
    attributes: {},
    children: [],
    firstChild: null,
    appendChild: function (child) {
      element.children.push(child);
      element.firstChild = element.children[0] || null;
      return child;
    },
    removeChild: function (child) {
      const index = element.children.indexOf(child);

      if (index !== -1) {
        element.children.splice(index, 1);
      }

      element.firstChild = element.children[0] || null;
      return child;
    },
    setAttribute: function (name, value) {
      element.attributes[name] = String(value);
    },
    getAttribute: function (name) {
      return Object.prototype.hasOwnProperty.call(element.attributes, name)
        ? element.attributes[name]
        : null;
    },
    removeAttribute: function (name) {
      delete element.attributes[name];
    }
  };

  element.classList = createClassList(element);
  return element;
}

function createDashboardHarness() {
  const elements = {
    root: createElement("section"),
    loading: createElement("div"),
    content: createElement("div"),
    error: createElement("div"),
    empty: createElement("div"),
    errorMessage: createElement("p"),
    cards: createElement("div"),
    statusChart: createElement("div"),
    categoryChart: createElement("div"),
    villageChart: createElement("div"),
    monthChart: createElement("div"),
    recent: createElement("div"),
    userName: createElement("span"),
    scopeText: createElement("p"),
    updatedAt: createElement("strong"),
    urgentCount: createElement("strong"),
    urgentText: createElement("p"),
    overdueCount: createElement("strong"),
    overdueText: createElement("p"),
    retry: createElement("button"),
    scopeMine: createElement("button"),
    scopeGlobal: createElement("button")
  };
  const selectorMap = {
    ".dashboard-page": elements.root,
    "[data-dashboard-loading]": elements.loading,
    "[data-dashboard-content]": elements.content,
    "[data-dashboard-error]": elements.error,
    "[data-dashboard-empty]": elements.empty,
    "[data-dashboard-error-message]": elements.errorMessage,
    "[data-dashboard-cards]": elements.cards,
    "[data-dashboard-status-chart]": elements.statusChart,
    "[data-dashboard-category-chart]": elements.categoryChart,
    "[data-dashboard-village-chart]": elements.villageChart,
    "[data-dashboard-month-chart]": elements.monthChart,
    "[data-dashboard-recent]": elements.recent,
    "[data-dashboard-user-name]": elements.userName,
    "[data-dashboard-scope-text]": elements.scopeText,
    "[data-dashboard-updated-at]": elements.updatedAt,
    "[data-dashboard-urgent-count]": elements.urgentCount,
    "[data-dashboard-urgent-text]": elements.urgentText,
    "[data-dashboard-overdue-count]": elements.overdueCount,
    "[data-dashboard-overdue-text]": elements.overdueText,
    "[data-dashboard-retry]": elements.retry
  };

  elements.scopeMine.dataset.dashboardScope = "mine";
  elements.scopeGlobal.dataset.dashboardScope = "global";

  const document = {
    documentElement: {
      dataset: {}
    },
    querySelector: function (selector) {
      return selectorMap[selector] || null;
    },
    querySelectorAll: function (selector) {
      if (selector === "[data-dashboard-scope]") {
        return [elements.scopeMine, elements.scopeGlobal];
      }

      if (selector === "[data-dashboard-retry]") {
        return [elements.retry];
      }

      return [];
    },
    createElement: createElement,
    addEventListener: function () {}
  };
  const window = {
    __KPR_ENABLE_DASHBOARD_TESTS__: true,
    document: document,
    location: {
      search: ""
    },
    console: {
      error: function () {},
      warn: function () {}
    },
    Intl: Intl,
    KPR_API: {
      getErrorMessage: function (error) {
        return error && error.message ? error.message : "error";
      }
    }
  };
  const context = {
    window: window,
    document: document,
    URLSearchParams: URLSearchParams,
    Intl: Intl,
    Date: Date,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    JSON: JSON
  };
  const source = fs.readFileSync(path.join(__dirname, "dashboard.js"), "utf8");

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: "dashboard.js"
  });

  return {
    elements: elements,
    window: window,
    tests: window.KPR_DASHBOARD_TESTS
  };
}

function sampleDashboardData(overrides) {
  return Object.assign({
    scope: "global",
    generatedAt: "2026-06-29T00:00:00.000Z",
    cards: {
      total: 39,
      open: 10,
      resolved: 29,
      overdue: 2
    },
    byStatus: [{ status: "resolved", total: 29 }],
    byCategory: [
      { name: "Road", total: 10 },
      { name: "Water", total: 8 },
      { name: "Light", total: 7 },
      { name: "Waste", total: 6 },
      { name: "Tree", total: 5 },
      { name: "Other", total: 4 }
    ],
    byMonth: [
      { yearMonth: "2026-01", total: 3 },
      { yearMonth: "2026-02", total: 4 },
      { yearMonth: "2026-03", total: 5 }
    ],
    byVillage: [{ villageNo: "1", total: 3 }],
    byVillageMonth: [
      { villageNo: "1", yearMonth: "2026-01", total: 1 },
      { villageNo: "หมู่1", yearMonth: "2026-02", total: 2 },
      { villageNo: "หมู่ที่ 2", yearMonth: "2026-03", total: 3 },
      { villageNo: "๓", yearMonth: "2026-03", total: 0 }
    ],
    recentReports: []
  }, overrides || {});
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise(function (promiseResolve, promiseReject) {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

async function run() {
  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.setLoading(true);
    assert.strictEqual(harness.elements.loading.hidden, false, "loading should show skeleton");
    assert.strictEqual(harness.elements.content.hidden, true, "loading should hide content");
    assert.strictEqual(harness.elements.error.hidden, true, "loading should hide error");
    assert.strictEqual(harness.elements.empty.hidden, true, "loading should hide empty");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData());
    assert.strictEqual(harness.elements.loading.hidden, true, "success with data should hide skeleton");
    assert.strictEqual(harness.elements.error.hidden, true, "success with data should hide error");
    assert.strictEqual(harness.elements.empty.hidden, true, "success with data should hide empty");
    assert.strictEqual(harness.elements.content.hidden, false, "success with data should show content");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData({
      cards: { total: 0 },
      byStatus: [],
      byCategory: [],
      byMonth: [],
      byVillage: [],
      recentReports: []
    }));
    assert.strictEqual(harness.elements.empty.hidden, false, "success without data should show empty");
    assert.strictEqual(harness.elements.content.hidden, true, "success without data should hide content");
    assert.strictEqual(harness.elements.error.hidden, true, "success without data should hide error");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.showError({ code: "NETWORK_ERROR", message: "failed" });
    assert.strictEqual(harness.elements.loading.hidden, true, "error should hide skeleton");
    assert.strictEqual(harness.elements.empty.hidden, true, "error should hide empty");
    assert.strictEqual(harness.elements.error.hidden, false, "error should show banner");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.showError({ code: "NETWORK_ERROR", message: "failed" });
    harness.tests.renderDashboard(sampleDashboardData());
    assert.strictEqual(harness.elements.error.hidden, true, "retry success should hide previous error");
    assert.strictEqual(harness.elements.errorMessage.textContent, "", "retry success should clear error message");
    assert.strictEqual(harness.tests.state.latestError, null, "retry success should clear error state");
  }

  {
    const harness = createDashboardHarness();
    const first = deferred();
    const second = deferred();
    const calls = [];

    harness.window.KPR_API.read = function (action, data) {
      calls.push({ action: action, scope: data.scope });
      return calls.length === 1 ? first.promise : second.promise;
    };

    harness.tests.resetState({ scope: "global" });
    const firstLoad = harness.tests.loadDashboard();
    harness.tests.state.scope = "mine";
    const secondLoad = harness.tests.loadDashboard();

    second.resolve({ data: sampleDashboardData({ scope: "mine" }) });
    await secondLoad;
    first.reject({ code: "NETWORK_ERROR", message: "old request failed" });
    await firstLoad;
    await flushPromises();

    assert.strictEqual(calls.length, 2, "scope change should start a new request");
    assert.deepStrictEqual(calls.map(function (call) { return call.scope; }), ["global", "mine"]);
    assert.strictEqual(harness.tests.state.scope, "mine", "latest scope should win");
    assert.strictEqual(harness.elements.error.hidden, true, "old failed request should not show error");
    assert.strictEqual(harness.elements.content.hidden, false, "latest success should keep content visible");
  }

  {
    const harness = createDashboardHarness();
    const first = deferred();
    const second = deferred();
    const calls = [];

    harness.window.KPR_API.read = function (action, data) {
      calls.push(data.scope);
      return calls.length === 1 ? first.promise : second.promise;
    };

    harness.tests.resetState({ scope: "mine" });
    const firstLoad = harness.tests.loadDashboard();
    harness.tests.state.scope = "global";
    const secondLoad = harness.tests.loadDashboard();

    first.resolve({ data: sampleDashboardData({ scope: "mine", cards: { total: 1 } }) });
    second.resolve({ data: sampleDashboardData({ scope: "global", cards: { total: 39 } }) });
    await firstLoad;
    await secondLoad;
    await flushPromises();

    assert.deepStrictEqual(calls, ["mine", "global"], "my_work to all should request the latest scope");
    assert.strictEqual(harness.tests.state.scope, "global", "all response should be the final UI scope");
    assert.strictEqual(harness.elements.error.hidden, true, "unused scope error should not display");
  }

  {
    const harness = createDashboardHarness();

    assert.strictEqual(harness.tests.hasDashboardData(sampleDashboardData()), true, "total=39 should count as data");
    assert.strictEqual(harness.tests.hasDashboardData(sampleDashboardData({
      cards: { total: 39 },
      byMonth: []
    })), true, "empty monthly series alone should not trigger empty state");
  }

  {
    const harness = createDashboardHarness();

    harness.window.KPR_API.read = function () {
      return Promise.resolve({ data: sampleDashboardData() });
    };

    harness.tests.resetState();
    await harness.tests.loadDashboard();
    assert.strictEqual(harness.elements.error.hidden, true, "API ok=true result should not show error banner");
    assert.strictEqual(harness.elements.content.hidden, false, "API ok=true result should show content");
  }

  {
    const harness = createDashboardHarness();
    const normalized = harness.tests.normalizeVillageSummary([
      { villageNo: "หมู่ 1", total: 5 },
      { villageNo: "หมู่1", total: 2 },
      { villageNo: "หมู่ที่ 1", total: 3 },
      { villageNo: "ม.1", total: 4 },
      { villageNo: "๑", total: 6 },
      { villageNo: "หมู่ 2", total: 1 },
      { villageNo: "หมู่ 6", total: 99 },
      { villageNo: "", total: 99 }
    ]);

    assert.strictEqual(normalized.length, 5, "village summary should always have five items");
    assert.strictEqual(normalized.map(function (item) { return item.label; }).join(","), "หมู่ 1,หมู่ 2,หมู่ 3,หมู่ 4,หมู่ 5");
    assert.strictEqual(normalized.map(function (item) { return item.villageNo; }).join(","), "1,2,3,4,5");
    assert.strictEqual(normalized[0].total, 20, "village aliases should aggregate into หมู่ 1");
    assert.strictEqual(normalized[1].total, 1, "หมู่ 2 should keep its total");
    assert.strictEqual(normalized[2].total, 0, "missing village should show zero");
    assert.strictEqual(normalized[3].total, 0, "missing village should show zero");
    assert.strictEqual(normalized[4].total, 0, "missing village should show zero");
    assert.strictEqual(new Set(normalized.map(function (item) { return item.label; })).size, 5, "village labels must not duplicate");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData({
      byVillage: [
        { villageNo: "หมู่ 1", total: 5 },
        { villageNo: "หมู่1", total: 2 },
        { villageNo: "หมู่ที่ 1", total: 3 },
        { villageNo: "ม.1", total: 4 },
        { villageNo: "๑", total: 6 },
        { villageNo: "หมู่ 6", total: 99 }
      ]
    }));

    assert.strictEqual(harness.elements.villageChart.children[0].className, "dashboard-heatmap__grid", "village chart should render a heatmap grid");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData());
    assert.strictEqual(harness.elements.monthChart.children.length, 3, "column chart should accept monthly data");
    assert.strictEqual(harness.elements.monthChart.children[0].children[2].textContent, "2026-01", "column chart should keep month labels");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData({
      byStatus: [
        { status: "new", total: 3 },
        { status: "in_progress", total: 2 },
        { status: "resolved", total: 5 },
        { status: "closed", total: 0 }
      ]
    }));
    assert.strictEqual(harness.elements.statusChart.children[0].className, "dashboard-donut-chart__visual", "status chart should render donut visual");
    assert.strictEqual(harness.elements.statusChart.children[0].children[0].children[0].textContent, "10", "donut chart should sum status totals");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData());
    assert.strictEqual(harness.elements.categoryChart.children.length, 5, "category chart should render top five only");
    assert.strictEqual(harness.elements.categoryChart.children[0].children[0].children[0].textContent, "Road", "category chart should sort highest first");
    assert.strictEqual(harness.elements.categoryChart.children[4].children[0].children[0].textContent, "Tree", "category chart should exclude the sixth item");
  }

  {
    const harness = createDashboardHarness();
    const summary = harness.tests.normalizeVillageMonthSummary([
      { villageNo: "หมู่ 1", yearMonth: "2026-01", total: 2 },
      { villageNo: "หมู่1", yearMonth: "2026-01", total: 3 },
      { villageNo: "ม.1", yearMonth: "2026-02", total: 4 },
      { villageNo: "๑", yearMonth: "2026-02", total: 5 },
      { villageNo: "หมู่ 6", yearMonth: "2026-02", total: 99 }
    ], [
      { yearMonth: "2026-01", total: 5 },
      { yearMonth: "2026-02", total: 9 }
    ]);

    assert.strictEqual(summary.rows.length, 5, "heat map should have exactly villages 1-5");
    assert.strictEqual(summary.rows[0].label, "หมู่ 1", "heat map should normalize village labels");
    assert.strictEqual(summary.rows[0].values[0].total, 5, "heat map should aggregate village aliases");
    assert.strictEqual(summary.rows[0].values[1].total, 9, "heat map should aggregate Thai digit aliases");
    assert.strictEqual(summary.rows[4].values[1].total, 0, "heat map should keep zero values");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.resetState();
    harness.tests.renderDashboard(sampleDashboardData({
      byVillageMonth: []
    }));
    assert.strictEqual(harness.elements.villageChart.children[0].className, "dashboard-heatmap__grid", "heat map can render zero values when months exist");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.renderChartFallback(harness.elements.monthChart);
    assert.strictEqual(harness.elements.monthChart.children[0].textContent, "ยังไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ", "empty chart should show fallback text");
  }

  {
    const harness = createDashboardHarness();

    harness.tests.safeRenderChart("broken", "[data-dashboard-category-chart]", function () {
      throw new Error("broken chart");
    });
    assert.strictEqual(harness.elements.categoryChart.children[0].textContent, "ยังไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ", "broken chart should render fallback without crashing");
  }

  {
    const dashboardHtml = fs.readFileSync(path.join(__dirname, "..", "..", "..", "admin", "dashboard.html"), "utf8");
    const chartIndex = dashboardHtml.indexOf("dashboard-overview-charts");
    const summaryIndex = dashboardHtml.indexOf("summary-title");

    assert.ok(chartIndex !== -1, "chart section should exist");
    assert.ok(summaryIndex !== -1, "summary section should exist");
    assert.ok(chartIndex < summaryIndex, "chart section should be before summary cards");
  }

  {
    const adminCss = fs.readFileSync(path.join(__dirname, "..", "..", "css", "admin.css"), "utf8");

    assert.ok(adminCss.indexOf("@media (prefers-reduced-motion: reduce)") !== -1, "reduced motion media query should exist");
    assert.ok(adminCss.indexOf(".dashboard-chart-scroll") !== -1, "chart scroll container should exist for mobile overflow");
    assert.ok(adminCss.indexOf("overflow-x: auto") !== -1, "mobile charts should scroll inside the card");
  }
}

run().then(function () {
  console.log("dashboard state tests passed");
}).catch(function (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
