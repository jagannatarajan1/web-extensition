// document.getElementById("login").addEventListener("click", () => {
//   const dashboardURL = "http://localhost:5173"; // React dashboard/login
//   const backendVerifyURL = "http://localhost:3000/payment/verify";

//   chrome.tabs.create({ url: dashboardURL });
//   // 1️⃣ Get token from chrome.storage.local

//   // 2️⃣ Send token to backend for verification
//   function verifyToken(token) {
//     console.log("🔍 Verifying token with backend...");

//     fetch(backendVerifyURL, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then(async (res) => {
//         if (!res.ok) {
//           const text = await res.text();
//           throw new Error(`HTTP ${res.status} - ${text}`);
//         }
//         return res.json();
//       })
//       .then((data) => {
//         console.log("📨 Backend response:", data);

//         if (data?.isSubscribed) {
//           console.log("✅ Token valid. Opening scraper.");
//           chrome.action.setPopup({ popup: "scraper.html" });
//           window.location.href = "scraper.html";
//         } else {
//           console.warn("⚠️ Token valid, but not subscribed.");
//         }
//       })
//       .catch((err) => {
//         console.error("🚨 Verification error:", err);
//       });
//   }
// });

// function init() {
//   chrome.storage.local.get("accessToken", ({ accessToken }) => {
//     if (accessToken) {
//       console.log("✅ Token from chrome.storage.local:", accessToken);
//       verifyToken(accessToken);
//     } else {
//       console.warn("❌ No token found in chrome.storage.local");
//     }
//   });
// }

// init();

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
