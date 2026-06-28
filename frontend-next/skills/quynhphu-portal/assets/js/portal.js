/* ============================================================
   Cổng thông tin Quỳnh Phụ · portal.js (vanilla, no deps)
   ------------------------------------------------------------
   Bản Laravel: header/footer do BLADE render (layouts/partials),
   JS chỉ ENHANCE markup có sẵn:
     - Mobile hamburger menu
     - Marquee seamless loop (nhân đôi track) + reduced-motion
     - Tabs (data-tab / data-tab-panel)
     - Lọc client-side (data-filter / data-filter-item)
     - Form demo (chặn submit, hiện alert thành công)
   Không tự chèn TopBar/Footer — Blade là nguồn sự thật.
   ============================================================ */
(function () {
  'use strict';

  // -------- Hamburger (markup do Blade render) --------
  function initNav() {
    var nav = document.querySelector('.qp-nav');
    var burger = document.querySelector('.qp-hamburger');
    if (!nav || !burger) return;
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // -------- Marquee: nhân đôi nội dung track cho loop liền mạch --------
  // Blade render items 1 lần trong .qp-marquee__track; JS clone thêm 1 bản.
  function initMarquee() {
    var track = document.querySelector('.qp-marquee__track');
    if (!track || track.getAttribute('data-doubled')) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
    track.setAttribute('data-doubled', '1');
  }

  // -------- Tabs --------
  function initTabs() {
    document.querySelectorAll('[data-tab-group]').forEach(function (group) {
      var tabs = group.querySelectorAll('[data-tab]');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var name = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
          document.querySelectorAll('[data-tab-panel]').forEach(function (p) {
            p.hidden = (p.getAttribute('data-tab-panel') !== name);
          });
        });
      });
    });
  }

  // -------- Lọc client-side --------
  // control: [data-filter="key"] (key='q' = full-text); item: [data-filter-item] + data-<key>
  function initFilters() {
    var controls = document.querySelectorAll('[data-filter]');
    if (!controls.length) return;
    var scopes = {};
    controls.forEach(function (c) {
      var scopeId = c.getAttribute('data-filter-scope') || 'default';
      (scopes[scopeId] = scopes[scopeId] || []).push(c);
      c.addEventListener('input', function () { apply(scopeId); });
      c.addEventListener('change', function () { apply(scopeId); });
    });

    function apply(scopeId) {
      var ctrls = scopes[scopeId];
      var sel = '[data-filter-item]' + (scopeId !== 'default' ? '[data-filter-scope="' + scopeId + '"]' : '');
      var items = document.querySelectorAll(sel);
      var shown = 0;
      items.forEach(function (item) {
        var ok = true;
        ctrls.forEach(function (c) {
          var key = c.getAttribute('data-filter');
          var val = (c.value || '').trim().toLowerCase();
          if (!val) return;
          if (key === 'q') {
            if (item.textContent.toLowerCase().indexOf(val) === -1) ok = false;
          } else {
            var itemVal = (item.getAttribute('data-' + key) || '').toLowerCase();
            if (itemVal !== val) ok = false;
          }
        });
        item.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      var empty = document.querySelector('[data-filter-empty]' +
        (scopeId !== 'default' ? '[data-filter-scope="' + scopeId + '"]' : ''));
      if (empty) empty.hidden = shown !== 0;
    }
  }

  // -------- Form demo (chặn submit thật) --------
  // Dùng cho mockup không backend. Khi có route Laravel thật thì bỏ data-demo-form.
  function initForms() {
    document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = form.querySelector('[data-form-success]');
        if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        form.reset();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initMarquee();
    initTabs();
    initFilters();
    initForms();
  });
})();
