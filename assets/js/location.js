(function () {
  "use strict";

  window.KPR_LOCATION = {
    isSupported: function () {
      return "geolocation" in navigator;
    }
  };
})();
