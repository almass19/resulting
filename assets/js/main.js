/* RESULTING — interaction layer */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ----------------------------------------------------------
     Custom cursor: gold dot + trailing ring
     ---------------------------------------------------------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));

    const hoverables = 'a, button, .case';
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest(hoverables));
    });

    (function cursorLoop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(cursorLoop);
    })();
  }

  /* ----------------------------------------------------------
     Hero: self-typing manifesto
     ---------------------------------------------------------- */
  const typedEl = document.getElementById('typed');
  const caretEl = document.getElementById('caret');
  const MANIFESTO = 'Маркетинг, который приносит продажи, а не клики.';
  if (typedEl) {
    if (reduceMotion) {
      typedEl.textContent = MANIFESTO;
    } else {
      let i = 0;
      const type = () => {
        typedEl.textContent = MANIFESTO.slice(0, ++i);
        if (i < MANIFESTO.length) {
          const ch = MANIFESTO[i - 1];
          const pause = /[,.]/.test(ch) ? 260 : 34 + Math.random() * 46;
          setTimeout(type, pause);
        } else if (caretEl) {
          caretEl.classList.add('is-done');
        }
      };
      setTimeout(type, 900);
    }
  }

  /* ----------------------------------------------------------
     Hero: scroll-scrub of the molten-gold clip
     ---------------------------------------------------------- */
  const hero = document.querySelector('.hero');
  const heroVideo = document.querySelector('.hero__video');
  const heroTitle = document.querySelector('.hero__title');
  const heroContent = document.querySelector('.hero__content');
  const heroHint = document.querySelector('.hero__hint');

  if (hero && heroVideo && !reduceMotion) {
    heroVideo.pause();
    let targetTime = 0;

    const heroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      return scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
    };

    (function scrubLoop() {
      const p = heroProgress();
      if (heroVideo.duration) {
        targetTime = p * (heroVideo.duration - 0.05);
        const t = lerp(heroVideo.currentTime, targetTime, 0.22);
        if (Math.abs(t - heroVideo.currentTime) > 0.002) heroVideo.currentTime = t;
      }
      // parallax + late fade of the title block
      if (heroTitle) {
        heroTitle.style.transform = `translateY(${p * -9}vh)`;
      }
      if (heroContent) {
        heroContent.style.opacity = String(1 - clamp((p - 0.75) / 0.22, 0, 1));
      }
      if (heroHint) {
        heroHint.style.opacity = String(1 - clamp(p / 0.08, 0, 1));
      }
      requestAnimationFrame(scrubLoop);
    })();
  } else if (heroVideo && reduceMotion) {
    heroVideo.setAttribute('loop', '');
    heroVideo.play().catch(() => {});
  }

  /* ----------------------------------------------------------
     Stats: counters hammered in by scroll
     ---------------------------------------------------------- */
  const formatNum = (value, el) => {
    const grouping = el.dataset.grouping !== 'false';
    let s = Math.round(value).toString();
    if (grouping) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (el.dataset.prefix || '') + s + (el.dataset.suffix || '');
  };

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    if (reduceMotion) {
      el.textContent = formatNum(target, el);
      return;
    }
    const dur = 1900;
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      el.textContent = formatNum(target * easeOutExpo(t), el);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.stat__num').forEach((el) => counterObserver.observe(el));

  /* ----------------------------------------------------------
     Kinetic manifesto: one word per scroll step
     ---------------------------------------------------------- */
  const kinetic = document.querySelector('.kinetic');
  const words = Array.from(document.querySelectorAll('.kinetic__word'));
  const kineticIdx = document.getElementById('kinetic-idx');

  if (kinetic && words.length) {
    let lastIdx = -1;
    const update = () => {
      const rect = kinetic.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      const p = clamp(-rect.top / scrollable, 0, 1);
      const idx = clamp(Math.floor(p * words.length), 0, words.length - 1);
      if (idx === lastIdx) return;
      lastIdx = idx;
      words.forEach((w, i) => {
        w.classList.toggle('is-active', i === idx);
        w.classList.toggle('is-past', i < idx);
      });
      if (kineticIdx) kineticIdx.textContent = '0' + (idx + 1);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Works: hover-video reveals (crops of the showreel clip)
     ---------------------------------------------------------- */
  document.querySelectorAll('.case').forEach((card) => {
    const video = card.querySelector('.case__video');
    if (!video) return;
    card.addEventListener('mouseenter', () => {
      card.classList.add('is-hover');
      video.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-hover');
      video.pause();
    });
    // touch fallback: play while the card is mostly in view
    if (!window.matchMedia('(pointer: fine)').matches) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            card.classList.add('is-hover');
            video.play().catch(() => {});
          } else {
            card.classList.remove('is-hover');
            video.pause();
          }
        });
      }, { threshold: 0.55 }).observe(card);
    }
  });

  /* ----------------------------------------------------------
     Team: ambient clip plays only while visible
     ---------------------------------------------------------- */
  const teamVideo = document.querySelector('.team__video');
  if (teamVideo) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) teamVideo.play().catch(() => {});
        else teamVideo.pause();
      });
    }, { threshold: 0.2 }).observe(teamVideo);
  }

  /* ----------------------------------------------------------
     Generic reveal-on-scroll
     ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));
})();
