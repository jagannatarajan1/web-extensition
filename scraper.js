document.getElementById("start").addEventListener("click", async () => {
  const keyword = document.getElementById("keyword").value;
  const count = parseInt(document.getElementById("count").value, 10);

  const query = encodeURIComponent(keyword);
  const url = `https://www.linkedin.com/search/results/content/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;

  chrome.tabs.create({ url: url }, (tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeComments,
      args: [count],
    });
  });
});

function scrapeComments(postLimit) {
  (async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(5000); // wait for page to load

    const posts = Array.from(
      document.querySelectorAll("div.feed-shared-update-v2")
    ).slice(0, postLimit);
    const commenters = new Set();

    for (const post of posts) {
      const commentBtn = post.querySelector(
        "button.comments-comment-social-bar__button"
      );
      if (commentBtn) {
        commentBtn.click();
        await sleep(3000);
      }

      const profileLinks = post.querySelectorAll(
        "a.comments-post-meta__profile-link"
      );
      profileLinks.forEach((link) => {
        const href = link.href;
        if (href && href.includes("/in/")) {
          commenters.add(href.split("?")[0]);
        }
      });
    }

    if (commenters.size === 0) {
      alert("No commenters found!");
      return;
    }

    // Create CSV
    const csvContent =
      "data:text/csv;charset=utf-8," + Array.from(commenters).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.setAttribute("href", encodedUri);
    a.setAttribute("download", "linkedin_commenters.csv");
    document.body.appendChild(a);
    a.click();
  })();
}
