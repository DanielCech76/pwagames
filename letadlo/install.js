if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.error('Letadlo: registrace offline režimu selhala', error);
  });
}

const installButton = document.querySelector('#installApp');
const installHelp = document.querySelector('#installHelp');
const standalone = window.matchMedia('(display-mode: standalone)');
let installPrompt;

function updateInstallButton() {
  installButton.hidden = standalone.matches || navigator.standalone === true;
  if (installButton.hidden) installHelp.hidden = true;
}

updateInstallButton();
standalone.addEventListener('change', updateInstallButton);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});

window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  installButton.hidden = true;
  installHelp.hidden = true;
});

installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    installHelp.hidden = !installHelp.hidden;
    return;
  }

  const prompt = installPrompt;
  installPrompt = undefined;
  installHelp.hidden = true;
  installButton.disabled = true;
  try {
    const {outcome} = await prompt.prompt();
    if (outcome === 'accepted') installButton.hidden = true;
  } catch {
    installHelp.hidden = false;
  } finally {
    installButton.disabled = false;
  }
});
