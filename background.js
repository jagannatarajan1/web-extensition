chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadCSV") {
    const blob = new Blob([request.data], { type: "text/csv;charset=utf-8;" });
    const reader = new FileReader();

    reader.onload = function () {
      const base64data = reader.result;

      chrome.downloads.download({
        url: base64data,
        filename: "linkedin_commenters.csv"
      });
    };

    reader.readAsDataURL(blob);
  }
});
