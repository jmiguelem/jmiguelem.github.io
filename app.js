// Renders resume.json into the page and filters entries by tag.
(() => {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TOP_N = 12; // tags shown in the filter bar before "All tags"
  const SECTIONS = ["work", "personal", "education", "learning"];

  let TAGS = {};           // tag vocabulary from resume.json
  let MATCHABLE = new Set(); // tags at least one entry can match
  let COUNTS = new Map();  // tag -> number of matching entries
  let TOTAL = 0;           // entries with no filter
  let MODEL = null;        // rendered elements and their tags
  const selected = new Set();

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);

  const fmtMonth = (ym) => {
    if (!ym) return "Present";
    const [y, m] = ym.split("-");
    return `${MONTHS[Number(m) - 1]} ${y}`;
  };
  const fmtRange = (start, end) => `${fmtMonth(start)} – ${fmtMonth(end)}`;
  const byStartDesc = (a, b) => (b.start || "").localeCompare(a.start || "");

  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child === undefined || child === null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  // A tag plus its parents: BigQuery -> [BigQuery, GCP]
  const ancestorCache = new Map();
  function ancestors(tag) {
    if (!ancestorCache.has(tag)) {
      const chain = [tag];
      let parent = TAGS[tag] && TAGS[tag].parent;
      while (parent && !chain.includes(parent)) {
        chain.push(parent);
        parent = TAGS[parent] && TAGS[parent].parent;
      }
      ancestorCache.set(tag, chain);
    }
    return ancestorCache.get(tag);
  }
  const matches = (tags, sel) => tags.some((t) => ancestors(t).some((a) => sel.has(a)));

  // ---------- rendering ----------
  function chip(tag, { count, isStatic } = {}) {
    if (isStatic) {
      return h("span", { class: "tag tag--static", title: "Listed skill, not yet tagged on an entry" }, tag);
    }
    return h("button", { type: "button", class: "tag", "aria-pressed": "false", dataset: { tag } },
      tag,
      count !== undefined ? h("span", { class: "count", "aria-label": `, ${count} entries` }, String(count)) : null
    );
  }

  function tagList(tags, opts = {}) {
    if (!tags || tags.length === 0) return null;
    return h("ul", { class: "tags" },
      tags.map((t) => h("li", {}, chip(t, {
        isStatic: opts.matchable ? !opts.matchable.has(t) : false,
        count: opts.counts ? opts.counts.get(t) : undefined,
      })))
    );
  }

  const bullets = (items) =>
    items && items.length ? h("ul", { class: "bullets" }, items.map((b) => h("li", {}, b))) : null;

  const entryHead = (level, titleNodes, start, end) =>
    h("div", { class: "entry-head" },
      h(level, {}, titleNodes),
      h("span", { class: "dates" }, fmtRange(start, end))
    );

  const tagData = (tags) => ({ tags: (tags || []).join("|") });

  function renderProject(p) {
    return h("article", { class: "project", dataset: tagData(p.tags) },
      entryHead("h4", [p.name], p.start, p.end),
      p.summary && h("p", {}, p.summary),
      bullets(p.bullets),
      tagList(p.tags)
    );
  }

  function renderJob(job) {
    const projects = [...(job.projects || [])].sort(byStartDesc);
    return h("article", { class: "entry", dataset: tagData(job.tags) },
      entryHead("h3", [job.role, h("span", { class: "org" }, ` · ${job.company}`)], job.start, job.end),
      job.note && h("p", { class: "note" }, job.note),
      job.summary && h("p", {}, job.summary),
      bullets(job.bullets),
      tagList(job.tags),
      projects.length ? h("div", { class: "projects" }, projects.map(renderProject)) : null
    );
  }

  function renderPersonal(p) {
    const title = p.url ? h("a", { href: p.url, rel: "noopener" }, p.name) : p.name;
    return h("article", { class: "entry", dataset: tagData(p.tags) },
      h("div", { class: "entry-head" },
        h("h3", {}, title),
        p.start && h("span", { class: "dates" }, fmtMonth(p.start))
      ),
      p.summary && h("p", {}, p.summary),
      bullets(p.bullets),
      tagList(p.tags)
    );
  }

  function renderEducation(e) {
    return h("article", { class: "entry", dataset: tagData(e.tags) },
      entryHead("h3", [e.institution], e.start, e.end),
      h("p", {}, e.detail ? `${e.degree} · ${e.detail}` : e.degree),
      tagList(e.tags)
    );
  }

  function renderLearning(item) {
    const title = item.url ? h("a", { href: item.url, rel: "noopener" }, item.name) : item.name;
    return h("article", { class: "entry", dataset: tagData(item.tags) },
      h("div", { class: "entry-head" },
        h("h3", {}, title, item.issuer ? h("span", { class: "org" }, ` · ${item.issuer}`) : null),
        item.date && h("span", { class: "dates" }, fmtMonth(item.date))
      ),
      item.summary && h("p", {}, item.summary),
      tagList(item.tags)
    );
  }

  function render(data) {
    const b = data.basics;
    $("name").textContent = b.name;
    $("title").textContent = b.title;
    $("summary").textContent = b.summary;

    const printBtn = h("button", { type: "button", class: "linklike no-print" }, "Download PDF");
    printBtn.addEventListener("click", () => window.print());
    // On paper a link label is useless, so print shows the short URL instead.
    const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    $("contact").replaceChildren(
      h("a", { href: `mailto:${b.email}` }, b.email),
      ...b.links.map((l) => h("a", { href: l.url, rel: "noopener" },
        h("span", { class: "screen-only" }, l.label),
        h("span", { class: "print-only" }, shortUrl(l.url))
      )),
      printBtn
    );
    addStructuredData(data);

    $("work-list").replaceChildren(...[...data.work].sort(byStartDesc).map(renderJob));
    const personal = data.personalProjects || [];
    $("personal").hidden = personal.length === 0;
    $("personal-list").replaceChildren(...[...personal].sort(byStartDesc).map(renderPersonal));
    $("education-list").replaceChildren(...[...data.education].sort(byStartDesc).map(renderEducation));
    $("learning").hidden = data.learning.length === 0;
    $("learning-list").replaceChildren(...data.learning.map(renderLearning));
  }

  // schema.org Person data for search engines, built from the same JSON.
  function addStructuredData(data) {
    const b = data.basics;
    const current = data.work.find((w) => !w.end);
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: b.name,
      jobTitle: b.title,
      description: b.summary,
      email: `mailto:${b.email}`,
      url: "https://jmiguelem.github.io/",
      sameAs: b.links.map((l) => l.url),
      worksFor: current ? { "@type": "Organization", name: current.company } : undefined,
      alumniOf: data.education.map((e) => ({ "@type": "EducationalOrganization", name: e.institution })),
      knowsAbout: Object.values(data.skills).flat(),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(person);
    document.head.append(script);
  }

  // ---------- filtering ----------
  const tagsOf = (el) => (el.dataset.tags ? el.dataset.tags.split("|") : []);

  function buildModel() {
    const simple = (id) => [...$(id).children].map((el) => ({ el, tags: tagsOf(el) }));
    return {
      work: [...$("work-list").children].map((el) => ({
        el,
        tags: tagsOf(el),
        wrap: el.querySelector(".projects"),
        projects: [...el.querySelectorAll(".project")].map((p) => ({ el: p, tags: tagsOf(p) })),
      })),
      personal: simple("personal-list"),
      education: simple("education-list"),
      learning: simple("learning-list"),
    };
  }

  // Decide what is visible for a selection. An employer shows if it or any of its
  // projects match; only matching projects show. Counts are per visible entry
  // (each project counts, an employer without matching projects counts once).
  function evaluate(sel) {
    const all = sel.size === 0;
    const ok = (tags) => all || matches(tags, sel);
    const show = new Map();
    const perSection = { work: 0, personal: 0, education: 0, learning: 0 };

    for (const job of MODEL.work) {
      const hits = job.projects.map((p) => ok(p.tags));
      const anyProject = hits.some(Boolean);
      const visible = ok(job.tags) || anyProject;
      show.set(job.el, visible);
      job.projects.forEach((p, i) => show.set(p.el, hits[i]));
      if (job.wrap) show.set(job.wrap, anyProject);
      if (visible) perSection.work += anyProject ? hits.filter(Boolean).length : 1;
    }
    for (const key of ["personal", "education", "learning"]) {
      for (const item of MODEL[key]) {
        const visible = ok(item.tags);
        show.set(item.el, visible);
        if (visible) perSection[key] += 1;
      }
    }
    const total = Object.values(perSection).reduce((a, b) => a + b, 0);
    return { show, perSection, total };
  }

  const selectionLabel = () => [...selected].join(" or ");

  function renderFilterBar() {
    // Top row: the clouds first, then the most-used tools. Broad topics
    // (ETL, Data Warehousing, ...) stay in the "All tags" panel.
    const groupOf = (t) => (TAGS[t] && TAGS[t].group) || "";
    const byCount = (a, b) => COUNTS.get(b) - COUNTS.get(a) || a.localeCompare(b);
    const clouds = [...MATCHABLE].filter((t) => groupOf(t) === "Cloud").sort(byCount);
    const tools = [...MATCHABLE].filter((t) => !["Cloud", "Topics"].includes(groupOf(t))).sort(byCount);
    const shown = [...clouds, ...tools].slice(0, TOP_N);
    for (const t of selected) if (!shown.includes(t)) shown.push(t);
    $("filter-chips").replaceChildren(...shown.map((t) => chip(t, { count: COUNTS.get(t) })));
  }

  function renderAllTags(data) {
    const groups = new Map();
    for (const [tag, info] of Object.entries(data.tags)) {
      if (!MATCHABLE.has(tag)) continue;
      if (!groups.has(info.group)) groups.set(info.group, []);
      groups.get(info.group).push(tag);
    }
    $("filter-all").replaceChildren(
      ...[...groups].map(([group, tags]) => {
        tags.sort((a, b) => COUNTS.get(b) - COUNTS.get(a) || a.localeCompare(b));
        return h("div", { class: "filter-group" }, h("h3", {}, group), tagList(tags, { counts: COUNTS }));
      })
    );
  }

  function syncUrl() {
    const params = new URLSearchParams(location.search);
    if (selected.size) params.set("tags", [...selected].join(","));
    else params.delete("tags");
    const qs = params.toString();
    history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
  }

  function apply() {
    const result = evaluate(selected);
    for (const [el, visible] of result.show) el.hidden = !visible;

    for (const key of SECTIONS) {
      const note = $(`${key}-empty`);
      note.hidden = selected.size === 0 || result.perSection[key] > 0;
      note.textContent = `Nothing here matches ${selectionLabel()}.`;
    }

    renderFilterBar();
    document.querySelectorAll("button.tag[data-tag]").forEach((btn) => {
      const t = btn.dataset.tag;
      const on = selected.has(t);
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-hit", !on && selected.size > 0 && ancestors(t).some((a) => selected.has(a)));
    });

    $("filter-clear").hidden = selected.size === 0;
    $("filter-status").textContent = selected.size
      ? `Showing ${result.total} of ${TOTAL} entries tagged ${selectionLabel()}.`
      : "";
    syncUrl();
  }

  function toggle(tag) {
    if (selected.has(tag)) selected.delete(tag);
    else selected.add(tag);
    apply();
  }

  function wireEvents() {
    document.addEventListener("click", (event) => {
      const btn = event.target.closest("button.tag[data-tag]");
      if (!btn) return;
      const fromBar = btn.closest("#filters");
      const inTopRow = Boolean(btn.closest("#filter-chips"));
      toggle(btn.dataset.tag);
      if (fromBar) {
        // The top row re-renders; keep keyboard focus on the same tag.
        if (inTopRow) {
          const again = [...$("filter-chips").querySelectorAll("button.tag[data-tag]")]
            .find((b) => b.dataset.tag === btn.dataset.tag);
          if (again) again.focus();
        }
      } else {
        // Clicked a tag inside the content: jump back to the top of the results.
        const anchor = $("filters-anchor");
        if (window.scrollY > anchor.offsetTop) {
          const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top: anchor.offsetTop, behavior: smooth ? "smooth" : "auto" });
        }
      }
    });

    $("filter-clear").addEventListener("click", () => {
      selected.clear();
      apply();
    });

    $("filter-more").addEventListener("click", () => {
      const panel = $("filter-all");
      panel.hidden = !panel.hidden;
      $("filter-more").setAttribute("aria-expanded", String(!panel.hidden));
      $("filter-more").textContent = panel.hidden ? "All tags" : "Fewer tags";
    });
  }

  function init(data) {
    TAGS = data.tags;
    render(data);
    MODEL = buildModel();

    // Every tag that an entry uses, plus the parents it rolls up to.
    MATCHABLE = new Set();
    const all = [...MODEL.work.flatMap((j) => [j, ...j.projects]), ...MODEL.personal, ...MODEL.education, ...MODEL.learning];
    for (const item of all) for (const t of item.tags) ancestors(t).forEach((a) => MATCHABLE.add(a));

    TOTAL = evaluate(new Set()).total;
    COUNTS = new Map([...MATCHABLE].map((t) => [t, evaluate(new Set([t])).total]));

    $("skills-list").replaceChildren(
      ...Object.entries(data.skills).map(([group, tags]) =>
        h("div", { class: "skill-group" }, h("h3", {}, group), tagList(tags, { matchable: MATCHABLE }))
      )
    );
    renderAllTags(data);

    const fromUrl = new URLSearchParams(location.search).get("tags");
    if (fromUrl) fromUrl.split(",").map((t) => t.trim()).filter((t) => MATCHABLE.has(t)).forEach((t) => selected.add(t));

    $("filters").hidden = false;
    wireEvents();
    apply();
  }

  fetch("resume.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch((err) => {
      console.error("Could not load resume.json", err);
      $("work-list").textContent = "Could not load resume data.";
    });
})();
