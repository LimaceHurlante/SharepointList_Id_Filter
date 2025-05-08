// popup.js
(() => {

  /* ---------- Vérification du chargement de ce fichier JS------------- */
  console.log("popup.js chargé !");

  /* ---------- Helpers Chrome ----------------------------------------- */
  const _ = chrome.i18n.getMessage;

  const getActiveTab = () =>
    new Promise(resolve =>
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]))
    );

  /* ---------- SharePoint utils --------------------------------------- */
  function parseSharePointUrl(tabUrl) {
    const url = new URL(tabUrl);

    // ?List={GUID}
    const guidMatch = url.search.match(/[?&]List=({[^}]+})/i);
    if (guidMatch) {
      return {
        siteUrl: url.origin + url.pathname.split("/_layouts")[0],
        listGuid: guidMatch[1].replace(/[{}]/g, "")
      };
    }

    // /Lists/NomDeLaListe/
    const listMatch = url.pathname.match(/\/Lists\/([^/]+)\//i);
    if (listMatch) {
      const sitePath = url.pathname.split("/Lists/")[0];
      return {
        siteUrl: url.origin + sitePath,
        listTitle: decodeURIComponent(listMatch[1])
      };
    }
    return null;
  }

  async function getListFields({ siteUrl, listTitle, listGuid }) {
    const endpoint = listTitle
      ? `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/fields`
      : `${siteUrl}/_api/web/lists(guid'${listGuid}')/fields`;

    const r = await fetch(endpoint, {
      credentials: "include",                                 // ❶ cookies SPO
      headers: { Accept: "application/json;odata=nometadata" }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();

    // Liste des InternalNames à exclure
    const excluded_InternalName = [
      "Attachments",
      "ContentType",
      "Order",
      "FileLeafRef",
      "MetaInfo"
    ];
    // Liste des Type de collone à inclure
    const allowedColumnTypes = [
      "Boolean",
      "Number",
      "Text",
      "Counter",
      "Note"
    ];

    return json.value
      .filter(f =>
        //!f.Hidden &&                                        // pas masqué
        (!f.ReadOnlyField || f.InternalName === "ID") &&    // éditable ou c'est ID
        !excluded_InternalName.includes(f.InternalName) &&  // n'est pas dans la liste exclue
        allowedColumnTypes.includes(f.TypeAsString) &&    // est pas dans la liste des types autorisé
        true
      )
      .map(f => ({
        Title:          f.Title,
        InternalName:   f.InternalName,
        TypeAsString:   f.TypeAsString
      }));
      
  }



  /* ---------- UI initialisation -------------------------------------- */
  document.addEventListener("DOMContentLoaded", init);

  
  async function init() {


    const _        = chrome.i18n.getMessage;
    // titre de la popup
    document.title = _('popupTitle') || 'Filtrer par ID';
  
    // label du champ
    const labelEl = document.querySelector('label[for="idInput"]');
    if (labelEl) labelEl.textContent = _('labelId') || 'ID :';
  
    // bouton OK
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) applyBtn.textContent = _('btnOk')  || 'OK';
  
    // focus sur le champ
    const idInput = document.getElementById('idInput');
    if (idInput) idInput.focus();

    /* —— actions ------------------------------------------------------ */
    applyBtn.addEventListener("click", onApply);
    idInput.addEventListener("keydown", e => e.key === "Enter" && onApply());






    /* —— au chargement : tente de lister les colonnes ----------------- */
    try {
      const tab = await getActiveTab();
      const info = parseSharePointUrl(tab.url);
      if (!info) return;

      const cols = await getListFields(info);
      console.log("Colonnes SharePoint :", cols);

      // —— Peupler la combo box avec les Title ——
      const fieldSelect = document.getElementById("fieldSelect");
      cols.forEach(col => {
        const opt = document.createElement("option");
        opt.value = col.InternalName;      // la vraie valeur du filtre
        opt.textContent = col.Title;       // ce que voit l’utilisateur
        opt.dataset.type = col.TypeAsString; // on stocke le TypeAsString
        fieldSelect.appendChild(opt);
      });
      // on sélectionne par défaut la colonne ID
      fieldSelect.value = "ID";

      // TODO : tu peux les afficher ou copier dans le presse-papier ici
    } catch (err) {
      console.warn("Impossible de récupérer les colonnes :", err);
    }


    // après avoir ajouté toutes les options à fieldSelect :
    const fieldSelect = document.getElementById('fieldSelect');
    fieldSelect.value = "ID";
    updateInputField(fieldSelect.selectedOptions[0].dataset.type, fieldSelect.value);

    // écouteur pour les changements de sélection :
    fieldSelect.addEventListener('change', (event) => {
      const option = event.target.selectedOptions[0];
      updateInputField(option.dataset.type, option.value);
    });

  }

  /* ---------- Appliquer le filtre ID --------------------------------- */
  async function onApply() {
    const id = document.getElementById("idInput").value.trim();
    if (!id) return;

    const tab = await getActiveTab();
    const url = new URL(tab.url);
    const selectedField = document.getElementById("fieldSelect").value;

    // récupère l’option sélectionnée
    const select = document.getElementById("fieldSelect");
    const option = select.options[select.selectedIndex];

    // internalName et type stockés dans value et data-type
    const internalName = option.value;
    const filterType   = option.dataset.type;

    url.searchParams.set("FilterField1", internalName);
    url.searchParams.set("FilterValue1", id);
    url.searchParams.set("FilterType1", filterType);

    chrome.tabs.update(tab.id, { url: url.toString() });
    window.close();
  }

  function updateInputField(type, internalName) {
    const inputField = document.getElementById('idInput');
    
    if (internalName === "ID") {
      inputField.type = 'number';
      inputField.placeholder = chrome.i18n.getMessage('ph_ID');
    } else {
      switch (type) {
        case 'Number':
        case 'Counter':
          inputField.type = 'number';
          inputField.placeholder = chrome.i18n.getMessage('ph_Number');
          break;
  
        case 'Text':
        case 'Note':
          inputField.type = 'text';
          inputField.placeholder = chrome.i18n.getMessage('ph_Text');
          break;
  
        case 'Boolean':
          inputField.type = 'text';
          inputField.placeholder = chrome.i18n.getMessage('ph_Boolean');
          break;
  
        default:
          inputField.type = 'text';
          inputField.placeholder = chrome.i18n.getMessage('ph_Default');
      }
    }
  
    inputField.value = '';  
    inputField.focus();
  }
  

  /*
  // Écoute le changement de colonne pour ajuster le type du champ d'entrée
  document.getElementById('fieldSelect').addEventListener('change', (event) => {
    const selectedOption = event.target.options[event.target.selectedIndex];
    const inputField = document.getElementById('idInput');

    switch (selectedOption.dataset.type) {
      case 'Number':
        inputField.type = 'number';
        inputField.placeholder = "Entrez la valeur";
        break;
      case 'Counter':
        inputField.type = 'number';
        inputField.placeholder = "Entrez la valeur";
        break;

      case 'Text':
        inputField.type = 'text';
        inputField.placeholder = "Entrez le texte";
        break;

      case 'Note':
        inputField.type = 'text';
        inputField.placeholder = "Entrez le texte";
        break;

      case 'Boolean':
        inputField.type = 'text';
        inputField.placeholder = "true ou false";
        break;

      default:
        inputField.type = 'text';
        inputField.placeholder = "Entrez la valeur";
        break;
    }

  inputField.value = '';  // réinitialise le champ à chaque changement
  inputField.focus();


});
*/
})();
