(() => {
  const THEME_KEY = "av-theme";
  const TRANSITION_MS = 240;
  const body = document.body;
  const themeButton = document.querySelector(".theme-toggle");
  const themeButtonText = document.querySelector(".theme-toggle-text");
  const themeImages = Array.from(document.querySelectorAll(".theme-image"));
  const constructionNotice = document.querySelector(".construction-notice");
  const constructionClose = document.querySelector(".construction-close");
  const imageCache = new Map();
  let activeTheme = body.dataset.theme === "light" ? "light" : "dark";
  let isSwitchingTheme = false;

  function readSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (_error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_error) {
      // Storage can be unavailable in private or locked-down browsers.
    }
  }

  function requestedTheme() {
    const requested = new URLSearchParams(window.location.search).get("theme");
    if (requested === "light" || requested === "dark") {
      return requested;
    }

    return readSavedTheme() === "light" ? "light" : "dark";
  }

  function imageSourceForTheme(image, theme) {
    return image.dataset[theme === "light" ? "lightSrc" : "darkSrc"] || image.getAttribute("src");
  }

  function preloadImage(src) {
    if (!src) {
      return Promise.resolve();
    }

    if (imageCache.has(src)) {
      return imageCache.get(src);
    }

    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
    });

    imageCache.set(src, promise);
    return promise;
  }

  function preloadThemeImages(theme) {
    const sources = [...new Set(themeImages.map((image) => imageSourceForTheme(image, theme)).filter(Boolean))];
    return Promise.all(sources.map(preloadImage));
  }

  function updateThemeButton(theme) {
    if (!themeButton) {
      return;
    }

    const isLight = theme === "light";
    themeButton.setAttribute("aria-pressed", String(isLight));
    themeButton.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");

    if (themeButtonText) {
      themeButtonText.textContent = isLight ? "Dark" : "Light";
    }
  }

  function swapThemeImages(theme) {
    themeImages.forEach((image) => {
      const nextSrc = imageSourceForTheme(image, theme);

      if (nextSrc && image.getAttribute("src") !== nextSrc) {
        image.src = nextSrc;
      }
    });
  }

  function applyTheme(theme) {
    activeTheme = theme === "light" ? "light" : "dark";
    body.dataset.theme = activeTheme;
    swapThemeImages(activeTheme);
    updateThemeButton(activeTheme);
    saveTheme(activeTheme);
  }

  async function setTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";

    if (isSwitchingTheme || nextTheme === activeTheme) {
      return;
    }

    isSwitchingTheme = true;
    body.classList.add("is-theme-switching");

    if (themeButton) {
      themeButton.disabled = true;
    }

    try {
      await preloadThemeImages(nextTheme);
      applyTheme(nextTheme);
    } finally {
      window.setTimeout(() => {
        body.classList.remove("is-theme-switching");
        isSwitchingTheme = false;

        if (themeButton) {
          themeButton.disabled = false;
        }
      }, TRANSITION_MS);
    }
  }

  applyTheme(requestedTheme());
  preloadThemeImages(activeTheme === "light" ? "dark" : "light");

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const nextTheme = activeTheme === "light" ? "dark" : "light";
      setTheme(nextTheme).catch(() => {
        body.classList.remove("is-theme-switching");
        isSwitchingTheme = false;
        themeButton.disabled = false;
      });
    });
  }

  if (constructionClose && constructionNotice) {
    constructionClose.addEventListener("click", () => {
      constructionNotice.classList.add("is-hidden");
    });
  }
})();
