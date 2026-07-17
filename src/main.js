const TOTAL_SLIDES = 10;
const pad = (n) => String(n).padStart(2, '0');
const slideSrc = (n) => `/publication/slide-${pad(n)}.png`;

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || '';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

const track = document.getElementById('carouselTrack');
const counter = document.getElementById('carouselCounter');
const progressEl = document.getElementById('carouselProgress');
const tapLeft = document.getElementById('tapLeft');
const tapRight = document.getElementById('tapRight');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TRANSITION_MS = prefersReducedMotion ? 0 : 300;

let current = 0;

// Build progress segments
for (let i = 0; i < TOTAL_SLIDES; i++) {
  const seg = document.createElement('div');
  seg.className = 'progress-seg' + (i === 0 ? ' active' : '');
  progressEl.appendChild(seg);
}

// Build slides
const slides = [];
for (let i = 1; i <= TOTAL_SLIDES; i++) {
  const slide = document.createElement('div');
  slide.className = 'carousel-slide';
  const img = document.createElement('img');
  img.loading = i <= 2 ? 'eager' : 'lazy';
  img.decoding = i <= 2 ? 'sync' : 'async';
  img.width = 1080;
  img.height = 1350;
  img.src = slideSrc(i);
  img.alt = `Publication slide ${i}`;
  slide.appendChild(img);
  track.appendChild(slide);
  slides.push(slide);
}

function preload(n) {
  if (n < 1 || n > TOTAL_SLIDES) return;
  const img = slides[n - 1]?.querySelector('img');
  if (img && img.loading !== 'eager') {
    img.loading = 'eager';
  }
}

function update() {
  track.style.transform = `translateX(-${current * 100}%)`;
  counter.textContent = `${pad(current + 1)} / ${pad(TOTAL_SLIDES)}`;
  const segs = progressEl.children;
  for (let i = 0; i < segs.length; i++) {
    segs[i].classList.toggle('active', i === current);
  }
  preload(current + 1);
  preload(current - 1);
}

function next() { if (current < TOTAL_SLIDES - 1) { current++; update(); } }
function prev() { if (current > 0) { current--; update(); } }

// Tap navigation — right 70% advances, left 30% goes back
tapRight.addEventListener('click', next);
tapLeft.addEventListener('click', prev);

// Swipe navigation
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let isSwiping = false;

track.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchDeltaX = 0;
  isSwiping = false;
  track.style.transition = 'none';
}, { passive: true });

track.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    isSwiping = true;
    touchDeltaX = dx;
    const offset = -current * 100 + (dx / track.offsetWidth) * 100;
    track.style.transform = `translateX(${offset}%)`;
  }
}, { passive: true });

track.addEventListener('touchend', () => {
  track.style.transition = '';
  if (isSwiping) {
    const threshold = track.offsetWidth * 0.2;
    if (touchDeltaX < -threshold) {
      next();
    } else if (touchDeltaX > threshold) {
      prev();
    } else {
      update();
    }
  }
  isSwiping = false;
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});

update();

// ---- Contact form (Formspree) ----
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

function setStatus(msg, type, html) {
  formStatus.innerHTML = html || msg;
  formStatus.className = 'form-status' + (type ? ' ' + type : '');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const honeypot = form.querySelector('input[name="_gotcha"]');
  if (honeypot && honeypot.value) return;

  if (!FORMSPREE_ID) {
    setStatus('The form is temporarily unavailable. Please email adam@oneblades.one.', 'error',
      'The form is temporarily unavailable. Please email <a href="mailto:adam@oneblades.one" style="color:inherit;text-decoration:underline;">adam@oneblades.one</a>.');
    submitBtn.disabled = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending\u2026';
  setStatus('Sending\u2026', 'sending');

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      setStatus('Thank you. Your invitation has been sent.', 'success');
      form.reset();
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus(err.errors?.[0]?.message || 'Something went wrong. Please try again.', 'error');
    }
  } catch {
    setStatus('Network error. Please check your connection and try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Invitation';
  }
});
