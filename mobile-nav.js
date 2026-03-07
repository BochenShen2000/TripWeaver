(() => {
  const sections = Array.from(document.querySelectorAll(".mobile-screen-section[data-screen]"));
  const tabs = Array.from(document.querySelectorAll(".mobile-tab[data-screen-target]"));

  if (!sections.length || !tabs.length) return;

  const validScreens = new Set(tabs.map((tab) => tab.getAttribute("data-screen-target")));

  function getScreenFromHash() {
    const value = String(window.location.hash || "").replace("#", "").trim();
    return validScreens.has(value) ? value : "plan";
  }

  function applyScreen(screen) {
    sections.forEach((section) => {
      const sectionScreen = section.getAttribute("data-screen");
      section.classList.toggle("screen-hidden", sectionScreen !== screen);
    });
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-screen-target") === screen);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setScreen(screen) {
    if (!validScreens.has(screen)) return;
    if (window.location.hash !== `#${screen}`) {
      window.location.hash = screen;
      return;
    }
    applyScreen(screen);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const screen = tab.getAttribute("data-screen-target");
      setScreen(screen);
    });
  });

  window.addEventListener("hashchange", () => {
    applyScreen(getScreenFromHash());
  });

  if (!window.location.hash || !validScreens.has(window.location.hash.replace("#", ""))) {
    window.location.hash = "plan";
  } else {
    applyScreen(getScreenFromHash());
  }
})();
