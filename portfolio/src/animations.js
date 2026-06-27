/**
 * Scroll-reveal and fold-in animations.
 */
(function () {
  // Scroll reveal
  const revealEls = document.querySelectorAll(
    '.project, .about-text, .about-shape, .contact-inner, .hero-content, .crane-container'
  );

  revealEls.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach(el => io.observe(el));

  // Stagger project reveals
  document.querySelectorAll('.project').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
  });

  // Parallax crane on scroll
  const crane = document.querySelector('.crane-container');
  if (crane) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      crane.style.transform = `translateY(calc(-50% + ${y * 0.12}px))`;
    }, { passive: true });
  }

  // Nav hide/show on scroll direction
  const nav = document.querySelector('.nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      nav.style.transform = y > lastY ? 'translateY(-100%)' : 'translateY(0)';
      nav.style.transition = 'transform 0.3s ease';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });

  // Hero on first load
  document.querySelector('.hero-content').classList.add('visible');
  document.querySelector('.crane-container')?.classList.add('visible');
})();
