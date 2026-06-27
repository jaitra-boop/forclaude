/**
 * Origami cursor — draws tiny paper triangles that fold and fade
 * as the cursor moves across the page.
 */
(function () {
  const canvas = document.getElementById('cursor-canvas');
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouse = { x: -200, y: -200 };
  let lastMouse = { x: -200, y: -200 };
  let speed = 0;
  const particles = [];
  let animId;

  // Cursor dot state
  const dot = { x: -200, y: -200, tx: -200, ty: -200 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    speed = Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);

    // Spawn a paper triangle every few pixels of movement
    if (speed > 2 && Math.random() < 0.4) spawnParticle();
  });

  // Colour palette — cream / terracotta / sage — paper tones
  const COLORS = ['#e8ddd0', '#d4522a', '#4a7c6f', '#c8c0b4', '#ede8df'];

  function spawnParticle() {
    const angle = Math.atan2(mouse.y - lastMouse.y, mouse.x - lastMouse.x);
    const spread = (Math.random() - 0.5) * Math.PI * 0.6;
    const size = 6 + Math.random() * 10;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    particles.push({
      x: mouse.x,
      y: mouse.y,
      vx: Math.cos(angle + spread) * (1 + Math.random() * 2),
      vy: Math.sin(angle + spread) * (1 + Math.random() * 2) - 1.5,
      size,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      alpha: 0.75 + Math.random() * 0.25,
      decay: 0.012 + Math.random() * 0.018,
      color,
      foldRatio: 0,          // 0 = flat triangle, 1 = fully "folded"
      foldSpeed: 0.04 + Math.random() * 0.04,
    });
  }

  function drawTriangle(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;

    const s = p.size;
    const fold = p.foldRatio;

    // Front face
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * (1 - fold * 0.4), s * 0.6);
    ctx.lineTo(-s, s * 0.6);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    // Shadow / back face to simulate fold
    if (fold > 0.05) {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * (1 - fold * 0.4), s * 0.6);
      ctx.lineTo(0 + s * fold * 0.3, s * 0.6 - s * fold * 0.8);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
    }

    // Crease line
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0 + s * fold * 0.3, s * 0.6 - s * fold * 0.8);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  function drawCursor() {
    // Lerp dot toward mouse
    dot.x += (mouse.x - dot.x) * 0.18;
    dot.y += (mouse.y - dot.y) * 0.18;

    // Outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(26,24,20,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Inner dot
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(26,24,20,0.8)';
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.06;          // gravity
      p.rot    += p.rotSpeed;
      p.alpha  -= p.decay;
      p.foldRatio = Math.min(1, p.foldRatio + p.foldSpeed);

      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      drawTriangle(p);
    }

    drawCursor();
    animId = requestAnimationFrame(loop);
  }

  loop();

  // Cursor pointer style on interactive elements
  const interactives = 'a, button, [role="button"]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactives)) {
      dot._large = true;
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactives)) {
      dot._large = false;
    }
  });
})();
