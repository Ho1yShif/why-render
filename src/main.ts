import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Subtle scroll-reveal. Content is visible by default; only hidden when JS + motion are allowed. */
function setupReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  document.documentElement.classList.add('motion');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

/** Highlight the nav link for the section currently in view. */
function setupActiveNav(): void {
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]').forEach((a) => {
    links.set(a.getAttribute('href')!.slice(1), a);
  });
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a, id) => {
          if (id === entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  links.forEach((_a, id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
}

/** Copy button for the render.yaml snippet. Fails quietly where the Clipboard API is unavailable. */
function setupCopy(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copyTarget ?? '');
      const status = btn.closest('figure')?.querySelector<HTMLElement>('.copy-status');
      if (!target) return;
      let ok = false;
      try {
        await navigator.clipboard.writeText(target.textContent ?? '');
        ok = true;
      } catch {
        ok = false;
      }
      btn.textContent = ok ? 'Copied' : 'Select & copy';
      if (status) status.textContent = ok ? 'render.yaml copied to clipboard' : 'Copy unavailable; select the text instead';
      window.setTimeout(() => (btn.textContent = 'Copy'), 1800);
    });
  });
}

setupReveal();
setupActiveNav();
setupCopy();
