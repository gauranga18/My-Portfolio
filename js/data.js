/* ==========================================================================
 *  data.js — the single source of truth for all site content.
 *  Edit this file to change anything you see on the page.
 *  Loaded before main.js; exposes window.SITE.
 * ========================================================================== */

window.SITE = {

    /* ---------- Meta / head ---------- */
    meta: {
        name: "Saurav Jyoti Kalita",
        role: "Computing and Artificial Intelligence",
        description: "Portfolio of Saurav Jyoti Kalita, a BCA student at Chandigarh University focused on Computing and AI — building lightweight, offline-first tools in C, C++, and Python.",
        themeColor: "#0e0e0e",
        favicon: "assets/favicon.svg"
    },

    /* ---------- Brand / logo ---------- */
    brand: {
        label: "SJK",
        href: "#top"
    },

    /* ---------- Primary nav ---------- */
    nav: [
        { label: "About",    href: "#about"    },
        { label: "Skills",   href: "#skills"   },
        { label: "Projects", href: "#projects" },
        { label: "Contact",  href: "#contact"  }
    ],

    /* ---------- Hero ---------- */
    hero: {
        titleLines: [
            "I build fast,",
            "offline-first",
            "tools for",
            "the edge."
        ],
        lede: "Hi, I'm Saurav, a BCA student at Chandigarh University working in Computing and AI. I work primarily in C, C++, and Python, with a deep interest in deployment tooling, edge devices, and offline-first infrastructure.",
        cta: [
            { label: "Contact me",      href: "#contact",  variant: "primary" },
            { label: "See my projects", href: "#projects", variant: "ghost"   }
        ],
        status: "Open to opportunities",
        links: [
            { label: "sauravjyotikalita56@gmail.com", href: "mailto:sauravjyotikalita56@gmail.com" },
            { label: "GitHub",                        href: "https://github.com/gauranga18", rel: "noopener" },
            { label: "LinkedIn",                      href: "https://www.linkedin.com/in/saurav-jyoti/", rel: "noopener" }
        ]
    },

    /* ---------- Projects ---------- */
    projectsSection: {
        heading: "Selected projects",
        items: [
            {
                id: "forge",
                title: "Forge",
                meta: "C · 100KB · Deployment tool for edge devices",
                description: "A minimal, zero-dependency deployment tool written in C that clones Git repositories, builds Docker images, and runs containers — all from a single 70KB static binary. Designed for edge devices and offline environments where every kilobyte matters.",
                tags: ["C", "Docker", "Linux", "Edge"],
                actions: {
                    live: { label: "View on GitHub", href: "https://github.com/gauranga18/forge" },
                    code: { label: "Read the README", href: "https://github.com/gauranga18/forge#readme" }
                },
            },
        ]
    },

    /* ---------- About ---------- */
    about: {
        heading: "About me",
        lead: "I'm a BCA student at Chandigarh University (2023–2026), focused on Computing and AI. I work primarily in C, C++, and Python, with a deep interest in deployment tooling, edge devices, and offline-first infrastructure. I built Forge — a 70KB C binary that deploys Docker containers from Git repos with zero runtime dependencies.",
        highlightsHeading: "Highlights",
        highlights: [
            "BCA — Chandigarh University (2023–2026)",
            "Built Forge: a 100KB zero-dependency deployment tool in C",
            "Focus: Computing and AI",
            "Location: Punjab, India",
            "Status: Open to opportunities"
        ],
        toolsHeading: "Tools I'm comfortable with",
        tools: ["C", "C++", "Python", "Docker", "Git", "Linux"]
    },

    /* ---------- Contact ---------- */
    contact: {
        heading: "Let's build something together.",
        email: "sauravjyotikalita56@gmail.com",
        links: [
            { label: "GitHub",   href: "https://github.com/gauranga18", rel: "noopener" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/saurav-jyoti/", rel: "noopener" }
        ]
    },

    /* ---------- Footer ---------- */
    footer: {
        copyrightName: "Saurav Jyoti Kalita",
        sourceLink: {
            label: "View this site's source on GitHub",
            href: "https://github.com/gauranga18/My-Portfolio",
            rel: "noopener"
        }
    }
};
