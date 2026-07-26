// All UI strings for the app, NL + EN side by side so pairs stay in sync.
// Landing-page marketing copy lives in src/pages/Landing.jsx (self-contained).
// Placeholders use {name} syntax and are filled by t(key, vars).

const strings = {
  // --- Common -----------------------------------------------------------
  'common.loading': { nl: 'Laden…', en: 'Loading…' },
  'common.cancel': { nl: 'Annuleren', en: 'Cancel' },
  'common.delete': { nl: 'Verwijderen', en: 'Delete' },
  'common.confirm': { nl: 'Bevestigen', en: 'Confirm' },
  'common.save': { nl: 'Opslaan', en: 'Save' },
  'common.add': { nl: 'Toevoegen', en: 'Add' },
  'common.close': { nl: 'Sluiten', en: 'Close' },
  'common.download': { nl: 'Download', en: 'Download' },
  'common.open': { nl: 'Openen', en: 'Open' },
  'common.edit': { nl: 'Wijzigen', en: 'Edit' },
  'common.busy': { nl: 'Bezig…', en: 'Working…' },
  'common.view': { nl: 'Bekijken', en: 'View' },
  'common.item': { nl: 'Item', en: 'Item' },
  'common.section': { nl: 'Sectie', en: 'Section' },
  'common.unnamedItem': { nl: 'Naamloos item', en: 'Untitled item' },
  'common.unnamedSection': { nl: 'Naamloze sectie', en: 'Untitled section' },
  'common.status': { nl: 'Status', en: 'Status' },
  'common.color': { nl: 'Kleur', en: 'Colour' },

  // --- Boot / app shell --------------------------------------------------
  'boot.wait': { nl: 'Even geduld…', en: 'One moment…' },
  'boot.connecting': { nl: 'Verbinden met Supabase…', en: 'Connecting to Supabase…' },
  'boot.noConnection': { nl: 'Geen verbinding.', en: 'No connection.' },
  'boot.noProject': {
    nl: 'Geen project gevonden. Voer supabase/schema.sql uit om er één te zaaien.',
    en: 'No project found. Run supabase/schema.sql to seed one.',
  },

  // --- Operation errors --------------------------------------------------
  'op.saveFailed': { nl: 'Opslaan mislukt: {msg}', en: 'Saving failed: {msg}' },
  'op.deleteFailed': { nl: 'Verwijderen mislukt: {msg}', en: 'Deleting failed: {msg}' },
  'op.addSectionFailed': { nl: 'Sectie toevoegen mislukt: {msg}', en: 'Adding section failed: {msg}' },
  'op.addItemFailed': { nl: 'Item toevoegen mislukt: {msg}', en: 'Adding item failed: {msg}' },
  'op.addTaskFailed': { nl: 'Taak toevoegen mislukt: {msg}', en: 'Adding task failed: {msg}' },
  'op.orderFailed': { nl: 'Volgorde opslaan mislukt: {msg}', en: 'Saving order failed: {msg}' },
  'op.uploadFailed': { nl: 'Upload mislukt: {msg}', en: 'Upload failed: {msg}' },
  'op.tagSaveFailed': { nl: 'Tag opslaan mislukt: {msg}', en: 'Saving tag failed: {msg}' },
  'op.linkSaveFailed': { nl: 'Koppeling opslaan mislukt: {msg}', en: 'Saving link failed: {msg}' },
  'op.archiveFailed': { nl: 'Archiveren mislukt: {msg}', en: 'Archiving failed: {msg}' },

  // --- Top navigation ----------------------------------------------------
  'nav.overview': { nl: 'Overzicht', en: 'Overview' },
  'nav.todo': { nl: 'To do', en: 'To do' },
  'nav.comms': { nl: 'Communicatie', en: 'Communication' },
  'nav.docs': { nl: 'Documenten', en: 'Documents' },
  'nav.settings': { nl: 'Instellingen', en: 'Settings' },
  'nav.signout': { nl: 'Afmelden', en: 'Sign out' },
  'nav.brandAria': { nl: 'Renotrack — naar overzicht', en: 'Renotrack, go to overview' },
  'nav.signedInAs': { nl: 'Ingelogd als', en: 'Signed in as' },

  // --- Overview table ----------------------------------------------------
  'ov.tableAria': { nl: 'Budgettabel', en: 'Budget table' },
  'ov.colSectionItem': { nl: 'Sectie / item', en: 'Section / item' },
  'ov.colQuote': { nl: 'Offerte', en: 'Quote' },
  'ov.colInvoice': { nl: 'Factuur', en: 'Invoice' },
  'ov.colDiff': { nl: 'Verschil', en: 'Difference' },
  'ov.colInclude': { nl: 'Meetellen', en: 'Include' },
  'ov.empty': {
    nl: 'Nog geen secties. Voeg er één toe om te beginnen.',
    en: 'No sections yet. Add one to get started.',
  },
  'ov.total': { nl: 'TOTAAL', en: 'TOTAL' },
  'ov.addSection': { nl: '+ Sectie toevoegen', en: '+ Add section' },
  'ov.addItem': { nl: 'Item toevoegen', en: 'Add item' },
  'ov.deleteSectionTitle': { nl: 'Sectie verwijderen', en: 'Delete section' },
  'ov.deleteItemTitle': { nl: 'Item verwijderen', en: 'Delete item' },
  'ov.deleteSectionMsg': {
    nl: '"{name}" en alle items erin worden verwijderd. Dit kan niet ongedaan worden gemaakt.',
    en: '"{name}" and every item in it will be deleted. This cannot be undone.',
  },
  'ov.deleteItemMsg': {
    nl: '"{name}" wordt verwijderd. Dit kan niet ongedaan worden gemaakt.',
    en: '"{name}" will be deleted. This cannot be undone.',
  },
  'ov.dragAria': { nl: 'Versleep om te ordenen', en: 'Drag to reorder' },
  'ov.expandSection': { nl: 'Sectie openklappen', en: 'Expand section' },
  'ov.collapseSection': { nl: 'Sectie inklappen', en: 'Collapse section' },
  'ov.sectionNamePlaceholder': { nl: 'Naam sectie', en: 'Section name' },
  'ov.itemCountOne': { nl: '{n} item', en: '{n} item' },
  'ov.itemCountMany': { nl: '{n} items', en: '{n} items' },
  'ov.includeItemAria': { nl: 'Item {name} meetellen', en: 'Include item {name}' },
  'ov.includeSectionAria': { nl: 'Sectie {name} meetellen', en: 'Include section {name}' },
  'ov.deleteItemAria': { nl: 'Item {name} verwijderen', en: 'Delete item {name}' },
  'ov.deleteSectionAria': { nl: 'Sectie {name} verwijderen', en: 'Delete section {name}' },
  'ov.quoteSectionAria': { nl: 'Offerte sectie', en: 'Section quote' },
  'ov.invoiceSectionAria': { nl: 'Factuur sectie', en: 'Section invoice' },

  // --- Summary cards -----------------------------------------------------
  'cards.aria': { nl: 'Projecttotalen', en: 'Project totals' },
  'cards.budget': { nl: 'Budget', en: 'Budget' },
  'cards.quotes': { nl: 'Offertes', en: 'Quotes' },
  'cards.invoices': { nl: 'Facturen', en: 'Invoices' },
  'cards.onBudget': { nl: 'op budget', en: 'on budget' },
  'cards.underBudget': { nl: '{amount} onder budget', en: '{amount} under budget' },
  'cards.overBudget': { nl: '{amount} over budget', en: '{amount} over budget' },

  // --- Versions ----------------------------------------------------------
  'ver.compareAria': { nl: 'Versies vergelijken', en: 'Compare versions' },
  'ver.compareTitle': {
    nl: 'Versies vergelijken — Offertes vs budget',
    en: 'Compare versions: Quotes vs budget',
  },
  'ver.vsBudget': { nl: 'vs budget', en: 'vs budget' },
  'ver.tabsLabel': { nl: 'Project versies', en: 'Project versions' },
  'ver.fallbackName': { nl: 'Versie', en: 'Version' },
  'ver.deleteTitle': { nl: 'Versie verwijderen', en: 'Delete version' },
  'ver.deleteAria': { nl: 'Versie {name} verwijderen', en: 'Delete version {name}' },
  'ver.deleteConfirm': { nl: 'Versie "{name}" verwijderen?', en: 'Delete version "{name}"?' },
  'ver.addTitle': { nl: 'Nieuwe versie (kopie van de huidige)', en: 'New version (copy of current)' },
  'ver.addAria': { nl: 'Nieuwe versie toevoegen', en: 'Add new version' },

  // --- Tasks -------------------------------------------------------------
  'tasks.pageTitle': { nl: 'Taken', en: 'Tasks' },
  'tasks.pageSub': { nl: 'Beheer en volg jullie taken', en: 'Manage and track your tasks' },
  'tasks.nobody': { nl: 'Niemand', en: 'Nobody' },
  'tasks.linkItem': { nl: 'Koppel item', en: 'Link item' },
  'tasks.noItem': { nl: 'Geen item', en: 'No item' },
  'tasks.showCompleted': { nl: 'Voltooide taken tonen', en: 'Show completed tasks' },
  'tasks.colTask': { nl: 'Taak', en: 'Task' },
  'tasks.colOwner': { nl: 'Eigenaar', en: 'Owner' },
  'tasks.colPriority': { nl: 'Prioriteit', en: 'Priority' },
  'tasks.colDeadline': { nl: 'Deadline', en: 'Deadline' },
  'tasks.empty': { nl: 'Nog geen taken.', en: 'No tasks yet.' },
  'tasks.completedAria': { nl: 'Voltooid', en: 'Completed' },
  'tasks.newTaskPlaceholder': { nl: 'Nieuwe taak', en: 'New task' },
  'tasks.deleteTask': { nl: 'Taak verwijderen', en: 'Delete task' },
  'tasks.addTask': { nl: 'Taak toevoegen', en: 'Add task' },
  'tasks.prioHigh': { nl: 'High', en: 'High' },
  'tasks.prioMedium': { nl: 'Medium', en: 'Medium' },
  'tasks.prioLow': { nl: 'Low', en: 'Low' },

  // --- Settings ----------------------------------------------------------
  'set.title': { nl: 'Instellingen', en: 'Settings' },
  'set.sub': { nl: 'Beheer het projectbudget en tags', en: 'Manage the project budget and tags' },
  'set.budgetTitle': { nl: 'Budget', en: 'Budget' },
  'set.budgetField': { nl: 'Budget (totaal voor het project)', en: 'Budget (total for the project)' },
  'set.budgetHint': {
    nl: 'Verschijnt als de Budget-kaart bovenaan het overzicht. Huidig: {amount}.',
    en: 'Shown as the Budget card at the top of the overview. Current: {amount}.',
  },
  'set.saved': { nl: 'Opgeslagen ✓', en: 'Saved ✓' },
  'set.saveFailed': { nl: 'Opslaan mislukt.', en: 'Saving failed.' },
  'set.tagsTitle': { nl: 'Tags', en: 'Tags' },
  'set.tagsHint': {
    nl: 'Tags om documenten te labelen en te filteren op de Documenten-pagina.',
    en: 'Tags to label documents and filter them on the Documents page.',
  },
  'set.deleteTag': { nl: 'Tag verwijderen', en: 'Delete tag' },
  'set.noTags': { nl: 'Nog geen tags.', en: 'No tags yet.' },
  'set.newTagPlaceholder': { nl: 'Nieuwe tag', en: 'New tag' },

  // --- Documents ---------------------------------------------------------
  'docs.title': { nl: 'Documenten', en: 'Documents' },
  'docs.sub': { nl: 'Alle bestanden, filterbaar op tag', en: 'All files, filterable by tag' },
  'docs.filter': { nl: 'Filter:', en: 'Filter:' },
  'docs.allTags': { nl: 'Alle tags', en: 'All tags' },
  'docs.sort': { nl: 'Sorteer:', en: 'Sort:' },
  'docs.newestFirst': { nl: 'Nieuwste eerst', en: 'Newest first' },
  'docs.nameAZ': { nl: 'Naam (A–Z)', en: 'Name (A–Z)' },
  'docs.showActive': { nl: 'Toon actieve', en: 'Show active' },
  'docs.showArchive': { nl: 'Toon archief', en: 'Show archive' },
  'docs.emptyArchived': { nl: 'Geen gearchiveerde documenten.', en: 'No archived documents.' },
  'docs.empty': { nl: 'Geen documenten.', en: 'No documents.' },
  'docs.aiPending': { nl: 'AI verwerkt…', en: 'AI processing…' },
  'docs.aiError': { nl: 'AI mislukt', en: 'AI failed' },
  'docs.link': { nl: 'Koppel:', en: 'Link:' },
  'docs.noItemOption': { nl: '— Geen item —', en: '— No item —' },
  'docs.removeTag': { nl: 'Tag verwijderen', en: 'Remove tag' },
  'docs.addTag': { nl: 'Tag toevoegen', en: 'Add tag' },
  'docs.makeTagsHint': { nl: 'Maak tags aan onder Instellingen', en: 'Create tags under Settings' },
  'docs.unarchiveTitle': { nl: 'Terug naar actief', en: 'Back to active' },
  'docs.archiveTitle': { nl: 'Archiveer document', en: 'Archive document' },
  'docs.unarchive': { nl: 'De-archiveer', en: 'Unarchive' },
  'docs.archive': { nl: 'Archiveer', en: 'Archive' },
  'docs.dupTitle': { nl: 'Mogelijk duplicaat', en: 'Possible duplicate' },
  'docs.dupPre': { nl: 'Dit lijkt op', en: 'This looks like' },
  'docs.dupPost': {
    nl: 'dat je op {date} uploadde. Toch opladen? Je kan een document later eenvoudig archiveren.',
    en: 'which you uploaded on {date}. Upload anyway? You can easily archive a document later.',
  },
  'docs.dupConfirm': { nl: 'Toch opladen', en: 'Upload anyway' },

  // --- Categories --------------------------------------------------------
  'cat.quote': { nl: 'Offerte', en: 'Quote' },
  'cat.invoice': { nl: 'Factuur', en: 'Invoice' },
  'cat.picture': { nl: 'Foto', en: 'Photo' },
  'cat.plan': { nl: 'Plan', en: 'Plan' },
  'cat.architect': { nl: 'Architect', en: 'Architect' },
  'cat.other': { nl: 'Overig', en: 'Other' },

  // --- Communication -----------------------------------------------------
  'cw.title': { nl: 'Communicatie', en: 'Communication' },
  'cw.sub': {
    nl: 'Wekelijks overzicht van je Verbouwing-mailbox',
    en: 'Weekly overview of your renovation mailbox',
  },
  'cw.empty': { nl: 'Nog geen communicatie samengevat.', en: 'No communication summarized yet.' },
  'cw.unknownSender': { nl: 'Onbekende afzender', en: 'Unknown sender' },
  'cw.actionNeeded': { nl: 'Actie nodig', en: 'Action needed' },
  'cw.noSubject': { nl: '(geen onderwerp)', en: '(no subject)' },
  'cw.showLess': { nl: 'Toon minder', en: 'Show less' },
  'cw.showMore': { nl: '+{n} meer', en: '+{n} more' },
  'cw.openGmail': { nl: 'Open in Gmail →', en: 'Open in Gmail →' },
  'cw.prevWeek': { nl: 'Vorige week', en: 'Previous week' },
  'cw.nextWeek': { nl: 'Volgende week', en: 'Next week' },
  'cw.thisWeek': { nl: 'Deze week', en: 'This week' },
  'cw.weekOf': { nl: 'Week van', en: 'Week of' },
  'cw.messageOne': { nl: '{n} bericht', en: '{n} message' },
  'cw.messageMany': { nl: '{n} berichten', en: '{n} messages' },
  'cw.actionsCount': { nl: '{n}× actie nodig', en: '{n}× action needed' },
  'cw.jumpToWeek': { nl: 'Spring naar week:', en: 'Jump to week:' },

  // --- Item detail -------------------------------------------------------
  'item.backToOverview': { nl: 'Terug naar overzicht', en: 'Back to overview' },
  'item.notFound': { nl: 'Item niet gevonden.', en: 'Item not found.' },
  'item.namePlaceholder': { nl: 'Naam item', en: 'Item name' },
  'item.vsQuote': { nl: '{amount} vs offerte', en: '{amount} vs quote' },
  'item.notes': { nl: 'Notities', en: 'Notes' },
  'item.descriptionPlaceholder': { nl: 'Voeg een beschrijving toe…', en: 'Add a description…' },
  'item.todo': { nl: 'To do', en: 'To do' },
  'item.photos': { nl: "Foto's", en: 'Photos' },

  // --- Login -------------------------------------------------------------
  'login.sub': { nl: 'Meld je aan om verder te gaan', en: 'Sign in to continue' },
  'login.email': { nl: 'E-mail', en: 'Email' },
  'login.password': { nl: 'Wachtwoord', en: 'Password' },
  'login.submit': { nl: 'Aanmelden', en: 'Sign in' },
  'login.errCredentials': { nl: 'E-mail of wachtwoord klopt niet.', en: 'Email or password is incorrect.' },
  'login.errUnconfirmed': { nl: 'Dit account is nog niet bevestigd.', en: 'This account has not been confirmed yet.' },
  'login.errGeneric': { nl: 'Aanmelden mislukt. Probeer het opnieuw.', en: 'Sign-in failed. Please try again.' },

  // --- Files -------------------------------------------------------------
  'file.amount': { nl: 'Bedrag', en: 'Amount' },
  'file.modified': { nl: 'Gewijzigd', en: 'Modified' },
  'file.statusNone': { nl: '— Status —', en: '— Status —' },
  'file.statusAccepted': { nl: 'Accepted', en: 'Accepted' },
  'file.statusDeclined': { nl: 'Declined', en: 'Declined' },
  'file.addFile': { nl: '+ Bestand toevoegen', en: '+ Add file' },
  'file.addPhoto': { nl: '+ Foto toevoegen', en: '+ Add photo' },
  'file.deleteTitle': { nl: 'Bestand verwijderen', en: 'Delete file' },
  'file.deleteMsg': {
    nl: '"{name}" wordt verwijderd. Dit kan niet ongedaan worden gemaakt.',
    en: '"{name}" will be deleted. This cannot be undone.',
  },
  'file.tooBig': {
    nl: '{name} is groter dan 50MB en wordt overgeslagen.',
    en: '{name} is larger than 50MB and will be skipped.',
  },
  'file.dropHere': { nl: 'Sleep & drop bestanden hier', en: 'Drag & drop files here' },
  'file.choose': { nl: 'Bestanden kiezen', en: 'Choose files' },
  'file.dropHint': { nl: 'Ondersteunt PDF, PNG, JPG, MP4 tot 50MB', en: 'Supports PDF, PNG, JPG, MP4 up to 50MB' },
  'file.noPreview': { nl: 'Geen voorbeeld beschikbaar.', en: 'No preview available.' },

  // --- Inspiration / Pinterest ------------------------------------------
  'pin.sectionTitle': { nl: 'Inspiratie', en: 'Inspiration' },
  'pin.boardTitle': { nl: 'Inspiratieboard', en: 'Inspiration board' },
  'pin.boardAnchor': { nl: 'Inspiratieboard op Pinterest', en: 'Inspiration board on Pinterest' },
  'pin.openOnPinterest': { nl: 'Open op Pinterest →', en: 'Open on Pinterest →' },
  'pin.loadFailed': {
    nl: 'Pinterest kon niet geladen worden — gebruik de link hierboven.',
    en: 'Pinterest could not be loaded. Use the link above.',
  },
  'pin.urlAria': { nl: 'Pinterest board-URL', en: 'Pinterest board URL' },
  'pin.linkBtn': { nl: 'Koppelen', en: 'Link' },
  'pin.hint1': { nl: 'Plak de link van een', en: 'Paste the link of a' },
  'pin.hintStrong': { nl: 'publiek', en: 'public' },
  'pin.hint2': {
    nl: 'Pinterest-board. Privé-boards kunnen niet getoond worden.',
    en: 'Pinterest board. Private boards cannot be shown.',
  },
  'pin.invalidSaved': {
    nl: 'De opgeslagen link is geen geldig board: {reason}',
    en: 'The saved link is not a valid board: {reason}',
  },
  'pin.err.empty': { nl: 'Geen URL ingevuld.', en: 'No URL entered.' },
  'pin.err.invalidUrl': { nl: 'Dit lijkt geen geldige URL.', en: 'This does not look like a valid URL.' },
  'pin.err.shortlink': {
    nl: 'pin.it-kortlinks kunnen niet ingebed worden — gebruik de volledige board-URL.',
    en: 'pin.it short links cannot be embedded. Use the full board URL.',
  },
  'pin.err.notPinterest': { nl: 'Geef een pinterest.com board-URL.', en: 'Enter a pinterest.com board URL.' },
  'pin.err.profile': {
    nl: 'Dit lijkt een profiel, geen board. Open het board zelf en kopieer die URL.',
    en: 'This looks like a profile, not a board. Open the board itself and copy that URL.',
  },
  'pin.err.notBoard': {
    nl: 'Dit is geen board-URL. Open het board en kopieer de link.',
    en: 'This is not a board URL. Open the board and copy the link.',
  },
}

export const translations = { nl: {}, en: {} }
for (const [key, val] of Object.entries(strings)) {
  translations.nl[key] = val.nl
  translations.en[key] = val.en
}
