(function () {
  "use strict";

  window.KPR_IMAGE = {
    maxImages: function () {
      return (window.APP_CONFIG && window.APP_CONFIG.MAX_IMAGES) || 3;
    }
  };
})();
