chrome.storage.local.get("dangerousURL", (data) => {
  document.getElementById("dangerous-url").textContent =
    data.dangerousURL || "Unknown URL";
});

document.getElementById("btn-back").addEventListener("click", () => {
  history.back();
});

document.getElementById("btn-proceed").addEventListener("click", () => {
  chrome.storage.local.get("dangerousURL", (data) => {
    if (data.dangerousURL) window.location.href = data.dangerousURL;
  });
});