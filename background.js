const SAFE_BROWSING_API_KEY = "AIzaSyCV84MYFM70wf3mdQrwkTywg5CV7IeMDZw";
const GEMINI_API_KEY = "AIzaSyDuM56qvLvSBpnTXvGu4zGO1k51KPWk1uY";

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = details.url;

  if (url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("file://")) return;

  console.log("LinkGuard checking:", url);

  const testThreats = ["free-iphone", "giveaway", "click-here-win", "login-verify", "phishing", "malware"];
  const isSuspicious = testThreats.some(word => url.includes(word));

  if (isSuspicious) {
    console.log("THREAT DETECTED - redirecting!");
    const reason = await getAIExplanation(url);
    chrome.storage.local.set({ dangerousURL: url, aiReason: reason });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html")
    });
    return;
  }

  const isThreat = await checkURL(url);
  if (isThreat) {
    const reason = await getAIExplanation(url);
    chrome.storage.local.set({ dangerousURL: url, aiReason: reason });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html")
    });
  }
});

async function checkURL(url) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
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

async function getAIExplanation(url) {
  try {
    console.log("Calling Gemini API...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `In 2 sentences, why is this URL dangerous: ${url}`
            }]
          }]
        })
      }
    );
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Raw response:", text);
    const data = JSON.parse(text);
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    return "This link is dangerous. Do not proceed.";
  } catch (err) {
    console.error("Gemini failed:", err);
    return "This link is dangerous. Do not proceed.";
  }
}
// APK Download Detection
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const url = details.url;
  
  if (url.endsWith(".apk") || url.includes(".apk?")) {
    console.log("APK DETECTED:", url);
    const reason = "This APK file is from an unverified source. It may contain malware, spyware, or dangerous permissions that could steal your personal data.";
    chrome.storage.local.set({ 
      dangerousURL: url, 
      aiReason: reason,
      isAPK: true 
    });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html")
    });
  }
});