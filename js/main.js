/* ============================================================
   VAAPS — main UI logic
   Loader (tied to real readiness), nav, custom cursor, magnetic
   buttons, tilt cards, scroll reveals, count-ups, 2D particle
   canvases, case-study modal, contact form. All motion guarded
   by prefers-reduced-motion and pointer capabilities.
   ============================================================ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------------- 1. PREMIUM LOADER ----------------
     Progress reflects real milestones: DOM parsed -> fonts ->
     3D scene ready -> window load. Fallback timer guarantees
     the loader never traps the user if the CDN fails. */
  var loader = document.getElementById("loader");
  var loaderProgress = document.getElementById("loaderProgress");
  var loaderStatus = document.getElementById("loaderStatus");
  var loadLevel = 0;
  var loaderDone = false;

  function setProgress(level, label) {
    if (loaderDone || !loader) return;
    loadLevel = Math.max(loadLevel, Math.min(level, 100));
    loaderProgress.style.width = loadLevel + "%";
    if (label) loaderStatus.textContent = label;
    if (loadLevel >= 100) finishLoading();
  }

  function finishLoading() {
    if (loaderDone || !loader) return;
    loaderDone = true;
    loaderStatus.textContent = "Ready";
    setTimeout(function () { loader.classList.add("done"); }, 400);
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 1300);
  }

  setProgress(20, "Loading interface");
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { setProgress(45, "Preparing typography"); });
  } else {
    setProgress(45, "Preparing typography");
  }
  window.addEventListener("vaaps:scene-ready", function () {
    setProgress(78, "Composing 3D scene");
  });
  window.addEventListener("load", function () {
    setProgress(100, "Ready");
  });
  // Safety net: never leave the user stuck behind the loader
  setTimeout(function () {
    if (!loaderDone) setProgress(100, "Ready");
  }, 8000);

  /* ---------------- 2. NAV ---------------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var progress = document.getElementById("scrollProgress");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    }
  });

  /* ---------------- 2b. SCROLLSPY ---------------- */
  var spyLinks = document.querySelectorAll(".nav-links a[href^='#']");
  if ("IntersectionObserver" in window && spyLinks.length) {
    var spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = "#" + entry.target.id;
          spyLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["home", "services", "work", "about", "process", "contact"].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spyObs.observe(sec);
    });
  }

  /* ---------------- 3. CUSTOM CURSOR (desktop only) ---------------- */
  if (finePointer && !reducedMotion) {
    document.body.classList.add("has-cursor");
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    var cx = -100, cy = -100, rx = -100, ry = -100;

    document.addEventListener("pointermove", function (e) {
      cx = e.clientX; cy = e.clientY;
      dot.style.transform = "translate(" + (cx - 3.5) + "px," + (cy - 3.5) + "px)";
    }, { passive: true });

    (function cursorLoop() {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      ring.style.transform = "translate(" + (rx - ring.offsetWidth / 2) + "px," + (ry - ring.offsetHeight / 2) + "px)";
      requestAnimationFrame(cursorLoop);
    })();

    var hoverSel = "a, button, [data-tilt], input, select, textarea, .case-btn";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest(hoverSel)) ring.classList.add("is-hover");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest(hoverSel)) ring.classList.remove("is-hover");
    });

    // Cursor "View" label over project cards
    var label = document.getElementById("cursorLabel");
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest(".work-card")) {
        ring.classList.add("has-label");
        ring.classList.remove("is-hover");
      }
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest(".work-card")) ring.classList.remove("has-label");
    });
    if (label) label.textContent = "View";
  }

  /* ---------------- 4. MAGNETIC BUTTONS ---------------- */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 7;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx / r.width * strength * 2) + "px," + (dy / r.height * strength * 2) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---------------- 5. TILT CARDS ---------------- */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var max = 9;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" + (px * max).toFixed(2) + "deg) scale(1.03)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
      // Keyboard users get the same glow/description reveal via :focus-visible styles
    });
  }

  /* ---------------- 5b. SPOTLIGHT CARDS ----------------
     Mouse-tracked radial highlight that follows the cursor across cards. */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll(".spotlight").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left).toFixed(1) + "px");
        el.style.setProperty("--my", (e.clientY - r.top).toFixed(1) + "px");
      }, { passive: true });
    });
  }

  /* ---------------- 5c. SPLIT-WORD HEADINGS ----------------
     Wraps each word of [data-split] headings in a span so words
     stagger in on reveal. Accessible name is unchanged. */
  document.querySelectorAll("[data-split]").forEach(function (h) {
    var nodes = Array.prototype.slice.call(h.childNodes);
    var frag = document.createDocumentFragment();
    var idx = 0;
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          w.textContent = part;
          w.style.transitionDelay = (idx * 0.06).toFixed(3) + "s";
          idx++;
          frag.appendChild(w);
        });
      } else {
        frag.appendChild(node);
      }
    });
    h.textContent = "";
    h.appendChild(frag);
  });

  /* ---------------- 6. SCROLL REVEALS ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------------- 7. COUNT-UP STATS ---------------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    if (reducedMotion) { el.textContent = target; return; }
    var dur = 1500, start = null;
    function frame(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll(".count");
  if ("IntersectionObserver" in window && !reducedMotion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObs.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------------- 8. AMBIENT 2D PARTICLES ----------------
     Lightweight drifting dots behind section content + soft
     blurred orbs on the contact canvas. Paused off-screen. */
  if (!reducedMotion) {
    var PALETTE = ["0,180,255", "123,97,255", "125,233,255"];
    var systems = [];

    function makeDotSystem(canvas) {
      var ctx = canvas.getContext("2d");
      var count = parseInt(canvas.getAttribute("data-particles"), 10) || 30;
      if (window.matchMedia("(max-width: 760px)").matches) count = Math.round(count / 2);
      var dots = [];
      function sizeCanvas() {
        var r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(r.width));
        canvas.height = Math.max(1, Math.floor(r.height));
      }
      sizeCanvas();
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random(), y: Math.random(),
          s: 0.8 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.0006,
          vy: (Math.random() - 0.5) * 0.0006,
          c: PALETTE[i % PALETTE.length],
          a: 0.15 + Math.random() * 0.4,
          ph: Math.random() * Math.PI * 2
        });
      }
      return {
        canvas: canvas, ctx: ctx, dots: dots, visible: true,
        resize: sizeCanvas,
        draw: function (t) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (var j = 0; j < dots.length; j++) {
            var d = dots[j];
            d.x = (d.x + d.vx + 1) % 1;
            d.y = (d.y + d.vy + 1) % 1;
            var tw = 0.6 + 0.4 * Math.sin(t * 0.001 + d.ph);
            ctx.beginPath();
            ctx.arc(d.x * canvas.width, d.y * canvas.height, d.s, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + d.c + "," + (d.a * tw).toFixed(3) + ")";
            ctx.fill();
          }
        }
      };
    }

    function makeOrbSystem(canvas) {
      var ctx = canvas.getContext("2d");
      var orbs = [
        { x: 0.15, y: 0.7, r: 0.32, c: "0,180,255", a: 0.10, sp: 0.00011, ph: 0 },
        { x: 0.85, y: 0.25, r: 0.28, c: "123,97,255", a: 0.12, sp: 0.00009, ph: 2 },
        { x: 0.6, y: 0.85, r: 0.2, c: "125,233,255", a: 0.07, sp: 0.00013, ph: 4 }
      ];
      function sizeCanvas() {
        var r = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(r.width));
        canvas.height = Math.max(1, Math.floor(r.height));
      }
      sizeCanvas();
      return {
        canvas: canvas, ctx: ctx, visible: true,
        resize: sizeCanvas,
        draw: function (t) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (var i = 0; i < orbs.length; i++) {
            var o = orbs[i];
            var ox = (o.x + Math.sin(t * o.sp + o.ph) * 0.05) * canvas.width;
            var oy = (o.y + Math.cos(t * o.sp * 1.3 + o.ph) * 0.05) * canvas.height;
            var rad = o.r * Math.min(canvas.width, canvas.height);
            var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
            g.addColorStop(0, "rgba(" + o.c + "," + o.a + ")");
            g.addColorStop(1, "rgba(" + o.c + ",0)");
            ctx.fillStyle = g;
            ctx.fillRect(ox - rad, oy - rad, rad * 2, rad * 2);
          }
        }
      };
    }

    document.querySelectorAll("canvas.bg-particles").forEach(function (c) { systems.push(makeDotSystem(c)); });
    var contactCanvas = document.getElementById("contactCanvas");
    if (contactCanvas) systems.push(makeOrbSystem(contactCanvas));

    if (systems.length && "IntersectionObserver" in window) {
      var visObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var sys = systems.find(function (s) { return s.canvas === entry.target; });
          if (sys) sys.visible = entry.isIntersecting;
        });
      }, { threshold: 0.02 });
      systems.forEach(function (s) { visObs.observe(s.canvas); });
    }
    window.addEventListener("resize", function () {
      systems.forEach(function (s) { s.resize(); });
    });

    var anyVisible = function () { return systems.some(function (s) { return s.visible; }); };
    (function particleLoop(t) {
      requestAnimationFrame(particleLoop);
      if (document.hidden || !anyVisible()) return;
      systems.forEach(function (s) { if (s.visible) s.draw(t || 0); });
    })(0);
  }

  /* ---------------- 9. CASE STUDY MODAL ---------------- */
  var CASES = {
    medibook: {
      kicker: "Healthcare · Booking + AI Triage",
      title: "MediBook AI",
      lede: "Intelligent appointment booking and an AI triage chatbot for a multi-clinic healthcare network — patients describe symptoms in plain language and get matched to the right specialist in seconds.",
      challenge: "A 40-clinic network was losing patients to phone queues: 11-minute average hold times, 23% call abandonment, and front-desk staff spending hours on rescheduling. Their legacy booking portal converted under 4% of visitors.",
      solution: "We built a Next.js booking platform with an AI triage chatbot trained on the network's clinical pathways. The assistant conducts a structured symptom interview, suggests the right specialty and urgency level, books the slot, and sends automated SMS reminders with one-tap rescheduling.",
      results: [
        ["+38%", "booking conversion"],
        ["−52%", "patient no-shows"],
        ["24/7", "triage coverage"]
      ],
      tags: ["Next.js", "Python", "OpenAI API", "PostgreSQL", "Twilio"]
    },
    nexora: {
      kicker: "E-commerce · Recommendations + AI Assistant",
      title: "Nexora Commerce",
      lede: "A headless commerce platform with real-time AI product recommendations and a conversational shopping assistant that guides customers from browse to checkout.",
      challenge: "Nexora's catalog had grown to 40,000 SKUs, but discovery was broken: 71% of sessions ended without a product view, and mobile checkout abandonment sat at 84%. Their rule-based 'related products' barely moved the needle.",
      solution: "We rebuilt the storefront on Next.js with edge-rendered pages and a vector-based recommendation engine. A conversational shopping assistant — aware of cart, browsing history, and inventory — answers sizing questions, suggests bundles, and recovers abandoned carts in-chat.",
      results: [
        ["+27%", "average order value"],
        ["3.1×", "chat-assisted conversion"],
        ["0.9s", "median page load"]
      ],
      tags: ["Next.js", "Node.js", "Pinecone", "Stripe", "Edge Runtime"]
    },
    aether: {
      kicker: "SaaS · Support Automation",
      title: "Aether Desk",
      lede: "An AI-powered customer support platform with smart ticket routing, auto-suggested replies, and a knowledge-base chatbot that resolves repetitive queries on its own.",
      challenge: "Aether's support team was drowning: ticket volume up 3× year over year, first-response times over 9 hours, and agents copy-pasting answers from a wiki nobody maintained. CSAT was sliding quarter after quarter.",
      solution: "We built a unified support workspace: incoming tickets are classified and routed by an AI model, agents get draft replies grounded in the knowledge base, and a customer-facing chatbot resolves common issues end-to-end — escalating with full context when it can't.",
      results: [
        ["−64%", "first response time"],
        ["41%", "tickets auto-resolved"],
        ["+19 pts", "CSAT improvement"]
      ],
      tags: ["React", "FastAPI", "OpenAI API", "Elasticsearch", "WebSockets"]
    },
    pulse: {
      kicker: "BI SaaS · Real-time Insights",
      title: "Pulse Analytics",
      lede: "A real-time business-intelligence dashboard streaming live metrics and surfacing AI-generated insights — anomalies, trends, and plain-language summaries for every team.",
      challenge: "Pulse's customers were making decisions on yesterday's data. Their legacy dashboards took minutes to refresh, and non-technical teams couldn't self-serve — every question became a ticket for the data team.",
      solution: "We engineered a streaming analytics platform on ClickHouse and Kafka with sub-second dashboard refreshes. An AI insights layer watches every metric, flags anomalies with likely causes, and writes plain-language summaries executives actually read.",
      results: [
        ["<1s", "dashboard refresh"],
        ["12×", "faster insight delivery"],
        ["63%", "fewer ad-hoc data requests"]
      ],
      tags: ["React", "D3.js", "ClickHouse", "Kafka", "GPT-4"]
    }
  };

  var overlay = document.getElementById("modalOverlay");
  var modal = document.getElementById("modal");
  var modalClose = document.getElementById("modalClose");
  var lastFocused = null;

  function openCase(key) {
    var c = CASES[key];
    if (!c || !overlay) return;
    document.getElementById("modalKicker").textContent = c.kicker;
    document.getElementById("modalTitle").textContent = c.title;
    document.getElementById("modalLede").textContent = c.lede;
    document.getElementById("modalChallenge").textContent = c.challenge;
    document.getElementById("modalSolution").textContent = c.solution;
    document.getElementById("modalResults").innerHTML = c.results.map(function (r) {
      return '<div class="result-cell"><b>' + r[0] + "</b><span>" + r[1] + "</span></div>";
    }).join("");
    document.getElementById("modalTags").innerHTML = c.tags.map(function (t) {
      return "<li>" + t + "</li>";
    }).join("");

    lastFocused = document.activeElement;
    overlay.hidden = false;
    overlay.classList.remove("closing");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeCase() {
    if (!overlay || overlay.hidden) return;
    var finish = function () {
      overlay.hidden = true;
      overlay.classList.remove("closing");
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
    if (reducedMotion) { finish(); return; }
    overlay.classList.add("closing");
    setTimeout(finish, 380);
  }

  document.querySelectorAll(".case-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { openCase(btn.getAttribute("data-case")); });
  });
  modalClose.addEventListener("click", closeCase);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeCase(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCase();
    // Light focus trap: keep Tab cycling inside the open modal
    if (e.key === "Tab" && !overlay.hidden) {
      var focusables = modal.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      focusables = Array.prototype.filter.call(focusables, function (el) { return !el.disabled; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.getElementById("modalCta").addEventListener("click", closeCase);

  /* ---------------- 10. CONTACT FORM ---------------- */
  var form = document.getElementById("contactForm");
  var success = document.getElementById("formSuccess");

  function setFieldState(input, errorEl, valid, message) {
    var field = input.closest(".field");
    field.classList.toggle("invalid", !valid);
    input.setAttribute("aria-invalid", valid ? "false" : "true");
    if (!valid) { errorEl.textContent = message; errorEl.hidden = false; }
    else { errorEl.hidden = true; }
    return valid;
  }

  function validateForm() {
    var ok = true;
    var name = document.getElementById("cfName");
    var email = document.getElementById("cfEmail");
    var type = document.getElementById("cfType");
    var msg = document.getElementById("cfMsg");

    ok = setFieldState(name, document.getElementById("errName"),
      name.value.trim().length >= 2, "Please enter your name.") && ok;
    ok = setFieldState(email, document.getElementById("errEmail"),
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()),
      "Please enter a valid email address.") && ok;
    ok = setFieldState(type, document.getElementById("errType"),
      type.value !== "", "Please choose a project type.") && ok;
    ok = setFieldState(msg, document.getElementById("errMsg"),
      msg.value.trim().length >= 10, "Please tell us a little about your project (10+ characters).") && ok;
    return ok;
  }

  ["cfName", "cfEmail", "cfType", "cfMsg"].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener("input", function () {
      input.closest(".field").classList.remove("invalid");
      var err = input.closest(".field").querySelector(".field-error");
      if (err) err.hidden = true;
      input.setAttribute("aria-invalid", "false");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm()) {
      var firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    // Front-end only: no backend. Show confirmation state.
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  document.getElementById("formReset").addEventListener("click", function () {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    document.getElementById("cfName").focus();
  });

  /* ---------------- 11. MISC ---------------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
