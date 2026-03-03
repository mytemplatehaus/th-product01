const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.navbar nav');
const reveals = document.querySelectorAll('.reveal');
const countEls = document.querySelectorAll('[data-count]');
const progress = document.querySelector('.scroll-progress');
const cursor = document.querySelector('.cursor');
const ring = document.querySelector('.cursor-ring');
const magneticButtons = document.querySelectorAll('.magnetic');
const form = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');
const testimonials = [...document.querySelectorAll('.testimonial')];
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let slideIndex = 0;

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      if (entry.target.querySelector('[data-count]') || entry.target.matches('[data-count]')) {
        countEls.forEach((el) => animateCount(el));
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((el) => observer.observe(el));

function animateCount(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const target = Number(el.dataset.count);
  const suffix = target === 100 || target === 50 || target === 5 ? '+' : '';
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const tick = () => {
    current += step;
    if (current >= target) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    el.textContent = `${current}${suffix}`;
    requestAnimationFrame(tick);
  };
  tick();
}

window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const pct = (scrollTop / scrollHeight) * 100;
  progress.style.width = `${pct}%`;
});

document.addEventListener('mousemove', (e) => {
  if (!cursor || !ring) return;
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  ring.style.transform = `translate(${e.clientX - 13}px, ${e.clientY - 13}px)`;
});

magneticButtons.forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0,0)';
  });
});

const cards = document.querySelectorAll('.project-card');
cards.forEach((card) => {
  card.addEventListener('click', () => {
    const modalId = card.dataset.modal;
    const modal = document.getElementById(modalId);
    if (modal?.showModal) modal.showModal();
  });
});

document.querySelectorAll('.close-modal').forEach((btn) => {
  btn.addEventListener('click', () => btn.closest('dialog')?.close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (e) => {
    const box = dialog.getBoundingClientRect();
    const outside =
      e.clientX < box.left ||
      e.clientX > box.right ||
      e.clientY < box.top ||
      e.clientY > box.bottom;
    if (outside) dialog.close();
  });
});

function showSlide(index) {
  testimonials.forEach((slide, i) => slide.classList.toggle('active', i === index));
}

function nextSlide(step = 1) {
  slideIndex = (slideIndex + step + testimonials.length) % testimonials.length;
  showSlide(slideIndex);
}

prevBtn?.addEventListener('click', () => nextSlide(-1));
nextBtn?.addEventListener('click', () => nextSlide(1));
setInterval(() => nextSlide(1), 5000);

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    formStatus.textContent = 'Please fill out all fields correctly.';
    formStatus.style.color = '#ff9d9d';
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
    return;
  }
  formStatus.textContent = 'Message sent! I will respond within 24 hours.';
  formStatus.style.color = '#9de2ae';
  form.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
