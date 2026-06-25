(function () {
  "use strict";

  window.KPRUtils = {
    setText: function (element, value) {
      if (element) {
        element.textContent = value || "";
      }
    }
  };
})();

