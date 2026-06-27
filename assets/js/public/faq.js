(function () {
  "use strict";

  const searchInput = document.querySelector("[data-faq-list]") ?
    document.getElementById("faq-search-input") :
    null;
  const faqList = document.querySelector("[data-faq-list]");
  const emptyState = document.querySelector("[data-faq-empty]");
  const clearButton = document.querySelector("[data-faq-clear]");
  const resultSummary = document.getElementById("faq-result-summary");

  if (!searchInput || !faqList || !emptyState || !resultSummary) {
    return;
  }

  const faqItems = Array.prototype.slice.call(faqList.querySelectorAll(".faq-item"));

  function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function getItemText(item) {
    return normalizeText(item.textContent);
  }

  function updateFaqList() {
    const query = normalizeText(searchInput.value);
    let visibleCount = 0;

    faqItems.forEach(function (item) {
      const isVisible = !query || getItemText(item).indexOf(query) !== -1;
      item.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    emptyState.hidden = visibleCount > 0;
    clearButton.hidden = !query;
    resultSummary.textContent = query ?
      "พบคำถาม " + visibleCount + " รายการ" :
      "แสดงคำถามทั้งหมด";
  }

  searchInput.addEventListener("input", updateFaqList);

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      searchInput.value = "";
      updateFaqList();
      searchInput.focus();
    });
  }

  updateFaqList();
}());
