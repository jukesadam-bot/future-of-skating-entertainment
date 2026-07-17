// Publication deck viewer + contact form
// Replaces the original inline mailto with a Formspree endpoint.
// Set VITE_FORMSPREE_ID in .env (or hardcode FORMSPREE_ENDPOINT below).

const TOTAL_PAGES = 93;
const pad = (n) => String(n).padStart(2, '0');
const pageSrc = (n) => `/publication/portrait-page-${pad(n)}.webp`;

// Formspree endpoint. Set VITE_FORMSPREE_ID env var, or paste your own ID here.
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || 'YOUR_FORMSPREE_ID';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

const stage = document.getElementById('deckStage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('deckCounter');
let current = 0;

// Build all 93 slides up front so the counter and bounds are correct.
// Images use loading="lazy" except the first 3 (eager) to prevent layout shifts.
const slides = [];
for (let i = 1; i <= TOTAL_PAGES; i++) {
  const slide = document.createElement('div');
  slide.className = 'slide' + (i === 1 ? ' active' : '');
  const img = document.createElement('img');
  img.loading = i <= 3 ? 'eager' : 'lazy';
  img.decoding = i === 1 ? 'sync' : 'async';
  img.width = 640;
  img.height = 1138;
  img.src = pageSrc(i);
  img.alt = `Publication page ${i}`;
  slide.appendChild(img);
  stage.appendChild(slide);
  slides.push(slide);
}

function preload(n) {
  if (n < 1 || n > TOTAL_PAGES) return;
  const img = slides[n - 1]?.querySelector('img');
  if (img && !img.complete) {
    img.loading = 'eager';
  }
}

function update() {
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
  counter.textContent = `${current + 1} / ${TOTAL_PAGES}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === TOTAL_PAGES - 1;
  // Preload the pages immediately before and after the current page
  preload(current);
  preload(current + 2);
}

function next() {
  if (current < TOTAL_PAGES - 1) { current++; update(); }
}
function prev() {
  if (current > 0) { current--; update(); }
}

nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
});
update();

// ---- Contact form (Formspree) ----
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

function setStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className = 'form-status' + (type ? ' ' + type : '');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Honeypot spam protection — hidden field must remain empty
  const honeypot = form.querySelector('input[name="_gotcha"]');
  if (honeypot && honeypot.value) return;

  if (FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
    setStatus('Form service not configured. Set VITE_FORMSPREE_ID in .env', 'error');
    return;
  }

  submitBtn.disabled = true;
  setStatus('Sending…', 'sending');

  try {
    const data = new FormData(form);
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: data,
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
  }
});
