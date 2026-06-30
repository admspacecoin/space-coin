/* jshint esversion: 11 */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let currentUser    = null;
let currentProfile = null;
let pecas          = [];
let colecoes       = [];
let eventos        = [];
let selectedPecaId = null;
let selectedColId  = null;

// ── NAVEGAÇÃO (preservada do protótipo) ───────────────────────────
const allScreens = ['inicio','catalogo','catalogar','det-moeda','det-cedula','colecoes','det-colecao','eventos','perfil'];
const navHistory = [];
const pageTitles = {
  inicio: 'SPACE COIN', catalogo: 'Catálogo', catalogar: 'Catalogar Peça',
  'det-moeda': 'Detalhe da Peça', 'det-cedula': 'Detalhe da Peça',
  colecoes: 'Coleções', 'det-colecao': 'Coleção', eventos: 'Parceiros e Eventos', perfil: 'Perfil'
};

function navTo(id) {
  const cur = allScreens.find(s => document.getElementById('scr-' + s)?.classList.contains('active'));
  if (cur) navHistory.push(cur);
  switchTo(id);
}

function goBack() {
  const prev = navHistory.pop();
  switchTo(prev || 'inicio');
}

function switchTo(id) {
  allScreens.forEach(s => document.getElementById('scr-' + s)?.classList.remove('active'));
  const el = document.getElementById('scr-' + id);
  if (el) { el.classList.add('active'); el.querySelector('.scroll')?.scrollTo(0, 0); }
  document.getElementById('sb-titulo').textContent = pageTitles[id] || 'SPACE COIN';

  // Sidebar active state (desktop)
  const snavMap = { inicio: 'snav-inicio', catalogo: 'snav-catalogo', eventos: 'snav-eventos', perfil: 'snav-perfil' };
  document.querySelectorAll('.snav-item[id]').forEach(el => el.classList.remove('active'));
  if (snavMap[id]) document.getElementById(snavMap[id])?.classList.add('active');

  // Renderiza a tela ao entrar
  if (id === 'catalogo')  renderCatalog(pecas);
  if (id === 'colecoes')  renderColecoes();
  if (id === 'perfil')    renderProfile();
  if (id === 'eventos')   renderEventos();
}

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  currentUser = session.user;
  sb.auth.onAuthStateChange((_, s) => { if (!s) window.location.href = 'index.html'; });

  await loadAll();
  renderDashboard();
});

async function loadAll() {
  await Promise.all([loadPecas(), loadColecoes(), loadProfile(), loadEventos()]);
}

// ── CARREGAMENTO DE DADOS ─────────────────────────────────────────
async function loadPecas() {
  const { data } = await sb.from('pecas')
    .select('*').eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  pecas = data || [];
}

async function loadColecoes() {
  const { data } = await sb.from('colecoes')
    .select('*').eq('user_id', currentUser.id).order('nome');
  colecoes = data || [];
}

async function loadProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  currentProfile = data;
}

async function loadEventos() {
  const { data } = await sb.from('eventos').select('*').order('data_evento');
  eventos = data || [];
}

// ── DASHBOARD ────────────────────────────────────────────────────
function renderDashboard() {
  const moedas   = pecas.filter(p => p.tipo === 'moeda');
  const cedulas  = pecas.filter(p => p.tipo === 'cedula');
  const totalVal = pecas.reduce((s, p) => s + (p.valor_estimado || 0), 0);
  const paisesM  = new Set(moedas.map(p => p.pais).filter(Boolean)).size;
  const paisesC  = new Set(cedulas.map(p => p.pais).filter(Boolean)).size;
  const name     = currentProfile?.name || currentUser.email.split('@')[0];

  set('dash-username',     name);
  set('dash-moedas-count', moedas.length);
  set('dash-moedas-paises',`${paisesM} ${paisesM === 1 ? 'país' : 'países'}`);
  set('dash-moedas-val',   formatBRL(moedas.reduce((s, p) => s + (p.valor_estimado || 0), 0)));
  set('dash-cedulas-count',cedulas.length);
  set('dash-cedulas-paises',`${paisesC} ${paisesC === 1 ? 'país' : 'países'}`);
  set('dash-cedulas-val',  formatBRL(cedulas.reduce((s, p) => s + (p.valor_estimado || 0), 0)));
  set('dash-total-count',  `${pecas.length} itens no total`);
  set('dash-total-val',    `Valor total estimado · ${formatBRL(totalVal)}`);
  set('dash-colecoes-count',`${colecoes.length} ${colecoes.length === 1 ? 'coleção' : 'coleções'}`);

  // Barra de distribuição
  const total = pecas.length || 1;
  const mPct  = Math.round((moedas.length / total) * 100);
  setStyle('dash-bar-moedas',  'width', `${mPct}%`);
  setStyle('dash-bar-cedulas', 'width', `${100 - mPct}%`);
  set('dash-dist-total',   `${pecas.length} peças`);
  set('dash-dist-moedas',  `${moedas.length} moedas`);
  set('dash-dist-cedulas', `${cedulas.length} cédulas`);

  // Peça mais valiosa
  const best = pecas.reduce((prev, curr) =>
    (curr.valor_estimado || 0) > (prev?.valor_estimado || 0) ? curr : prev, null);
  if (best) {
    set('dash-best-nome', `${best.valor_facial || '?'} ${best.moeda_codigo || ''} · ${best.pais}`);
    set('dash-best-val',  best.valor_estimado ? formatBRL(best.valor_estimado) : '—');
  } else {
    setDisplay('dash-best-card', 'none');
  }

  renderRecentes(pecas.slice(0, 4));
}

function renderRecentes(items) {
  const c = document.getElementById('dash-recentes');
  if (!c) return;
  if (!items.length) {
    c.innerHTML = emptyState('Nenhuma peça catalogada ainda.\nClique em + para começar!');
    return;
  }
  c.innerHTML = items.map(p => pecaListItem(p)).join('');
}

// ── CATÁLOGO ─────────────────────────────────────────────────────
function renderCatalog(items) {
  const c = document.getElementById('catalog-list');
  if (!c) return;

  set('catalog-count', `${items.length} de ${pecas.length} itens`);

  if (!items.length) {
    c.innerHTML = emptyState('Nenhuma peça encontrada.');
    return;
  }

  // Agrupa por coleção
  const groups = {};
  items.forEach(p => {
    const col   = colecoes.find(cc => cc.id === p.colecao_id);
    const key   = col?.id || '__sem_colecao__';
    const label = col?.nome || 'Sem coleção';
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(p);
  });

  c.innerHTML = Object.values(groups).map(g => `
    <div style="margin:10px 14px 0;border-radius:var(--r12);overflow:hidden;border:.5px solid var(--borda);">
      <div class="group-head" onclick="toggleGroup(this)">
        <div class="group-head-l"><i class="ti ti-folder"></i> ${esc(g.label)}</div>
        <div class="group-head-r">${g.items.length} ${g.items.length === 1 ? 'item' : 'itens'} <i class="ti ti-chevron-down" style="font-size:14px;"></i></div>
      </div>
      <div class="group-body">
        ${g.items.map((p, i) => pecaListItem(p, i === g.items.length - 1)).join('')}
      </div>
    </div>
  `).join('') + '<div style="height:16px;"></div>';
}

function pecaListItem(p, last = false) {
  const emoji = p.foto_frente_url
    ? `<img src="${esc(p.foto_frente_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : (p.tipo === 'moeda' ? '🪙' : '💵');
  const badge = p.valor_estimado
    ? `<span class="badge badge-verde">ESTIMADO</span><div class="li-val">${formatBRL(p.valor_estimado)}</div>`
    : `<span class="badge badge-cinza">SEM VALOR</span><div class="li-dash">—</div>`;

  return `
    <div class="list-item" onclick="openDetail('${p.id}')" ${last ? 'style="border-bottom:none;"' : ''}>
      <div class="li-thumb">${emoji}</div>
      <div class="li-body">
        <div class="li-name">${getFlagEmoji(p.pais)} ${esc(p.valor_facial || '?')} ${esc(p.moeda_codigo || '')}</div>
        <div class="li-meta">${p.ano || '?'} · ${esc(p.pais)} · ${esc(p.conservacao || '—')}</div>
        <div style="font-size:10px;color:var(--txt-4);margin-top:2px;">Adicionado em ${formatDate(p.created_at)}</div>
      </div>
      <div class="li-right">${badge}</div>
    </div>`;
}

function searchCatalog(query) {
  if (!query.trim()) return renderCatalog(pecas);
  const q = query.toLowerCase();
  renderCatalog(pecas.filter(p =>
    p.pais?.toLowerCase().includes(q) ||
    p.moeda_codigo?.toLowerCase().includes(q) ||
    String(p.ano || '').includes(q) ||
    String(p.valor_facial || '').includes(q) ||
    p.material?.toLowerCase().includes(q) ||
    p.conservacao?.toLowerCase().includes(q) ||
    p.descricao?.toLowerCase().includes(q)
  ));
}

function filterCatalog(tipo) {
  document.querySelectorAll('.fchip').forEach(c => c.classList.remove('on'));
  event.target.classList.add('on');
  if (tipo === 'todos') return renderCatalog(pecas);
  renderCatalog(pecas.filter(p => p.tipo === tipo));
}

function toggleGroup(header) {
  const body    = header.nextElementSibling;
  const chevron = header.querySelector('[class*="ti-chevron"]');
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? 'block' : 'none';
  if (chevron) { chevron.className = hidden ? 'ti ti-chevron-up' : 'ti ti-chevron-down'; }
}

// ── DETALHE DA PEÇA ───────────────────────────────────────────────
function openDetail(id) {
  selectedPecaId = id;
  const p = pecas.find(pp => pp.id === id);
  if (!p) return;

  if (p.tipo === 'moeda') {
    renderDetMoeda(p);
    navTo('det-moeda');
  } else {
    renderDetCedula(p);
    navTo('det-cedula');
  }
}

function renderDetMoeda(p) {
  setDetPhoto('dm-prev-frente', 'dm-ph-frente', p.foto_frente_url, '🪙');
  setDetPhoto('dm-prev-verso',  'dm-ph-verso',  p.foto_verso_url,  '🪙');
  set('det-moeda-nome',        `${p.valor_facial || '?'} ${p.moeda_codigo || ''}`);
  set('det-moeda-pais',        `${p.pais} · ${p.ano || '?'}`);
  set('det-moeda-flag',        getFlagEmoji(p.pais));
  set('det-moeda-val',         p.valor_estimado ? formatBRL(p.valor_estimado) : '—');
  set('det-moeda-material',    p.material || '—');
  set('det-moeda-conservacao', p.conservacao || '—');
  set('det-moeda-diametro',    p.diametro   ? `${p.diametro} mm`   : '—');
  set('det-moeda-espessura',   p.espessura  ? `${p.espessura} mm`  : '—');
  set('det-moeda-peso',        p.peso       ? `${p.peso} g`        : '—');
  set('det-moeda-formato',     p.formato    || '—');
  set('det-moeda-borda',       p.borda      || '—');
  set('det-moeda-rotacao',     p.rotacao    || '—');
  set('det-moeda-cunhagem',    p.cunhagem   ? p.cunhagem.toLocaleString('pt-BR') : '—');
  set('det-moeda-krause',      p.codigo_krause || '—');
  set('det-moeda-periodo',     formatPeriodo(p.inicio_emissao, p.fim_emissao));
  set('det-moeda-descricao',   p.descricao  || '—');
}

function renderDetCedula(p) {
  setDetPhoto('dc-prev-frente', 'dc-ph-frente', p.foto_frente_url, '💵');
  setDetPhoto('dc-prev-verso',  'dc-ph-verso',  p.foto_verso_url,  '🏦');
  set('det-cedula-nome',        `${p.valor_facial || '?'} ${p.moeda_codigo || ''}`);
  set('det-cedula-pais',        `${p.pais} · ${p.ano || '?'}`);
  set('det-cedula-flag',        getFlagEmoji(p.pais));
  set('det-cedula-val',         p.valor_estimado ? formatBRL(p.valor_estimado) : '—');
  set('det-cedula-material',    p.material || '—');
  set('det-cedula-conservacao', p.conservacao || '—');
  set('det-cedula-krause',      p.codigo_krause || '—');
  set('det-cedula-tamanho',     p.largura && p.altura ? `${p.largura} × ${p.altura} mm` : '—');
  set('det-cedula-serie',       p.numero_serie || '—');
  set('det-cedula-assinatura',  p.serie_assinatura || '—');
  set('det-cedula-placa',       p.placa || '—');
  set('det-cedula-impressor',   p.impressor || '—');
  set('det-cedula-periodo',     formatPeriodo(p.inicio_emissao, p.fim_emissao));
  set('det-cedula-seguranca',   p.recursos_seguranca || '—');
  set('det-cedula-descricao',   p.descricao || '—');
}

function setDetPhoto(imgId, phId, url, defaultEmoji) {
  const img = document.getElementById(imgId);
  const ph  = document.getElementById(phId);
  if (!img || !ph) return;
  if (url) {
    img.src = url; img.style.display = 'block';
    ph.style.display = 'none';
  } else {
    img.src = ''; img.style.display = 'none';
    ph.textContent = defaultEmoji; ph.style.display = 'block';
  }
}

// ── FORMULÁRIO CATALOGAR ──────────────────────────────────────────
function setTipo(tipo) {
  const isCed = tipo === 'cedula';
  document.getElementById('tab-moeda').className  = 'type-btn' + (isCed ? '' : ' on');
  document.getElementById('tab-cedula').className = 'type-btn' + (isCed ? ' on' : '');
  document.getElementById('specs-moeda').style.display  = isCed ? 'none' : 'block';
  document.getElementById('specs-cedula').style.display = isCed ? 'block' : 'none';
  document.getElementById('form-scroll').scrollTop = 0;
}

function openCatalogar() {
  // Limpa o formulário
  document.getElementById('form-catalogar').reset?.();
  document.getElementById('prev-frente').src = ''; document.getElementById('prev-frente').style.display = 'none';
  document.getElementById('prev-verso').src  = ''; document.getElementById('prev-verso').style.display  = 'none';
  document.getElementById('lbl-frente').style.display = '';
  document.getElementById('lbl-verso').style.display  = '';
  setTipo('moeda');
  populateColecaoSelect();
  navTo('catalogar');
}

async function salvarPeca() {
  const tipo = document.getElementById('tab-moeda').classList.contains('on') ? 'moeda' : 'cedula';
  const pais = document.getElementById('campo-pais').value.trim();

  if (!pais) { showToast('País é obrigatório!'); return; }

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader"></i> Salvando...';

  const data = {
    user_id:      currentUser.id,
    tipo,
    pais,
    ano:          valInt('campo-ano'),
    valor_facial: valNum('campo-valor-facial'),
    moeda_codigo: valStr('campo-moeda'),
    material:     valStr('campo-material'),
    conservacao:  valStr('campo-conservacao'),
    variacao:     valStr('campo-variacao'),
    colecao_id:   valStr('campo-colecao') || null,
  };

  if (tipo === 'moeda') {
    Object.assign(data, {
      diametro:       valNum('campo-diametro'),
      peso:           valNum('campo-peso'),
      espessura:      valNum('campo-espessura'),
      formato:        valStr('campo-formato'),
      borda:          valStr('campo-borda'),
      rotacao:        valStr('campo-rotacao'),
      cunhagem:       valInt('campo-cunhagem'),
      codigo_krause:  valStr('campo-krause'),
      inicio_emissao: valInt('campo-inicio-emissao'),
      fim_emissao:    valInt('campo-fim-emissao'),
      descricao:      valStr('campo-descricao'),
    });
  } else {
    Object.assign(data, {
      largura:            valNum('campo-largura'),
      altura:             valNum('campo-altura'),
      codigo_krause:      valStr('campo-krause-ced'),
      inicio_emissao:     valInt('campo-inicio-emissao-ced'),
      fim_emissao:        valInt('campo-fim-emissao-ced'),
      numero_serie:       valStr('campo-serie'),
      serie_assinatura:   valStr('campo-assinatura'),
      placa:              valStr('campo-placa'),
      impressor:          valStr('campo-impressor'),
      recursos_seguranca: valStr('campo-seguranca'),
      descricao:          valStr('campo-descricao-ced'),
    });
  }

  // Remove colecao_id vazio para não violar FK
  if (!data.colecao_id) delete data.colecao_id;

  // Upload de fotos
  const frenteFile = document.getElementById('foto-frente')?.files?.[0];
  const versoFile  = document.getElementById('foto-verso')?.files?.[0];
  if (frenteFile) { const url = await uploadFoto(frenteFile, 'frente'); if (url) data.foto_frente_url = url; }
  if (versoFile)  { const url = await uploadFoto(versoFile,  'verso');  if (url) data.foto_verso_url  = url; }

  const { error } = await sb.from('pecas').insert(data);

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Salvar peça';

  if (error) { showToast('Erro ao salvar: ' + error.message); return; }

  showToast('Peça salva com sucesso!');
  await loadAll();
  renderDashboard();
  setTimeout(() => navTo('catalogo'), 900);
}

async function uploadFoto(file, side) {
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${currentUser.id}/${Date.now()}_${side}.${ext}`;

  const { error } = await sb.storage.from('pecas-fotos').upload(path, file, { upsert: true });
  if (error) return null;

  const { data } = sb.storage.from('pecas-fotos').getPublicUrl(path);
  return data.publicUrl;
}

// ── DELETE PEÇA ───────────────────────────────────────────────────
async function deletarPeca() {
  if (!selectedPecaId) return;
  if (!confirm('Excluir esta peça? Esta ação é irreversível.')) return;

  const { error } = await sb.from('pecas').delete()
    .eq('id', selectedPecaId).eq('user_id', currentUser.id);

  if (error) { showToast('Erro ao excluir: ' + error.message); return; }

  showToast('Peça excluída!');
  await loadAll();
  renderDashboard();
  goBack();
}

// ── COLEÇÕES ─────────────────────────────────────────────────────
function renderColecoes() {
  const c = document.getElementById('colecoes-list');
  if (!c) return;
  set('colecoes-header-count', `${colecoes.length} ${colecoes.length === 1 ? 'coleção' : 'coleções'} · ${pecas.length} itens`);

  if (!colecoes.length) {
    c.innerHTML = emptyState('Nenhuma coleção criada ainda.\nClique em "+ Nova coleção" para começar!');
    return;
  }

  c.innerHTML = colecoes.map(col => {
    const items    = pecas.filter(p => p.colecao_id === col.id);
    const totalVal = items.reduce((s, p) => s + (p.valor_estimado || 0), 0);
    const comVal   = items.filter(p => p.valor_estimado).length;
    const pct      = items.length ? Math.round((comVal / items.length) * 100) : 0;

    return `
      <div class="coll-card" onclick="openCollection('${col.id}')">
        <div class="coll-card-head">
          <i class="ti ti-folder"></i>
          <span class="cc-nome">${esc(col.nome)}</span>
          <span class="cc-count">${items.length} ${items.length === 1 ? 'item' : 'itens'}</span>
        </div>
        <div style="font-size:11px;color:var(--txt-4);">Valor estimado: ${formatBRL(totalVal)}</div>
        <div class="coll-progbar">
          <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%;"></div></div>
          <span class="coll-pct">${pct}%</span>
        </div>
      </div>`;
  }).join('');
}

function openCollection(id) {
  selectedColId = id;
  const col   = colecoes.find(c => c.id === id);
  const items = pecas.filter(p => p.colecao_id === id);
  if (!col) return;

  const totalVal = items.reduce((s, p) => s + (p.valor_estimado || 0), 0);
  const paises   = new Set(items.map(p => p.pais).filter(Boolean)).size;
  const comVal   = items.filter(p => p.valor_estimado).length;
  const pct      = items.length ? Math.round((comVal / items.length) * 100) : 0;

  set('det-col-titulo',      col.nome);
  set('det-col-count',       `${items.length} itens · Valor total estimado`);
  set('det-col-val',         formatBRL(totalVal));
  set('det-col-itens-count', items.length);
  set('det-col-paises',      paises);
  set('det-col-pct',         `${pct}%`);
  document.getElementById('det-col-titulo-head').textContent = col.nome;

  const c = document.getElementById('det-col-itens');
  if (c) c.innerHTML = items.length
    ? items.map((p, i) => pecaListItem(p, i === items.length - 1)).join('')
    : emptyState('Nenhuma peça nesta coleção.');

  navTo('det-colecao');
}

async function criarColecao() {
  const nome     = document.getElementById('nova-colecao-nome')?.value?.trim();
  const descricao = document.getElementById('nova-colecao-desc')?.value?.trim();

  if (!nome) { showToast('Nome da coleção é obrigatório!'); return; }

  const { error } = await sb.from('colecoes').insert({
    user_id: currentUser.id, nome, descricao: descricao || null
  });

  if (error) { showToast('Erro: ' + error.message); return; }

  closeModal('modal-nova-colecao');
  showToast('Coleção criada!');
  await loadColecoes();
  renderColecoes();
  populateColecaoSelect();
}

function populateColecaoSelect() {
  const sel = document.getElementById('campo-colecao');
  if (!sel) return;
  sel.innerHTML = '<option value="">Sem coleção</option>' +
    colecoes.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
}

// ── EVENTOS ───────────────────────────────────────────────────────
function renderEventos() {
  const c = document.getElementById('eventos-list');
  if (!c) return;

  if (!eventos.length) { c.innerHTML = emptyState('Nenhum evento disponível.'); return; }

  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  c.innerHTML = eventos.map((ev, i) => {
    const d = new Date(ev.data_evento + 'T12:00:00');
    return `
      <div class="evento-row" ${i === eventos.length - 1 ? 'style="border-bottom:none;"' : ''}>
        <div class="ev-date">
          <div class="ev-mes">${meses[d.getMonth()]}</div>
          <div class="ev-dia">${d.getDate().toString().padStart(2,'0')}</div>
          <div class="ev-ano">${d.getFullYear()}</div>
        </div>
        <div class="ev-body">
          <div class="ev-nome">${esc(ev.nome)}</div>
          <div class="ev-desc">${esc(ev.descricao || '')}</div>
          <div class="ev-loc"><i class="ti ti-map-pin"></i> ${esc(ev.local || '')} — ${esc(ev.cidade || '')} / ${esc(ev.estado || '')}</div>
        </div>
      </div>`;
  }).join('');
}

// ── PERFIL ────────────────────────────────────────────────────────
function renderProfile() {
  const name = currentProfile?.name || currentUser.email.split('@')[0];
  set('perfil-nome',  name);
  set('perfil-email', currentUser.email);

  const inputNome = document.getElementById('perfil-input-nome');
  if (inputNome) inputNome.value = name;

  const inputBio = document.getElementById('perfil-input-bio');
  if (inputBio) { inputBio.value = currentProfile?.bio || ''; contarBio(); }

  set('perfil-stat-pecas',    pecas.length);
  set('perfil-stat-valor',    formatBRL(pecas.reduce((s, p) => s + (p.valor_estimado || 0), 0)));
  set('perfil-stat-paises',   new Set(pecas.map(p => p.pais).filter(Boolean)).size);
  set('perfil-stat-colecoes', colecoes.length);

  if (currentProfile?.avatar_url) {
    const img  = document.getElementById('avatar-img');
    const icon = document.getElementById('avatar-icon');
    if (img)  { img.src = currentProfile.avatar_url; img.style.display = 'block'; }
    if (icon) icon.style.display = 'none';
  }
}

function contarBio() {
  const bio = document.getElementById('perfil-input-bio');
  const cnt = document.getElementById('bio-count');
  if (bio && cnt) cnt.textContent = `${bio.value.length}/200`;
}

async function salvarPerfil() {
  const nome = document.getElementById('perfil-input-nome')?.value?.trim();
  const bio  = document.getElementById('perfil-input-bio')?.value?.trim();

  if (!nome) { showToast('Nome é obrigatório!'); return; }

  const { error } = await sb.from('profiles').upsert({ id: currentUser.id, name: nome, bio: bio || null });
  if (error) { showToast('Erro ao salvar: ' + error.message); return; }

  currentProfile = { ...currentProfile, name: nome, bio };
  showToast('Perfil salvo!');
}

async function uploadAvatar(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${currentUser.id}/avatar.${ext}`;

  const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) { showToast('Erro no upload: ' + error.message); return; }

  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  await sb.from('profiles').upsert({ id: currentUser.id, avatar_url: data.publicUrl });

  currentProfile = { ...currentProfile, avatar_url: data.publicUrl };

  const img  = document.getElementById('avatar-img');
  const icon = document.getElementById('avatar-icon');
  if (img)  { img.src = data.publicUrl; img.style.display = 'block'; }
  if (icon) icon.style.display = 'none';

  showToast('Foto atualizada!');
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

async function confirmarExclusaoConta() {
  if (!confirm('Excluir sua conta? Todos os dados serão apagados. Esta ação é irreversível.')) return;
  await sb.from('pecas').delete().eq('user_id', currentUser.id);
  await sb.from('colecoes').delete().eq('user_id', currentUser.id);
  await sb.from('profiles').delete().eq('id', currentUser.id);
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ── ESTIMATIVA IA (simulação) ─────────────────────────────────────
function simularIA() {
  showToast('Analisando imagem com IA...');
  setTimeout(() => showToast('Recurso de IA será integrado em breve!'), 1800);
}

// ── FOTOS NO FORMULÁRIO ───────────────────────────────────────────
function triggerUpload(id) { document.getElementById(id)?.click(); }

function previewFoto(input, imgId, lblId) {
  if (!input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById(imgId);
    img.src = e.target.result; img.style.display = 'block';
    document.getElementById(lblId).style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

function previewDet(input, imgId, phId) {
  if (!input.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById(imgId);
    img.src = e.target.result; img.style.display = 'block';
    document.getElementById(phId).style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

// ── DARK MODE ────────────────────────────────────────────────────
let darkMode = localStorage.getItem('darkMode') === '1';
(function applyDark() { if (darkMode) enableDark(); })();

function toggleDark() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode ? '1' : '0');
  darkMode ? enableDark() : disableDark();
}

function enableDark() {
  const r = document.documentElement;
  r.style.setProperty('--bg-page',  '#1a1a2a');
  r.style.setProperty('--bg-card',  '#252535');
  r.style.setProperty('--bg-input', '#1a1a2a');
  r.style.setProperty('--txt-1',    '#f0f0f0');
  r.style.setProperty('--txt-2',    '#aaaaaa');
  r.style.setProperty('--txt-3',    '#777777');
  r.style.setProperty('--borda',    'rgba(255,255,255,0.08)');
  r.style.setProperty('--borda2',   'rgba(255,255,255,0.14)');
}

function disableDark() {
  const r = document.documentElement;
  r.style.setProperty('--bg-page',  '#f2f3f5');
  r.style.setProperty('--bg-card',  '#ffffff');
  r.style.setProperty('--bg-input', '#f2f3f5');
  r.style.setProperty('--txt-1',    '#111111');
  r.style.setProperty('--txt-2',    '#666666');
  r.style.setProperty('--txt-3',    '#999999');
  r.style.setProperty('--borda',    'rgba(0,0,0,0.09)');
  r.style.setProperty('--borda2',   'rgba(0,0,0,0.14)');
}

// ── MODAIS ────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeModalOutside(e, id) { if (e.target.id === id) closeModal(id); }

// ── TOAST ────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ── HELPERS ──────────────────────────────────────────────────────
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setStyle(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}
function setDisplay(id, val) {
  const el = document.getElementById(id);
  if (el) el.style.display = val;
}
function valStr(id) { return document.getElementById(id)?.value?.trim() || null; }
function valNum(id) { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? null : v; }
function valInt(id) { const v = parseInt(document.getElementById(id)?.value);   return isNaN(v) ? null : v; }
function esc(s)     { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}
function formatPeriodo(ini, fim) {
  if (!ini) return '—';
  return fim && fim !== ini ? `${ini}–${fim}` : String(ini);
}

const FLAGS = {
  'Brasil':'🇧🇷','México':'🇲🇽','China':'🇨🇳','EUA':'🇺🇸','Estados Unidos':'🇺🇸',
  'Argentina':'🇦🇷','Portugal':'🇵🇹','Alemanha':'🇩🇪','França':'🇫🇷','Itália':'🇮🇹',
  'Japão':'🇯🇵','Espanha':'🇪🇸','Reino Unido':'🇬🇧','Rússia':'🇷🇺','Canadá':'🇨🇦',
  'Austrália':'🇦🇺','Índia':'🇮🇳','México':'🇲🇽','Cuba':'🇨🇺','Chile':'🇨🇱',
};
function getFlagEmoji(pais) { return FLAGS[pais] || '🌍'; }

function emptyState(msg) {
  return `<div style="padding:30px 20px;text-align:center;color:var(--txt-4);font-size:13px;line-height:1.6;">${msg.replace(/\n/g,'<br>')}</div>`;
}
