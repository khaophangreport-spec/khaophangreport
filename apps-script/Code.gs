function doGet(e) {
  return createJsonResponse_({
    ok: true,
    data: {
      status: 'not_implemented'
    },
    message: 'ยังไม่ได้เปิดใช้งาน Backend',
    meta: {}
  });
}

function doPost(e) {
  return routeRequest_(e);
}

