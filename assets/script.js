const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

// Les liens en dossier donnent de belles URL sur GitHub Pages. En ouverture
// locale (file://), on cible explicitement index.html pour éviter l'index du dossier.
if (window.location.protocol === 'file:') {
  document.querySelectorAll('a[href$="/"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return;
    link.setAttribute('href', `${href}index.html`);
  });
}

if (menuButton && navigation) {
  const menuLabel = menuButton.querySelector('.sr-only');

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
    if (menuLabel) menuLabel.textContent = isOpen ? 'Ouvrir le menu' : 'Fermer le menu';
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      if (menuLabel) menuLabel.textContent = 'Ouvrir le menu';
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (menuLabel) menuLabel.textContent = 'Ouvrir le menu';
    menuButton.focus();
  });
}

document.querySelectorAll('.marquee__inner').forEach((track) => {
  const group = track.querySelector('.marquee__group');
  if (!group || track.children.length > 1) return;

  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
});

document.querySelectorAll('.sales-program__list, .sales-faq__list').forEach((accordion) => {
  const panels = accordion.querySelectorAll('details');

  panels.forEach((panel) => {
    panel.addEventListener('toggle', () => {
      if (!panel.open) return;
      panels.forEach((candidate) => {
        if (candidate !== panel && candidate.open) candidate.open = false;
      });
    });
  });
});

const portfolioGallery = document.querySelector('.portfolio-gallery');
const portfolioCount = document.querySelector('.portfolio-work__count');
const portfolioFilterButtons = document.querySelectorAll('.portfolio-filter');
const portfolioWork = document.querySelector('.portfolio-work');
const socialProof = document.querySelector('.social-proof');
const portfolioHint = document.querySelector('.portfolio-work__hint');

if (portfolioGallery && window.portfolioLibrary) {
  const categoryOrder = ['Gaming', 'Sport', 'Business', 'Podcast', 'Divertissement', 'Manga'];

  const makeItem = (category, file) => ({ category, file });
  const itemsByCategory = Object.fromEntries(
    categoryOrder.map((category) => [
      category,
      (window.portfolioLibrary[category] || []).map((file) => makeItem(category, file))
    ])
  );

  // Le mélange par rotation évite de regrouper tous les univers dans « Tout voir ».
  const allItems = [];
  const longestCategory = Math.max(...categoryOrder.map((category) => itemsByCategory[category].length));
  for (let index = 0; index < longestCategory; index += 1) {
    categoryOrder.forEach((category) => {
      if (itemsByCategory[category][index]) allItems.push(itemsByCategory[category][index]);
    });
  }

  const featuredByFilter = {
    all: { category: 'Sport', file: 'Tom_Vlog.jpg' },
    Gaming: { category: 'Gaming', file: 'Zekken_CITY CLASSIC HIGHLIGHTS.jpg' },
    Business: { category: 'Business', file: 'Hugo_RegardDesAutres.jpg' },
    Sport: { category: 'Sport', file: 'Tom_Vlog.jpg' },
    Podcast: { category: 'Podcast', file: 'Liftrainer_Podcast7.jpg' },
    Manga: { category: 'Manga', file: 'Adrien_NouvelleTechniqueBoruto.jpg' }
  };

  const promoteFeaturedItem = (items, filter) => {
    const arrangedItems = [...items];
    const featured = featuredByFilter[filter];
    if (!featured) return arrangedItems;

    const featuredIndex = arrangedItems.findIndex((item) => (
      item.category === featured.category && item.file === featured.file
    ));
    if (featuredIndex > 0) {
      [arrangedItems[0], arrangedItems[featuredIndex]] = [arrangedItems[featuredIndex], arrangedItems[0]];
    }
    return arrangedItems;
  };

  const humanizeFilename = (file) => file
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const renderPortfolio = (filter = 'all') => {
    const sourceItems = filter === 'all' ? allItems : (itemsByCategory[filter] || []);
    const items = promoteFeaturedItem(sourceItems, filter);
    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const button = document.createElement('button');
      const image = document.createElement('img');
      const isFeatured = index % 10 === 0;
      const label = `${item.category} — ${humanizeFilename(item.file)}`;

      button.className = `portfolio-gallery__item${isFeatured ? ' is-featured' : ''}`;
      button.type = 'button';
      button.dataset.lightbox = '';
      button.setAttribute('aria-label', `Agrandir la miniature ${label}`);

      image.src = encodeURI(`../Ressources/Portfolio Miniamaker/${item.category}/${item.file}`);
      image.alt = `Miniature ${label}`;
      image.loading = index < 4 ? 'eager' : 'lazy';
      image.decoding = 'async';

      button.appendChild(image);
      fragment.appendChild(button);
    });

    portfolioGallery.classList.add('is-refreshing');
    portfolioGallery.dataset.filter = filter;
    portfolioGallery.replaceChildren(fragment);
    portfolioGallery.scrollLeft = 0;
    if (portfolioCount) {
      const label = items.length > 1 ? 'miniatures' : 'miniature';
      portfolioCount.textContent = `${items.length} ${label}`;
    }

    requestAnimationFrame(() => portfolioGallery.classList.remove('is-refreshing'));
  };

  const scrollToPortfolioStart = () => {
    if (!portfolioWork || window.matchMedia('(max-width: 760px)').matches) return;
    const headerHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height')
    ) || 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sectionTop = portfolioWork.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: Math.max(0, sectionTop),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  };

  portfolioFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      const showProof = filter === 'proof';

      portfolioFilterButtons.forEach((candidate) => {
        const isSelected = candidate === button;
        candidate.classList.toggle('is-active', isSelected);
        candidate.setAttribute('aria-pressed', String(isSelected));
      });

      portfolioGallery.hidden = showProof;
      if (portfolioCount) portfolioCount.hidden = showProof;
      if (portfolioHint) portfolioHint.hidden = showProof;
      if (socialProof) socialProof.hidden = !showProof;

      if (!showProof) renderPortfolio(filter);
      scrollToPortfolioStart();
    });
  });

  renderPortfolio();
}

const homepageThumbnails = document.querySelectorAll('.recent__item');
homepageThumbnails.forEach((thumbnail) => {
  const image = thumbnail.querySelector('img');
  thumbnail.dataset.lightbox = '';
  thumbnail.setAttribute('role', 'button');
  thumbnail.setAttribute('tabindex', '0');
  thumbnail.setAttribute('aria-label', `Agrandir ${image?.alt || 'la miniature'}`);
});

const pageLightboxTargets = document.querySelectorAll('[data-lightbox]');

if (portfolioGallery || homepageThumbnails.length || pageLightboxTargets.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Aperçu de la miniature');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <button class="image-lightbox__close" type="button" aria-label="Fermer l’aperçu">
      <span aria-hidden="true"></span><span aria-hidden="true"></span>
    </button>
    <img class="image-lightbox__image" src="" alt="">
  `;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector('.image-lightbox__image');
  const lightboxClose = lightbox.querySelector('.image-lightbox__close');
  let lightboxTrigger = null;

  const openLightbox = (trigger) => {
    const sourceImage = trigger.querySelector('img');
    if (!sourceImage || !lightboxImage || !lightboxClose) return;

    lightboxTrigger = trigger;
    lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
    lightboxImage.alt = sourceImage.alt;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox.classList.contains('is-open') || !lightboxImage) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
    lightboxTrigger?.focus();
    lightboxTrigger = null;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lightbox]');
    if (trigger) openLightbox(trigger);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.recent__item[data-lightbox]')) {
      event.preventDefault();
      openLightbox(event.target);
    }
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
}

// Animations discrètes des grands blocs, réservées aux écrans d’ordinateur.
// Le contenu reste visible par défaut : sans JavaScript, sur mobile ou avec
// « réduire les animations », rien n’est masqué.
const desktopRevealMedia = window.matchMedia(
  '(min-width: 761px) and (prefers-reduced-motion: no-preference)'
);
const revealSelectors = [
  '.results__inner',
  '.about__inner',
  '.recent__head',
  '.recent__rail',
  '.portfolio-filters',
  '.social-proof__header',
  '.portfolio-work .proof-block',
  '.sales-pain__inner',
  '.sales-about__inner',
  '.sales-work',
  '.sales-trust',
  '.sales-results',
  '.sales-solution > .sales-section-head',
  '.sales-solution__grid',
  '.sales-included__inner',
  '.sales-program > .sales-section-head',
  '.sales-program__list',
  '.sales-support > .sales-section-head',
  '.sales-support__grid',
  '.sales-offer',
  '.sales-faq > .sales-section-head',
  '.sales-faq__list',
  '.sales-final__inner',
  '.contact-intro',
  '.contact-form',
  '.legal__header',
  '.legal__document',
  '.site-footer__inner'
];
const revealTargets = [...new Set(
  revealSelectors.flatMap((selector) => [...document.querySelectorAll(selector)])
)];
let revealObserver = null;

const showRevealTargets = () => {
  revealObserver?.disconnect();
  revealObserver = null;
  revealTargets.forEach((target) => {
    target.classList.remove('is-reveal-pending');
    target.classList.add('is-revealed');
  });
};

const setupDesktopReveals = () => {
  if (!desktopRevealMedia.matches || !('IntersectionObserver' in window)) {
    showRevealTargets();
    return;
  }

  revealObserver?.disconnect();
  revealTargets.forEach((target) => {
    if (target.classList.contains('is-revealed')) return;
    target.classList.add('scroll-reveal', 'is-reveal-pending');
  });

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('is-reveal-pending');
      entry.target.classList.add('is-revealed');
      revealObserver?.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -10% 0px'
  });

  revealTargets.forEach((target) => {
    if (!target.classList.contains('is-revealed')) revealObserver.observe(target);
  });
};

setupDesktopReveals();
desktopRevealMedia.addEventListener?.('change', () => {
  if (desktopRevealMedia.matches) setupDesktopReveals();
  else showRevealTargets();
});
