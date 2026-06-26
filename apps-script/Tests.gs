function runTests() {
  return {
    ok: true,
    publicConfig: testPublicConfig_(),
    categoryList: testCategoryList_(),
    announcementList: testAnnouncementList_(),
    seedData: testValidateSeedData()
  };
}

function runSetupSeedTests() {
  var categories = testSeedCategories();
  var settings = testSeedSettings();
  var initialData = testSeedInitialData();
  var validation = testValidateSeedData();

  return {
    ok: categories.ok && settings.ok && initialData.ok && validation.ok,
    categories: categories,
    settings: settings,
    initialData: initialData,
    validation: validation
  };
}

function testSeedCategories() {
  var firstRun = seedCategories();
  var secondRun = seedCategories();

  return {
    ok: isSeedLogOk_(firstRun) && isSeedLogOk_(secondRun) && secondRun.inserted === 0,
    action: 'seedCategories',
    firstRun: firstRun,
    secondRun: secondRun
  };
}

function testSeedSettings() {
  var firstRun = seedSettings();
  var secondRun = seedSettings();

  return {
    ok: isSeedLogOk_(firstRun) && isSeedLogOk_(secondRun) && secondRun.inserted === 0,
    action: 'seedSettings',
    firstRun: firstRun,
    secondRun: secondRun
  };
}

function testSeedInitialData() {
  var firstRun = seedInitialData();
  var secondRun = seedInitialData();

  return {
    ok: isSeedGroupOk_(firstRun) && isSeedGroupOk_(secondRun) &&
      secondRun.categories.inserted === 0 &&
      secondRun.settings.inserted === 0,
    action: 'seedInitialData',
    firstRun: firstRun,
    secondRun: secondRun
  };
}

function testValidateSeedData() {
  var result = validateSeedData();

  return {
    ok: result.ok === true,
    action: 'validateSeedData',
    result: result
  };
}

function testPublicConfig_() {
  var payload = callRouterForTest_('public.config', {});
  var data = payload.data || {};

  return {
    ok: payload.ok === true &&
      !!data.appName &&
      data.maxImages !== undefined &&
      data.schemaVersion === undefined,
    action: 'public.config',
    payload: payload
  };
}

function testCategoryList_() {
  var payload = callRouterForTest_('category.list', {});
  var items = payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
  var hasPrivateField = payload.ok && items.some(function (item) {
    return item.default_assignee !== undefined || item.defaultAssignee !== undefined;
  });

  return {
    ok: payload.ok === true && Array.isArray(items) && !hasPrivateField,
    action: 'category.list',
    payload: payload
  };
}

function testAnnouncementList_() {
  var payload = callRouterForTest_('announcement.list', { limit: 5 });
  var items = payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];

  return {
    ok: payload.ok === true && Array.isArray(items) && items.length <= 5,
    action: 'announcement.list',
    payload: payload
  };
}

function callRouterForTest_(action, data) {
  var response = routeRequest_({
    postData: {
      contents: JSON.stringify({
        action: action,
        requestId: 'TEST-' + action,
        sessionToken: '',
        data: data || {}
      })
    }
  }, 'POST');

  return safeJsonParse_(response.getContent(), {
    ok: false,
    error: {
      code: 'TEST_PARSE_FAILED',
      message: 'อ่านผลทดสอบไม่สำเร็จ'
    }
  });
}

function isSeedLogOk_(log) {
  return !!log &&
    typeof log.inserted === 'number' &&
    typeof log.skipped === 'number' &&
    typeof log.error === 'number' &&
    log.error === 0;
}

function isSeedGroupOk_(group) {
  return !!group &&
    isSeedLogOk_(group.categories) &&
    isSeedLogOk_(group.settings) &&
    isSeedLogOk_(group.schemaMigrations);
}
