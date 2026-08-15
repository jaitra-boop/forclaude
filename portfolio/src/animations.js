/**
 * Interactions:
 * - Letter flip  JAITRA ↔ JOY (first 3 chars) on interval
 * - Spinning fan — speed up on hover, click shows design fact
 * - Scroll-based hero kerning
 * - Hide/show header on scroll direction
 * - Card click → case study view
 * - Logo click → home view
 */
(function () {

  /* ── Letter flip ──────────────────────────────── */
  const TOPS    = ['J','A','I','T','R','A'];
  const BOTTOMS = ['J','O','Y','T','R','A'];
  const ANIMATED = [0, 1, 2];

  const nameFlip = document.getElementById('name-flip');
  const inners = [];

  TOPS.forEach((top, i) => {
    const letter = document.createElement('span');
    letter.className = 'name-letter';

    const inner = document.createElement('span');
    inner.className = 'name-letter-inner unflipped';

    const t = document.createElement('span'); t.textContent = top;
    const b = document.createElement('span'); b.textContent = BOTTOMS[i];

    inner.appendChild(t);
    inner.appendChild(b);
    letter.appendChild(inner);
    nameFlip.appendChild(letter);

    if (ANIMATED.includes(i)) inners.push({ el: inner, idx: i });
  });

  let flipped = false;
  setInterval(() => {
    flipped = !flipped;
    inners.forEach(({ el, idx }) => {
      el.style.transitionDelay = `${idx * 80}ms`;
      el.className = `name-letter-inner ${flipped ? 'flipped' : 'unflipped'}`;
    });
  }, 2400);

  /* ── Fan spin speed ───────────────────────────── */
  const FANS = document.querySelectorAll('.fan-svg');

  function setFanSpeed(fast) {
    FANS.forEach(f => {
      if (fast) f.classList.add('fan-fast');
      else      f.classList.remove('fan-fast');
    });
  }

  /* ── Design facts ─────────────────────────────── */
  const FACTS = [
    'GOOD DESIGN IS INVISIBLE UNTIL IT BREAKS',
    'WHITESPACE IS A DECISION, NOT AN ACCIDENT',
    'CONSTRAINTS MAKE BETTER DESIGNERS THAN FREEDOM',
    'THE BEST INTERFACE IS THE ONE YOU DON’T NOTICE',
    'FORM FOLLOWS FEELING, NOT JUST FUNCTION',
  ];

  const tooltip = document.getElementById('fact-tooltip');

  function showFact(x, y) {
    tooltip.textContent = FACTS[Math.floor(Math.random() * FACTS.length)];
    tooltip.style.left = `${x}px`;
    tooltip.style.top  = `${y}px`;
    tooltip.hidden = false;
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-cursor-label="CLICK FOR A DESIGN FACT"]')) {
      const rect = e.target.closest('[data-cursor-label]').getBoundingClientRect();
      showFact(rect.left + rect.width / 2, rect.bottom + 12);
      if (window.cursorExpand) window.cursorExpand('CLICK FOR A DESIGN FACT');
      e.stopPropagation();
      return;
    }
    if (!e.target.closest('#fact-tooltip')) tooltip.hidden = true;
  });

  // Fan hover events
  document.querySelectorAll('[data-cursor-label="CLICK FOR A DESIGN FACT"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      setFanSpeed(true);
      if (window.cursorExpand) window.cursorExpand('CLICK FOR A DESIGN FACT');
    });
    el.addEventListener('mouseleave', () => {
      setFanSpeed(false);
      if (window.cursorCollapse) window.cursorCollapse();
    });
  });

  /* ── Scroll: kerning + header hide ───────────── */
  const header    = document.getElementById('site-header');
  const headline  = document.getElementById('hero-headline');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    // Hero kerning
    if (headline) {
      const ky = Math.min(y, 500);
      const spacing = (0.02 - (ky / 500) * 0.02).toFixed(3) + 'em';
      headline.style.letterSpacing = spacing;
    }

    // Header hide/show
    if (y > 80) {
      header.style.transform = y > lastY ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      header.style.transform = 'translateY(0)';
    }

    lastY = y;
  }, { passive: true });

  /* ── View switching ───────────────────────────── */
  const homeView = document.getElementById('home-view');
  const caseView = document.getElementById('case-view');
  const headerNav = document.getElementById('header-nav');
  const caseNav   = document.getElementById('case-nav');

  function openCase() {
    homeView.hidden = true;
    caseView.hidden = false;
    headerNav.hidden = true;
    caseNav.hidden   = false;
    window.scrollTo(0, 0);
  }

  function goHome() {
    caseView.hidden = true;
    homeView.hidden = false;
    caseNav.hidden   = true;
    headerNav.hidden = false;
    window.scrollTo(0, 0);
  }

  // Project cards with a case ID
  document.querySelectorAll('.card[data-case]').forEach(card => {
    card.addEventListener('click', () => openCase(card.dataset.case));
    card.style.cursor = 'none';
  });

  document.getElementById('back-btn').addEventListener('click', e => {
    e.preventDefault();
    goHome();
  });

  document.getElementById('logo-home').addEventListener('click', e => {
    if (!homeView.hidden) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      goHome();
    }
  });

})();
