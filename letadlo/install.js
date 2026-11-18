if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.error('Letadlo: registrace offline režimu selhala', error);
  });
}
