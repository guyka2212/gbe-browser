const appName = document.getElementById('appName');
const appPath = document.getElementById('appPath');
const browseBtn = document.getElementById('browse');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');
const appsWrap = document.getElementById('apps');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#b30000' : '#0f5132';
}

function sanitizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
}

async function refreshApps() {
  const apps = await window.gbe.listApps();
  appsWrap.innerHTML = '';

  const entries = Object.entries(apps);
  if (!entries.length) {
    appsWrap.textContent = 'No apps installed yet.';
    return;
  }

  entries.forEach(([name, folder]) => {
    const row = document.createElement('div');
    row.className = 'app-row';

    const info = document.createElement('div');
    info.innerHTML = `<code>gbe://${name}</code> — ${folder}`;

    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => {
      window.location.href = `gbe://${name}`;
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await window.gbe.removeApp(name);
      setStatus(`Removed gbe://${name}`);
      refreshApps();
    });

    row.appendChild(info);
    row.appendChild(openBtn);
    row.appendChild(removeBtn);
    appsWrap.appendChild(row);
  });
}

browseBtn.addEventListener('click', async () => {
  const folder = await window.gbe.chooseFolder();
  if (folder) {
    appPath.value = folder;
  }
});

saveBtn.addEventListener('click', async () => {
  const rawName = appName.value.trim();
  const name = sanitizeName(rawName);
  const folder = appPath.value.trim();

  if (!name) {
    setStatus('Please enter a domain name.', true);
    return;
  }

  if (!folder) {
    setStatus('Please choose a folder.', true);
    return;
  }

  await window.gbe.registerApp({ name, folder });
  setStatus(`Created gbe://${name}`);
  appName.value = '';
  appPath.value = '';
  refreshApps();
});

refreshApps();
