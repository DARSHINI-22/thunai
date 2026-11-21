(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var navList = document.getElementById('primary-nav');

  if (!toggle || !navList) {
    return;
  }

  function setOpen(isOpen) {
    navList.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setOpen(!navList.classList.contains('is-open'));
  });

  // Close the mobile menu after a link is chosen.
  navList.addEventListener('click', function (event) {
    if (event.target && event.target.tagName === 'A') {
      setOpen(false);
    }
  });
})();
