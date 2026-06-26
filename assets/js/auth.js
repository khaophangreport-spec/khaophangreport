(function () {
  "use strict";

  function getCurrentUser() {
    return null;
  }

  function handleLogoutIntent() {
    window.alert("ยังไม่ได้เชื่อมต่อ Session จริง การออกจากระบบจะทำงานในขั้น Authentication");
  }

  window.KPRAuth = {
    getCurrentUser: getCurrentUser,
    getSessionToken: function () {
      return "";
    },
    handleLogoutIntent: handleLogoutIntent
  };
})();
