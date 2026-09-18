/**
 * KAPATE CONSULTANCY - MINIMAL EXECUTIVE JS
 * Components: Simple Sticky Nav, Mobile Menu, Accordions, Consultation Form
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAccordions();
  initContactForm();
  initBackToTop();
  initEstimatorWidget();
  initPortalLinks();
});

/* ==========================================================================
   PORTAL (KAPATE OS) DYNAMIC LINK RESOLVER
   ========================================================================== */
function initPortalLinks() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const portalUrl = isLocal ? 'http://localhost:3000' : 'https://os.kapateconsultancy.in';

  document.querySelectorAll('a').forEach(link => {
    const text = link.textContent.trim();
    if (text === 'Kapate OS' || text.includes('Launch OS') || text.includes('Client Portal')) {
      link.href = portalUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
}

/* ==========================================================================
   1. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navDrawer = document.querySelector('.mobile-nav-drawer');
  const navOverlay = document.querySelector('.mobile-nav-overlay');

  if (menuToggle && navDrawer && navOverlay) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !navDrawer.classList.contains('open');
      menuToggle.classList.toggle('active', isOpen);
      navDrawer.classList.toggle('open', isOpen);
      navOverlay.classList.toggle('visible', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', () => toggleMenu());
    navOverlay.addEventListener('click', () => toggleMenu(false));

    navDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDrawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });
  }

  // Active link highlighters
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   2. ACCORDION (FAQ)
   ========================================================================== */
function initAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('active', !isActive);
      questionBtn.setAttribute('aria-expanded', (!isActive).toString());
    });
  });
}

/* ==========================================================================
   3. CONTACT & CONSULTATION BOOKING FORM
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  const modal = document.getElementById('confirmation-modal');
  const closeModalBtn = document.getElementById('modal-close-btn');

  const validateField = (input, condition, errorMsg) => {
    const group = input.closest('.form-group');
    const feedback = group?.querySelector('.form-feedback');
    if (!condition) {
      group?.classList.add('has-error');
      if (feedback) feedback.textContent = errorMsg;
      return false;
    } else {
      group?.classList.remove('has-error');
      return true;
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const serviceInput = form.querySelector('[name="service"]');
    const messageInput = form.querySelector('[name="message"]');

    let isValid = true;

    if (nameInput) {
      const hasName = nameInput.value.trim().length >= 2;
      isValid = validateField(nameInput, hasName, 'Please enter your full name.') && isValid;
    }

    if (emailInput) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasEmail = emailRegex.test(emailInput.value.trim());
      isValid = validateField(emailInput, hasEmail, 'Please enter a valid business email.') && isValid;
    }

    if (serviceInput) {
      const hasService = serviceInput.value.trim() !== '';
      isValid = validateField(serviceInput, hasService, 'Please select a service.') && isValid;
    }

    if (messageInput) {
      const hasMessage = messageInput.value.trim().length >= 10;
      isValid = validateField(messageInput, hasMessage, 'Please provide a message (minimum 10 characters).') && isValid;
    }

    if (isValid) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      const companyInput = form.querySelector('[name="company"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const budgetInput = form.querySelector('[name="budget"]');
      const hpInput = form.querySelector('[name="hp_website_company_fax"]');

      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        service: serviceInput.value.trim(),
        message: messageInput.value.trim(),
        company: companyInput ? companyInput.value.trim() : null,
        phone: phoneInput ? phoneInput.value.trim() : null,
        budget: budgetInput ? budgetInput.value.trim() : null,
        hp_website_company_fax: hpInput ? hpInput.value.trim() : null
      };

      try {
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBaseUrl = isLocalHost ? 'http://localhost:8000' : 'https://api.kapateconsultancy.in';
        const response = await fetch(`${apiBaseUrl}/api/v1/public/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }

          const refSpan = document.getElementById('modal-ref-id');
          if (refSpan) refSpan.textContent = data.lead_code;

          const modalName = document.getElementById('modal-client-name');
          if (modalName && nameInput) modalName.textContent = nameInput.value.trim();

          if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
          }

          form.reset();
        } else {
          throw new Error(data.error || 'Submission failed.');
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
        alert(err.message || 'An error occurred. Please try again later.');
      }
    }
  });

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

/* ==========================================================================
   4. BACK TO TOP
   ========================================================================== */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   5. CONSULTATION SCOPE ESTIMATOR
   ========================================================================== */
function initEstimatorWidget() {
  const estimator = document.getElementById('consultation-estimator');
  if (!estimator) return;

  const scopeSelect = estimator.querySelector('#est-scope');
  const speedSelect = estimator.querySelector('#est-speed');
  const outputElem = estimator.querySelector('#est-result-timeline');

  function recalculate() {
    if (!scopeSelect || !speedSelect || !outputElem) return;
    const scope = scopeSelect.value;
    const speed = speedSelect.value;

    let timeline = '2-4 Weeks';
    if (scope === 'enterprise') {
      timeline = speed === 'expedited' ? '6-8 Weeks' : '10-14 Weeks';
    } else if (scope === 'advisory') {
      timeline = '1-2 Weeks';
    } else {
      timeline = speed === 'expedited' ? '3-5 Weeks' : '6-9 Weeks';
    }
    outputElem.textContent = timeline;
  }

  scopeSelect?.addEventListener('change', recalculate);
  speedSelect?.addEventListener('change', recalculate);
}
