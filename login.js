const TARGET_URL = "http://localhost:5173";

// The function to be injected into the leadmagnet page
function fetchAuthToken() {
  const token = localStorage.getItem("accessToken");
  chrome.runtime.sendMessage({ from: "content", token: token || null });
}

// Utility to inject and fetch token
function injectAndFetch(tabId, closeAfter = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: fetchAuthToken,
  });

  chrome.runtime.onMessage.addListener(function listener(message, sender) {
    if (message.from === "content") {
      if (message.token) {
        console.log("✅ accessToken:", message.token);
        // chrome.action.setPopup({ popup: "scraper.html" });
        localStorage.setItem("accessToken", message.token);
        window.location.href = "scraper.html";
      } else {
        console.warn("⚠️ accessToken not found");
      }

      chrome.runtime.onMessage.removeListener(listener);
      if (closeAfter) chrome.tabs.remove(tabId);
    }
  });
}

// Main logic triggered when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  console.log("excecuting this");
  const currentTab = tabs[0];

  if (currentTab.url && currentTab.url.startsWith(TARGET_URL)) {
    // Already on the right page → just inject
    injectAndFetch(currentTab.id);
  } else {
    // Not on target page → open new tab, inject after load, then close
    chrome.tabs.create({ url: TARGET_URL, active: false }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function tabListener(tabId, info) {
        if (tabId === newTab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(tabListener);
          injectAndFetch(tabId, true); // Inject and close the tab after token is fetched
        }
      });
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event triggered."); // Debugging log
  const loginButton = document.getElementById("login");

  if (loginButton) {
    console.log("Login button found."); // Debugging log
    loginButton.addEventListener("click", () => {
      console.log("Login button clicked, redirecting to target URL...");

      // Redirect using chrome.tabs.update
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.update(currentTab.id, { url: TARGET_URL });
      });
    });
  } else {
    console.error("Login button not found!"); // Error log
  }
});
