(() => {
    "use strict";

    const THEME_KEY = "portfolio-theme";
    const LANG_KEY = "portfolio-lang";
    const SUPPORTED_LANGS = ["fr", "en"];
    const scriptUrl = document.currentScript ? new URL(document.currentScript.src, window.location.href) : null;
    const i18nBaseUrl = scriptUrl ? new URL("../i18n/", scriptUrl) : new URL("assets/i18n/", window.location.href);
    let currentDict = null;

    function t(key, fallback) {
        if (currentDict && typeof currentDict[key] === "string") return currentDict[key];
        return fallback;
    }

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
            return savedTheme;
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);
        const btn = document.querySelector("[data-theme-toggle]");
        if (btn) {
            const isDark = theme === "dark";
            btn.setAttribute("aria-label", isDark ? t("theme_toggle_light", "Enable light mode") : t("theme_toggle_dark", "Enable dark mode"));
            btn.textContent = isDark ? "Light" : "Dark";
        }
    }

    function createThemeToggle() {
        if (document.querySelector("[data-theme-toggle]")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-toggle";
        button.setAttribute("data-theme-toggle", "true");
        button.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
            applyTheme(currentTheme === "dark" ? "light" : "dark");
        });
        document.body.appendChild(button);
        applyTheme(getPreferredTheme());
    }

    function detectLanguage() {
        const savedLang = localStorage.getItem(LANG_KEY);
        if (SUPPORTED_LANGS.includes(savedLang)) return savedLang;
        const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || "fr";
        return browserLang.toLowerCase().startsWith("en") ? "en" : "fr";
    }

    async function loadTranslations(locale) {
        try {
            const response = await fetch(new URL(`${locale}.json`, i18nBaseUrl), { cache: "no-cache" });
            if (!response.ok) return null;
            return response.json();
        } catch (error) {
            return null;
        }
    }

    function applyTranslations(dict) {
        if (!dict) return;
        currentDict = dict;
        document.querySelectorAll("[data-i18n]").forEach((node) => {
            const key = node.getAttribute("data-i18n");
            if (dict[key]) node.textContent = dict[key];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
            const key = node.getAttribute("data-i18n-placeholder");
            if (dict[key]) node.setAttribute("placeholder", dict[key]);
        });
        refreshDynamicControls();
    }

    function refreshDynamicControls() {
        const themeBtn = document.querySelector("[data-theme-toggle]");
        if (themeBtn) {
            const currentTheme = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
            applyTheme(currentTheme);
        }

        const langBtn = document.querySelector("[data-lang-toggle]");
        if (langBtn) {
            const lang = localStorage.getItem(LANG_KEY) || detectLanguage();
            langBtn.textContent = lang.toUpperCase();
            langBtn.setAttribute("aria-label", t("lang_toggle", "Change language"));
        }

        const scrollTopBtn = document.querySelector("[data-scroll-top]");
        if (scrollTopBtn) {
            scrollTopBtn.setAttribute("aria-label", t("scroll_top", "Back to top"));
            scrollTopBtn.textContent = t("scroll_top_short", "Top");
        }
    }

    function createLanguageToggle() {
        if (document.querySelector("[data-lang-toggle]")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "lang-toggle";
        button.setAttribute("data-lang-toggle", "true");
        button.setAttribute("aria-label", "Change language");
        button.addEventListener("click", async () => {
            const currentLang = localStorage.getItem(LANG_KEY) || detectLanguage();
            const nextLang = currentLang === "fr" ? "en" : "fr";
            localStorage.setItem(LANG_KEY, nextLang);
            document.documentElement.setAttribute("lang", nextLang);
            button.textContent = nextLang.toUpperCase();
            const dict = await loadTranslations(nextLang);
            applyTranslations(dict);
        });
        document.body.appendChild(button);
    }

    async function initI18n() {
        const lang = detectLanguage();
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.setAttribute("lang", lang);
        const toggle = document.querySelector("[data-lang-toggle]");
        if (toggle) toggle.textContent = lang.toUpperCase();
        const dict = await loadTranslations(lang);
        applyTranslations(dict);
        refreshDynamicControls();
    }

    function createScrollTopButton() {
        if (document.querySelector("[data-scroll-top]")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scroll-top";
        button.setAttribute("data-scroll-top", "true");
        button.setAttribute("aria-label", "Back to top");
        button.textContent = "Top";
        button.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
        document.body.appendChild(button);

        const onScroll = () => {
            if (window.scrollY > 300) {
                button.classList.add("is-visible");
            } else {
                button.classList.remove("is-visible");
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    function initNavToggle() {
        const toggle = document.querySelector(".nav-toggle");
        const nav = document.querySelector("#site-nav");
        if (!toggle || !nav) return;

        const closeNav = () => {
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Ouvrir le menu");
        };

        toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeNav);
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 980) closeNav();
        });
    }

    function initRevealAnimation() {
        const elements = document.querySelectorAll(".reveal");
        if (!elements.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add("active");
                });
            },
            { threshold: 0.15 }
        );
        elements.forEach((element) => observer.observe(element));
    }

    function initProjectLightbox() {
        const projectImages = document.querySelectorAll(".projects .card img");
        if (!projectImages.length) return;

        const overlay = document.createElement("div");
        overlay.className = "project-lightbox";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = `
            <button type="button" class="project-lightbox-close" aria-label="Fermer">x</button>
            <article class="project-lightbox-panel" role="dialog" aria-modal="true" aria-label="Presentation du projet">
                <img class="project-lightbox-image" alt="" />
                <div class="project-lightbox-content">
                    <h3></h3>
                    <p></p>
                </div>
            </article>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector(".project-lightbox-close");
        const panel = overlay.querySelector(".project-lightbox-panel");
        const lightboxImage = overlay.querySelector(".project-lightbox-image");
        const lightboxTitle = overlay.querySelector(".project-lightbox-content h3");
        const lightboxText = overlay.querySelector(".project-lightbox-content p");
        let lastFocused = null;

        const openLightbox = (image) => {
            const card = image.closest(".card");
            const title = card ? card.querySelector("h3") : null;
            const text = card ? card.querySelector(".card-content p") : null;

            lightboxImage.src = image.currentSrc || image.src;
            lightboxImage.alt = image.alt || "Image projet";
            lightboxTitle.textContent = title ? title.textContent.trim() : "Projet";
            lightboxText.textContent = text ? text.textContent.trim() : "";

            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
            lastFocused = document.activeElement;
            closeBtn.focus();
            document.body.style.overflow = "hidden";
        };

        const closeLightbox = () => {
            overlay.classList.remove("is-open");
            overlay.setAttribute("aria-hidden", "true");
            lightboxImage.src = "";
            document.body.style.overflow = "";
            if (lastFocused && typeof lastFocused.focus === "function") {
                lastFocused.focus();
            }
        };

        projectImages.forEach((image) => {
            image.setAttribute("tabindex", "0");
            image.setAttribute("role", "button");
            image.setAttribute("aria-label", "Ouvrir l image du projet");
            image.addEventListener("click", () => openLightbox(image));
            image.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLightbox(image);
                }
            });
        });

        closeBtn.addEventListener("click", closeLightbox);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeLightbox();
        });
        panel.addEventListener("click", (event) => event.stopPropagation());
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && overlay.classList.contains("is-open")) {
                closeLightbox();
            }
        });
    }

    function initCardAnimations() {
        const animatedCards = document.querySelectorAll(".card, .info-card, .timeline-item");
        if (!animatedCards.length) return;

        animatedCards.forEach((card) => card.classList.add("is-animated"));

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("in-view");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.18 }
        );

        animatedCards.forEach((card, index) => {
            card.style.setProperty("--card-delay", `${Math.min(index * 70, 420)}ms`);
            observer.observe(card);
        });
    }

    function initFormSubmitRedirects() {
        const forms = document.querySelectorAll('form[action*="formsubmit.co"]');
        if (!forms.length) return;

        forms.forEach((form) => {
            const pathHint = form.getAttribute("data-next-path");
            if (!pathHint) return;

            const nextUrl = new URL(pathHint, window.location.href).href;
            let nextInput = form.querySelector('input[name="_next"]');
            if (!nextInput) {
                nextInput = document.createElement("input");
                nextInput.type = "hidden";
                nextInput.name = "_next";
                form.appendChild(nextInput);
            }
            nextInput.value = nextUrl;
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        initNavToggle();
        initFormSubmitRedirects();
        createThemeToggle();
        createLanguageToggle();
        await initI18n();
        createScrollTopButton();
        initRevealAnimation();
        initProjectLightbox();
        initCardAnimations();
    });
})();
