(function () {
  "use strict";

  window.KPRValidation = {
    isRequired: function (value) {
      return String(value || "").trim().length > 0;
    }
  };
})();

