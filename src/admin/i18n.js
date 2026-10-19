// Admin panel texts: Italian (it) and European Portuguese (pt).

const it = {
  lang: 'it', html: 'it', other: 'pt', langName: 'Italiano',
  months: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  days: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  appName: 'Gestione sito', appTitle: 'Gestione sito Sal Rei',
  nav: { home: 'Inizio', news: 'Notizie', matches: 'Partite', partners: 'Partner', account: 'Account', myAccount: 'Il mio account' },
  logout: 'Esci', panelLang: 'Lingua del pannello',
  flash: {
    saved: 'Modifiche salvate.',
    published: 'Pubblicato: ora è visibile sul sito.',
    unpublished: 'Ritirato dal sito: ora è una bozza.',
    deleted: 'Eliminato.',
    created: 'Creato.',
    results: 'Risultati salvati. La classifica è già aggiornata sul sito.',
    password: 'Password cambiata.',
    'need-both': 'Per pubblicare servono titolo e testo in tutte e due le lingue. Usa “Traduci” per completare l’altra lingua.',
    'bad-login': 'Email o password non corretti.',
    locked: 'Troppi tentativi. Riprova tra un quarto d’ora.',
    invalid: 'Controlla i campi evidenziati.',
  },
  notFound: 'Pagina non trovata', backHome: 'Torna all’inizio',

  login: {
    title: 'Accesso', h1: 'Accedi', email: 'Email', password: 'Password', submit: 'Entra',
  },
  setup: {
    title: 'Primo accesso', h1: 'Crea il primo account',
    intro: 'Serve la chiave di attivazione impostata su Cloudflare (SETUP_KEY). Questo account potrà poi creare gli altri.',
    key: 'Chiave di attivazione', name: 'Il tuo nome', email: 'Email', password: 'Password', min: '(almeno 10 caratteri)', submit: 'Crea account',
    noKey: 'Prima va impostato il segreto SETUP_KEY sul Worker in Cloudflare.',
    badKey: 'Chiave di attivazione non corretta.', missing: 'Compila tutti i campi (password di almeno 10 caratteri).',
  },

  dash: {
    hello: 'Ciao', intro: 'Da qui aggiorni notizie, risultati e partner del sito. Le modifiche sono online appena salvi o pubblichi.',
    openSite: 'Apri il sito ↗',
    missing1: 'partita giocata senza risultato', missingN: 'partite giocate senza risultato',
    drafts1: 'notizia in bozza', draftsN: 'notizie in bozza', published: 'notizie pubblicate',
    next: 'Prossima partita del Sal Rei', round: 'Giornata', noTime: 'ora da definire', editMatch: 'Modifica data, ora o campo', noNext: 'Nessuna partita in programma.',
    todo: 'Cosa vuoi fare?', write: 'Scrivi una notizia', results: 'Inserisci i risultati', partners: 'Gestisci i partner',
  },

  news: {
    title: 'Notizie', intro: 'Le bozze sono visibili solo qui. Pubblica quando titolo e testo sono pronti in tutte e due le lingue.',
    add: '+ Nuova notizia', untitled: 'Senza titolo', newTitle: 'Nuova notizia', missing: 'manca',
    published: 'Pubblicata', draft: 'Bozza', all: '← Tutte le notizie', viewLive: 'vedi sul sito',
    date: 'Data', category: 'Categoria', gfx: 'Grafica senza foto', gfxHint: '(numero o parola corta)', gfxPh: 'es. 2004',
    photo: 'Foto', noPhoto: 'Nessuna foto: verrà mostrata la grafica', upload: 'Carica foto…', removePhoto: 'Togli foto',
    photoHint: 'JPG o PNG. La foto viene ridimensionata automaticamente.', framing: 'Inquadratura',
    positions: { 'center 30%': 'Alto', 'center 50%': 'Centro', 'center 70%': 'Basso' },
    langs: { pt: 'Portoghese', en: 'Inglese' },
    translateFrom: { pt: 'Traduci dal portoghese', en: 'Traduci dall’inglese' },
    headline: 'Titolo', body: 'Testo', bodyHint: '— il primo paragrafo è l’introduzione in evidenza',
    tools: { p: 'Paragrafo', h2: 'Sottotitolo', bold: 'Grassetto', boldKey: 'G', italic: 'Corsivo', italicKey: 'C', list: '• Elenco', link: 'Link', toolbar: 'Formattazione' },
    placeholder: 'Scrivi qui il testo della notizia…',
    excerpt: 'Riassunto', excerptHint: '(facoltativo — se vuoto si usa l’inizio del testo)',
    pull: 'Frase in evidenza', pullHint: '(facoltativa, a lato del testo)',
    facts: 'Dati in breve', factsHint: '(facoltativi, es. “Stagione” → “2026/27”)', factKey: 'Voce', factValue: 'Valore',
    gfxCap: 'Didascalia della grafica', gfxCapHint: '(se non c’è la foto)',
    save: 'Salva bozza', preview: 'Anteprima', publish: 'Pubblica', update: 'Salva e aggiorna il sito', unpublish: 'Ritira dal sito', delete: 'Elimina',
    confirmDelete: 'Eliminare definitivamente questa notizia?',
    categories: { club: 'Club', 'first-team': 'Prima squadra', academy: 'Accademia', history: 'Storia', regional: 'Calcio regionale', 'cape-verde': 'Capo Verde' },
    previewBar: { pt: 'Anteprima in portoghese', en: 'Anteprima in inglese' }, notPublished: 'non ancora pubblicata',
    seeIn: { pt: 'vedi in portoghese', en: 'vedi in inglese' }, backToEditor: 'torna all’editor',
  },

  matches: {
    title: 'Partite e risultati', intro: 'Scrivi i gol e premi “Salva risultati”: la classifica sul sito si aggiorna da sola. Le partite del Sal Rei sono evidenziate.',
    missing1: 'C’è 1 partita già giocata senza risultato in questa competizione.', missingN: (n) => `Ci sono ${n} partite già giocate senza risultato in questa competizione.`,
    round: 'Giornata', none: 'Nessuna partita in questa competizione.', save: 'Salva risultati', saveHint: 'Lascia vuoti i gol delle partite non ancora giocate.',
    edit: 'Modifica', postponed: 'Rinviata', date: 'Data', time: 'Ora', venue: 'Campo', venuePh: 'es. Estádio Arsénio Ramos', status: 'Stato', normal: 'Normale', remove: 'Elimina partita',
    goals: 'Gol', table: 'Classifica attuale', tableCols: ['#', 'Squadra', 'G', 'DR', 'Pt'],
    ties: 'Spareggio manuale (sorteggio o spareggio)', tiesHint: 'Serve solo se due squadre restano pari dopo tutti i criteri. Numero più basso = posizione più alta. Lascia vuoto per non usarlo.',
    tieLabel: 'Ordine manuale', saveTies: 'Salva ordine',
    add: 'Aggiungi una partita', home: 'In casa', away: 'In trasferta', roundOpt: 'Giornata', timeOpt: 'Ora', optional: '(facoltativa)', addTo: 'Aggiungi a',
  },

  partners: {
    title: 'Partner', intro: 'I partner attivi con “Mostra nella fascia” compaiono in fondo a tutte le pagine, in quest’ordine.',
    add: '+ Nuovo partner', inStrip: 'nella fascia partner', active: 'Attivo', hidden: 'Nascosto', all: '← Tutti i partner', newTitle: 'Nuovo partner',
    tiers: { main: 'Partner principale', technical: 'Partner tecnico', official: 'Partner ufficiale' },
    slotsTitle: 'Dove compaiono i partner', slotsIntro: 'Scegli quale partner citare in ogni punto del sito. “Nessuno” toglie quella scritta.', none: 'Nessuno', saveSlots: 'Salva posizioni',
    slots: {
      main_band: ['Partner principale', 'grande banda nera in home'],
      matchday: ['Partner del giorno partita', 'fascia rossa dei risultati in home'],
      academy: ['Partner dell’accademia', 'sezione Accademia in home'],
      newsroom: ['Partner delle notizie', 'pagine Notizie e articoli'],
      match_centre: ['Partner del calendario', 'pagina Stagione'],
      standings: ['Partner della classifica', 'pagina Stagione'],
      squad: ['Presenta la rosa', 'pagina Prima squadra'],
      kit: ['Sponsor tecnico (maglie)', 'pagina Prima squadra'],
    },
    name: 'Nome', tier: 'Tipo', url: 'Sito web', urlHint: '(facoltativo)', sort: 'Ordine', sortHint: '(1 = primo)', logo: 'Logo', noLogo: 'Nessun logo',
    uploadLogo: 'Carica logo…', logoHint: 'Meglio PNG o SVG bianco su sfondo trasparente: i loghi stanno su fondo scuro.',
    showStrip: 'Mostra nella fascia partner in fondo alle pagine', activeLabel: 'Attivo (togli la spunta per nasconderlo ovunque)',
    save: 'Salva', delete: 'Elimina', confirmDelete: 'Eliminare questo partner?',
    whereTitle: 'Dove compare questo partner',
    whereIntro: 'Spunta gli spazi del sito in cui deve comparire. Ogni spazio ospita un solo partner: se è già occupato, verrà sostituito da questo.',
    now: 'ora:', free: 'libero', willReplace: 'verrà sostituito',
    pages: { home: 'Home', news: 'Notizie', season: 'Stagione', team: 'Prima squadra' },
  },

  account: {
    title: 'Account', mine: 'Il mio account',
    password: 'Cambia password', current: 'Password attuale', next: 'Nuova password', min: '(almeno 10 caratteri)', change: 'Cambia password',
    people: 'Persone che possono usare il pannello', owner: 'gestisce gli account', remove: 'Togli accesso', confirmRemove: (n) => `Togliere l’accesso a ${n}?`,
    addTitle: 'Aggiungi una persona', name: 'Nome', email: 'Email', initial: 'Password iniziale', initialHint: '(almeno 10 caratteri — comunicala a voce, poi potrà cambiarla)', add: 'Aggiungi',
    lang: 'Lingua del pannello',
  },
};

const pt = {
  lang: 'pt', html: 'pt-PT', other: 'it', langName: 'Português',
  months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  days: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  appName: 'Gestão do site', appTitle: 'Gestão do site Sal Rei',
  nav: { home: 'Início', news: 'Notícias', matches: 'Jogos', partners: 'Parceiros', account: 'Contas', myAccount: 'A minha conta' },
  logout: 'Sair', panelLang: 'Língua do painel',
  flash: {
    saved: 'Alterações guardadas.',
    published: 'Publicado: já está visível no site.',
    unpublished: 'Retirado do site: agora é um rascunho.',
    deleted: 'Eliminado.',
    created: 'Criado.',
    results: 'Resultados guardados. A classificação já está atualizada no site.',
    password: 'Palavra-passe alterada.',
    'need-both': 'Para publicar, o título e o texto têm de estar nas duas línguas. Use “Traduzir” para completar a outra língua.',
    'bad-login': 'Email ou palavra-passe incorretos.',
    locked: 'Demasiadas tentativas. Tente novamente daqui a um quarto de hora.',
    invalid: 'Verifique os campos assinalados.',
  },
  notFound: 'Página não encontrada', backHome: 'Voltar ao início',

  login: {
    title: 'Entrar', h1: 'Entrar', email: 'Email', password: 'Palavra-passe', submit: 'Entrar',
  },
  setup: {
    title: 'Primeiro acesso', h1: 'Criar a primeira conta',
    intro: 'É precisa a chave de ativação definida no Cloudflare (SETUP_KEY). Esta conta poderá depois criar as outras.',
    key: 'Chave de ativação', name: 'O seu nome', email: 'Email', password: 'Palavra-passe', min: '(pelo menos 10 caracteres)', submit: 'Criar conta',
    noKey: 'Primeiro é preciso definir o segredo SETUP_KEY no Worker do Cloudflare.',
    badKey: 'Chave de ativação incorreta.', missing: 'Preencha todos os campos (palavra-passe com pelo menos 10 caracteres).',
  },

  dash: {
    hello: 'Olá', intro: 'Aqui atualiza as notícias, os resultados e os parceiros do site. As alterações ficam online assim que guarda ou publica.',
    openSite: 'Abrir o site ↗',
    missing1: 'jogo já disputado sem resultado', missingN: 'jogos já disputados sem resultado',
    drafts1: 'notícia em rascunho', draftsN: 'notícias em rascunho', published: 'notícias publicadas',
    next: 'Próximo jogo do Sal Rei', round: 'Jornada', noTime: 'hora a definir', editMatch: 'Alterar data, hora ou campo', noNext: 'Não há jogos marcados.',
    todo: 'O que quer fazer?', write: 'Escrever uma notícia', results: 'Inserir resultados', partners: 'Gerir os parceiros',
  },

  news: {
    title: 'Notícias', intro: 'Os rascunhos só são visíveis aqui. Publique quando o título e o texto estiverem prontos nas duas línguas.',
    add: '+ Nova notícia', untitled: 'Sem título', newTitle: 'Nova notícia', missing: 'falta',
    published: 'Publicada', draft: 'Rascunho', all: '← Todas as notícias', viewLive: 'ver no site',
    date: 'Data', category: 'Categoria', gfx: 'Gráfico sem foto', gfxHint: '(número ou palavra curta)', gfxPh: 'ex. 2004',
    photo: 'Fotografia', noPhoto: 'Sem fotografia: será mostrado o gráfico', upload: 'Carregar foto…', removePhoto: 'Retirar foto',
    photoHint: 'JPG ou PNG. A fotografia é redimensionada automaticamente.', framing: 'Enquadramento',
    positions: { 'center 30%': 'Cima', 'center 50%': 'Centro', 'center 70%': 'Baixo' },
    langs: { pt: 'Português', en: 'Inglês' },
    translateFrom: { pt: 'Traduzir do português', en: 'Traduzir do inglês' },
    headline: 'Título', body: 'Texto', bodyHint: '— o primeiro parágrafo é a introdução em destaque',
    tools: { p: 'Parágrafo', h2: 'Subtítulo', bold: 'Negrito', boldKey: 'N', italic: 'Itálico', italicKey: 'I', list: '• Lista', link: 'Ligação', toolbar: 'Formatação' },
    placeholder: 'Escreva aqui o texto da notícia…',
    excerpt: 'Resumo', excerptHint: '(opcional — se ficar vazio, usa-se o início do texto)',
    pull: 'Frase em destaque', pullHint: '(opcional, ao lado do texto)',
    facts: 'Dados em resumo', factsHint: '(opcionais, ex. “Época” → “2026/27”)', factKey: 'Item', factValue: 'Valor',
    gfxCap: 'Legenda do gráfico', gfxCapHint: '(se não houver fotografia)',
    save: 'Guardar rascunho', preview: 'Pré-visualizar', publish: 'Publicar', update: 'Guardar e atualizar o site', unpublish: 'Retirar do site', delete: 'Eliminar',
    confirmDelete: 'Eliminar definitivamente esta notícia?',
    categories: { club: 'Clube', 'first-team': 'Equipa principal', academy: 'Academia', history: 'História', regional: 'Futebol regional', 'cape-verde': 'Cabo Verde' },
    previewBar: { pt: 'Pré-visualização em português', en: 'Pré-visualização em inglês' }, notPublished: 'ainda não publicada',
    seeIn: { pt: 'ver em português', en: 'ver em inglês' }, backToEditor: 'voltar ao editor',
  },

  matches: {
    title: 'Jogos e resultados', intro: 'Escreva os golos e carregue em “Guardar resultados”: a classificação do site atualiza-se sozinha. Os jogos do Sal Rei estão destacados.',
    missing1: 'Há 1 jogo já disputado sem resultado nesta competição.', missingN: (n) => `Há ${n} jogos já disputados sem resultado nesta competição.`,
    round: 'Jornada', none: 'Não há jogos nesta competição.', save: 'Guardar resultados', saveHint: 'Deixe vazios os golos dos jogos que ainda não se disputaram.',
    edit: 'Alterar', postponed: 'Adiado', date: 'Data', time: 'Hora', venue: 'Campo', venuePh: 'ex. Estádio Arsénio Ramos', status: 'Estado', normal: 'Normal', remove: 'Eliminar jogo',
    goals: 'Golos', table: 'Classificação atual', tableCols: ['#', 'Equipa', 'J', 'DG', 'Pts'],
    ties: 'Desempate manual (sorteio ou jogo de desempate)', tiesHint: 'Só é preciso se duas equipas continuarem empatadas depois de todos os critérios. Número mais baixo = posição mais alta. Deixe vazio para não usar.',
    tieLabel: 'Ordem manual', saveTies: 'Guardar ordem',
    add: 'Adicionar um jogo', home: 'Em casa', away: 'Fora', roundOpt: 'Jornada', timeOpt: 'Hora', optional: '(opcional)', addTo: 'Adicionar a',
  },

  partners: {
    title: 'Parceiros', intro: 'Os parceiros ativos com “Mostrar na faixa” aparecem no fundo de todas as páginas, por esta ordem.',
    add: '+ Novo parceiro', inStrip: 'na faixa de parceiros', active: 'Ativo', hidden: 'Oculto', all: '← Todos os parceiros', newTitle: 'Novo parceiro',
    tiers: { main: 'Parceiro principal', technical: 'Parceiro técnico', official: 'Parceiro oficial' },
    slotsTitle: 'Onde aparecem os parceiros', slotsIntro: 'Escolha o parceiro a mencionar em cada sítio do site. “Nenhum” retira essa menção.', none: 'Nenhum', saveSlots: 'Guardar posições',
    slots: {
      main_band: ['Parceiro principal', 'grande faixa preta na página inicial'],
      matchday: ['Parceiro do dia de jogo', 'faixa vermelha dos resultados na página inicial'],
      academy: ['Parceiro da academia', 'secção Academia na página inicial'],
      newsroom: ['Parceiro das notícias', 'páginas de notícias'],
      match_centre: ['Parceiro do calendário', 'página Época'],
      standings: ['Parceiro da classificação', 'página Época'],
      squad: ['Apresenta o plantel', 'página Equipa principal'],
      kit: ['Patrocinador técnico (equipamentos)', 'página Equipa principal'],
    },
    name: 'Nome', tier: 'Tipo', url: 'Site', urlHint: '(opcional)', sort: 'Ordem', sortHint: '(1 = primeiro)', logo: 'Logótipo', noLogo: 'Sem logótipo',
    uploadLogo: 'Carregar logótipo…', logoHint: 'De preferência PNG ou SVG branco com fundo transparente: os logótipos ficam sobre fundo escuro.',
    showStrip: 'Mostrar na faixa de parceiros no fundo das páginas', activeLabel: 'Ativo (tire o visto para o ocultar em todo o site)',
    save: 'Guardar', delete: 'Eliminar', confirmDelete: 'Eliminar este parceiro?',
    whereTitle: 'Onde aparece este parceiro',
    whereIntro: 'Assinale os espaços do site onde deve aparecer. Cada espaço tem um só parceiro: se já estiver ocupado, será substituído por este.',
    now: 'agora:', free: 'livre', willReplace: 'será substituído',
    pages: { home: 'Página inicial', news: 'Notícias', season: 'Época', team: 'Equipa principal' },
  },

  account: {
    title: 'Contas', mine: 'A minha conta',
    password: 'Alterar palavra-passe', current: 'Palavra-passe atual', next: 'Nova palavra-passe', min: '(pelo menos 10 caracteres)', change: 'Alterar palavra-passe',
    people: 'Pessoas que podem usar o painel', owner: 'gere as contas', remove: 'Retirar acesso', confirmRemove: (n) => `Retirar o acesso a ${n}?`,
    addTitle: 'Adicionar uma pessoa', name: 'Nome', email: 'Email', initial: 'Palavra-passe inicial', initialHint: '(pelo menos 10 caracteres — comunique-a pessoalmente; depois pode alterá-la)', add: 'Adicionar',
    lang: 'Língua do painel',
  },
};

export const ADMIN_LANGS = { it, pt };

export function adminT(lang) {
  return ADMIN_LANGS[lang] || it;
}

// Language before login: ?lang=, then the browser's preference.
export function guessLang(request, url) {
  const q = url.searchParams.get('lang');
  if (q && ADMIN_LANGS[q]) return q;
  return /^pt/i.test(request.headers.get('accept-language') || '') ? 'pt' : 'it';
}

export function adminDate(L, iso, withDay = false) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${withDay ? L.days[dow] + ' ' : ''}${d} ${L.months[m - 1]} ${y}`;
}
