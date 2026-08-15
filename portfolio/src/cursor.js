/**
 * Custom cursor — green dot that expands to a ring + label on hover.
 */
(function () {
  const dot   = document.getElementById('jdv-cursor');
  const label = document.getElementById('jdv-cursor-label');
  if (!dot || !label) return;

  window.addEventListener('mousemove', e => {
    dot.style.transform   = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    label.style.transform = `translate(${e.clientX}px, ${e.clientY - 32}px) translate(-50%,-50%)`;
  });

  function expand(text) {
    if (text) { label.textContent = text; label.style.opacity = '1'; }
    dot.style.width      = '36px';
    dot.style.height     = '36px';
    dot.style.background = 'rgba(180,242,67,0.12)';
    dot.style.border     = '1px solid #B4F243';
  }

  function collapse() {
    label.style.opacity  = '0';
    dot.style.width      = '14px';
    dot.style.height     = '14px';
    dot.style.background = '#B4F243';
    dot.style.border     = 'none';
  }

  // Expose so animations.js can call them
  window.cursorExpand   = expand;
  window.cursorCollapse = collapse;

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-cursor-label]');
    if (el) expand(el.getAttribute('data-cursor-label'));
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest('[data-cursor-label]')) collapse();
  });
})();
