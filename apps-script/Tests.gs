function runTests() {
  return {
    ok: true,
    publicConfig: testPublicConfig_(),
    categoryList: testCategoryList_(),
    announcementList: testAnnouncementList_()
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
