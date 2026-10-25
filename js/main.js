(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer  = matchMedia("(hover: hover) and (pointer: fine)");

  const SITE = window.SITE;
  if (!SITE) {
    console.warn("[portfolio] data.js missing or window.SITE undefined.");
    return;
  }

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const el = (tag, opts = {}) => {
    const node = document.createElement(tag);
    if (opts.class)   node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.href)    node.setAttribute("href", opts.href);
    if (opts.rel)     node.setAttribute("rel", opts.rel);
    if (opts.attrs)   for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
    return node;
  };

  /* ==================================================================
   *  1. RENDERER — hydrate the HTML from window.SITE  (unchanged)
   * ================================================================== */
  const renderBrand = () => {
    const a = $('[data-slot="brand"]');
    if (!a) return;
    a.textContent = SITE.brand.label;
    a.setAttribute("aria-label", `${SITE.brand.label}, back to top`);
    a.setAttribute("href", SITE.brand.href);
  };

  const renderNav = () => {
    const nav = $('[data-slot="nav"]');
    if (!nav) return;
    nav.replaceChildren(
      ...SITE.nav.map(item => el("a", { text: item.label, href: item.href }))
    );
  };

  const renderHero = () => {
    const section = $('[data-slot="hero"]');
    if (!section) return;

    const h1 = $("#hero-title");
    if (h1) {
      h1.replaceChildren(
        ...SITE.hero.titleLines.map(line => el("span", { text: line }))
      );
    }

    const lede = $(".lede", section);
    if (lede) lede.textContent = SITE.hero.lede;

    const cta = $('[data-slot="hero-cta"]');
    if (cta) {
      cta.replaceChildren(
        ...SITE.hero.cta.map(({ label, href, variant }) => {
          const cls = variant === "ghost" ? "btn ghost" : "btn";
          return el("a", { class: cls, text: label, href });
        })
      );
    }

    const status = $('[data-slot="hero-status"]');
    if (status) {
      status.replaceChildren(
        el("span", { class: "dot", attrs: { "aria-hidden": "true" } }),
                             document.createTextNode(SITE.hero.status)
      );
    }

    const links = $('[data-slot="hero-links"]');
    if (links) {
      links.replaceChildren(
        ...SITE.hero.links.map(({ label, href, rel }) => {
          const li = document.createElement("li");
          li.appendChild(el("a", { text: label, href, rel }));
          return li;
        })
      );
    }
  };

  const renderProjects = () => {
    const list = $('[data-slot="project-list"]');
    const heading = $("#projects-title");
    if (heading) heading.textContent = SITE.projectsSection.heading;
    if (!list) return;

    list.replaceChildren(
      ...SITE.projectsSection.items.map(project => {
        const li = el("li", { class: "project" });
        li.dataset.projectId = project.id;

        const row = el("div", { class: "row" });
        const head = el("div", { class: "head" });
        head.appendChild(el("h3", { text: project.title }));
        head.appendChild(el("p", { class: "meta", text: project.meta }));

        const body = el("div", { class: "body" });
        body.appendChild(el("p", { text: project.description }));

        const tags = el("ul", { class: "tags", attrs: { "aria-label": "Built with" } });
        project.tags.forEach(tag => tags.appendChild(el("li", { text: tag })));
        body.appendChild(tags);

        const actions = el("div", { class: "actions" });

        const live = el("a", {
          class: "btn sm",
          text: project.actions.live.label,
          href: project.actions.live.href,
          rel: "noopener"
        });
        live.appendChild(el("span", { class: "sr", text: ` for ${project.title}` }));

        const code = el("a", {
          class: "btn sm ghost",
          text: project.actions.code.label,
          href: project.actions.code.href,
          rel: "noopener"
        });
        code.appendChild(el("span", { class: "sr", text: ` for ${project.title}` }));

        actions.append(live, code);
        body.appendChild(actions);
        row.append(head, body);

        li.appendChild(row);
        return li;
      })
    );
  };

  const renderAbout = () => {
    const section = $('[data-slot="about"]');
    if (!section) return;

    const heading = $("#about-title");
    if (heading) heading.textContent = SITE.about.heading;

    const lead = $('[data-slot="about-lead"]');
    if (lead) lead.textContent = SITE.about.lead;

    const hlH = $('[data-slot="about-highlights-heading"]');
    if (hlH) hlH.textContent = SITE.about.highlightsHeading;

    const hlList = $('[data-slot="about-highlights"]');
    if (hlList) {
      hlList.replaceChildren(
        ...SITE.about.highlights.map(text => el("li", { text }))
      );
    }

    const toolsH = $('[data-slot="about-tools-heading"]');
    if (toolsH) toolsH.textContent = SITE.about.toolsHeading;

    const toolsList = $('[data-slot="about-tools"]');
    if (toolsList) {
      toolsList.replaceChildren(
        ...SITE.about.tools.map(text => el("li", { text }))
      );
    }
  };

  const renderContact = () => {
    const section = $('[data-slot="contact"]');
    if (!section) return;

    const heading = $('[data-slot="contact-heading"]');
    if (heading) heading.textContent = SITE.contact.heading;

    const mail = $('[data-slot="contact-email"]');
    if (mail) {
      mail.textContent = SITE.contact.email;
      mail.setAttribute("href", `mailto:${SITE.contact.email}`);
    }

    const links = $('[data-slot="contact-links"]');
    if (links) {
      links.replaceChildren(
        ...SITE.contact.links.map(({ label, href, rel }) => {
          const li = document.createElement("li");
          li.appendChild(el("a", { text: label, href, rel }));
          return li;
        })
      );
    }
  };

  const renderFooter = () => {
    const name = $('[data-slot="footer-name"]');
    if (name) name.textContent = SITE.footer.copyrightName;

    const source = $('[data-slot="footer-source"]');
    if (source) {
      source.textContent = SITE.footer.sourceLink.label;
      source.setAttribute("href", SITE.footer.sourceLink.href);
      if (SITE.footer.sourceLink.rel) source.setAttribute("rel", SITE.footer.sourceLink.rel);
    }
  };

  const renderAll = () => {
    if (SITE.meta) {
      document.title = `${SITE.meta.name} – ${SITE.meta.role}`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc && SITE.meta.description) desc.setAttribute("content", SITE.meta.description);
      const theme = document.querySelector('meta[name="theme-color"]');
      if (theme && SITE.meta.themeColor) theme.setAttribute("content", SITE.meta.themeColor);
    }

    renderBrand();
    renderNav();
    renderHero();
    renderProjects();
    renderAbout();
    renderContact();
    renderFooter();
  };

  /* ==================================================================
   *  2. SHARED PLUMBING
   * ================================================================== */

  /* One rAF-throttled scroll/resize loop feeds every scroll-linked effect */
  const scrollHooks = [];
  const onScroll = fn => scrollHooks.push(fn);
  let ticking = false;
  const runHooks = () => { ticking = false; scrollHooks.forEach(fn => fn()); };
  const queueHooks = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(runHooks);
  };
  addEventListener("scroll", queueHooks, { passive: true });
  addEventListener("resize", queueHooks, { passive: true });

  /* Reveal-on-enter: adds .is-in the first time a node is seen */
  let revealIO = null;
  const reveal = node => {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      node.classList.add("is-in");
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealIO.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
    }
    revealIO.observe(node);
  };

  /* Text scramble — letters settle left-to-right, case & width preserved */
  const POOL = { l: "abcdefghijklmnopqrstuvwxyz", u: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", d: "0123456789" };
  const pick = s => s[(Math.random() * s.length) | 0];
  const noise = c =>
  /[a-z]/.test(c) ? pick(POOL.l) :
  /[A-Z]/.test(c) ? pick(POOL.u) :
  /\d/.test(c)    ? pick(POOL.d) : c;

  const scramble = (node, duration = 520) => {
    if (!node || node._scrambling || reduceMotion.matches || node.childElementCount) return;
    const text = node.textContent;
    if (!text.trim()) return;

    node._scrambling = true;
    const { width } = node.getBoundingClientRect();
    node.style.width = `${width}px`;       // lock so the layout never twitches
    node.style.whiteSpace = "nowrap";

    const chars = [...text];
    const start = performance.now();
    let last = 0;

    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      if (now - last > 38 || t === 1) {
        last = now;
        node.textContent = chars.map((c, i) => (i < t * chars.length ? c : noise(c))).join("");
      }
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        node.textContent = text;
        node.style.width = "";
        node.style.whiteSpace = "";
        node._scrambling = false;
      }
    };
    requestAnimationFrame(step);
  };

  /* ==================================================================
   *  3. BEHAVIOUR
   * ================================================================== */

  /* ---- Header: menu, nav pill, current section, tuck-away ---- */
  const initHeader = () => {
    const bar = $(".bar");
    if (!bar) return;
    const btn  = $(".menu-btn", bar);
    const nav  = $("nav", bar);
    const logo = $(".logo", bar);

    const isOpen  = () => !!btn && btn.getAttribute("aria-expanded") === "true";
    const setOpen = open => btn && btn.setAttribute("aria-expanded", String(open));
    let navLock = 0;                         // timestamp until which the bar stays visible
    const holdBar = (ms = 1100) => { navLock = performance.now() + ms; };

    /* mobile menu */
    if (btn && nav) {
      const small = matchMedia("(max-width: 759px)");

      btn.addEventListener("click", () => setOpen(!isOpen()));

      addEventListener("keydown", e => {
        if (e.key !== "Escape" || !isOpen()) return;
        const inside = nav.contains(document.activeElement);
        setOpen(false);
        if (inside) btn.focus();
      });

        nav.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
        document.addEventListener("pointerdown", e => {
          if (isOpen() && !bar.contains(e.target)) setOpen(false);
        });
          bar.addEventListener("focusout", e => {
            if (isOpen() && e.relatedTarget && !bar.contains(e.relatedTarget)) setOpen(false);
          });
            small.addEventListener("change", () => setOpen(false));
    }

    /* keep the bar on screen while a nav jump is scrolling */
    if (nav) nav.addEventListener("click", e => { if (e.target.closest("a")) holdBar(); });
    if (logo) logo.addEventListener("click", () => holdBar());

    /* sliding pill */
    const links = nav ? $$("a", nav) : [];
    const current = () => (nav ? $("a[aria-current]", nav) : null);
    let hovering = false;
    let pill = null;

    if (nav && links.length) {
      pill = el("span", { class: "nav-pill", attrs: { "aria-hidden": "true" } });
      nav.prepend(pill);

      const place = (a, hover = false) => {
        if (!a) { pill.classList.remove("on", "hov"); return; }
        if (!pill.classList.contains("on")) {   // first appearance: no slide-in from 0,0
          pill.classList.add("snap");
          void pill.offsetWidth;
        }
        pill.style.setProperty("--x", `${a.offsetLeft}px`);
        pill.style.setProperty("--y", `${a.offsetTop}px`);
        pill.style.setProperty("--w", `${a.offsetWidth}px`);
        pill.style.setProperty("--h", `${a.offsetHeight}px`);
        pill.classList.add("on");
        pill.classList.toggle("hov", hover);
        requestAnimationFrame(() => pill.classList.remove("snap"));
      };
      pill._place = place;

      nav.addEventListener("pointerover", e => {
        if (e.pointerType === "touch") return;
        const a = e.target.closest("a");
        if (a) { hovering = true; place(a, true); }
      });
      nav.addEventListener("pointerleave", () => { hovering = false; place(current()); });
      nav.addEventListener("focusin", e => {
        const a = e.target.closest("a");
        if (a) place(a, true);
      });
        nav.addEventListener("focusout", () => { if (!hovering) place(current()); });

        addEventListener("resize", () => { if (!hovering) place(current()); }, { passive: true });
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => { if (!hovering) place(current()); });
        }
    }

    /* scramble on hover for logo + nav links */
    if (finePointer.matches) {
      [logo, ...links].filter(Boolean).forEach(node => {
        node.addEventListener("pointerenter", e => {
          if (e.pointerType !== "touch") scramble(node);
        });
      });
    }
    if (logo && !reduceMotion.matches) setTimeout(() => scramble(logo, 900), 350);

    /* scroll-linked: current section, elevation, tuck-away */
    const sections = $$("main section[id]");
    let lastCurrent = null;
    let lastY = scrollY;

    onScroll(() => {
      /* current section */
      const probe = innerHeight * 0.4;
      let id = "";
      sections.forEach(s => { if (s.getBoundingClientRect().top <= probe) id = s.id; });
      if (sections.length && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
        id = sections[sections.length - 1].id;
      }
      links.forEach(a => {
        if (id && a.hash === "#" + id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
        if (id !== lastCurrent) {
          lastCurrent = id;
          if (pill && !hovering) pill._place(current());
        }

        /* elevation */
        const y = scrollY;
        bar.classList.toggle("is-scrolled", y > 24);

        /* tuck away on scroll down, return on scroll up */
        const dy = y - lastY;
        if (Math.abs(dy) > 6) {
          const canHide =
          dy > 0 && y > 480 &&
          !isOpen() &&
          !bar.matches(":focus-within") &&
          performance.now() > navLock &&
          !reduceMotion.matches;
          bar.classList.toggle("is-hidden", canHide);
          lastY = y;
        }
        if (y < 120) bar.classList.remove("is-hidden");
    });
  };

  /* ---- Projects: case-study toggles, clickable rows, cascade index ---- */
  const initProjects = () => {
    $$(".project").forEach(item => {
      const toggle = $(".toggle", item);
      if (!toggle) return;

      $$(".cs dl > div", item).forEach((d, i) => d.style.setProperty("--i", i));

      toggle.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        const label = $(".t", toggle);
        if (label) label.textContent = open ? "Hide case study" : "Read case study";
      });
    });
  };

  /* ---- Projects carousel: pager, arrows, keyboard, drag ---- */
  const initCarousel = () => {
    const track = $('[data-slot="project-list"]');
    if (!track) return;
    const cards = $$(":scope > .project", track);
    if (cards.length < 2) return;

    const section = track.closest("section") || document.body;
    const behavior = () => (reduceMotion.matches ? "auto" : "smooth");
    const pad = n => String(n + 1).padStart(2, "0");

    track.setAttribute("tabindex", "0");
    track.setAttribute("aria-label", "Projects");

    /* cards fade up as they scroll into view */
    cards.forEach((card, i) => {
      card.classList.add("rv");
      card.style.setProperty("--i", i % 3);
      reveal(card);
    });

    /* pager UI */
    const arrow = dir =>
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    (dir < 0
    ? '<path d="M13 8H3M3 8l4.5-4.5M3 8l4.5 4.5"'
    : '<path d="M3 8h10M13 8L8.5 3.5M13 8l-4.5 4.5"') +
    ' stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const mkBtn = (dir, label) => {
      const b = el("button", {
        class: `btn ghost pager-btn ${dir < 0 ? "prev" : "next"}`,
        attrs: { type: "button", "aria-label": label }
      });
      b.innerHTML = arrow(dir);
      return b;
    };

    const count = el("p", { class: "pager-count", attrs: { "aria-live": "polite", "aria-atomic": "true" } });
    const thumb = el("span", { class: "pager-thumb" });
    const bar = el("div", { class: "pager-bar", attrs: { "aria-hidden": "true" } });
    bar.appendChild(thumb);
    const prev = mkBtn(-1, "Previous project");
    const next = mkBtn(1, "Next project");
    const btns = el("div", { class: "pager-btns" });
    btns.append(prev, next);
    const pager = el("div", { class: "pager", attrs: { role: "group", "aria-label": "Project navigation" } });
    pager.append(count, bar, btns);
    track.after(pager);

    /* state */
    const maxScroll = () => track.scrollWidth - track.clientWidth;

    const visibleRange = () => {
      const left = track.scrollLeft;
      const right = left + track.clientWidth;
      let first = -1, last = -1;
      cards.forEach((c, i) => {
        const l = c.offsetLeft, r = l + c.offsetWidth;
        if (l >= left - 4 && r <= right + 4) { if (first < 0) first = i; last = i; }
      });
      if (first < 0) {                                   // nothing fully visible: nearest card
        const i = cards.findIndex(c => c.offsetLeft + c.offsetWidth / 2 >= left);
        first = last = i < 0 ? cards.length - 1 : i;
      }
      return { first, last };
    };

    const setDisabled = (btn, off) => btn.setAttribute("aria-disabled", String(off));

    const update = () => {
      const { first, last } = visibleRange();
      const text = `${first === last ? pad(first) : `${pad(first)}–${pad(last)}`} / ${pad(cards.length - 1)}`;
      if (count.textContent !== text) count.textContent = text;

      const sw = track.scrollWidth, cw = track.clientWidth;
      if (sw > 0 && cw > 0) {
        thumb.style.width = `${Math.min(100, (cw / sw) * 100)}%`;
        thumb.style.transform = `translateX(${(track.scrollLeft / cw) * 100}%)`;
      }
      setDisabled(prev, track.scrollLeft <= 2);
      setDisabled(next, track.scrollLeft >= maxScroll() - 2);
    };

    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    track.addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(queue).observe(track);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    update();

    /* navigation */
    const go = dir => {
      const left = track.scrollLeft;
      let target;
      if (dir > 0) {
        if (left >= maxScroll() - 2) return;
        target = cards.find(c => c.offsetLeft > left + 4);
      } else {
        target = [...cards].reverse().find(c => c.offsetLeft < left - 4);
      }
      if (target) track.scrollTo({ left: target.offsetLeft, behavior: behavior() });
    };

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));

    addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable='true']")) return;

      const active = document.activeElement;
      const idle = !active || active === document.body;
      const within = !idle && section.contains(active);
      const r = section.getBoundingClientRect();
      const inView = r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4;
      if (!(within || (idle && inView))) return;

      e.preventDefault();
      go(e.key === "ArrowRight" ? 1 : -1);
    });

    /* opening a case study brings its card fully into view */
    cards.forEach(card => {
      const toggle = $(".toggle", card);
      if (!toggle) return;
      toggle.addEventListener("click", () => {
        if (!card.classList.contains("open")) return;
        const l = card.offsetLeft, r = l + card.offsetWidth;
        if (l < track.scrollLeft - 4 || r > track.scrollLeft + track.clientWidth + 4) {
          track.scrollTo({ left: l, behavior: behavior() });
        }
      });
    });

    /* mouse drag (touch and trackpads already scroll natively) */
    if (finePointer.matches) {
      let down = false, moved = false, startX = 0, startLeft = 0;

      track.addEventListener("pointerdown", e => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        if (e.target.closest("a, button")) return;
        down = true; moved = false;
        startX = e.clientX; startLeft = track.scrollLeft;
      });

      addEventListener("pointermove", e => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 6) return;
        if (!moved) {
          moved = true;
          track.classList.add("is-dragging");
          const sel = getSelection();
          if (sel) sel.removeAllRanges();
        }
        track.scrollLeft = startLeft - dx;
      });

      const end = () => {
        if (!down) return;
        down = false;
        track.classList.remove("is-dragging");       // snap re-engages here
        setTimeout(() => { moved = false; }, 0);     // after the click that follows pointerup
      };
      addEventListener("pointerup", end);
      addEventListener("pointercancel", end);

      /* a drag must not count as a click on the row */
      track.addEventListener("click", e => {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
      }, true);
    }
  };

  /* ---- Copy email on click + toast ---- */
  const initCopyMail = () => {
    const toast = el("p", { class: "copy-toast", attrs: { role: "status", "aria-live": "polite" } });
    document.body.appendChild(toast);

    let timer;
    const showToast = text => {
      toast.textContent = text;
      toast.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove("show"), 1800);
    };

    const copyText = async text => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      }
    };

    $$('a[href^="mailto:"]').forEach(mail => {
      mail.addEventListener("click", () => {
        const address = mail.href.replace(/^mailto:/, "").split("?")[0];
        copyText(address).then(ok => showToast(ok ? "Email copied" : "Copy failed"));
      });
    });
  };

  /* ---- Back to top with a scroll-progress ring ---- */
  const initToTop = () => {
    const hero = $(".hero");
    const R = 22.5;
    const C = 2 * Math.PI * R;

    const toTop = el("button", {
      class: "to-top",
      attrs: { type: "button", "aria-label": "Back to top" }
    });
    toTop.innerHTML =
    '<svg class="ring" viewBox="0 0 48 48" aria-hidden="true">' +
    `<circle class="ring-track" cx="24" cy="24" r="${R}"/>` +
    `<circle class="ring-fill" cx="24" cy="24" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>` +
    '</svg>' +
    '<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(toTop);

    const fill = $(".ring-fill", toTop);
    const threshold = () => (hero ? hero.offsetTop + hero.offsetHeight * 0.6 : 600);

    onScroll(() => {
      toTop.classList.toggle("show", scrollY > threshold());
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      fill.style.strokeDashoffset = String(C * (1 - p));
    });

    toTop.addEventListener("click", () => {
      scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
      toTop.blur();
    });
  };

  /* ---- Hero headline: cursor works as a flashlight ---- */
  const initHeroType = () => {
    const h1 = $("#hero-title");
    const hero = $(".hero");
    if (!h1 || !hero) return;

    $$(":scope > span", h1).forEach(line => {
      const text = line.textContent;
      line.textContent = "";
      line.appendChild(el("span", { class: "sr", text }));

      const vis = el("span", { attrs: { "aria-hidden": "true" } });
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { vis.appendChild(document.createTextNode(" ")); return; }
        const word = el("span", { class: "word" });
        [...part].forEach(ch => word.appendChild(el("span", { class: "ch", text: ch })));
        vis.appendChild(word);
      });
      line.appendChild(vis);
    });

    if (!finePointer.matches || reduceMotion.matches) return;

    const chars = $$(".ch", h1);
    const RADIUS = clamp(innerWidth * 0.12, 120, 210);
    let px = 0, py = 0, raf = 0;

    const update = () => {
      raf = 0;
      const rects = chars.map(c => c.getBoundingClientRect());   // read…
      chars.forEach((c, i) => {                                   // …then write
        const r = rects[i];
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const t = clamp(1 - d / RADIUS, 0, 1);
        c.style.setProperty("--p", (t * t * (3 - 2 * t)).toFixed(3));
      });
    };

    hero.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX; py = e.clientY;
      h1.classList.add("is-hot");
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });

      hero.addEventListener("pointerleave", () => {
        h1.classList.remove("is-hot");
        chars.forEach(c => c.style.setProperty("--p", "0"));
      });
  };

  /* ---- Section headings: word-by-word rise ---- */
  const initHeadings = () => {
    $$("main h2").forEach(h => {
      const text = h.textContent.trim();
      if (!text) return;
      h.textContent = "";
      h.appendChild(el("span", { class: "sr", text }));

      const vis = el("span", { attrs: { "aria-hidden": "true" } });
      const words = text.split(/\s+/);
      words.forEach((word, i) => {
        const w = el("span", { class: "w" });
        const inner = el("span", { text: word });
        inner.style.setProperty("--i", i);
        w.appendChild(inner);
        vis.appendChild(w);
        if (i < words.length - 1) vis.appendChild(document.createTextNode(" "));
      });
        h.appendChild(vis);
        h.classList.add("split");
        reveal(h);
    });
  };

  /* ---- About lead: words light up as you read ---- */
  const initLead = () => {
    const lead = $('[data-slot="about-lead"]');
    if (!lead) return;
    const text = lead.textContent.trim();
    if (!text) return;

    lead.textContent = "";
    lead.appendChild(el("span", { class: "sr", text }));
    const vis = el("span", { attrs: { "aria-hidden": "true" } });
    const words = text.split(/\s+/);
    const spans = words.map((w, i) => {
      const s = el("span", { class: "wd", text: w });
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(" "));
      return s;
    });
    lead.appendChild(vis);
    lead.classList.add("is-split");

    if (reduceMotion.matches) { spans.forEach(s => s.classList.add("on")); return; }

    onScroll(() => {
      const r = lead.getBoundingClientRect();
      const start = innerHeight * 0.9;                    // top edge reaches here → 0%
      const travel = innerHeight * 0.35 + r.height;       // …bottom edge reaches 55% → 100%
      const p = clamp((start - r.top) / travel, 0, 1);
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("on", i < n));
    });
  };

  /* ---- Staggered list reveals ---- */
  const initStagger = () => {
    ["#about .plain li", "#about .tags li", "#contact .links li"].forEach(sel => {
      $$(sel).forEach((node, i) => {
        node.classList.add("rv");
        node.style.setProperty("--i", i);
        reveal(node);
      });
    });
  };

  /* ---- Cursor ring (inverts what it passes over) ---- */
  const initCursor = () => {
    if (!finePointer.matches || reduceMotion.matches) return;

    const ring = el("div", { class: "cursor is-hidden", attrs: { "aria-hidden": "true" } });
    const label = el("span", { class: "cursor-label" });
    ring.appendChild(label);
    document.body.appendChild(ring);
    document.documentElement.classList.add("has-cursor");

    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;

    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) ? requestAnimationFrame(loop) : 0;
    };

    const setState = target => {
      const t = target instanceof Element ? target : null;
      const link = t && t.closest("a, button, input, textarea, select, [role='button']");
      const setState = target => {
        const t = target instanceof Element ? target : null;
        const link = t && t.closest("a, button, input, textarea, select, [role='button']");
        ring.classList.toggle("is-link", !!link);
      };
    };

    addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      tx = e.clientX; ty = e.clientY;
      if (ring.classList.contains("is-hidden")) {
        x = tx; y = ty;
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        ring.classList.remove("is-hidden");
      }
      if (!raf) raf = requestAnimationFrame(loop);
      setState(e.target);
    }, { passive: true });

    addEventListener("pointerdown", e => { if (e.pointerType !== "touch") ring.classList.add("is-down"); });
    addEventListener("pointerup",   () => ring.classList.remove("is-down"));
    document.documentElement.addEventListener("mouseleave", () => ring.classList.add("is-hidden"));
    document.documentElement.addEventListener("mouseenter", () => ring.classList.remove("is-hidden"));
  };

  /* ---- Click / tap ripple (works on touch too) ---- */
  const initRipple = () => {
    addEventListener("pointerdown", e => {
      if (reduceMotion.matches || e.button > 0) return;
      const r = el("span", { class: "ripple", attrs: { "aria-hidden": "true" } });
      r.style.left = `${e.clientX}px`;
      r.style.top  = `${e.clientY}px`;
      document.body.appendChild(r);
      const kill = () => r.remove();
      r.addEventListener("animationend", kill, { once: true });
      setTimeout(kill, 1200);                           // safety net
    }, { passive: true });
  };

  /* ---- Magnetic buttons ---- */
  const initMagnetic = () => {
    if (!finePointer.matches || reduceMotion.matches) return;
    const STRENGTH = 0.28, MAX = 10;

    $$(".btn, .logo, .menu-btn, .to-top").forEach(node => {
      let tx = 0, ty = 0, cx = 0, cy = 0;

      node.addEventListener("pointerenter", () => {
        const r = node.getBoundingClientRect();
        cx = r.left + r.width / 2 - tx;                 // centre without our own offset
        cy = r.top + r.height / 2 - ty;
      });
      node.addEventListener("pointermove", e => {
        if (e.pointerType === "touch") return;
        tx = clamp((e.clientX - cx) * STRENGTH, -MAX, MAX);
        ty = clamp((e.clientY - cy) * STRENGTH, -MAX, MAX);
        node.style.setProperty("--tx", `${tx.toFixed(1)}px`);
        node.style.setProperty("--ty", `${ty.toFixed(1)}px`);
      });
      node.addEventListener("pointerleave", () => {
        tx = ty = 0;
        node.style.setProperty("--tx", "0px");
        node.style.setProperty("--ty", "0px");
      });
    });
  };

  /* ---- Spotlight following the pointer ---- */
  const initSpotlight = () => {
    if (!finePointer.matches || reduceMotion.matches) return;
    $$(".on-sea, .project").forEach(node => {
      node.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") return;
        const r = node.getBoundingClientRect();
        node.style.setProperty("--sx", `${e.clientX - r.left}px`);
        node.style.setProperty("--sy", `${e.clientY - r.top}px`);
        node.classList.add("is-lit");
      }, { passive: true });
      node.addEventListener("pointerleave", () => node.classList.remove("is-lit"));
    });
  };

  /* ---- Year ---- */
  const initYear = () => {
    const yr = $("#yr");
    if (yr) yr.textContent = new Date().getFullYear();
  };

    /* ==================================================================
     *  4. BOOT
     * ================================================================== */
    const boot = () => {
      renderAll();

      initHeader();
      initProjects();
      initCarousel();           // before magnetic/cursor, so pager buttons are included
      initCopyMail();
      initToTop();              // before magnetic, so the button is included
      initHeroType();
      initHeadings();
      initLead();
      initStagger();
      initCursor();
      initRipple();
      initMagnetic();
      initSpotlight();
      initYear();

      runHooks();               // paint initial scroll-linked state
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
      boot();
    }
})();
