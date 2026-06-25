function routeRequest_(e) {
  return createJsonResponse_({
    ok: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'ยังไม่ได้ติดตั้ง API ในขั้นนี้'
    },
    meta: {}
  });
}

