document.querySelector("button").addEventListener("click", async () => {
  const screenDetails = await window.getScreenDetails();

  // Open a full-size window on each screen available to the device

  window.open(
    "./spyglass.html",
    "_blank",
    `left=${
      screenDetails.screens[0].availLeft +
      screenDetails.screens[0].availWidth * 0.25
    },
    top=${
      screenDetails.screens[0].availTop +
      screenDetails.screens[0].availHeight * 0.25
    },
    width=${screenDetails.screens[0].availWidth * 0.5},
    height=${screenDetails.screens[0].availHeight * 0.5}`
  );
});
