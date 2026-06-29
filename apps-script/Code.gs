function doGet(e) {
  try {
    return Router_handleGet_(e);
  } catch (error) {
    const meta = Router_extractMetaFromEvent_(e, "GET");

    Response_logUnhandledBackendError_(error, meta);
    return Response_fromException_(error, meta);
  }
}

function doPost(e) {
  try {
    return Router_handlePost_(e);
  } catch (error) {
    const meta = Router_extractMetaFromEvent_(e, "POST");

    Response_logUnhandledBackendError_(error, meta);
    return Response_fromException_(error, meta);
  }
}
