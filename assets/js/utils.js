(function () {
  "use strict";

  window.KPR_UTILS = {
    setText: function (element, value) {
      if (element) {
        element.textContent = value || "";
      }
    }
  };
})();
