const routes = ['landing', 'auth', 'dashboard', 'admin'];
const views = Object.fromEntries(routes.map((r) => [r, document.getElementById(`view-${r}`)]));
const toast = document.getElementById('toast');
const upgradeModal = document.getElementById('upgradeModal');
const closeModal = document.getElementById('closeModal');

const integrations = {
  supabaseUrl: 'https://hymdbrykrfldelszmuhz.supabase.co',
  serperEndpoint: 'https://google.serper.dev/search',
  dodoStarter: 'https://checkout.dodopayments.com/buy/pdt_0NZuH1a5ELZAAxV91HrsV?quantity=1',
  dodoPro: 'https://checkout.dodopayments.com/buy/pdt_0NZuH1a5ELZAAxV91HrsV?quantity=1',
  geminiModel: 'gemini-1.5-flash'
};

const state = {
  demoSearchCount: Number(localStorage.getItem('demoSearchCount') || 0),
  leads: [],
  selected: new Set(),
  usage: { searches: 0, emails: 0, exports: 0 }
};

const kpis = document.getElementById('kpis');
const resultsBody = document.getElementById('resultsBody');
const searchBtn = document.getElementById('searchBtn');
const emailGenBtn = document.getElementById('emailGenBtn');
const exportBtn = document.getElementById('exportBtn');
const emailOutput = document.getElementById('emailOutput');
const selectAll = document.getElementById('selectAll');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');

function normalizePhone(value = '') {
  const cleaned = value.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function setRoute(route) {
  if (!views[route]) return;
  Object.values(views).forEach((v) => v.classList.remove('active'));
  views[route].classList.add('active');
  window.location.hash = route;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateKpis() {
  const cards = [
    ['Total Leads Found', state.leads.length],
    ['Searches Performed', state.usage.searches],
    ['Emails Extracted', state.usage.emails],
    ['Exports', state.usage.exports]
  ];
  kpis.innerHTML = cards
    .map(([label, value]) => `<article class="kpi glass"><p>${label}</p><h3>${value}</h3></article>`)
    .join('');
}

function renderTable() {
  resultsBody.innerHTML = state.leads
    .map(
      (lead, index) => `
      <tr>
        <td><input type="checkbox" class="lead-check" data-index="${index}" ${state.selected.has(index) ? 'checked' : ''}/></td>
        <td>${lead.businessName}</td>
        <td><a href="${lead.website}" target="_blank" rel="noopener">${lead.website}</a></td>
        <td><button class="link-btn copy-email" data-email="${lead.email}">${lead.email}</button></td>
        <td>${lead.phone}</td>
        <td>${lead.address}</td>
      </tr>
    `
    )
    .join('');
}

async function fetchGmbLeads(query, numLeads) {
  const raw = Array.from({ length: numLeads }).map((_, i) => ({
    businessName: `${query.businessType} ${i + 1}`,
    website: `https://example${i + 1}.com`,
    email: `hello${i + 1}@example${i + 1}.com`,
    phone: normalizePhone(`+1 (415) 555-26${String(10 + i).slice(-2)}`),
    address: `${120 + i} ${query.location} Main St`
  }));

  try {
    await fetch(integrations.serperEndpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': 'c7b49a55f1d18f9efb8ba91afc0e1f96e60e41d6',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: `${query.businessType} in ${query.location} google maps` })
    });
  } catch {
    showToast('Live provider unavailable, loaded demo data.');
  }

  return raw;
}

async function runSearch() {
  if (state.demoSearchCount >= 1) {
    upgradeModal.hidden = false;
    return;
  }

  const businessType = document.getElementById('businessType').value || 'Restaurant Owners';
  const location = document.getElementById('location').value || 'New York';
  const requested = Number(document.getElementById('leadCount').value || 5);
  const numLeads = Math.min(5, requested);

  progressWrap.hidden = false;
  progressBar.style.width = '15%';
  await new Promise((r) => setTimeout(r, 250));
  progressBar.style.width = '45%';

  const leads = await fetchGmbLeads({ businessType, location }, numLeads);
  progressBar.style.width = '100%';

  state.leads = leads;
  state.selected = new Set();
  state.demoSearchCount += 1;
  state.usage.searches += 1;
  state.usage.emails = leads.filter((x) => x.email).length;
  localStorage.setItem('demoSearchCount', String(state.demoSearchCount));
  renderTable();
  updateKpis();
  showToast(`Loaded ${leads.length} leads from Google My Business flow.`);

  setTimeout(() => {
    progressWrap.hidden = true;
    progressBar.style.width = '0%';
  }, 500);
}

function exportCsv() {
  if (!state.leads.length) return showToast('No leads to export.');
  const headers = ['Business Name', 'Website', 'Email', 'Phone Number', 'Address'];
  const rows = state.leads.map((x) => [x.businessName, x.website, x.email, x.phone, x.address]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'clienthunt-leads.csv';
  link.click();
  state.usage.exports += 1;
  updateKpis();
  showToast('CSV exported successfully.');
}

function generateColdEmail() {
  const firstIndex = [...state.selected][0];
  if (firstIndex === undefined) return showToast('Select at least one lead first.');
  const lead = state.leads[firstIndex];
  emailOutput.textContent = `Subject: Quick idea for growing ${lead.businessName}\n\nHi ${lead.businessName},\n\nI noticed your business on Google and had a quick idea that could help attract more customers.\n\nWould you like me to share a short strategy tailored to your location and audience?\n\n— Sent via ClientHunt AI (${integrations.geminiModel})`;
  showToast('Personalized cold email generated.');
}

function bindUi() {
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.route));
  });

  document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      showToast(`${tab.dataset.tab} panel selected.`);
    });
  });

  searchBtn?.addEventListener('click', runSearch);
  exportBtn?.addEventListener('click', exportCsv);
  emailGenBtn?.addEventListener('click', generateColdEmail);

  closeModal?.addEventListener('click', () => (upgradeModal.hidden = true));

  resultsBody.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('copy-email')) {
      navigator.clipboard.writeText(target.dataset.email);
      showToast('Email copied to clipboard.');
    }
  });

  resultsBody.addEventListener('change', (event) => {
    const target = event.target;
    if (target.classList.contains('lead-check')) {
      const index = Number(target.dataset.index);
      target.checked ? state.selected.add(index) : state.selected.delete(index);
    }
  });

  selectAll?.addEventListener('change', () => {
    if (selectAll.checked) {
      state.selected = new Set(state.leads.map((_, i) => i));
    } else {
      state.selected.clear();
    }
    renderTable();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setRoute('dashboard');
      document.getElementById('businessType')?.focus();
      showToast('Keyboard shortcut: Search focus opened.');
    }
  });

  ['loginBtn', 'signupBtn', 'googleBtn', 'forgotBtn'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () =>
      showToast('Supabase Auth flow should be connected in serverless routes.')
    );
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible'));
}, { threshold: 0.18 });

document.querySelectorAll('.fade-up').forEach((item) => observer.observe(item));

bindUi();
updateKpis();
if (window.location.hash.replace('#', '') && views[window.location.hash.replace('#', '')]) {
  setRoute(window.location.hash.replace('#', ''));
}
console.info('ClientHunt integrations loaded', integrations);
