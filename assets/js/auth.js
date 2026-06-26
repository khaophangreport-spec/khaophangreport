(function () {
  "use strict";

  let currentUser = null;

  window.KPR_AUTH = {
    getSessionToken: function () {
      return "";
    },
    getCurrentUser: function () {
      return currentUser;
    },
    setCurrentUserForLayout: function (user) {
      currentUser = user || null;
    },
    logout: function () {
      currentUser = null;
      window.location.href = "login.html";
    }
  };
})();
