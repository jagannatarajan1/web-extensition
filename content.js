chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("recieved Message from popup");
  if (request.action === "start_scraping") {
    const sleep = ms => new Promise(res => setTimeout(res, ms));

    let { postLimit } = await chrome.storage.local.get("postLimit");

    postLimit = postLimit || 20

    await sleep(5000); // wait for page to load
    let posts = Array.from(document.querySelectorAll('div.feed-shared-update-v2__control-menu-container')).slice(0, postLimit);
    while(posts.length < postLimit) {
      console.log(posts.length, "posts found, scrolling down")
      posts[posts.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(2000);
      posts = Array.from(document.querySelectorAll('div.feed-shared-update-v2__control-menu-container')).slice(0, postLimit);
    }
    const commenters = new Set();
    console.log("posts", posts);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      const commentBtn = post.querySelector('li.social-details-social-counts__comments button');
      console.log(i, commentBtn)
      if (commentBtn && commentBtn.innerText.toLowerCase().includes('comment')) {
        commentBtn.click();
        await sleep(3000);
      }

      const moreBtns = post.querySelectorAll('button.comments-comments-list__load-more-comments-button');
      for (const btn of moreBtns) {
        btn.click();
        await sleep(2000);
      }

      const profileLinks = post.querySelectorAll('a.comments-comment-meta__description-container');
      profileLinks.forEach(link => {
        const href = link.href;
        if (href.includes('/in/')) {
          commenters.add(href.split('?')[0]);
        }
      });

    }

    if (commenters.size === 0) {
      alert("No commenters found.");
      return;
    } else {
      console.log("Commenters:", commenters);
    }

    chrome.runtime.sendMessage({
      action: "downloadCSV",
      data: Array.from(commenters).join("\n")
    });

    // const csvContent = "data:text/csv;charset=utf-8," + Array.from(commenters).join("\n");
    // const encodedUri = encodeURI(csvContent);
    // const link = document.createElement("a");
    // link.setAttribute("href", encodedUri);
    // link.setAttribute("download", "linkedin_commenters.csv");
    // document.body.appendChild(link);
    // link.click();
  }
});
