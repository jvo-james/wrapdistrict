(() => {
  const root = document.querySelector('#teamRoot');
  if (!root) return;

  const order = ['t1','t2','t3','t4','t5','t6','t7','t8'];
  const socialData = [
    ['instagram','instagram','Instagram'],
    ['tiktok','tiktok','TikTok'],
    ['snapchat','snapchat','Snapchat'],
    ['x','x-twitter','X'],
    ['facebook','facebook-f','Facebook']
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function isAllowedTeamImage(value, fallback) {
    const image = String(value || '').trim();
    if (!image) return fallback;

    // Keep the Team page free from old stock-photo data. Local SVG placeholders
    // and images uploaded later through the admin are allowed.
    const lower = image.toLowerCase();
    if (lower.includes('unsplash.com') || lower.includes('images.unsplash.com')) return fallback;
    return image;
  }

  function getTeamPeople() {
    const defaults = Array.isArray(window.WD_DEFAULT_TEAM) ? window.WD_DEFAULT_TEAM : [];
    const saved = window.WD?.team ? WD.team() : [];
    const savedById = new Map(saved.map(person => [String(person.id), person]));
    return order.map(id => {
      const fallback = defaults.find(person => String(person.id) === id) || {};
      const override = savedById.get(id) || {};
      const merged = {...fallback,...override,id};
      merged.image = isAllowedTeamImage(override.image || fallback.image, fallback.image);
      return merged;
    }).filter(person => person.name);
  }

  function socialLinks(person) {
    const links = socialData.filter(([key]) => person[key] && person[key] !== '#');
    if (!links.length) {
      return `<div class="team-social-empty"><i class="fa-regular fa-circle-user"></i><span>Public social links will appear here when they are added.</span></div>`;
    }
    return `<div class="team-drawer-socials">${links.map(([key, icon, label]) => `
      <a href="${esc(person[key])}" target="_blank" rel="noopener noreferrer">
        <span><i class="fa-brands fa-${icon}"></i>${label}</span>
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>`).join('')}</div>`;
  }

  function founderCard(person) {
    return `
      <section class="team-founder-v3" aria-labelledby="founderName">
        <div class="team-founder-copy-v3">
          <div class="team-founder-number">Founder</div>
          <span class="eyebrow">Founder spotlight</span>
          <h2 id="founderName">${esc(person.name).replace(/\s+/,'<br>')}</h2>
          <p>${esc(person.bio || 'Founder of Wrap District.')}</p>
          <button class="team-profile-link-v3" type="button" data-person-id="${esc(person.id)}">
            Open ${esc(person.name)}'s profile <span><i class="fa-solid fa-arrow-right"></i></span>
          </button>
        </div>
        <button class="team-founder-portrait-v3" type="button" data-person-id="${esc(person.id)}" aria-label="Open ${esc(person.name)}'s profile">
          <img src="${esc(person.image)}" alt="${esc(person.name)}">
          <span class="team-founder-corner">Founder</span>
          <span class="team-portrait-open"><i class="fa-solid fa-expand"></i> View profile</span>
        </button>
      </section>`;
  }

  function memberCard(person, index) {
    const number = String(index + 2).padStart(2, '0');
    return `
      <button class="team-person-v3 team-person-v3-${index + 1}" type="button" data-person-id="${esc(person.id)}" aria-label="Open ${esc(person.name)}'s profile">
        <span class="team-person-image-v3"><img src="${esc(person.image)}" alt="${esc(person.name)}"></span>
        <span class="team-person-shade-v3"></span>
        <span class="team-person-number-v3">${number}</span>
        <span class="team-person-name-v3">${esc(person.name)}</span>
        <span class="team-person-open-v3">View profile <i class="fa-solid fa-arrow-right"></i></span>
      </button>`;
  }

  function drawerShell() {
    return `
      <div class="team-drawer-backdrop-v3" id="teamBackdrop" aria-hidden="true"></div>
      <aside class="team-profile-drawer-v3" id="teamDrawer" aria-hidden="true" aria-label="Team member profile">
        <button class="team-drawer-close-v3" type="button" data-team-close aria-label="Close profile"><i class="fa-solid fa-xmark"></i></button>
        <div id="teamDrawerContent"></div>
      </aside>`;
  }

  function render() {
    const people = getTeamPeople();
    if (people.length !== 8) {
      root.innerHTML = '<p class="lede">Team profiles are being prepared. Please check back soon.</p>';
      return;
    }

    const founder = people[0];
    const others = people.slice(1);

    root.innerHTML = `
      ${founderCard(founder)}
      <section class="team-rest-v3" aria-labelledby="teamPeopleTitle">
        <div class="team-rest-head-v3">
          <div>
            <span class="eyebrow">The people around the District</span>
            <h2 id="teamPeopleTitle">Meet the rest<br>of the team.</h2>
          </div>
          <p>No titles on the cards. Just the people. Open a portrait when you want to know more.</p>
        </div>
        <div class="team-grid-v3">${others.map(memberCard).join('')}</div>
      </section>
      ${drawerShell()}`;

    root.querySelectorAll('[data-person-id]').forEach(button => {
      button.addEventListener('click', () => {
        const person = people.find(item => String(item.id) === String(button.dataset.personId));
        if (person) openProfile(person, people.indexOf(person));
      });
    });

    root.querySelector('[data-team-close]')?.addEventListener('click', closeProfile);
    root.querySelector('#teamBackdrop')?.addEventListener('click', closeProfile);
  }

  function openProfile(person, index) {
    const drawer = document.querySelector('#teamDrawer');
    const backdrop = document.querySelector('#teamBackdrop');
    const content = document.querySelector('#teamDrawerContent');
    if (!drawer || !backdrop || !content) return;

    const number = String(index + 1).padStart(2, '0');
    const isFounder = index === 0;

    content.innerHTML = `
      <div class="team-drawer-portrait-v3">
        <img src="${esc(person.image)}" alt="${esc(person.name)}">
        <span class="team-drawer-count-v3">Profile ${number}</span>
        <span class="team-drawer-word-v3">DISTRICT</span>
      </div>
      <div class="team-drawer-body-v3">
        <div class="team-drawer-heading-v3">
          <span class="eyebrow">${isFounder ? 'Founder of Wrap District' : 'Meet the team'}</span>
          <h2>${esc(person.name)}</h2>
        </div>
        <div class="team-drawer-about-v3">
          <span>About</span>
          <p>${esc(person.bio || 'A short introduction will be added soon.')}</p>
        </div>
        <div class="team-drawer-connect-v3">
          <span>Find them online</span>
          ${socialLinks(person)}
        </div>
      </div>`;

    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    drawer.querySelector('.team-drawer-close-v3')?.focus({preventScroll:true});
  }

  function closeProfile() {
    const drawer = document.querySelector('#teamDrawer');
    const backdrop = document.querySelector('#teamBackdrop');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeProfile();
  });

  render();
  document.addEventListener('wd:data-ready', render);
})();
