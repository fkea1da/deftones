/* deftones / archive — общий скрипт для всех страниц */
(function () {
  "use strict";

  const D = window.DEFTONES;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.documentElement.classList.add("js");

  const ARROW =
    '<svg class="arrow" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 8L8 2M3.2 2H8v4.8" stroke="currentColor" stroke-width="1.1"/></svg>';

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const pad = (n) => String(n).padStart(2, "0");
  const memberUrl = (id) => `member.html?id=${encodeURIComponent(id)}`;
  const fullName = (m) => m.name.join(" ");



  function initHeader() {
    const toggle = $(".menu-toggle");
    if (!toggle) return;
    const close = () => {
      document.body.classList.remove("is-menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("is-menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".nav a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
    window.addEventListener("resize", () => window.innerWidth > 860 && close());
  }



  function initScrollSpy() {
    const links = $$(".nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) map.set(sec, a);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          map.get(e.target).classList.add("is-active");
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    map.forEach((_, sec) => io.observe(sec));
  }



  function initReveal(root = document) {
    const items = $$(".reveal:not(.is-in)", root);
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));
  }



  function initToTop() {
    const btn = $(".to-top");
    if (!btn) return;
    const onScroll = () => btn.classList.toggle("is-visible", window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0 }));
    onScroll();
  }

  function renderDates() {
    const box = $("#dates-list");
    if (!box) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    box.innerHTML = D.dates
      .map((d, i) => {
        const past = new Date(d.iso + "T23:59:59") < today;
        return `
        <article class="date-row reveal${past ? " is-past" : ""}" style="--d:${i * 0.08}s">
          <p class="date-row__when"><time class="date-row__date" datetime="${d.iso}">${esc(d.date)}</time>${esc(d.note)}</p>
          <p class="date-row__where"><span class="date-row__venue">${esc(d.venue)}</span><br>${d.place.map(esc).join("<br>")}</p>
          <a class="btn" href="${D.links.tickets}" target="_blank" rel="noopener">${past ? "Past" : "Tickets"} ${ARROW}</a>
        </article>`;
      })
      .join("");
  }

  function renderDiscography() {
    const box = $("#discography-grid");
    if (!box) return;
    box.innerHTML = D.albums
      .map(
        (a, i) => `
        <a class="album-card reveal" style="--d:${(i % 5) * 0.06}s" href="albums.html#${a.id}">
          <div class="album-card__cover"><img src="${a.cover}" alt="${esc(a.title)} cover" loading="lazy" width="300" height="300"></div>
          <div class="album-card__meta"><span class="album-card__title">${esc(a.title)}</span><span class="album-card__year">${a.year}</span></div>
        </a>`
      )
      .join("");
  }

  function renderMembers() {
    const box = $("#members-grid");
    if (box) {
      box.innerHTML = D.members
        .filter((m) => m.core)
        .map(
          (m, i) => `
          <a class="member-card reveal" style="--d:${i * 0.06}s" href="${memberUrl(m.id)}">
            <div class="member-card__photo"><img src="${m.photo}" alt="${esc(fullName(m))}" loading="lazy"></div>
            <div class="member-card__top"><span class="eyebrow">${esc(m.since)}</span>${ARROW}</div>
            <h3 class="member-card__name display">${esc(fullName(m))}</h3>
            <p class="member-card__role">${esc(m.role)}</p>
          </a>`
        )
        .join("");
    }

    const ch = $("#chapters");
    if (ch) {
      ch.innerHTML = D.members
        .filter((m) => !m.core)
        .map(
          (m, i) => `
          <a class="chapter reveal" style="--d:${i * 0.08}s" href="${memberUrl(m.id)}"${m.memorial ? ' id="memory"' : ""}>
            <div class="chapter__photo"><img src="${m.photo}" alt="${esc(fullName(m))}" loading="lazy"></div>
            <div>
              <p class="eyebrow">${esc(m.since)}</p>
              <h3 class="chapter__name display">${esc(fullName(m))} ${ARROW}</h3>
              <p class="chapter__text">${esc(m.short)}</p>
            </div>
          </a>`
        )
        .join("");
    }
  }


  function renderMember() {
    const box = $("#member");
    if (!box) return;

    const id = new URLSearchParams(location.search).get("id") || D.members[0].id;
    const idx = Math.max(0, D.members.findIndex((m) => m.id === id));
    const m = D.members[idx];
    const next = D.members[(idx + 1) % D.members.length];

    document.title = `${fullName(m)} — deftones / archive`;
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", m.text[0]);

    // Пункт меню: мемориальная страница → «Memory», остальные → «Members»
    $$(".nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === (m.memorial ? "memory" : "members")));

    box.classList.toggle("member--memorial", !!m.memorial);
    box.innerHTML = `
      <div class="wrap">
        <div class="member__top">
          <figure class="member__photo figure reveal">
            <img src="${m.photo}" alt="${esc(fullName(m))}">
            <figcaption class="caption"><span>${esc(m.caption[0])}</span><span>${esc(m.caption[1])}</span></figcaption>
          </figure>
          <div class="reveal" style="--d:.1s">
            <h1 class="member__name display">${m.name.map(esc).join("<br>")}</h1>
            <dl class="facts">
              <div><dt>Born</dt><dd>${esc(m.born)}</dd></div>
              <div><dt>${esc(m.inBandLabel)}</dt><dd>${esc(m.inBand)}</dd></div>
            </dl>
          </div>
        </div>
        <div class="member__text">
          ${m.text.map((p, i) => `<p class="reveal" style="--d:${i * 0.08}s">${esc(p)}</p>`).join("")}
        </div>
        <div class="aside reveal">
          <h2 class="aside__title">${esc(m.aside.title)}</h2>
          <p>${esc(m.aside.text)}</p>
        </div>
      </div>
      <nav class="member-nav" aria-label="Members">
        <div class="wrap">
          <a class="back-link" href="index.html#members">← All members</a>
          <a class="next-link" href="${memberUrl(next.id)}">
            <span class="eyebrow">${esc(m.nextLabel)}</span><br>
            <span class="next-link__name display">${esc(fullName(next))} ${ARROW}</span>
          </a>
        </div>
      </nav>`;

    // Клавиши ← / → листают участников
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea")) return;
      const prev = D.members[(idx - 1 + D.members.length) % D.members.length];
      if (e.key === "ArrowRight") location.href = memberUrl(next.id);
      if (e.key === "ArrowLeft") location.href = memberUrl(prev.id);
    });
  }


  const toSec = (t) => t.split(":").reduce((acc, v) => acc * 60 + Number(v), 0);
  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = pad(s % 60);
    return h ? `${h}:${pad(mm)}:${ss}` : `${mm}:${ss}`;
  };

  function renderAlbums() {
    const toc = $("#toc");
    const list = $("#albums");
    if (!toc || !list) return;

    toc.innerHTML = `<ol>${D.albums
      .map((a, i) => `<li><a href="#${a.id}"><span class="num">${pad(i + 1)}</span><span>${esc(a.title)}</span><span class="yr">${a.year}</span></a></li>`)
      .join("")}</ol>`;

    const half = Math.ceil(D.albums.length / 2);
    $$("li", toc).forEach((li, i) => {
      li.style.gridColumn = i < half ? "1" : "2";
      li.style.gridRow = String((i % half) + 1);
    });

    list.innerHTML = D.albums
      .map((a, i) => {
        const total = a.tracks.reduce((s, t) => s + toSec(t[1]), 0);
        return `
        <div class="album-wrap">
          <article class="album wrap" id="${a.id}">
            <aside class="album__side reveal">
              <div class="album__side-head"><span class="eyebrow">${pad(i + 1)} / Studio album</span><span>${a.year}</span></div>
              <img class="album__cover" src="${a.cover}" alt="${esc(a.title)} cover" loading="lazy" width="360" height="360">
              ${a.about ? `<p class="album__about">${esc(a.about)}</p>` : ""}
            </aside>
            <div class="reveal" style="--d:.08s">
              <header class="album__head">
                <h2 class="album__title display">${esc(a.title)}</h2>
                <span class="album__year">${a.year}</span>
              </header>
              <table class="tracks">
                <thead><tr><th class="n">No.</th><th>Track</th><th class="t">Time</th></tr></thead>
                <tbody>
                  ${a.tracks.map((t, k) => `<tr><td class="n">${pad(k + 1)}</td><td>${esc(t[0])}</td><td class="t">${t[1]}</td></tr>`).join("")}
                </tbody>
                <tfoot><tr><td></td><td>${a.tracks.length} tracks</td><td class="t">${fmt(total)}</td></tr></tfoot>
              </table>
              ${a.note ? `<div class="edition"><p class="eyebrow">${esc(a.note.label)}</p><p>${esc(a.note.text)}</p></div>` : ""}
            </div>
          </article>
        </div>`;
      })
      .join("");


    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView());
    }
  }



  renderDates();
  renderDiscography();
  renderMembers();
  renderMember();
  renderAlbums();

  initHeader();
  initScrollSpy();
  initReveal();
  initToTop();

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
