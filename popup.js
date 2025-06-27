let globalTabId = null;

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
    // Store post limit in session
    chrome.storage.local.set({ postLimit: count });
  });
});

document.getElementById("startBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "start_scraping" });
    }
  });
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
    const lines = e.target.result.split("\n").filter(line => line.trim());
    // const data = lines.slice(1); // Skip header
    const data = lines;

    console.log(data, "data")
    data.forEach((line, index) => {
      const [url, subject, message] = line.split(",");
      console.log(line, subject, "line");

      if (url) {
        setTimeout(() => {
          chrome.tabs.create({ url: url.trim(), active: false }, function (tab) {
            const tabId = tab.id;

            const listener = (updatedTabId, changeInfo, updatedTab) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                // Double-check the tab is still valid and loaded
                chrome.scripting.executeScript({
                  target: { tabId },
                  func: (subject, message) => {
                    function insertMessageInContentEditable(selector, message, timeout = 10000) {
                      const start = Date.now();
                      const interval = setInterval(() => {
                        const editableDiv = document.querySelector(selector);
                        if (editableDiv) {
                          editableDiv.innerHTML = `<p>${message}</p>`;

                          // Trigger input events so LinkedIn detects the change
                          editableDiv.dispatchEvent(new Event("input", { bubbles: true }));
                          editableDiv.dispatchEvent(new Event("change", { bubbles: true }));

                          clearInterval(interval);
                          const sendBtn = document.querySelector(".msg-form__send-btn")
                          if(sendBtn) {
                            sendBtn.click()
                          }
                        } else if (Date.now() - start > timeout) {
                          console.warn("Contenteditable div not found within timeout.");
                          clearInterval(interval);
                        }
                      }, 200);
                    }

                    // Usage:
                    setTimeout(() => {
                      const messageButton = Array.from(document.querySelectorAll("button"))
                        .find(btn => btn.textContent.trim() === "Message");
                      console.log(messageButton, "messageButton")

                      const connectButton = Array.from(document.querySelectorAll("button"))
                        .find(btn => btn.textContent.trim() === "Connect");
                      console.log(connectButton, "connectButton")

                      if(connectButton){
                        connectButton.click();
                      }
                      if(messageButton){
                        messageButton.click();
                        console.log("clicked message button")
                        // waitForInputAndType('input[name="subject"]', subject);
                        console.log("wait for input started")
                        const start = Date.now();

                        const interval = setInterval(() => {
                          const selector = "input[name='subject']";
                          const text = subject;
                          const input = document.querySelector(selector);
                          console.log(selector, input ,"check")
                          if (input) {
                            input.value = text;

                            // Dispatch input event so frameworks like React detect the change
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            insertMessageInContentEditable("div.msg-form__contenteditable", message);
                            clearInterval(interval);
                          } else if (Date.now() - start > 10000) {
                            console.warn("Input not found within timeout.");
                            clearInterval(interval);
                          }
                        }, 200);
                        console.log("Message button clicked");
                      }
                      
                      console.log('Script executed after tab fully loaded');
                    }, 2000); // wait 2s for DOM to stabilize
                  },
                  args: [subject, message]
                });

                chrome.tabs.onUpdated.removeListener(listener);
              }
            };

            chrome.tabs.onUpdated.addListener(listener);
          });
        }, index * 4000); // Stagger tabs with more delay (LinkedIn loads slowly)
      }
    });

  };

  reader.readAsText(file);
});