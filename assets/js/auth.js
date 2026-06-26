(function () {
  "use strict";

  const SESSION_KEY = "KPR_ADMIN_SESSION";
  let currentUser = null;

  function readSession() {
    try {
      const rawSession = window.sessionStorage.getItem(SESSION_KEY);
      return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    if (!session || !session.sessionToken) {
      return;
    }

    const safeSession = {
      sessionToken: String(session.sessionToken),
      expiresAt: session.expiresAt || "",
      user: session.user || null
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
    currentUser = safeSession.user;
  }

  function clearSession() {
    window.sessionStorage.removeItem(SESSION_KEY);
    currentUser = null;
  }

  const storedSession = readSession();
  if (storedSession && storedSession.user) {
    currentUser = storedSession.user;
  }

  window.KPR_AUTH = {
    getSessionToken: function () {
      const session = readSession();
      return session && session.sessionToken ? session.sessionToken : "";
    },
    getCurrentUser: function () {
      return currentUser;
    },
    setSession: function (session) {
      writeSession(session);
    },
    clearSession: function () {
      clearSession();
    },
    setCurrentUserForLayout: function (user) {
      currentUser = user || null;
    },
    handleSessionExpired: function () {
      clearSession();
    },
    logout: function () {
      clearSession();
      window.location.href = "login.html";
    }
  };
})();
