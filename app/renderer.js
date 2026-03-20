const tabsEl = document.getElementById('tabs');
const webviewsEl = document.getElementById('webviews');
const address = document.getElementById('address');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');
const newTabBtn = document.getElementById('newTab');
const createBtn = document.getElementById('install');
const accountBtn = document.getElementById('account');
const homeBtn = document.getElementById('home');
const bookmarkBtn = document.getElementById('bookmark');
const showBookmarksBtn = document.getElementById('showBookmarks');
const showHistoryBtn = document.getElementById('showHistory');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const panelClose = document.getElementById('panelClose');
const modeBadge = document.getElementById('modeBadge');
const updateModal = document.getElementById('updateModal');
const updateBtn = document.getElementById('updateBtn');
const updateClose = document.getElementById('updateClose');
const installBtn = document.getElementById('installBtn');
const updateTitle = document.getElementById('updateTitle');
const updateText = document.getElementById('updateText');

const LOGO_URL = 'assets/logo.png';
const UPDATE_URL = 'https://guyka2212.github.io/gbe-browser/';
const gbePreload = new URL('webview-preload.js', window.location.href).toString();
const ACCOUNT_KEY = 'gbe:account';
const SERVER_KEY = 'gbe:serverSearchBase';

const state = {
  tabs: [],
  activeId: null,
  incognito: true,
  account: null
};

function normalizeUrl(input) {
  const value = input.trim();
  if (!value) return 'about:blank';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('file://')) return value;
  if (value.includes('://')) return value;
  if (value.includes(' ')) return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  return `https://${value}`;
}

function loadStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getBookmarks() {
  return loadStore('gbe:bookmarks', []);
}

function setBookmarks(list) {
  saveStore('gbe:bookmarks', list);
}

function getHistory() {
  return loadStore('gbe:history', []);
}

function addHistory(entry) {
  const list = getHistory();
  list.unshift(entry);
  saveStore('gbe:history', list.slice(0, 500));
}

function getAccount() {
  return loadStore(ACCOUNT_KEY, null);
}

function setAccount(account) {
  saveStore(ACCOUNT_KEY, account);
  state.account = account;
  state.incognito = !account;
  updateModeBadge();
}

function updateModeBadge() {
  if (state.incognito) {
    modeBadge.querySelector('span').textContent = 'Incognito';
  } else {
    modeBadge.querySelector('span').textContent = state.account?.name ? `User: ${state.account.name}` : 'User';
  }
}

function createWebview(kind) {
  const view = document.createElement('webview');
  const partition = state.incognito ? 'incognito' : (kind === 'gbe' ? 'persist:gbe' : 'persist:web');
  view.setAttribute('partition', partition);
  if (kind === 'gbe') {
    view.setAttribute('nodeintegration', 'true');
    view.setAttribute('preload', gbePreload);
  }
  return view;
}

function addTab(initialUrl = 'about:blank') {
  const id = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tab = {
    id,
    title: 'New Tab',
    url: initialUrl,
    favicon: LOGO_URL,
    viewEl: document.createElement('div'),
    web: createWebview('web'),
    gbe: createWebview('gbe'),
    activeView: 'web'
  };

  tab.viewEl.className = 'tab-view';
  tab.viewEl.appendChild(tab.web);
  tab.viewEl.appendChild(tab.gbe);
  tab.gbe.style.display = 'none';

  attachWebviewEvents(tab, tab.web);
  attachWebviewEvents(tab, tab.gbe);

  webviewsEl.appendChild(tab.viewEl);
  state.tabs.push(tab);
  renderTabs();
  setActiveTab(id);
  navigate(initialUrl);
}

function attachWebviewEvents(tab, view) {
  view.addEventListener('did-navigate', (event) => onNavigate(tab, event.url));
  view.addEventListener('did-navigate-in-page', (event) => onNavigate(tab, event.url));
  view.addEventListener('page-favicon-updated', (event) => {
    if (event.favicons && event.favicons.length) {
      tab.favicon = event.favicons[0];
      renderTabs();
    }
  });
  view.addEventListener('page-title-updated', (event) => {
    tab.title = event.title || tab.title;
    renderTabs();
  });
}

function onNavigate(tab, url) {
  if (url === 'about:blank' && tab.url && tab.url !== 'about:blank') {
    return;
  }
  tab.url = url;
  if (tab.id === state.activeId) {
    address.value = url;
    updateBookmarkIcon();
  }
  addHistory({ url, title: tab.title || url, time: Date.now() });
}

function setActiveTab(id) {
  state.activeId = id;
  state.tabs.forEach((tab) => {
    tab.viewEl.classList.toggle('active', tab.id === id);
  });
  renderTabs();
  const tab = getActiveTab();
  if (tab) {
    address.value = tab.url || '';
    updateBookmarkIcon();
  }
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeId);
}

function renderTabs() {
  tabsEl.innerHTML = '';
  state.tabs.forEach((tab) => {
    const el = document.createElement('div');
    el.className = `tab ${tab.id === state.activeId ? 'active' : ''}`;

    const logo = document.createElement('img');
    logo.className = 'tab-logo';
    logo.src = tab.favicon || LOGO_URL;
    logo.alt = '';

    const title = document.createElement('span');
    title.textContent = tab.title || 'New Tab';

    const close = document.createElement('button');
    close.textContent = '×';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    el.appendChild(logo);
    el.appendChild(title);
    el.appendChild(close);
    el.addEventListener('click', () => setActiveTab(tab.id));

    tabsEl.appendChild(el);
  });
  tabsEl.appendChild(newTabBtn);
}

function closeTab(id) {
  const index = state.tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return;
  const [tab] = state.tabs.splice(index, 1);
  tab.viewEl.remove();

  if (state.tabs.length === 0) {
    addTab();
    return;
  }

  if (state.activeId === id) {
    const next = state.tabs[Math.max(0, index - 1)];
    setActiveTab(next.id);
  }
  renderTabs();
}

function setActiveView(tab, kind) {
  if (kind === 'gbe') {
    tab.activeView = 'gbe';
    tab.gbe.style.display = 'flex';
    tab.web.style.display = 'none';
  } else {
    tab.activeView = 'web';
    tab.gbe.style.display = 'none';
    tab.web.style.display = 'flex';
  }
}

function navigate(input) {
  const tab = getActiveTab();
  if (!tab) return;
  const url = normalizeUrl(input);
  if (url.startsWith('file://')) {
    setActiveView(tab, 'gbe');
    tab.gbe.src = url;
  } else {
    setActiveView(tab, 'web');
    tab.web.src = url;
  }
  tab.url = url;
  address.value = url;
}

function canGoBack() {
  const tab = getActiveTab();
  if (!tab) return false;
  return tab.activeView === 'gbe' ? tab.gbe.canGoBack() : tab.web.canGoBack();
}

function canGoForward() {
  const tab = getActiveTab();
  if (!tab) return false;
  return tab.activeView === 'gbe' ? tab.gbe.canGoForward() : tab.web.canGoForward();
}

function goBack() {
  const tab = getActiveTab();
  if (!tab) return;
  if (tab.activeView === 'gbe') tab.gbe.goBack();
  else tab.web.goBack();
}

function goForward() {
  const tab = getActiveTab();
  if (!tab) return;
  if (tab.activeView === 'gbe') tab.gbe.goForward();
  else tab.web.goForward();
}

function reload() {
  const tab = getActiveTab();
  if (!tab) return;
  if (tab.activeView === 'gbe') tab.gbe.reload();
  else tab.web.reload();
}

function updateBookmarkIcon() {
  const tab = getActiveTab();
  if (!tab) return;
  const bookmarks = getBookmarks();
  const found = bookmarks.some((b) => b.url === tab.url);
  bookmarkBtn.textContent = found ? '★' : '☆';
}

function toggleBookmark() {
  const tab = getActiveTab();
  if (!tab) return;
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.url === tab.url);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.unshift({ url: tab.url, title: tab.title || tab.url });
  }
  setBookmarks(bookmarks);
  updateBookmarkIcon();
}

function openPanel(type) {
  panel.classList.add('show');
  panelTitle.textContent = type === 'history' ? 'History' : 'Bookmarks';
  panelContent.innerHTML = '';
  const items = type === 'history' ? getHistory() : getBookmarks();
  if (!items.length) {
    panelContent.textContent = 'Nothing here yet.';
    return;
  }
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'panel-item';
    row.innerHTML = `<div>${item.title || item.url}</div><small>${item.url}</small>`;
    row.addEventListener('click', () => {
      panel.classList.remove('show');
      navigate(item.url);
    });
    panelContent.appendChild(row);
  });
}

function resetTabsForModeChange() {
  state.tabs.forEach((tab) => tab.viewEl.remove());
  state.tabs = [];
  state.activeId = null;
  addTab('about:blank');
  showHomePanel();
}

function initAccount() {
  state.account = getAccount();
  state.incognito = !state.account;
  updateModeBadge();
}

function showHomePanel() {
  panel.classList.add('show');
  panelTitle.textContent = 'Home';
  panelContent.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'panel-home';

  const title = document.createElement('h3');
  title.textContent = 'Search the Web';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search…';

  const googleBtn = document.createElement('button');
  googleBtn.textContent = 'Google';

  const gbeBtn = document.createElement('button');
  gbeBtn.textContent = 'Gbe Server';

  const serverLabel = document.createElement('label');
  serverLabel.textContent = 'Gbe server search URL (use {q})';

  const serverInput = document.createElement('input');
  serverInput.type = 'text';
  serverInput.placeholder = 'https://your-server.com/search?q={q}';
  serverInput.value = localStorage.getItem(SERVER_KEY) || '';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';

  const createLink = document.createElement('button');
  createLink.textContent = 'Create a Gbe Site';

  const row = document.createElement('div');
  row.className = 'home-row';
  row.appendChild(input);
  row.appendChild(googleBtn);
  row.appendChild(gbeBtn);

  wrap.appendChild(title);
  wrap.appendChild(row);
  wrap.appendChild(serverLabel);
  wrap.appendChild(serverInput);
  wrap.appendChild(saveBtn);
  wrap.appendChild(createLink);
  panelContent.appendChild(wrap);

  googleBtn.addEventListener('click', () => {
    if (!input.value.trim()) return;
    navigate(`https://www.google.com/search?q=${encodeURIComponent(input.value.trim())}`);
    panel.classList.remove('show');
  });

  gbeBtn.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    const base = serverInput.value.trim();
    if (!base) return;
    const url = base.includes('{q}') ? base.replace('{q}', encodeURIComponent(q)) : `${base}${encodeURIComponent(q)}`;
    navigate(url);
    panel.classList.remove('show');
  });

  saveBtn.addEventListener('click', () => {
    localStorage.setItem(SERVER_KEY, serverInput.value.trim());
  });

  createLink.addEventListener('click', () => {
    showCreatePanel();
  });
}

async function showCreatePanel() {
  panel.classList.add('show');
  panelTitle.textContent = 'Create';
  panelContent.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'panel-create';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Domain name (example: studio)';
  const nameInput = document.createElement('input');

  const pathLabel = document.createElement('label');
  pathLabel.textContent = 'Folder path (contains index.html)';
  const pathRow = document.createElement('div');
  pathRow.className = 'home-row';
  const pathInput = document.createElement('input');
  const browseBtn = document.createElement('button');
  browseBtn.textContent = 'Browse';
  pathRow.appendChild(pathInput);
  pathRow.appendChild(browseBtn);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Create';

  const status = document.createElement('div');
  status.className = 'status';

  const listTitle = document.createElement('h3');
  listTitle.textContent = 'Installed Apps';
  const list = document.createElement('div');
  list.className = 'apps-list';

  wrap.appendChild(nameLabel);
  wrap.appendChild(nameInput);
  wrap.appendChild(pathLabel);
  wrap.appendChild(pathRow);
  wrap.appendChild(saveBtn);
  wrap.appendChild(status);
  wrap.appendChild(listTitle);
  wrap.appendChild(list);
  panelContent.appendChild(wrap);

  browseBtn.addEventListener('click', async () => {
    const folder = await window.gbe.chooseFolder();
    if (folder) pathInput.value = folder;
  });

  saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const folder = pathInput.value.trim();
    if (!name || !folder) {
      status.textContent = 'Please enter a name and folder.';
      return;
    }
    await window.gbe.registerApp({ name, folder });
    status.textContent = `Created ${name}`;
    nameInput.value = '';
    pathInput.value = '';
    renderApps();
  });

  async function renderApps() {
    const apps = await window.gbe.listApps();
    list.innerHTML = '';
    const entries = Object.entries(apps);
    if (!entries.length) {
      list.textContent = 'No apps installed yet.';
      return;
    }
    entries.forEach(([name, folder]) => {
      const row = document.createElement('div');
      row.className = 'app-row';
      row.textContent = `${name} — ${folder}`;

      const openBtn = document.createElement('button');
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', async () => {
        const resolved = await window.gbe.resolvePath(folder);
        if (!resolved) return;
        const target = `${resolved}\\index.html`;
        navigate(`file://${target.replace(/\\/g, '/')}`);
        panel.classList.remove('show');
      });

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        await window.gbe.removeApp(name);
        renderApps();
      });

      row.appendChild(openBtn);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }

  renderApps();
}

function showAccountPanel() {
  panel.classList.add('show');
  panelTitle.textContent = 'Account';
  panelContent.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'panel-account';

  const title = document.createElement('h3');
  title.textContent = 'Choose Your Mode';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Name';
  const nameInput = document.createElement('input');

  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email (optional)';
  const emailInput = document.createElement('input');

  const createAccountBtn = document.createElement('button');
  createAccountBtn.textContent = 'Create Account';

  const incognitoBtn = document.createElement('button');
  incognitoBtn.textContent = 'Continue Incognito';

  const signoutBtn = document.createElement('button');
  signoutBtn.textContent = 'Sign Out';

  wrap.appendChild(title);
  wrap.appendChild(nameLabel);
  wrap.appendChild(nameInput);
  wrap.appendChild(emailLabel);
  wrap.appendChild(emailInput);
  wrap.appendChild(createAccountBtn);
  wrap.appendChild(incognitoBtn);
  wrap.appendChild(signoutBtn);
  panelContent.appendChild(wrap);

  createAccountBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name) return;
    setAccount({ name, email, createdAt: Date.now() });
    resetTabsForModeChange();
  });

  incognitoBtn.addEventListener('click', () => {
    setAccount(null);
    resetTabsForModeChange();
  });

  signoutBtn.addEventListener('click', () => {
    setAccount(null);
    resetTabsForModeChange();
  });
}

function showUpdateModal() {
  updateModal.classList.add('show');
}

address.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') navigate(address.value);
});

backBtn.addEventListener('click', () => {
  if (canGoBack()) goBack();
});

forwardBtn.addEventListener('click', () => {
  if (canGoForward()) goForward();
});

reloadBtn.addEventListener('click', reload);

newTabBtn.addEventListener('click', () => addTab('about:blank'));

createBtn.addEventListener('click', () => showCreatePanel());
accountBtn.addEventListener('click', () => showAccountPanel());
homeBtn.addEventListener('click', () => showHomePanel());

bookmarkBtn.addEventListener('click', toggleBookmark);

showBookmarksBtn.addEventListener('click', () => openPanel('bookmarks'));
showHistoryBtn.addEventListener('click', () => openPanel('history'));

panelClose.addEventListener('click', () => panel.classList.remove('show'));

updateBtn.addEventListener('click', () => {
  window.gbe.openExternal(UPDATE_URL);
});

installBtn.addEventListener('click', () => {
  window.gbe.installUpdate();
});

updateClose.addEventListener('click', () => {
  updateModal.classList.remove('show');
});

window.gbe.onUpdateAvailable(() => {
  updateTitle.textContent = 'Update available';
  updateText.textContent = 'Downloading the latest version...';
  installBtn.style.display = 'none';
  showUpdateModal();
});

window.gbe.onUpdateDownloaded(() => {
  updateTitle.textContent = 'Update ready';
  updateText.textContent = 'Install and restart to finish the update.';
  installBtn.style.display = 'inline-flex';
  showUpdateModal();
});

window.gbe.onUpdateError((msg) => {
  updateTitle.textContent = 'Update error';
  updateText.textContent = msg || 'Could not check for updates.';
  installBtn.style.display = 'none';
  showUpdateModal();
});

initAccount();
addTab('about:blank');
showHomePanel();
