// --- i18n ---------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const _ = chrome.i18n.getMessage;

  document.title                       = _('popupTitle');
  document.querySelector('label[for="idInput"]').textContent = _('labelId');
  document.getElementById('applyBtn').textContent            = _('btnOk');
});


document.getElementById('applyBtn').addEventListener('click', function() {
  const idValue = document.getElementById('idInput').value;
  if (!idValue) return; // Si rien n'est saisi, on ne fait rien

  // On récupère l'onglet actif
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const urlObj = new URL(currentTab.url);
    
    // Ajoute/modify les paramètres dans l'URL
    urlObj.searchParams.set("FilterField1", "ID");
    urlObj.searchParams.set("FilterValue1", idValue);
    urlObj.searchParams.set("FilterType1", "Counter");
    
    // On redirige l'onglet vers la nouvelle URL
    chrome.tabs.update(currentTab.id, { url: urlObj.toString() });
    window.close();
  });
});

  document.addEventListener('DOMContentLoaded', function() {
    const idInput = document.getElementById('idInput');
    const applyBtn = document.getElementById('applyBtn');
  
    // Focus sur le champ dès que la popup est chargée
    idInput.focus();
  
    // Ajoute l'action sur le clic du bouton
    applyBtn.addEventListener('click', function() {
      const idValue = idInput.value;
      if (!idValue) return; // On vérifie que l'ID est renseigné
  
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        const urlObj = new URL(currentTab.url);
        urlObj.searchParams.set("FilterField1", "ID");
        urlObj.searchParams.set("FilterValue1", idValue);
        urlObj.searchParams.set("FilterType1", "Counter");
        chrome.tabs.update(currentTab.id, { url: urlObj.toString() });
        window.close();
      });
    });
  
    // Déclenche l'action en appuyant sur "Enter"
    idInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        applyBtn.click();
      }
    });
  });
  
  