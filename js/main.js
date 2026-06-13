/* Impactalyst — main.js
   Progressive enhancement only. Site is fully usable without JS.
   - sticky header state on scroll
   - mobile nav toggle
   - Formspree AJAX submit (pattern from jacobdigital/)
   - IntersectionObserver reveal (respects prefers-reduced-motion)
*/
(function () {
  'use strict';

  /* --- Sticky header shadow/blur on scroll --- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Mobile nav toggle --- */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    // close after navigating to an anchor
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => setOpen(false))
    );
    // close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* --- Reveal on scroll --- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* --- Formspree AJAX submit --- */
  const form = document.getElementById('join-form');
  if (form) {
    const btn = form.querySelector('.form__submit');
    const success = document.getElementById('form-success');
    const error = document.getElementById('form-error');
    const btnLabel = btn ? btn.textContent : '';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (error) error.style.display = 'none';

      // basic required-field guard
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();
      if (!name || !email || !message) {
        form.reportValidity();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Wird gesendet …';
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });

        if (res.ok) {
          form.reset();
          if (btn) btn.style.display = 'none';
          if (success) {
            success.style.display = 'block';
            success.focus?.();
          }
        } else {
          throw new Error('bad status');
        }
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btnLabel;
        }
        if (error) error.style.display = 'block';
      }
    });
  }
})();
