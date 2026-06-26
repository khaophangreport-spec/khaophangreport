(function () {
  "use strict";

  window.KPR_VALIDATION = {
    isRequired: function (value) {
      return String(value || "").trim().length > 0;
    }
  };
})();
