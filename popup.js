let globalTabId = null;

// 🧠 Handle "Submit" — opens LinkedIn search with keyword
document.getElementById("submitBtn").addEventListener("click", () => {
  const keyword = document.getElementById("keyword").value.trim();
  const count = parseInt(document.getElementById("count").value, 10);

  if (!keyword || isNaN(count) || count <= 0) {
    alert("Please enter a valid keyword and count.");
    return;
  }

  const query = encodeURIComponent(keyword);
  const url = `https://www.linkedin.com/search/results/content/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;

  chrome.tabs.create({ url }, (tab) => {
    globalTabId = tab.id;
    chrome.storage.local.set({ postLimit: count });
  });
});

// 🧹 Start scraping
document.getElementById("startBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "start_scraping" });
    }
  });
});

// 📦 Upload CSV and auto-message
// document.getElementById("processCsvBtn").addEventListener("click", () => {
//   const fileInput = document.getElementById("csvUpload");
//   const file = fileInput.files[0];

//   if (!file) {
//     alert("Please upload a CSV file.");
//     return;
//   }

//   const reader = new FileReader();

//   reader.onload = function (e) {
//     const lines = e.target.result.split("\n").filter((line) => line.trim());
//     const data = lines;

//     data.forEach((line, index) => {
//       const [url, subject, message] = line.split(",");

//       if (url) {
//         setTimeout(() => {
//           chrome.tabs.create({ url: url.trim(), active: false }, (tab) => {
//             const tabId = tab.id;

//             const listener = (updatedTabId, changeInfo) => {
//               if (updatedTabId === tabId && changeInfo.status === "complete") {
//                 chrome.scripting.executeScript({
//                   target: { tabId },
//                   func: (subject, message) => {
//                     function insertMessageInContentEditable(
//                       selector,
//                       message,
//                       timeout = 10000
//                     ) {
//                       const start = Date.now();
//                       const interval = setInterval(() => {
//                         const editableDiv = document.querySelector(selector);
//                         if (editableDiv) {
//                           editableDiv.innerHTML = `<p>${message}</p>`;
//                           editableDiv.dispatchEvent(
//                             new Event("input", { bubbles: true })
//                           );
//                           editableDiv.dispatchEvent(
//                             new Event("change", { bubbles: true })
//                           );
//                           clearInterval(interval);
//                           const sendBtn = document.querySelector(
//                             ".msg-form__send-btn"
//                           );
//                           if (sendBtn) sendBtn.click();
//                         } else if (Date.now() - start > timeout) {
//                           console.warn("❌ Message box not found in time.");
//                           clearInterval(interval);
//                         }
//                       }, 200);
//                     }

//                     setTimeout(() => {
//                       const messageBtn = Array.from(
//                         document.querySelectorAll("button")
//                       ).find((btn) => btn.textContent.trim() === "Message");

//                       const connectBtn = Array.from(
//                         document.querySelectorAll("button")
//                       ).find((btn) => btn.textContent.trim() === "Connect");

//                       if (connectBtn) connectBtn.click();

//                       if (messageBtn) {
//                         messageBtn.click();

//                         const start = Date.now();
//                         const interval = setInterval(() => {
//                           const input = document.querySelector(
//                             "input[name='subject']"
//                           );
//                           if (input) {
//                             input.value = subject;
//                             input.dispatchEvent(
//                               new Event("input", { bubbles: true })
//                             );

//                             insertMessageInContentEditable(
//                               "div.msg-form__contenteditable",
//                               message
//                             );
//                             clearInterval(interval);
//                           } else if (Date.now() - start > 10000) {
//                             console.warn("❌ Subject input not found.");
//                             clearInterval(interval);
//                           }
//                         }, 200);
//                       }
//                     }, 2000);
//                   },
//                   args: [subject, message],
//                 });

//                 chrome.tabs.onUpdated.removeListener(listener);
//               }
//             };

//             chrome.tabs.onUpdated.addListener(listener);
//           });
//         }, index * 4000);
//       }
//     });
//   };

//   reader.readAsText(file);
// });

// document.getElementById("processCsvBtn").addEventListener("click", () => {
//   const fileInput = document.getElementById("csvUpload");
//   const file = fileInput.files[0];

//   if (!file) {
//     alert("Please upload a CSV file.");
//     return;
//   }

//   const reader = new FileReader();

//   reader.onload = function (e) {
//     const csvData = e.target.result;
//     const lines = csvData.split("\n").filter((line) => line.trim());
//     const jsonData = [];

//     if (lines.length) {
//       const headers = lines[0].split(",").map((header) => header.trim());

//       lines.slice(1).forEach((line) => {
//         const values = line.split(",");
//         const entry = {};

//         headers.forEach((header, index) => {
//           entry[header] = values[index]?.trim() || "";
//         });

//         // Transform entry to match the desired output format
//         jsonData.push({
//           url: entry.url,
//           context: entry.context,
//           message: entry.message,
//           keywords: entry.keywords,
//           request: entry.request.toLowerCase() === "true",
//         });
//       });
//     }

//     console.log("Converted JSON Data:", jsonData);

//     // Example usage of JSON data
//     jsonData.forEach((data) => {
//       console.log(
//         `URL: ${data.url}, Context: ${data.context}, Message: ${data.message}, Keywords: ${data.keywords}, Request: ${data.request}`
//       );
//     });
//   };

//   reader.readAsText(file);
// });

const fileInput = document.getElementById("csvUpload");

fileInput.addEventListener("click", (e) => {
  e.stopPropagation();
});
fileInput.addEventListener("change", (e) => {
  e.stopPropagation();
});

document.getElementById("processCsvBtn").addEventListener("click", () => {
  const fileInput = document.getElementById("csvUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a CSV file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const csvData = e.target.result;
    const lines = csvData.split("\n").filter((line) => line.trim());
    const jsonData = [];

    if (lines.length) {
      const headers = lines[0].split(",").map((header) => header.trim());

      lines.slice(1).forEach((line) => {
        const values = line.split(",");
        const entry = {};

        headers.forEach((header, index) => {
          entry[header] = values[index]?.trim() || "";
        });

        // Transform entry to match the desired output format
        jsonData.push({
          url: entry.url,
          context: entry.context,
          message: entry.message,
          keywords: entry.keywords,
          request: entry.request.toLowerCase() === "true",
        });
      });
    }

    console.log("Converted JSON Data:", jsonData);

    // Retrieve access token and call the API
    // Retrieve the access token from localStorage
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      console.error("Access token not found in localStorage.");
      alert("Authentication required. Please log in.");
      return;
    }

    // Call the verify API
    fetch("http://localhost:3000/payment/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((apiResponse) => {
        console.log("API Response:", apiResponse);

        const userId = apiResponse?.user?._id;
        if (!userId) {
          alert("User ID not found. Please try again.");
          return;
        }

        console.log("User ID:", userId);

        // Send JSON data to the user-specific endpoint
        fetch(`http://localhost:3000/user/add-data/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonData),
        })
          .then((response) => response.json())
          .then((responseData) => {
            console.log("Data successfully posted:", responseData);
            alert("Data successfully added!");
          })
          .catch((error) => {
            console.error("Error posting data:", error);
            alert("Failed to add data. Please try again.");
          });
      })
      .catch((error) => {
        console.error("API Call Error:", error);
        alert("Failed to verify data.");
      });
  };

  reader.readAsText(file);
});
