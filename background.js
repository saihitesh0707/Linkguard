const SAFE_BROWSING_API_KEY = "AIzaSyCV84MYFM70wf3mdQrwkTywg5CV7IeMDZw";

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = details.url;

  if (url.startsWith("chrome://") || 
      url.startsWith("chrome-extension://") ||
      url.startsWith("file://")) return;

  console.log("LinkGuard checking:", url);

  // TEST MODE — check immediately before anything else
  const testThreats = ["free-iphone", "giveaway", "click-here-win", "login-verify"];
  const isSuspicious = testThreats.some(word => url.includes(word));
  
  if (isSuspicious) {
    console.log("THREAT DETECTED - redirecting!");
    chrome.storage.local.set({ dangerousURL: url });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html")
    });
    return;
  }

  const isThreat = await checkURL(url);
  if (isThreat) {
    chrome.storage.local.set({ dangerousURL: url });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html")
    });
  }
});

async function checkURL(url) {

  // TEST MODE
  if (url.includes("free-iphone") ||
      url.includes("click-here-win") ||
      url.includes("login-verify") ||
      url.includes("giveaway")) {
    console.log("TEST MODE: threat detected!");
    return true;
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "linkguard", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }]
          }
        })
      }
    );
    const data = await response.json();
    return data.matches && data.matches.length > 0;
  } catch (err) {
    console.error("LinkGuard check failed:", err);
    return false;
  }
}