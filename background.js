chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadCSV") {
    const blob = new Blob([request.data], { type: "text/csv;charset=utf-8;" });
    const reader = new FileReader();

    reader.onload = function () {
      const base64data = reader.result;

      chrome.downloads.download({
        url: base64data,
        filename: "linkedin_commenters.csv",
      });
    };

    reader.readAsDataURL(blob);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "process_csv") {
    const csvData = message.data;
    const lines = csvData.split("\n").filter((line) => line.trim());
    const jsonData = [];

    try {
      if (lines.length) {
        const headers = lines[0].split(",").map((header) => header.trim());

        lines.slice(1).forEach((line) => {
          const values = line.split(",");
          const entry = {};
          headers.forEach((header, index) => {
            entry[header] = values[index]?.trim() || "";
          });
          jsonData.push(entry);
        });

        console.log("Processed CSV Data:", jsonData);
        sendResponse({ message: "CSV processed successfully", data: jsonData });
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      sendResponse({ message: "Error processing CSV" });
    }
  }
  return true; // To handle async response
});
