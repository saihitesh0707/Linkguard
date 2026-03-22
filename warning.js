chrome.storage.local.get(["dangerousURL", "aiReason"], (data) => {
  document.getElementById("dangerous-url").textContent =
    data.dangerousURL || "Unknown URL";
  
  if (data.aiReason) {
    document.getElementById("ai-reason").textContent = data.aiReason;
  }
});

document.getElementById("btn-back").addEventListener("click", () => {
  history.back();
});

document.getElementById("btn-proceed").addEventListener("click", () => {
  chrome.storage.local.get("dangerousURL", (data) => {
    if (data.dangerousURL) window.location.href = data.dangerousURL;
  });
});