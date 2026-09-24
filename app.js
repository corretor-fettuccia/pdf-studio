/* PDF Studio v1.7.0 - client-side PDF viewer/composer/editor + PWA + auto-open */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const uid = (prefix = 'id') => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const normalizeRotation = (deg) => ((deg % 360) + 360) % 360;
  const isQuarterTurn = (deg) => normalizeRotation(deg) % 180 !== 0;
  const A4 = { width: 595.28, height: 841.89 };
  const mmFromPt = (pt) => pt * 25.4 / 72;
  const hasFileTransfer = (dt) => Array.from(dt?.types || []).includes('Files');

  if (!window.pdfjsLib || !window.PDFLib) {
    alert('Não foi possível carregar as bibliotecas locais de PDF. Verifique se o diretório libs acompanha o aplicativo.');
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const { PDFDocument, degrees } = PDFLib;

  const els = {
    documentMeta: $('#documentMeta'),
    documentNameInput: $('#documentNameInput'),
    dirtyDot: $('#dirtyDot'),
    newDocumentBtn: $('#newDocumentBtn'),
    newDocumentMenu: $('#newDocumentMenu'),
    newBlankBtn: $('#newBlankBtn'),
    loadDocumentBtn: $('#loadDocumentBtn'),
    organizeBtn: $('#organizeBtn'),
    propertiesBtn: $('#propertiesBtn'),
    aboutBtn: $('#aboutBtn'),
    printBtn: $('#printBtn'),
    exportBtn: $('#exportBtn'),
    installAppBtn: $('#installAppBtn'),
    installAppLabel: $('#installAppLabel'),

    pageCountBadge: $('#pageCountBadge'),
    dropzone: $('#dropzone'),
    openFileBtn: $('#openFileBtn'),
    insertBeforeBtn: $('#insertBeforeBtn'),
    insertAfterBtn: $('#insertAfterBtn'),
    imagePageMode: $('#imagePageMode'),
    insertHint: $('#insertHint'),
    thumbList: $('#thumbList'),
    thumbScroll: $('#thumbScroll'),
    emptySidebar: $('#emptySidebar'),
    fileInput: $('#fileInput'),
    undoBtn: $('#undoBtn'),
    redoBtn: $('#redoBtn'),
    rotateAllLeftBtn: $('#rotateAllLeftBtn'),
    rotateAllRightBtn: $('#rotateAllRightBtn'),

    selectionBar: $('#selectionBar'),
    selectionCount: $('#selectionCount'),
    clearSelectionBtn: $('#clearSelectionBtn'),

    previewArea: $('.preview-area'),
    previewStage: $('#previewStage'),
    previewPlaceholder: $('#previewPlaceholder'),
    pageCanvasWrap: $('#pageCanvasWrap'),
    previewCanvas: $('#previewCanvas'),
    previewStatus: $('#previewStatus'),
    selectedPageLabel: $('#selectedPageLabel'),
    pageDimensionLabel: $('#pageDimensionLabel'),
    prevPageBtn: $('#prevPageBtn'),
    nextPageBtn: $('#nextPageBtn'),
    pagePositionBtn: $('#pagePositionBtn'),
    currentPageNumber: $('#currentPageNumber'),
    totalPageNumber: $('#totalPageNumber'),
    zoomOutBtn: $('#zoomOutBtn'),
    zoomValueBtn: $('#zoomValueBtn'),
    zoomInBtn: $('#zoomInBtn'),
    fitWidthBtn: $('#fitWidthBtn'),
    fitBtn: $('#fitBtn'),
    fullscreenBtn: $('#fullscreenBtn'),

    editToolbar: $('#editToolbar'),
    selectToolBtn: $('#selectToolBtn'),
    textToolBtn: $('#textToolBtn'),
    editExistingTextBtn: $('#editExistingTextBtn'),
    imageToolBtn: $('#imageToolBtn'),
    objectProperties: $('#objectProperties'),
    textProperties: $('#textProperties'),
    textFontFamily: $('#textFontFamily'),
    textFontSize: $('#textFontSize'),
    textBoldBtn: $('#textBoldBtn'),
    textItalicBtn: $('#textItalicBtn'),
    textAlign: $('#textAlign'),
    textColor: $('#textColor'),
    objectOpacity: $('#objectOpacity'),
    objectRotation: $('#objectRotation'),
    sendBackBtn: $('#sendBackBtn'),
    bringFrontBtn: $('#bringFrontBtn'),
    duplicateObjectBtn: $('#duplicateObjectBtn'),
    deleteObjectBtn: $('#deleteObjectBtn'),
    editHint: $('#editHint'),
    editorLayer: $('#editorLayer'),
    overlayImageInput: $('#overlayImageInput'),

    insertMenu: $('#insertMenu'),
    insertBlankMenuBtn: $('#insertBlankMenuBtn'),
    insertFileMenuBtn: $('#insertFileMenuBtn'),
    pageContextMenu: $('#pageContextMenu'),
    movePagePopover: $('#movePagePopover'),
    movePageCurrent: $('#movePageCurrent'),
    movePageDestination: $('#movePageDestination'),
    movePageCancelBtn: $('#movePageCancelBtn'),
    movePageOkBtn: $('#movePageOkBtn'),

    organizeModal: $('#organizeModal'),
    closeOrganizeBtn: $('#closeOrganizeBtn'),
    organizeGrid: $('#organizeGrid'),
    organizeSelectionCount: $('#organizeSelectionCount'),
    organizeAddBlankBtn: $('#organizeAddBlankBtn'),
    organizeAddFileBtn: $('#organizeAddFileBtn'),
    organizeDuplicateBtn: $('#organizeDuplicateBtn'),
    organizeExtractBtn: $('#organizeExtractBtn'),
    organizeDeleteBtn: $('#organizeDeleteBtn'),

    importSourceModal: $('#importSourceModal'),
    closeImportSourceBtn: $('#closeImportSourceBtn'),
    clipboardImportBtn: $('#clipboardImportBtn'),
    dragImportBtn: $('#dragImportBtn'),
    importSourceStatus: $('#importSourceStatus'),

    propertiesModal: $('#propertiesModal'),
    aboutModal: $('#aboutModal'),
    closeAboutBtn: $('#closeAboutBtn'),
    closePropertiesBtn: $('#closePropertiesBtn'),
    propName: $('#propName'),
    propPages: $('#propPages'),
    propSources: $('#propSources'),
    propSourceSize: $('#propSourceSize'),
    propOrientation: $('#propOrientation'),
    propObjects: $('#propObjects'),
    propDirty: $('#propDirty'),

    exportModal: $('#exportModal'),
    closeExportModalBtn: $('#closeExportModalBtn'),
    cancelExportBtn: $('#cancelExportBtn'),
    confirmExportBtn: $('#confirmExportBtn'),
    compressionSettings: $('#compressionSettings'),
    colorMode: $('#colorMode'),
    dpiRange: $('#dpiRange'),
    dpiValue: $('#dpiValue'),
    jpegQuality: $('#jpegQuality'),
    qualityValue: $('#qualityValue'),
    monoDither: $('#monoDither'),
    exportSummary: $('#exportSummary'),
    exportSourceSize: $('#exportSourceSize'),
    exportEstimatedSize: $('#exportEstimatedSize'),

    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmCancelBtn: $('#confirmCancelBtn'),
    confirmProceedBtn: $('#confirmProceedBtn'),

    toastStack: $('#toastStack'),
    processingOverlay: $('#processingOverlay'),
    processingTitle: $('#processingTitle'),
    processingDetail: $('#processingDetail'),
    progressBar: $('#progressBar'),
  };

  const state = {
    pages: [],
    sources: new Map(),
    overlayAssets: new Map(),
    selectedId: null,
    selectedOverlayId: null,
    editMode: 'select',
    selectedIds: new Set(),
    anchorId: null,
    fileName: 'documento.pdf',
    dirty: false,
    fitMode: 'page', // page | width | manual | actual
    zoom: 1,
    previewScale: 1,
    history: [],
    future: [],
    importContext: { mode: 'replace', index: 0 },
    pendingInsertIndex: 0,
    contextPageId: null,
    movePageId: null,
    previewToken: 0,
    thumbRenderVersion: 0,
    gridRenderVersion: 0,
    draggingId: null,
    busy: false,
    confirmResolve: null,
    estimateToken: 0,
  };

  function snapshot() {
    return {
      pages: state.pages.map(p => ({ ...p, overlays: (p.overlays || []).map(o => ({ ...o })) })),
      selectedId: state.selectedId,
      selectedOverlayId: state.selectedOverlayId,
      selectedIds: [...state.selectedIds],
      anchorId: state.anchorId,
      fileName: state.fileName,
      dirty: state.dirty,
    };
  }

  function restoreSnapshot(snap) {
    state.pages = snap.pages.map(p => ({ ...p, overlays: (p.overlays || []).map(o => ({ ...o })) }));
    state.selectedOverlayId = snap.selectedOverlayId || null;
    state.selectedIds = new Set((snap.selectedIds || []).filter(id => state.pages.some(p => p.id === id)));
    state.selectedId = snap.selectedId && state.pages.some(p => p.id === snap.selectedId)
      ? snap.selectedId
      : state.pages.find(p => state.selectedIds.has(p.id))?.id || state.pages[0]?.id || null;
    if (state.selectedId && !state.selectedIds.size) state.selectedIds.add(state.selectedId);
    state.anchorId = snap.anchorId && state.pages.some(p => p.id === snap.anchorId) ? snap.anchorId : state.selectedId;
    state.fileName = ensurePdfName(snap.fileName || 'documento.pdf');
    state.dirty = Boolean(snap.dirty);
    state.fitMode = 'page';
    state.zoom = 1;
    refreshComposition();
  }

  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 80) state.history.shift();
    state.future = [];
  }

  function markDirty() {
    state.dirty = true;
    updateToolbarState();
  }

  function undo() {
    if (!state.history.length || state.busy) return;
    state.future.push(snapshot());
    restoreSnapshot(state.history.pop());
  }

  function redo() {
    if (!state.future.length || state.busy) return;
    state.history.push(snapshot());
    restoreSnapshot(state.future.pop());
  }

  function getSelectedIndex() {
    return state.pages.findIndex(p => p.id === state.selectedId);
  }

  function getSelectedPage() {
    return state.pages.find(p => p.id === state.selectedId) || null;
  }

  function orderedSelectedIds() {
    return state.pages.filter(p => state.selectedIds.has(p.id)).map(p => p.id);
  }

  function selectedPages() {
    return state.pages.filter(p => state.selectedIds.has(p.id));
  }

  function ensurePdfName(name) {
    const clean = (name || 'documento.pdf').trim().replace(/[\\/:*?"<>|]+/g, '-');
    return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`;
  }

  function fileBaseName(name) {
    return (name || 'documento').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'documento';
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
    return `${n >= 10 || i === 0 ? n.toFixed(i === 0 ? 0 : 1) : n.toFixed(2)} ${units[i]}`;
  }

  function usedSourceIds(pageList = state.pages) {
    return new Set(pageList.filter(p => p.sourceId).map(p => p.sourceId));
  }

  function currentSourceBytes(pageList = state.pages) {
    const ids = usedSourceIds(pageList);
    let total = 0;
    for (const id of ids) total += state.sources.get(id)?.bytes?.byteLength || 0;
    const assetIds = new Set();
    for (const page of pageList) for (const obj of (page.overlays || [])) if (obj.assetId) assetIds.add(obj.assetId);
    for (const id of assetIds) total += state.overlayAssets.get(id)?.bytes?.byteLength || 0;
    return total;
  }

  function updateToolbarState() {
    const hasPages = state.pages.length > 0;
    const idx = getSelectedIndex();
    const canPrev = idx > 0;
    const canNext = idx >= 0 && idx < state.pages.length - 1;

    els.pageCountBadge.textContent = String(state.pages.length);
    els.documentNameInput.value = state.fileName;
    els.documentNameInput.disabled = !hasPages || state.busy;
    els.dirtyDot.classList.toggle('hidden', !state.dirty || !hasPages);

    [els.insertBeforeBtn, els.insertAfterBtn, els.rotateAllLeftBtn, els.rotateAllRightBtn,
      els.exportBtn, els.printBtn, els.organizeBtn, els.propertiesBtn,
      els.zoomOutBtn, els.zoomValueBtn, els.zoomInBtn, els.fitWidthBtn, els.fitBtn,
      els.fullscreenBtn, els.pagePositionBtn, els.selectToolBtn, els.textToolBtn, els.imageToolBtn].forEach(el => { if (el) el.disabled = !hasPages || state.busy; });
    if (els.editExistingTextBtn) els.editExistingTextBtn.disabled = !hasPages || state.busy || getSelectedPage()?.kind !== 'pdf';
    els.prevPageBtn.disabled = !canPrev || state.busy;
    els.nextPageBtn.disabled = !canNext || state.busy;
    els.undoBtn.disabled = !state.history.length || state.busy;
    els.redoBtn.disabled = !state.future.length || state.busy;

    if (!hasPages) {
      els.documentMeta.textContent = 'Nenhum documento aberto';
      els.insertHint.textContent = 'Abra um arquivo para iniciar.';
      els.totalPageNumber.textContent = '0';
      els.currentPageNumber.textContent = '0';
    } else {
      els.documentMeta.textContent = `${state.pages.length} ${state.pages.length === 1 ? 'página' : 'páginas'}${state.dirty ? ' • alterações não exportadas' : ''}`;
      els.insertHint.textContent = idx >= 0
        ? `Página atual: ${idx + 1}. Adicione antes ou depois dela.`
        : 'Selecione uma página para definir o ponto de inserção.';
      els.totalPageNumber.textContent = String(state.pages.length);
      els.currentPageNumber.textContent = String(idx >= 0 ? idx + 1 : 0);
    }
    updateSelectionBar();
  }

  function updateSelectionBar() {
    const count = state.selectedIds.size;
    els.selectionBar.classList.toggle('hidden', count <= 1);
    els.selectionCount.textContent = `${count} ${count === 1 ? 'selecionada' : 'selecionadas'}`;
    els.organizeSelectionCount.textContent = `${count} ${count === 1 ? 'selecionada' : 'selecionadas'}`;
    const disabled = count === 0 || state.busy;
    [els.organizeDuplicateBtn, els.organizeExtractBtn, els.organizeDeleteBtn].forEach(el => { if (el) el.disabled = disabled; });
  }

  function showToast(message, type = 'info', ttl = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), ttl);
  }

  function setBusy(on, title = 'Processando PDF...', detail = 'Preparando páginas', progress = 0) {
    state.busy = on;
    els.processingOverlay.classList.toggle('hidden', !on);
    els.processingTitle.textContent = title;
    els.processingDetail.textContent = detail;
    els.progressBar.style.width = `${clamp(progress, 0, 100)}%`;
    updateToolbarState();
  }

  function setProgress(progress, detail) {
    els.progressBar.style.width = `${clamp(progress, 0, 100)}%`;
    if (detail) els.processingDetail.textContent = detail;
  }

  function closeDocumentMenu() {
    els.newDocumentMenu.classList.add('hidden');
    els.newDocumentBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleDocumentMenu() {
    if (state.busy) return;
    const open = els.newDocumentMenu.classList.contains('hidden');
    els.newDocumentMenu.classList.toggle('hidden', !open);
    els.newDocumentBtn.setAttribute('aria-expanded', String(open));
  }

  function askDiscardChanges(title, text) {
    if (!state.dirty) return Promise.resolve(true);
    els.confirmTitle.textContent = title || 'Alterações não exportadas';
    els.confirmText.textContent = text || 'Existem alterações que ainda não foram exportadas.';
    els.confirmModal.classList.remove('hidden');
    return new Promise(resolve => { state.confirmResolve = resolve; });
  }

  function resolveConfirm(value) {
    els.confirmModal.classList.add('hidden');
    const resolve = state.confirmResolve;
    state.confirmResolve = null;
    if (resolve) resolve(value);
  }

  async function resetSources() {
    for (const source of state.sources.values()) {
      try { if (source.bitmap?.close) source.bitmap.close(); } catch (_) {}
      try { if (source.pdfJs?.destroy) await source.pdfJs.destroy(); } catch (_) {}
    }
    state.sources = new Map();
    for (const asset of state.overlayAssets.values()) {
      try { if (asset.bitmap?.close) asset.bitmap.close(); } catch (_) {}
      try { if (asset.url) URL.revokeObjectURL(asset.url); } catch (_) {}
    }
    state.overlayAssets = new Map();
  }

  async function createBlankDocument() {
    if (state.busy) return;
    const ok = await askDiscardChanges('Criar novo documento?', 'O documento atual possui alterações não exportadas.');
    if (!ok) return;
    await resetSources();
    state.pages = [makeBlankPage()];
    state.selectedId = state.pages[0].id;
    state.selectedIds = new Set([state.selectedId]);
    state.anchorId = state.selectedId;
    state.fileName = 'novo-documento.pdf';
    state.history = [];
    state.future = [];
    state.fitMode = 'page';
    state.zoom = 1;
    state.dirty = true;
    closeDocumentMenu();
    refreshComposition();
    showToast('Novo documento A4 criado.', 'success');
  }

  function makeBlankPage() {
    return {
      id: uid('page'), kind: 'blank', sourceId: null, sourcePageIndex: 0,
      rotation: 0, sourceName: 'Página em branco', widthPt: A4.width, heightPt: A4.height, overlays: [],
    };
  }

  function insertBlankAt(index) {
    if (state.busy) return;
    pushHistory();
    const page = makeBlankPage();
    const at = clamp(index, 0, state.pages.length);
    state.pages.splice(at, 0, page);
    state.selectedId = page.id;
    state.selectedIds = new Set([page.id]);
    state.anchorId = page.id;
    state.fitMode = 'page';
    markDirty();
    refreshComposition();
    showToast('Página A4 em branco adicionada.', 'success');
  }

  async function loadFileAsPages(file) {
    const type = file.type || '';
    const name = file.name || 'arquivo';

    if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdfJs = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      const sourceId = uid('pdf');
      state.sources.set(sourceId, { id: sourceId, kind: 'pdf', name, bytes, pdfJs });
      const pages = [];
      for (let i = 0; i < pdfJs.numPages; i++) {
        const p = await pdfJs.getPage(i + 1);
        const vp = p.getViewport({ scale: 1, rotation: p.rotate || 0 });
        pages.push({
          id: uid('page'), kind: 'pdf', sourceId, sourcePageIndex: i,
          rotation: 0, sourceName: name, baseWidthPt: vp.width, baseHeightPt: vp.height, overlays: [],
        });
      }
      return pages;
    }

    if (type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name)) {
      const supported = /image\/(png|jpeg|jpg|webp)/i.test(type) || /\.(png|jpe?g|webp)$/i.test(name);
      if (!supported) throw new Error(`Formato de imagem não suportado: ${name}`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = type || (name.toLowerCase().endsWith('.png') ? 'image/png' : name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');
      const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
      const sourceId = uid('img');
      state.sources.set(sourceId, { id: sourceId, kind: 'image', name, bytes, mime, bitmap });
      return [{
        id: uid('page'), kind: 'image', sourceId, sourcePageIndex: 0,
        rotation: 0, sourceName: name, imageLayout: els.imagePageMode.value || 'original', overlays: [],
      }];
    }

    throw new Error(`Arquivo não suportado: ${name}`);
  }

  async function importFiles(fileList, context = state.importContext) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length || state.busy) return false;

    const oldSourceIds = new Set(state.sources.keys());
    try {
      setBusy(true, 'Importando arquivos...', 'Lendo conteúdo', 4);
      const newPages = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(5 + (i / files.length) * 55, `Lendo ${files[i].name}`);
        newPages.push(...await loadFileAsPages(files[i]));
      }
      if (!newPages.length) return;

      if (context.mode === 'replace' || state.pages.length === 0) {
        for (const asset of state.overlayAssets.values()) {
          try { if (asset.bitmap?.close) asset.bitmap.close(); } catch (_) {}
          try { if (asset.url) URL.revokeObjectURL(asset.url); } catch (_) {}
        }
        state.overlayAssets = new Map();
        const keepIds = usedSourceIds(newPages);
        for (const id of oldSourceIds) {
          if (!keepIds.has(id)) state.sources.delete(id);
        }
        state.pages = newPages;
        state.fileName = `${fileBaseName(files[0].name)}.pdf`;
        state.history = [];
        state.future = [];
        state.dirty = false;
      } else {
        pushHistory();
        const idx = clamp(context.index ?? state.pages.length, 0, state.pages.length);
        state.pages.splice(idx, 0, ...newPages);
        state.dirty = true;
      }

      state.selectedId = newPages[0].id;
      state.selectedOverlayId = null;
      state.selectedIds = new Set([newPages[0].id]);
      state.anchorId = newPages[0].id;
      state.fitMode = 'page';
      state.zoom = 1;
      setProgress(76, 'Criando miniaturas');
      refreshComposition();
      showToast(`${newPages.length} ${newPages.length === 1 ? 'página adicionada' : 'páginas adicionadas'}.`, 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'Não foi possível importar o arquivo.', 'error', 5000);
      return false;
    } finally {
      setBusy(false);
      els.fileInput.value = '';
    }
  }

  async function requestReplaceFromFile() {
    if (state.busy) return;
    if (!state.dirty) { triggerPicker('replace', 0); return; }
    const ok = await askDiscardChanges('Abrir outro documento?', 'O documento atual possui alterações não exportadas.');
    if (!ok) return;
    triggerPicker('replace', 0);
  }

  function triggerPicker(mode, index) {
    if (state.busy) return;
    state.importContext = { mode, index };
    els.fileInput.value = '';
    els.fileInput.click();
  }

  function closeInsertMenu() {
    els.insertMenu.classList.add('hidden');
  }

  function openInsertMenu(index, x, y) {
    state.pendingInsertIndex = clamp(index, 0, state.pages.length);
    els.insertMenu.classList.remove('hidden');
    positionFloatingMenu(els.insertMenu, x, y);
  }

  function positionFloatingMenu(menu, x, y) {
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      const left = clamp(x, 8, window.innerWidth - rect.width - 8);
      const top = clamp(y, 8, window.innerHeight - rect.height - 8);
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    });
  }

  function insertPoint(index) {
    const wrap = document.createElement('div');
    wrap.className = 'insert-point';
    wrap.dataset.insertIndex = String(index);
    const btn = document.createElement('button');
    btn.className = 'insert-btn';
    btn.type = 'button';
    btn.title = `Adicionar página na posição ${index + 1}`;
    btn.setAttribute('aria-label', 'Adicionar página entre páginas');
    btn.textContent = '+';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const rect = btn.getBoundingClientRect();
      openInsertMenu(index, rect.left + rect.width / 2 + 8, rect.bottom + 5);
    });

    wrap.addEventListener('dragover', (ev) => {
      if (!hasFileTransfer(ev.dataTransfer)) return;
      ev.preventDefault();
      wrap.classList.add('file-drag-target');
      ev.dataTransfer.dropEffect = 'copy';
    });
    wrap.addEventListener('dragleave', () => wrap.classList.remove('file-drag-target'));
    wrap.addEventListener('drop', (ev) => {
      if (!ev.dataTransfer?.files?.length) return;
      ev.preventDefault();
      ev.stopPropagation();
      wrap.classList.remove('file-drag-target');
      importFiles(ev.dataTransfer.files, { mode: state.pages.length ? 'insert' : 'replace', index });
    });
    wrap.appendChild(btn);
    return wrap;
  }

  function setSingleSelection(id) {
    if (!id || !state.pages.some(p => p.id === id)) {
      state.selectedId = null;
      state.selectedIds.clear();
      state.anchorId = null;
      return;
    }
    if (state.selectedId !== id) state.selectedOverlayId = null;
    state.selectedId = id;
    state.selectedIds = new Set([id]);
    state.anchorId = id;
  }

  function selectPage(id, ev = {}) {
    const previousPageId = state.selectedId;
    const idx = state.pages.findIndex(p => p.id === id);
    if (idx < 0) return;
    const ctrl = Boolean(ev.ctrlKey || ev.metaKey);
    const shift = Boolean(ev.shiftKey);

    if (shift && state.anchorId) {
      const anchorIdx = state.pages.findIndex(p => p.id === state.anchorId);
      if (anchorIdx >= 0) {
        if (!ctrl) state.selectedIds.clear();
        const [a, b] = anchorIdx < idx ? [anchorIdx, idx] : [idx, anchorIdx];
        for (let i = a; i <= b; i++) state.selectedIds.add(state.pages[i].id);
        state.selectedId = id;
      } else {
        setSingleSelection(id);
      }
    } else if (ctrl) {
      if (state.selectedIds.has(id)) state.selectedIds.delete(id);
      else state.selectedIds.add(id);
      state.selectedId = state.selectedIds.has(id) ? id : orderedSelectedIds().at(-1) || null;
      state.anchorId = id;
    } else {
      setSingleSelection(id);
    }

    if (state.selectedId !== previousPageId) state.selectedOverlayId = null;
    refreshSelectionVisuals();
    updateToolbarState();
    renderPreview();
  }

  function clearMultiSelection() {
    if (state.selectedId) setSingleSelection(state.selectedId);
    refreshSelectionVisuals();
    updateToolbarState();
  }

  function refreshSelectionVisuals() {
    $$('.thumb-card').forEach(card => {
      const id = card.dataset.pageId;
      card.classList.toggle('multi-selected', state.selectedIds.has(id));
      card.classList.toggle('primary-selected', id === state.selectedId);
      card.classList.toggle('selected', id === state.selectedId);
    });
    $$('.organize-card').forEach(card => {
      card.classList.toggle('selected', state.selectedIds.has(card.dataset.pageId));
    });
    updateSelectionBar();
  }

  function buildThumbnailCard(item, index) {
    const card = document.createElement('article');
    card.className = 'thumb-card';
    card.dataset.pageId = item.id;
    card.draggable = true;

    const mark = document.createElement('span');
    mark.className = 'thumb-selection-mark';
    mark.textContent = '✓';

    const frame = document.createElement('div');
    frame.className = 'thumb-frame';
    const canvas = document.createElement('canvas');
    canvas.width = 70; canvas.height = 95;
    canvas.dataset.thumbFor = item.id;
    frame.appendChild(canvas);

    const info = document.createElement('div');
    info.className = 'thumb-info';
    const number = document.createElement('div');
    number.className = 'thumb-number';
    number.textContent = `Página ${index + 1}`;
    const source = document.createElement('div');
    source.className = 'thumb-source';
    source.title = item.sourceName;
    source.textContent = item.sourceName;
    const dimension = document.createElement('div');
    dimension.className = 'thumb-dimension';
    dimension.dataset.dimensionFor = item.id;

    const tools = document.createElement('div');
    tools.className = 'thumb-tools';
    tools.innerHTML = `
      <button class="thumb-tool" data-action="left" title="Rotacionar 90° à esquerda">↺</button>
      <button class="thumb-tool" data-action="right" title="Rotacionar 90° à direita">↻</button>
      <button class="thumb-tool" data-action="duplicate" title="Duplicar página">⧉</button>
      <button class="thumb-tool" data-action="move" title="Mover página para...">⇅</button>
      <button class="thumb-tool danger" data-action="delete" title="Excluir página">×</button>`;

    info.append(number, source, dimension, tools);
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.title = 'Arraste para reordenar';
    handle.textContent = '⠿';
    card.append(mark, frame, info, handle);

    card.addEventListener('click', (ev) => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      if (action) {
        ev.stopPropagation();
        if (action === 'left') rotateIds([item.id], -90);
        if (action === 'right') rotateIds([item.id], 90);
        if (action === 'duplicate') duplicateIds([item.id]);
        if (action === 'move') openMovePagePopover(item.id, ev.target.closest('[data-action]'));
        if (action === 'delete') deleteIds([item.id]);
        return;
      }
      selectPage(item.id, ev);
    });

    card.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (!state.selectedIds.has(item.id)) setSingleSelection(item.id);
      state.contextPageId = item.id;
      refreshSelectionVisuals();
      updateToolbarState();
      renderPreview();
      openContextMenu(item, ev.clientX, ev.clientY);
    });

    card.addEventListener('dragstart', (ev) => {
      if (!state.selectedIds.has(item.id)) setSingleSelection(item.id);
      state.draggingId = item.id;
      refreshSelectionVisuals();
      card.classList.add('dragging');
      if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', item.id);
      }
    });
    card.addEventListener('dragend', () => {
      state.draggingId = null;
      $$('.thumb-card,.organize-card').forEach(c => c.classList.remove('dragging', 'drag-target'));
    });
    card.addEventListener('dragover', (ev) => {
      if (hasFileTransfer(ev.dataTransfer)) {
        ev.preventDefault();
        card.classList.add('drag-target');
        ev.dataTransfer.dropEffect = 'copy';
        return;
      }
      if (!state.draggingId || state.draggingId === item.id) return;
      ev.preventDefault();
      card.classList.add('drag-target');
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-target'));
    card.addEventListener('drop', (ev) => {
      ev.preventDefault();
      card.classList.remove('drag-target');
      const rect = card.getBoundingClientRect();
      const after = ev.clientY > rect.top + rect.height / 2;
      if (ev.dataTransfer?.files?.length) {
        const targetIndex = state.pages.findIndex(p => p.id === item.id) + (after ? 1 : 0);
        importFiles(ev.dataTransfer.files, { mode: 'insert', index: targetIndex });
        return;
      }
      const draggedId = state.draggingId || ev.dataTransfer?.getData('text/plain');
      if (!draggedId || draggedId === item.id) return;
      reorderPages(draggedId, item.id, after);
    });
    return card;
  }

  function renderThumbList() {
    const version = ++state.thumbRenderVersion;
    els.thumbList.innerHTML = '';
    els.emptySidebar.classList.toggle('hidden', state.pages.length > 0);
    if (!state.pages.length) return;

    state.pages.forEach((item, index) => {
      els.thumbList.appendChild(insertPoint(index));
      els.thumbList.appendChild(buildThumbnailCard(item, index));
    });
    els.thumbList.appendChild(insertPoint(state.pages.length));
    refreshSelectionVisuals();

    requestAnimationFrame(async () => {
      for (const item of state.pages) {
        if (version !== state.thumbRenderVersion) return;
        const canvas = els.thumbList.querySelector(`canvas[data-thumb-for="${CSS.escape(item.id)}"]`);
        const dim = els.thumbList.querySelector(`[data-dimension-for="${CSS.escape(item.id)}"]`);
        if (!canvas) continue;
        try {
          await renderItemToCanvas(item, canvas, { mode: 'thumb' });
          if (dim) {
            const size = await getItemBaseSize(item);
            dim.textContent = `${Math.round(mmFromPt(size.width))} × ${Math.round(mmFromPt(size.height))} mm`;
          }
        } catch (err) {
          console.warn('Falha ao renderizar miniatura', err);
        }
      }
    });
  }

  function refreshComposition() {
    updateToolbarState();
    renderThumbList();
    renderPreview();
    if (!els.organizeModal.classList.contains('hidden')) renderOrganizeGrid();
  }

  function rotatePageItem(item, delta) {
    const step = delta >= 0 ? 90 : -90;
    const count = Math.max(1, Math.round(Math.abs(delta) / 90));
    for (let n = 0; n < count; n++) {
      const size = pageDisplaySizeSync(item);
      for (const obj of overlayList(item)) {
        const x = obj.xPt || 0, y = obj.yPt || 0, w = obj.wPt || 1, h = obj.hPt || 1;
        if (step > 0) {
          obj.xPt = Math.max(0, size.height - (y + h));
          obj.yPt = Math.max(0, x);
        } else {
          obj.xPt = Math.max(0, y);
          obj.yPt = Math.max(0, size.width - (x + w));
        }
        obj.wPt = h;
        obj.hPt = w;
        obj.rotation = (obj.rotation || 0) + step;
      }
      item.rotation = normalizeRotation((item.rotation || 0) + step);
    }
  }

  function rotateIds(ids, delta) {
    const set = new Set(ids);
    const targets = state.pages.filter(p => set.has(p.id));
    if (!targets.length || state.busy) return;
    pushHistory();
    targets.forEach(p => rotatePageItem(p, delta));
    state.selectedId = targets[0].id;
    state.selectedIds = new Set(targets.map(p => p.id));
    state.anchorId = state.selectedId;
    markDirty();
    refreshComposition();
  }

  function rotateAll(delta) {
    if (!state.pages.length || state.busy) return;
    pushHistory();
    state.pages.forEach(p => rotatePageItem(p, delta));
    markDirty();
    refreshComposition();
  }

  function deleteIds(ids) {
    if (state.busy) return;
    const set = new Set(ids);
    const indexes = state.pages.map((p, i) => set.has(p.id) ? i : -1).filter(i => i >= 0);
    if (!indexes.length) return;
    pushHistory();
    const fallbackIndex = Math.min(indexes[0], Math.max(0, state.pages.length - indexes.length - 1));
    state.pages = state.pages.filter(p => !set.has(p.id));
    const fallback = state.pages[fallbackIndex] || state.pages.at(-1) || null;
    state.selectedId = fallback?.id || null;
    state.selectedIds = new Set(fallback ? [fallback.id] : []);
    state.anchorId = state.selectedId;
    markDirty();
    refreshComposition();
  }

  function duplicateIds(ids) {
    if (state.busy) return;
    const ordered = state.pages.filter(p => ids.includes(p.id));
    if (!ordered.length) return;
    pushHistory();
    const maxIndex = Math.max(...ordered.map(p => state.pages.findIndex(x => x.id === p.id)));
    const clones = ordered.map(p => ({ ...p, id: uid('page'), sourceName: p.sourceName, overlays: (p.overlays || []).map(o => ({ ...o, id: uid('obj') })) }));
    state.pages.splice(maxIndex + 1, 0, ...clones);
    state.selectedIds = new Set(clones.map(p => p.id));
    state.selectedId = clones[0].id;
    state.anchorId = clones[0].id;
    markDirty();
    refreshComposition();
    showToast(`${clones.length} ${clones.length === 1 ? 'página duplicada' : 'páginas duplicadas'}.`, 'success');
  }

  function reorderPages(draggedId, targetId, after) {
    if (state.busy) return;
    const movingIds = state.selectedIds.has(draggedId) && state.selectedIds.size > 1 ? orderedSelectedIds() : [draggedId];
    if (movingIds.includes(targetId)) return;
    const movingSet = new Set(movingIds);
    const moving = state.pages.filter(p => movingSet.has(p.id));
    if (!moving.length) return;
    pushHistory();
    const remaining = state.pages.filter(p => !movingSet.has(p.id));
    const targetIndex = remaining.findIndex(p => p.id === targetId);
    const insertAt = clamp(targetIndex + (after ? 1 : 0), 0, remaining.length);
    remaining.splice(insertAt, 0, ...moving);
    state.pages = remaining;
    state.selectedIds = new Set(movingIds);
    state.selectedId = draggedId;
    state.anchorId = movingIds[0];
    markDirty();
    refreshComposition();
  }

  function movePageTo(pageId, destinationOneBased) {
    if (!pageId || state.busy || state.pages.length < 2) return;
    const from = state.pages.findIndex(p => p.id === pageId);
    if (from < 0) return;
    const destination = clamp(Math.trunc(Number(destinationOneBased) || 1), 1, state.pages.length) - 1;
    if (from === destination) { closeMovePagePopover(); return; }
    pushHistory();
    const [moving] = state.pages.splice(from, 1);
    state.pages.splice(destination, 0, moving);
    state.selectedId = moving.id;
    state.selectedIds = new Set([moving.id]);
    state.anchorId = moving.id;
    state.selectedOverlayId = null;
    markDirty();
    closeMovePagePopover();
    refreshComposition();
    requestAnimationFrame(() => els.thumbList.querySelector(`[data-page-id="${CSS.escape(moving.id)}"]`)?.scrollIntoView({ block:'nearest', behavior:'smooth' }));
    showToast(`Página movida para a posição ${destination + 1}.`, 'success');
  }

  function openMovePagePopover(pageId = state.selectedId, anchor = null) {
    if (!pageId || state.busy || !state.pages.some(p => p.id === pageId)) return;
    state.movePageId = pageId;
    const current = state.pages.findIndex(p => p.id === pageId) + 1;
    els.movePageCurrent.value = String(current);
    els.movePageDestination.min = '1';
    els.movePageDestination.max = String(state.pages.length);
    els.movePageDestination.value = String(current);
    els.movePagePopover.classList.remove('hidden');
    let x = window.innerWidth / 2 - 125, y = 90;
    if (anchor?.getBoundingClientRect) {
      const r = anchor.getBoundingClientRect(); x = r.right + 8; y = r.top;
    } else if (anchor && Number.isFinite(anchor.x)) { x = anchor.x; y = anchor.y; }
    positionFloatingMenu(els.movePagePopover, x, y);
    requestAnimationFrame(() => { els.movePageDestination.focus(); els.movePageDestination.select(); });
  }

  function closeMovePagePopover() {
    els.movePagePopover.classList.add('hidden');
    state.movePageId = null;
  }

  function confirmMovePage() {
    if (!state.movePageId) return;
    const dest = clamp(Math.trunc(Number(els.movePageDestination.value) || 1), 1, state.pages.length);
    els.movePageDestination.value = String(dest);
    movePageTo(state.movePageId, dest);
  }

  function imagePageSpec(item) {
    const source = state.sources.get(item.sourceId);
    if (!source?.bitmap) throw new Error('Imagem de origem não encontrada.');
    const imgWPt = source.bitmap.width * 72 / 96;
    const imgHPt = source.bitmap.height * 72 / 96;
    const layout = item.imageLayout || 'original';
    if (layout === 'original') {
      return { pageW: imgWPt, pageH: imgHPt, x: 0, y: 0, drawW: imgWPt, drawH: imgHPt };
    }
    const pageW = A4.width, pageH = A4.height;
    const scale = layout === 'fill-a4' ? Math.max(pageW / imgWPt, pageH / imgHPt) : Math.min(pageW / imgWPt, pageH / imgHPt);
    const drawW = imgWPt * scale, drawH = imgHPt * scale;
    return { pageW, pageH, x: (pageW - drawW) / 2, y: (pageH - drawH) / 2, drawW, drawH };
  }

  async function getItemBaseSize(item) {
    if (item.kind === 'blank') {
      const width = item.widthPt || A4.width, height = item.heightPt || A4.height;
      return isQuarterTurn(item.rotation) ? { width: height, height: width } : { width, height };
    }
    const source = state.sources.get(item.sourceId);
    if (!source) throw new Error('Fonte da página não encontrada.');
    if (item.kind === 'pdf') {
      const page = await source.pdfJs.getPage(item.sourcePageIndex + 1);
      const viewport = page.getViewport({ scale: 1, rotation: normalizeRotation(page.rotate + item.rotation) });
      return { width: viewport.width, height: viewport.height, pdfPage: page };
    }
    const spec = imagePageSpec(item);
    return isQuarterTurn(item.rotation) ? { width: spec.pageH, height: spec.pageW } : { width: spec.pageW, height: spec.pageH };
  }

  function calcPreviewScale(widthPt, heightPt) {
    const availW = Math.max(220, els.previewStage.clientWidth - 84);
    const availH = Math.max(260, els.previewStage.clientHeight - 82);
    if (state.fitMode === 'width') return clamp(availW / widthPt, .12, 5);
    if (state.fitMode === 'actual') return 1;
    if (state.fitMode === 'manual') return clamp(state.zoom, .12, 5);
    return clamp(Math.min(availW / widthPt, availH / heightPt), .12, 5);
  }

  function drawRotatedCanvas(sourceCanvas, targetCanvas, rotation) {
    const r = normalizeRotation(rotation);
    const quarter = isQuarterTurn(r);
    targetCanvas.width = quarter ? sourceCanvas.height : sourceCanvas.width;
    targetCanvas.height = quarter ? sourceCanvas.width : sourceCanvas.height;
    const ctx = targetCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    if (r === 90) { ctx.translate(targetCanvas.width, 0); ctx.rotate(Math.PI / 2); }
    else if (r === 180) { ctx.translate(targetCanvas.width, targetCanvas.height); ctx.rotate(Math.PI); }
    else if (r === 270) { ctx.translate(0, targetCanvas.height); ctx.rotate(-Math.PI / 2); }
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
  }

  function cssFontFamily(name) {
    if (name === 'Times') return 'Times New Roman, Times, serif';
    if (name === 'Courier') return 'Courier New, Courier, monospace';
    return 'Arial, Helvetica, sans-serif';
  }

  function pageDisplaySizeSync(item) {
    let w, h;
    if (item.kind === 'pdf') {
      w = item.baseWidthPt || A4.width; h = item.baseHeightPt || A4.height;
    } else if (item.kind === 'blank') {
      w = item.widthPt || A4.width; h = item.heightPt || A4.height;
    } else {
      const spec = imagePageSpec(item); w = spec.pageW; h = spec.pageH;
    }
    return isQuarterTurn(item.rotation) ? { width: h, height: w } : { width: w, height: h };
  }

  function overlayList(item) {
    if (!Array.isArray(item.overlays)) item.overlays = [];
    return item.overlays;
  }

  function getOverlayById(id, page = getSelectedPage()) {
    if (!id || !page) return null;
    return overlayList(page).find(o => o.id === id) || null;
  }

  function hexToCss(hex) {
    return /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#111111';
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const paragraphs = String(text ?? '').split(/\n/);
    const lines = [];
    for (const paragraph of paragraphs) {
      if (!paragraph) { lines.push(''); continue; }
      const words = paragraph.split(/\s+/);
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
        else line = test;
      }
      lines.push(line);
    }
    return lines;
  }

  function drawOverlayObject(ctx, obj, scale) {
    const x = (obj.xPt || 0) * scale;
    const y = (obj.yPt || 0) * scale;
    const w = Math.max(1, (obj.wPt || 1) * scale);
    const h = Math.max(1, (obj.hPt || 1) * scale);
    const cx = x + w / 2, cy = y + h / 2;
    ctx.save();
    ctx.globalAlpha = clamp(obj.opacity ?? 1, .1, 1);
    ctx.translate(cx, cy);
    ctx.rotate(normalizeRotation(obj.rotation || 0) * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);

    if (obj.kind === 'text' && obj.replacement) {
      const savedAlpha = ctx.globalAlpha;
      ctx.globalAlpha = 1;
      ctx.fillStyle = hexToCss(obj.backgroundColor || '#ffffff');
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = savedAlpha;
    }

    if (obj.kind === 'image') {
      const asset = state.overlayAssets.get(obj.assetId);
      if (asset?.bitmap) ctx.drawImage(asset.bitmap, 0, 0, w, h);
    } else if (obj.kind === 'text') {
      const size = Math.max(6, obj.fontSizePt || 18) * scale;
      const style = `${obj.italic ? 'italic ' : ''}${obj.bold ? 'bold ' : ''}${size}px ${cssFontFamily(obj.fontFamily)}`;
      ctx.font = style;
      ctx.fillStyle = hexToCss(obj.color);
      ctx.textBaseline = 'top';
      ctx.textAlign = obj.align || 'left';
      const pad = 2 * scale;
      const usable = Math.max(1, w - pad * 2);
      const lines = wrapCanvasText(ctx, obj.text || '', usable);
      const lineHeight = size * 1.18;
      const tx = obj.align === 'center' ? w / 2 : obj.align === 'right' ? w - pad : pad;
      let ty = pad;
      for (const line of lines) {
        if (ty + lineHeight > h + 1) break;
        ctx.fillText(line, tx, ty, usable);
        ty += lineHeight;
      }
    }
    ctx.restore();
  }

  function drawOverlaysToCanvas(item, canvas, scale) {
    const objects = [...overlayList(item)].sort((a, b) => (a.z || 0) - (b.z || 0));
    if (!objects.length) return;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    objects.forEach(obj => drawOverlayObject(ctx, obj, scale));
  }

  async function renderItemToCanvas(item, canvas, options = {}) {
    const mode = options.mode || 'preview';
    const source = item.sourceId ? state.sources.get(item.sourceId) : null;

    if (item.kind === 'pdf') {
      if (!source) throw new Error('Fonte da página não encontrada.');
      const page = await source.pdfJs.getPage(item.sourcePageIndex + 1);
      const rotation = normalizeRotation(page.rotate + item.rotation);
      const base = page.getViewport({ scale: 1, rotation });
      let scale;
      if (mode === 'thumb') scale = Math.min(84 / base.width, 116 / base.height);
      else if (mode === 'grid') scale = Math.min(145 / base.width, 178 / base.height);
      else if (mode === 'dpi') scale = (options.dpi || 200) / 72;
      else scale = calcPreviewScale(base.width, base.height);

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: mode === 'dpi' });
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, background: '#ffffff' }).promise;
      if (mode !== 'preview') drawOverlaysToCanvas(item, canvas, scale);
      if (mode === 'preview') state.previewScale = scale;
      return { widthPt: viewport.width / scale, heightPt: viewport.height / scale, scale };
    }

    let baseW, baseH;
    if (item.kind === 'blank') {
      baseW = item.widthPt || A4.width; baseH = item.heightPt || A4.height;
    } else {
      const spec = imagePageSpec(item); baseW = spec.pageW; baseH = spec.pageH;
    }
    const displayW = isQuarterTurn(item.rotation) ? baseH : baseW;
    const displayH = isQuarterTurn(item.rotation) ? baseW : baseH;
    let scale;
    if (mode === 'thumb') scale = Math.min(84 / displayW, 116 / displayH);
    else if (mode === 'grid') scale = Math.min(145 / displayW, 178 / displayH);
    else if (mode === 'dpi') scale = (options.dpi || 200) / 72;
    else scale = calcPreviewScale(displayW, displayH);

    const temp = document.createElement('canvas');
    temp.width = Math.max(1, Math.round(baseW * scale));
    temp.height = Math.max(1, Math.round(baseH * scale));
    const ctx = temp.getContext('2d', { alpha: false, willReadFrequently: mode === 'dpi' });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, temp.width, temp.height);

    if (item.kind === 'image') {
      if (!source?.bitmap) throw new Error('Imagem de origem não encontrada.');
      const spec = imagePageSpec(item);
      ctx.drawImage(source.bitmap, spec.x * scale, spec.y * scale, spec.drawW * scale, spec.drawH * scale);
    }
    drawRotatedCanvas(temp, canvas, item.rotation);
    if (mode !== 'preview') drawOverlaysToCanvas(item, canvas, scale);
    temp.width = 1; temp.height = 1;
    if (mode === 'preview') state.previewScale = scale;
    return { widthPt: displayW, heightPt: displayH, scale };
  }

  function setEditMode(mode) {
    state.editMode = mode === 'text' ? 'text' : mode === 'edit-existing' ? 'edit-existing' : 'select';
    els.selectToolBtn.classList.toggle('active', state.editMode === 'select');
    els.textToolBtn.classList.toggle('active', state.editMode === 'text');
    if (els.editExistingTextBtn) els.editExistingTextBtn.classList.toggle('active', state.editMode === 'edit-existing');
    els.editorLayer.classList.toggle('text-placement-mode', state.editMode === 'text');
    els.editorLayer.classList.toggle('existing-text-mode', state.editMode === 'edit-existing');
    els.editorLayer.classList.toggle('select-mode', state.editMode === 'select');
    if (state.editMode !== 'edit-existing') els.editorLayer.querySelector('.pdf-text-edit-layer')?.remove();
    if (state.editMode === 'text') els.editHint.textContent = 'Clique em qualquer ponto da página para inserir uma caixa de texto.';
    else if (state.editMode === 'edit-existing') els.editHint.textContent = getSelectedPage()?.kind === 'pdf' ? 'Clique sobre um texto existente para torná-lo editável.' : 'A edição de texto existente está disponível em páginas PDF com texto selecionável.';
    else els.editHint.textContent = state.selectedOverlayId ? 'Arraste para mover. Use as alças para redimensionar ou girar.' : 'Selecione Texto, Editar texto ou Imagem para trabalhar na página.';
  }

  function selectedOverlay() {
    return getOverlayById(state.selectedOverlayId);
  }

  function updateObjectInspector() {
    const obj = selectedOverlay();
    const visible = Boolean(obj);
    els.objectProperties.classList.toggle('hidden', !visible);
    if (!obj) {
      els.textProperties.classList.add('hidden');
      if (state.editMode === 'select') els.editHint.textContent = 'Selecione Texto, Editar texto ou Imagem para trabalhar na página.';
      return;
    }
    els.textProperties.classList.toggle('hidden', obj.kind !== 'text');
    els.objectOpacity.value = Math.round((obj.opacity ?? 1) * 100);
    els.objectRotation.value = Math.round(obj.rotation || 0);
    if (obj.kind === 'text') {
      els.textFontFamily.value = obj.fontFamily || 'Helvetica';
      els.textFontSize.value = obj.fontSizePt || 18;
      els.textBoldBtn.classList.toggle('active', Boolean(obj.bold));
      els.textItalicBtn.classList.toggle('active', Boolean(obj.italic));
      els.textAlign.value = obj.align || 'left';
      els.textColor.value = hexToCss(obj.color);
    }
    els.editHint.textContent = obj.kind === 'text'
      ? 'Duplo clique no texto para editar o conteúdo diretamente.'
      : 'Arraste a imagem para mover; use a alça inferior para redimensionar.';
  }

  function styleEditorObject(el, obj, scale) {
    el.style.left = `${(obj.xPt || 0) * scale}px`;
    el.style.top = `${(obj.yPt || 0) * scale}px`;
    el.style.width = `${Math.max(1, (obj.wPt || 1) * scale)}px`;
    el.style.height = `${Math.max(1, (obj.hPt || 1) * scale)}px`;
    el.style.transform = `rotate(${obj.rotation || 0}deg)`;
    el.style.opacity = String(clamp(obj.opacity ?? 1, .1, 1));
    el.style.zIndex = String(20 + (obj.z || 0));
    el.style.background = obj.kind === 'text' && obj.replacement ? hexToCss(obj.backgroundColor || '#ffffff') : 'transparent';
    if (obj.kind === 'text') {
      const content = el.querySelector('.text-content');
      if (content) {
        content.style.fontFamily = cssFontFamily(obj.fontFamily);
        content.style.fontSize = `${Math.max(6, obj.fontSizePt || 18) * scale}px`;
        content.style.fontWeight = obj.bold ? '700' : '400';
        content.style.fontStyle = obj.italic ? 'italic' : 'normal';
        content.style.textAlign = obj.align || 'left';
        content.style.color = hexToCss(obj.color);
        content.style.lineHeight = '1.18';
      }
    }
  }

  function inferEditorFontFamily(fontFamily = '') {
    const f = String(fontFamily).toLowerCase();
    if (f.includes('times') || f.includes('serif')) return 'Times';
    if (f.includes('courier') || f.includes('mono')) return 'Courier';
    return 'Helvetica';
  }

  function sampleCanvasBackgroundColor(left, top, width, height) {
    const canvas = els.previewCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    const x0 = clamp(Math.floor(left), 0, Math.max(0, canvas.width - 1));
    const y0 = clamp(Math.floor(top), 0, Math.max(0, canvas.height - 1));
    const x1 = clamp(Math.ceil(left + width), x0 + 1, canvas.width);
    const y1 = clamp(Math.ceil(top + height), y0 + 1, canvas.height);
    const samples = [];
    const points = [
      [x0, y0], [x1-1, y0], [x0, y1-1], [x1-1, y1-1],
      [Math.floor((x0+x1)/2), y0], [Math.floor((x0+x1)/2), y1-1],
      [x0, Math.floor((y0+y1)/2)], [x1-1, Math.floor((y0+y1)/2)]
    ];
    for (const [x,y] of points) {
      try { const d = ctx.getImageData(x,y,1,1).data; samples.push([d[0],d[1],d[2]]); } catch (_) {}
    }
    if (!samples.length) return '#ffffff';
    const avg = [0,1,2].map(c => Math.round(samples.reduce((sum,p)=>sum+p[c],0)/samples.length));
    return '#' + avg.map(v => v.toString(16).padStart(2,'0')).join('');
  }

  function sourceTextKey(item, textItem, index) {
    const t = Array.from(textItem?.transform || []).map(v => Number(v).toFixed(2)).join(',');
    return `${item.sourceId}:${item.sourcePageIndex}:${index}:${t}:${textItem?.str || ''}`;
  }

  async function renderExistingTextTargets(item, scale) {
    if (state.editMode !== 'edit-existing' || item?.kind !== 'pdf') return;
    const source = state.sources.get(item.sourceId);
    if (!source?.pdfJs) return;
    const previewToken = state.previewToken;
    const pageId = item.id;
    const layer = document.createElement('div');
    layer.className = 'pdf-text-edit-layer textLayer';
    layer.style.width = `${els.previewCanvas.width}px`;
    layer.style.height = `${els.previewCanvas.height}px`;
    layer.style.setProperty('--scale-factor', String(scale));
    els.editorLayer.prepend(layer);
    try {
      const pdfPage = await source.pdfJs.getPage(item.sourcePageIndex + 1);
      const viewport = pdfPage.getViewport({ scale, rotation: normalizeRotation(pdfPage.rotate + item.rotation) });
      const textContent = await pdfPage.getTextContent();
      if (previewToken !== state.previewToken || state.selectedId !== pageId || state.editMode !== 'edit-existing') { layer.remove(); return; }
      const textDivs = [];
      if (typeof pdfjsLib.renderTextLayer === 'function') {
        const task = pdfjsLib.renderTextLayer({ textContentSource:textContent, container:layer, viewport, textDivs });
        if (task?.promise) await task.promise;
        else if (task?.then) await task;
      } else {
        // Fallback simples para versões de PDF.js sem renderTextLayer público.
        for (const ti of textContent.items || []) {
          if (!ti?.str?.trim()) { textDivs.push(null); continue; }
          const tx = pdfjsLib.Util.transform(viewport.transform, ti.transform);
          const fontHeight = Math.max(2, Math.hypot(tx[2], tx[3]));
          const span = document.createElement('span');
          span.textContent = ti.str;
          span.style.position = 'absolute'; span.style.left = `${tx[4]}px`; span.style.top = `${tx[5]-fontHeight}px`;
          span.style.fontSize = `${fontHeight}px`; span.style.width = `${Math.max(2,(ti.width||1)*scale)}px`; span.style.height = `${fontHeight*1.2}px`;
          layer.appendChild(span); textDivs.push(span);
        }
      }
      if (previewToken !== state.previewToken || state.selectedId !== pageId || state.editMode !== 'edit-existing') { layer.remove(); return; }
      const replaced = new Set(overlayList(item).map(o => o.replacesSourceKey).filter(Boolean));
      let targetCount = 0;
      let divIndex = 0;
      for (let i = 0; i < (textContent.items || []).length; i++) {
        const ti = textContent.items[i];
        const span = textDivs[divIndex++] || null;
        if (!span || !ti?.str?.trim()) continue;
        const key = sourceTextKey(item, ti, i);
        if (replaced.has(key)) { span.remove(); continue; }
        targetCount++;
        span.classList.add('existing-text-target');
        span.title = `Editar: ${ti.str}`;
        span.dataset.sourceTextKey = key;
        span.addEventListener('click', ev => {
          ev.preventDefault(); ev.stopPropagation();
          convertExistingTextToOverlay(item, ti, i, span, key);
        });
      }
      if (!targetCount) els.editHint.textContent = 'Nenhum texto selecionável foi encontrado nesta página. PDFs digitalizados exigem OCR.';
      else els.editHint.textContent = `${targetCount} bloco${targetCount===1?'':'s'} de texto detectado${targetCount===1?'':'s'}. Clique em um para editar.`;
    } catch (err) {
      console.warn('Falha ao mapear texto existente', err);
      layer.remove();
      els.editHint.textContent = 'Não foi possível mapear o texto desta página.';
    }
  }

  function convertExistingTextToOverlay(page, textItem, index, span, key) {
    if (!page || page.id !== state.selectedId || state.busy) return;
    const layerRect = els.editorLayer.getBoundingClientRect();
    const rect = span.getBoundingClientRect();
    const scale = state.previewScale || 1;
    const padPt = 1.2;
    const xPx = rect.left - layerRect.left;
    const yPx = rect.top - layerRect.top;
    const xPt = Math.max(0, xPx / scale - padPt);
    const yPt = Math.max(0, yPx / scale - padPt);
    const size = pageDisplaySizeSync(page);
    const wPt = Math.min(size.width - xPt, Math.max(12, rect.width / scale + padPt * 2));
    const hPt = Math.min(size.height - yPt, Math.max(10, rect.height / scale + padPt * 2));
    const cs = getComputedStyle(span);
    const fontSizePt = clamp((parseFloat(cs.fontSize) || rect.height || 12) / scale, 6, 144);
    const backgroundColor = sampleCanvasBackgroundColor(xPx, yPx, rect.width, rect.height);
    pushHistory();
    const z = overlayList(page).reduce((m,o)=>Math.max(m,o.z||0),0)+1;
    const obj = {
      id:uid('obj'), kind:'text', replacement:true, replacesSourceKey:key, originalText:textItem.str,
      xPt, yPt, wPt, hPt, text:textItem.str, fontFamily:inferEditorFontFamily(cs.fontFamily), fontSizePt,
      bold:/bold|700|800|900/i.test(cs.fontWeight || ''), italic:/italic|oblique/i.test(cs.fontStyle || ''),
      align:'left', color:'#111111', backgroundColor, opacity:1, rotation:0, z
    };
    overlayList(page).push(obj);
    state.selectedOverlayId = obj.id;
    state.dirty = true;
    setEditMode('select');
    renderPreview(); renderThumbList(); updateToolbarState();
    setTimeout(() => {
      const content = els.editorLayer.querySelector(`[data-object-id="${CSS.escape(obj.id)}"] .text-content`);
      if (content) content.dispatchEvent(new MouseEvent('dblclick', { bubbles:true }));
    }, 40);
  }

  function renderEditorLayer(item, scale) {
    els.editorLayer.innerHTML = '';
    els.editorLayer.style.width = `${els.previewCanvas.width}px`;
    els.editorLayer.style.height = `${els.previewCanvas.height}px`;
    els.pageCanvasWrap.style.width = `${els.previewCanvas.width}px`;
    els.pageCanvasWrap.style.height = `${els.previewCanvas.height}px`;
    setEditMode(state.editMode);

    if (!item) { state.selectedOverlayId = null; updateObjectInspector(); return; }
    if (state.selectedOverlayId && !overlayList(item).some(o => o.id === state.selectedOverlayId)) state.selectedOverlayId = null;

    const objects = [...overlayList(item)].sort((a,b)=>(a.z||0)-(b.z||0));
    for (const obj of objects) {
      const el = document.createElement('div');
      el.className = `editor-object ${obj.kind}-object${obj.id === state.selectedOverlayId ? ' selected' : ''}`;
      el.dataset.objectId = obj.id;

      if (obj.kind === 'text') {
        const content = document.createElement('div');
        content.className = 'text-content';
        content.textContent = obj.text || '';
        content.spellcheck = false;
        el.appendChild(content);
        content.addEventListener('dblclick', ev => {
          ev.stopPropagation();
          selectOverlayObject(obj.id);
          pushHistory();
          el.classList.add('editing-text');
          content.contentEditable = 'true';
          content.focus();
          const range = document.createRange(); range.selectNodeContents(content); range.collapse(false);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        });
        content.addEventListener('input', () => {
          obj.text = content.innerText.replace(/\r/g, '');
          state.dirty = true;
          updateToolbarState();
        });
        content.addEventListener('blur', () => {
          content.contentEditable = 'false';
          el.classList.remove('editing-text');
          renderThumbList();
          if (!els.organizeModal.classList.contains('hidden')) renderOrganizeGrid();
        });
        content.addEventListener('pointerdown', ev => { if (content.isContentEditable) ev.stopPropagation(); });
      } else if (obj.kind === 'image') {
        const asset = state.overlayAssets.get(obj.assetId);
        const img = document.createElement('img');
        img.alt = asset?.name || 'Imagem adicionada';
        if (asset?.url) img.src = asset.url;
        el.appendChild(img);
      }

      const rotateLine = document.createElement('span'); rotateLine.className = 'object-rotate-line';
      const rotateHandle = document.createElement('span'); rotateHandle.className = 'object-rotate-handle'; rotateHandle.title = 'Girar objeto';
      const resizeHandle = document.createElement('span'); resizeHandle.className = 'object-handle'; resizeHandle.title = 'Redimensionar';
      el.append(rotateLine, rotateHandle, resizeHandle);
      styleEditorObject(el, obj, scale);

      el.addEventListener('pointerdown', ev => {
        if (ev.target === resizeHandle || ev.target === rotateHandle) return;
        const content = el.querySelector('.text-content');
        if (content?.isContentEditable) return;
        beginObjectDrag(ev, obj, el);
      });
      resizeHandle.addEventListener('pointerdown', ev => beginObjectResize(ev, obj, el));
      rotateHandle.addEventListener('pointerdown', ev => beginObjectRotate(ev, obj, el));
      els.editorLayer.appendChild(el);
    }
    updateObjectInspector();
    if (state.editMode === 'edit-existing') renderExistingTextTargets(item, scale);
  }

  function selectOverlayObject(id) {
    state.selectedOverlayId = id;
    state.editMode = 'select';
    $$('.editor-object', els.editorLayer).forEach(el => el.classList.toggle('selected', el.dataset.objectId === id));
    setEditMode('select');
    updateObjectInspector();
  }

  function commitObjectInteraction() {
    state.dirty = true;
    updateToolbarState();
    renderThumbList();
    if (!els.organizeModal.classList.contains('hidden')) renderOrganizeGrid();
    updateObjectInspector();
  }

  function beginObjectDrag(ev, obj, el) {
    if (ev.button !== 0 || state.busy) return;
    ev.preventDefault(); ev.stopPropagation();
    selectOverlayObject(obj.id);
    pushHistory();
    const page = getSelectedPage();
    const size = pageDisplaySizeSync(page);
    const startX = ev.clientX, startY = ev.clientY, ox = obj.xPt || 0, oy = obj.yPt || 0;
    const move = e => {
      const dx = (e.clientX - startX) / state.previewScale;
      const dy = (e.clientY - startY) / state.previewScale;
      obj.xPt = clamp(ox + dx, 0, Math.max(0, size.width - obj.wPt));
      obj.yPt = clamp(oy + dy, 0, Math.max(0, size.height - obj.hPt));
      styleEditorObject(el, obj, state.previewScale);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); commitObjectInteraction(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once:true });
  }

  function beginObjectResize(ev, obj, el) {
    if (ev.button !== 0 || state.busy) return;
    ev.preventDefault(); ev.stopPropagation();
    selectOverlayObject(obj.id); pushHistory();
    const page = getSelectedPage(), size = pageDisplaySizeSync(page);
    const startX = ev.clientX, startY = ev.clientY, ow = obj.wPt, oh = obj.hPt;
    const ratio = Math.max(.05, ow / Math.max(1, oh));
    const move = e => {
      let w = Math.max(obj.kind === 'text' ? 35 : 24, ow + (e.clientX - startX) / state.previewScale);
      let h = Math.max(obj.kind === 'text' ? 18 : 24, oh + (e.clientY - startY) / state.previewScale);
      if (obj.kind === 'image' && !e.shiftKey) {
        if (Math.abs(e.clientX-startX) >= Math.abs(e.clientY-startY)) h = w / ratio;
        else w = h * ratio;
      }
      obj.wPt = Math.min(w, Math.max(24, size.width - obj.xPt));
      obj.hPt = Math.min(h, Math.max(18, size.height - obj.yPt));
      styleEditorObject(el, obj, state.previewScale);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); commitObjectInteraction(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once:true });
  }

  function beginObjectRotate(ev, obj, el) {
    if (ev.button !== 0 || state.busy) return;
    ev.preventDefault(); ev.stopPropagation();
    selectOverlayObject(obj.id); pushHistory();
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const startA = Math.atan2(ev.clientY-cy, ev.clientX-cx) * 180/Math.PI;
    const original = obj.rotation || 0;
    const move = e => {
      const a = Math.atan2(e.clientY-cy, e.clientX-cx) * 180/Math.PI;
      obj.rotation = Math.round(original + a - startA);
      styleEditorObject(el, obj, state.previewScale);
      els.objectRotation.value = Math.round(obj.rotation);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); commitObjectInteraction(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once:true });
  }

  function addTextAt(xPt, yPt) {
    const page = getSelectedPage();
    if (!page || state.busy) return;
    const size = pageDisplaySizeSync(page);
    const w = Math.min(190, Math.max(80, size.width * .42));
    const h = 44;
    pushHistory();
    const z = overlayList(page).reduce((m,o)=>Math.max(m,o.z||0),0)+1;
    const obj = { id:uid('obj'), kind:'text', xPt:clamp(xPt,0,Math.max(0,size.width-w)), yPt:clamp(yPt,0,Math.max(0,size.height-h)), wPt:w, hPt:h, text:'Digite o texto', fontFamily:'Helvetica', fontSizePt:18, bold:false, italic:false, align:'left', color:'#111111', opacity:1, rotation:0, z };
    overlayList(page).push(obj);
    state.selectedOverlayId = obj.id;
    state.dirty = true;
    setEditMode('select');
    renderPreview(); renderThumbList(); updateToolbarState();
    setTimeout(() => {
      const content = els.editorLayer.querySelector(`[data-object-id="${CSS.escape(obj.id)}"] .text-content`);
      if (content) content.dispatchEvent(new MouseEvent('dblclick', { bubbles:true }));
    }, 30);
  }

  async function addOverlayImage(file) {
    const page = getSelectedPage();
    if (!page || !file || state.busy) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const blob = new Blob([bytes], { type:mime });
      const bitmap = await createImageBitmap(blob);
      const url = URL.createObjectURL(blob);
      const assetId = uid('asset');
      state.overlayAssets.set(assetId, { id:assetId, name:file.name || 'imagem', mime, bytes, bitmap, url });
      const size = pageDisplaySizeSync(page);
      let w = Math.min(bitmap.width * 72/96, size.width * .46);
      let h = w * bitmap.height / bitmap.width;
      if (h > size.height * .46) { h = size.height * .46; w = h * bitmap.width / bitmap.height; }
      pushHistory();
      const z = overlayList(page).reduce((m,o)=>Math.max(m,o.z||0),0)+1;
      const obj = { id:uid('obj'), kind:'image', assetId, xPt:(size.width-w)/2, yPt:(size.height-h)/2, wPt:w, hPt:h, opacity:1, rotation:0, z };
      overlayList(page).push(obj);
      state.selectedOverlayId = obj.id;
      state.dirty = true;
      setEditMode('select');
      refreshComposition();
      showToast('Imagem adicionada à página.', 'success');
    } catch (err) {
      console.error(err); showToast('Não foi possível adicionar esta imagem.', 'error');
    } finally { els.overlayImageInput.value = ''; }
  }

  function updateSelectedOverlay(mutator, rerender = true) {
    const obj = selectedOverlay();
    if (!obj || state.busy) return;
    pushHistory(); mutator(obj); state.dirty = true; updateToolbarState();
    if (rerender) { renderPreview(); renderThumbList(); if (!els.organizeModal.classList.contains('hidden')) renderOrganizeGrid(); }
  }

  function deleteSelectedOverlay() {
    const page = getSelectedPage(), obj = selectedOverlay();
    if (!page || !obj) return;
    pushHistory(); page.overlays = overlayList(page).filter(o => o.id !== obj.id); state.selectedOverlayId = null; markDirty(); refreshComposition();
  }

  function duplicateSelectedOverlay() {
    const page = getSelectedPage(), obj = selectedOverlay();
    if (!page || !obj) return;
    pushHistory();
    const size = pageDisplaySizeSync(page);
    const clone = { ...obj, id:uid('obj'), xPt:clamp((obj.xPt||0)+10,0,Math.max(0,size.width-obj.wPt)), yPt:clamp((obj.yPt||0)+10,0,Math.max(0,size.height-obj.hPt)), z:overlayList(page).reduce((m,o)=>Math.max(m,o.z||0),0)+1 };
    overlayList(page).push(clone); state.selectedOverlayId = clone.id; markDirty(); refreshComposition();
  }

  function moveSelectedOverlayLayer(direction) {
    const page = getSelectedPage(), obj = selectedOverlay(); if (!page || !obj) return;
    pushHistory(); const list=overlayList(page); const zs=list.map(o=>o.z||0);
    obj.z = direction === 'front' ? Math.max(0,...zs)+1 : Math.min(0,...zs)-1;
    markDirty(); renderPreview(); renderThumbList();
  }

  async function renderPreview() {
    const token = ++state.previewToken;
    const item = getSelectedPage();
    const hasItem = Boolean(item);
    els.previewPlaceholder.classList.toggle('hidden', hasItem);
    els.pageCanvasWrap.classList.toggle('hidden', !hasItem);

    if (!item) {
      els.previewStatus.textContent = 'Preview do documento';
      els.selectedPageLabel.textContent = 'Nenhuma página selecionada';
      els.pageDimensionLabel.textContent = '';
      els.zoomValueBtn.textContent = '100%';
      els.editorLayer.innerHTML = '';
      state.selectedOverlayId = null;
      updateObjectInspector();
      updateToolbarState();
      return;
    }

    if (state.editMode === 'edit-existing' && item.kind !== 'pdf') setEditMode('select');
    const index = getSelectedIndex();
    els.previewStatus.textContent = `Visualizando página ${index + 1}`;
    els.selectedPageLabel.textContent = `Página ${index + 1} de ${state.pages.length}`;
    els.currentPageNumber.textContent = String(index + 1);
    els.totalPageNumber.textContent = String(state.pages.length);

    try {
      const info = await renderItemToCanvas(item, els.previewCanvas, { mode: 'preview' });
      if (token !== state.previewToken) return;
      renderEditorLayer(item, info.scale);
      els.zoomValueBtn.textContent = `${Math.round(state.previewScale * 100)}%`;
      els.pageDimensionLabel.textContent = `${Math.round(mmFromPt(info.widthPt))} × ${Math.round(mmFromPt(info.heightPt))} mm`;
      updateToolbarState();
    } catch (err) {
      console.error(err);
      showToast('Não foi possível gerar o preview desta página.', 'error');
    }
  }

  function changeZoom(delta) {
    if (!state.pages.length) return;
    state.fitMode = 'manual';
    state.zoom = clamp(Math.round((state.previewScale + delta) * 100) / 100, .25, 4);
    renderPreview();
  }
  function fitPreview() { state.fitMode = 'page'; state.zoom = 1; renderPreview(); }
  function fitWidth() { state.fitMode = 'width'; state.zoom = 1; renderPreview(); }
  function actualSize() { state.fitMode = 'actual'; state.zoom = 1; renderPreview(); }

  function goPage(delta, previewEdge = null) {
    const idx = getSelectedIndex();
    if (idx < 0) return;
    const next = state.pages[clamp(idx + delta, 0, state.pages.length - 1)];
    if (!next || next.id === state.selectedId) return;
    setSingleSelection(next.id);
    refreshSelectionVisuals();
    updateToolbarState();
    const rendered = renderPreview();
    if (previewEdge) {
      Promise.resolve(rendered).then(() => requestAnimationFrame(() => {
        if (previewEdge === 'top') els.previewStage.scrollTop = 0;
        else if (previewEdge === 'bottom') els.previewStage.scrollTop = Math.max(0, els.previewStage.scrollHeight - els.previewStage.clientHeight);
      }));
    }
    els.thumbList.querySelector(`[data-page-id="${CSS.escape(next.id)}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await els.previewArea.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      showToast('Tela cheia não está disponível neste navegador.', 'error');
    }
  }

  function openContextMenu(item, x, y) {
    const isImage = item.kind === 'image';
    $$('.image-only').forEach(el => el.classList.toggle('hidden', !isImage));
    $$('.image-context-separator').forEach(el => el.classList.toggle('hidden', !isImage));
    els.pageContextMenu.classList.remove('hidden');
    positionFloatingMenu(els.pageContextMenu, x, y);
  }

  function closeContextMenu() { els.pageContextMenu.classList.add('hidden'); }

  function contextIds() {
    if (state.contextPageId && state.selectedIds.has(state.contextPageId) && state.selectedIds.size > 1) return orderedSelectedIds();
    return state.contextPageId ? [state.contextPageId] : orderedSelectedIds();
  }

  function setImageLayout(ids, layout) {
    const set = new Set(ids);
    const targets = state.pages.filter(p => set.has(p.id) && p.kind === 'image');
    if (!targets.length) return;
    pushHistory();
    targets.forEach(p => { p.imageLayout = layout; });
    state.selectedIds = new Set(targets.map(p => p.id));
    state.selectedId = targets[0].id;
    markDirty();
    refreshComposition();
  }

  function dropzoneImportContext() {
    const idx = getSelectedIndex();
    return state.pages.length
      ? { mode: 'insert', index: idx < 0 ? state.pages.length : idx + 1 }
      : { mode: 'replace', index: 0 };
  }

  function setImportSourceStatus(message, type = '') {
    if (!els.importSourceStatus) return;
    els.importSourceStatus.textContent = message;
    els.importSourceStatus.classList.toggle('error', type === 'error');
    els.importSourceStatus.classList.toggle('success', type === 'success');
  }

  function openImportSourceModal() {
    if (state.busy) return;
    closeInsertMenu();
    setImportSourceStatus('Também é possível pressionar Ctrl+V com este modal aberto para colar uma imagem.');
    els.importSourceModal.classList.remove('hidden');
    requestAnimationFrame(() => els.clipboardImportBtn?.focus());
  }

  function closeImportSourceModal() {
    els.importSourceModal?.classList.add('hidden');
    els.dragImportBtn?.classList.remove('dragover');
  }

  async function normalizeClipboardImageBlob(blob) {
    if (!blob || !String(blob.type || '').startsWith('image/')) throw new Error('A área de transferência não contém uma imagem.');
    if (/^image\/(png|jpeg|webp)$/i.test(blob.type)) return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.drawImage(bitmap, 0, 0);
    try { bitmap.close?.(); } catch (_) {}
    const png = await canvasToBlob(canvas, 'image/png', 1);
    canvas.width = 1; canvas.height = 1;
    return png;
  }

  function clipboardFileName(mime) {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
    const ext = /webp/i.test(mime) ? 'webp' : /jpe?g/i.test(mime) ? 'jpg' : 'png';
    return `clipboard-${stamp}.${ext}`;
  }

  async function importClipboardBlob(blob) {
    const normalized = await normalizeClipboardImageBlob(blob);
    const file = new File([normalized], clipboardFileName(normalized.type), { type: normalized.type || 'image/png' });
    closeImportSourceModal();
    await importFiles([file], dropzoneImportContext());
  }

  async function readClipboardImageNative() {
    if (!navigator.clipboard?.read) throw new Error('Clipboard API indisponível.');
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = Array.from(item.types || []).find(t => String(t).startsWith('image/'));
      if (type) return item.getType(type);
    }
    throw new Error('Nenhuma imagem encontrada na área de transferência.');
  }

  function dataUrlToBlob(dataUrl) {
    const parts = String(dataUrl || '').split(',');
    if (parts.length < 2) throw new Error('Imagem recebida da extensão é inválida.');
    const meta = parts[0];
    const mime = (/^data:([^;]+)/.exec(meta) || [,'image/png'])[1];
    const binary = atob(parts.slice(1).join(','));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function readClipboardImageFromExtension(timeoutMs = 4500) {
    if (document.documentElement?.dataset?.pdfstudioClipboardBridge !== 'ready') {
      return Promise.reject(new Error('Extensão do Chrome não detectada.'));
    }
    return new Promise((resolve, reject) => {
      const requestId = uid('clipreq');
      let timer;
      const onMessage = ev => {
        const detail = ev.data || {};
        if (ev.source !== window || detail.source !== 'PDFSTUDIO_CLIPBOARD_BRIDGE' || detail.type !== 'CLIPBOARD_RESPONSE' || detail.requestId !== requestId) return;
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        if (!detail.ok) return reject(new Error(detail.error || 'A extensão não conseguiu ler o clipboard.'));
        try { resolve(dataUrlToBlob(detail.dataUrl)); } catch (err) { reject(err); }
      };
      window.addEventListener('message', onMessage);
      timer = setTimeout(() => {
        window.removeEventListener('message', onMessage);
        reject(new Error('A extensão do Chrome não respondeu.'));
      }, timeoutMs);
      window.postMessage({ source: 'PDFSTUDIO_APP', type: 'CLIPBOARD_REQUEST', requestId }, '*');
    });
  }

  async function importFromClipboard() {
    if (state.busy) return;
    setImportSourceStatus('Lendo imagem da área de transferência…');
    const bridgeReady = document.documentElement?.dataset?.pdfstudioClipboardBridge === 'ready';
    let extensionError;

    if (bridgeReady) {
      try {
        const blob = await readClipboardImageFromExtension();
        setImportSourceStatus('Imagem recebida da extensão.', 'success');
        await importClipboardBlob(blob);
        return;
      } catch (err) {
        extensionError = err;
      }
    }

    try {
      const blob = await readClipboardImageNative();
      setImportSourceStatus('Imagem encontrada.', 'success');
      await importClipboardBlob(blob);
      return;
    } catch (nativeError) {
      const msg = bridgeReady
        ? (extensionError?.message || nativeError?.message || 'Não foi possível ler o clipboard.')
        : 'Não foi possível ler automaticamente. Copie uma imagem e pressione Ctrl+V com este modal aberto, ou instale a extensão PDF Studio Clipboard Bridge.';
      setImportSourceStatus(msg, 'error');
      showToast(msg, 'error', 5500);
    }
  }

  async function importPastedImage(event) {
    if (els.importSourceModal?.classList.contains('hidden') || state.busy) return;
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find(item => item.kind === 'file' && String(item.type || '').startsWith('image/'));
    if (!imageItem) {
      setImportSourceStatus('O conteúdo colado não é uma imagem.', 'error');
      return;
    }
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    try {
      setImportSourceStatus('Imagem colada.', 'success');
      await importClipboardBlob(file);
    } catch (err) {
      setImportSourceStatus(err?.message || 'Não foi possível importar a imagem colada.', 'error');
    }
  }

  function openOrganizeModal() {
    if (!state.pages.length || state.busy) return;
    els.organizeModal.classList.remove('hidden');
    renderOrganizeGrid();
  }

  function closeOrganizeModal() { els.organizeModal.classList.add('hidden'); }

  function buildOrganizeCard(item, index) {
    const card = document.createElement('div');
    card.className = `organize-card${state.selectedIds.has(item.id) ? ' selected' : ''}`;
    card.dataset.pageId = item.id;
    card.draggable = true;
    card.innerHTML = `<div class="organize-thumb"><canvas data-grid-thumb-for="${item.id}"></canvas></div><div class="organize-meta"><strong>Página ${index + 1}</strong><span class="organize-source" title="${escapeHtml(item.sourceName)}">${escapeHtml(item.sourceName)}</span></div>`;
    card.addEventListener('click', ev => selectPage(item.id, ev));
    card.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      if (!state.selectedIds.has(item.id)) setSingleSelection(item.id);
      state.contextPageId = item.id;
      refreshSelectionVisuals();
      openContextMenu(item, ev.clientX, ev.clientY);
    });
    card.addEventListener('dragstart', ev => {
      if (!state.selectedIds.has(item.id)) setSingleSelection(item.id);
      state.draggingId = item.id;
      card.classList.add('dragging');
      ev.dataTransfer?.setData('text/plain', item.id);
      if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      state.draggingId = null;
      $$('.organize-card').forEach(c => c.classList.remove('dragging', 'drag-target'));
    });
    card.addEventListener('dragover', ev => {
      if (hasFileTransfer(ev.dataTransfer)) {
        ev.preventDefault(); card.classList.add('drag-target'); if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy'; return;
      }
      if (!state.draggingId || state.draggingId === item.id) return;
      ev.preventDefault(); card.classList.add('drag-target');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-target'));
    card.addEventListener('drop', ev => {
      ev.preventDefault(); card.classList.remove('drag-target');
      const rect = card.getBoundingClientRect();
      const after = ev.clientX > rect.left + rect.width / 2;
      if (ev.dataTransfer?.files?.length) {
        const targetIndex = state.pages.findIndex(p => p.id === item.id) + (after ? 1 : 0);
        importFiles(ev.dataTransfer.files, { mode: 'insert', index: targetIndex });
        return;
      }
      const draggedId = state.draggingId || ev.dataTransfer?.getData('text/plain');
      if (draggedId) reorderPages(draggedId, item.id, after);
    });
    return card;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  }

  function renderOrganizeGrid() {
    if (els.organizeModal.classList.contains('hidden')) return;
    const version = ++state.gridRenderVersion;
    els.organizeGrid.innerHTML = '';
    state.pages.forEach((item, index) => els.organizeGrid.appendChild(buildOrganizeCard(item, index)));
    refreshSelectionVisuals();
    requestAnimationFrame(async () => {
      for (const item of state.pages) {
        if (version !== state.gridRenderVersion) return;
        const canvas = els.organizeGrid.querySelector(`canvas[data-grid-thumb-for="${CSS.escape(item.id)}"]`);
        if (!canvas) continue;
        try { await renderItemToCanvas(item, canvas, { mode: 'grid' }); } catch (_) {}
      }
    });
  }

  function openAboutModal() {
    els.aboutModal?.classList.remove('hidden');
  }

  function closeAboutModal() {
    els.aboutModal?.classList.add('hidden');
  }

  async function openPropertiesModal() {
    if (!state.pages.length) return;
    els.propertiesModal.classList.remove('hidden');
    els.propName.textContent = state.fileName;
    els.propPages.textContent = String(state.pages.length);
    els.propSources.textContent = String(usedSourceIds().size);
    els.propSourceSize.textContent = formatBytes(currentSourceBytes());
    els.propObjects.textContent = String(state.pages.reduce((n,p)=>n+(p.overlays?.length||0),0));
    els.propDirty.textContent = state.dirty ? 'Não exportadas' : 'Documento sincronizado com a última exportação/abertura';
    let portrait = 0, landscape = 0;
    for (const page of state.pages) {
      try {
        const size = await getItemBaseSize(page);
        if (size.width > size.height) landscape += 1; else portrait += 1;
      } catch (_) {}
    }
    els.propOrientation.textContent = `${portrait} retrato • ${landscape} paisagem`;
  }
  function closePropertiesModal() { els.propertiesModal.classList.add('hidden'); }

  function currentExportMode() { return $('input[name="exportMode"]:checked')?.value || 'original'; }

  async function updateExportSettingsUI() {
    const mode = currentExportMode();
    $$('.option-card').forEach(card => card.classList.toggle('selected', card.dataset.exportMode === mode));
    els.compressionSettings.classList.toggle('disabled', mode !== 'compressed');
    els.dpiValue.textContent = `${els.dpiRange.value} DPI`;
    els.qualityValue.textContent = `${els.jpegQuality.value}%`;
    const modeName = els.colorMode.options[els.colorMode.selectedIndex]?.text || 'Cor';
    els.exportSummary.textContent = mode === 'compressed'
      ? `Saída: PDF comprimido • ${modeName} • ${els.dpiRange.value} DPI`
      : 'Saída: PDF sem compressão';
    els.exportSourceSize.textContent = formatBytes(currentSourceBytes());
    await updateExportEstimate();
  }

  async function updateExportEstimate() {
    const token = ++state.estimateToken;
    if (!state.pages.length) { els.exportEstimatedSize.textContent = '—'; return; }
    const mode = currentExportMode();
    if (mode === 'original') {
      const base = currentSourceBytes();
      els.exportEstimatedSize.textContent = base ? `≈ ${formatBytes(base)}` : '< 100 KB';
      return;
    }
    els.exportEstimatedSize.textContent = 'calculando…';
    const dpi = Number(els.dpiRange.value);
    const quality = Number(els.jpegQuality.value) / 100;
    const color = els.colorMode.value;
    let pixels = 0;
    for (const item of state.pages) {
      try {
        const size = await getItemBaseSize(item);
        pixels += Math.max(1, Math.round(size.width * dpi / 72)) * Math.max(1, Math.round(size.height * dpi / 72));
      } catch (_) {}
    }
    if (token !== state.estimateToken) return;
    const factor = color === 'mono' ? 0.028 : color === 'grayscale' ? 0.09 : 0.18;
    const qualityFactor = 0.55 + quality * 0.75;
    const estimated = pixels * factor * qualityFactor + state.pages.length * 18_000;
    els.exportEstimatedSize.textContent = `≈ ${formatBytes(estimated)}`;
  }

  function openExportModal() {
    if (!state.pages.length || state.busy) return;
    els.exportModal.classList.remove('hidden');
    updateExportSettingsUI();
  }
  function closeExportModal() { els.exportModal.classList.add('hidden'); }

  async function sourceImageForPdfLib(source, pdfDoc) {
    if (/png/i.test(source.mime)) return pdfDoc.embedPng(source.bytes);
    if (/jpe?g/i.test(source.mime)) return pdfDoc.embedJpg(source.bytes);
    const temp = document.createElement('canvas');
    temp.width = source.bitmap.width; temp.height = source.bitmap.height;
    const ctx = temp.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, temp.width, temp.height); ctx.drawImage(source.bitmap, 0, 0);
    const blob = await canvasToBlob(temp, 'image/jpeg', .94);
    temp.width = 1; temp.height = 1;
    return pdfDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
  }

  async function exportOriginal(pageList = state.pages) {
    const out = await PDFDocument.create();
    const loadedPdfs = new Map();
    const embeddedImages = new Map();

    for (let i = 0; i < pageList.length; i++) {
      const item = pageList[i];
      const source = item.kind === 'blank' ? null : state.sources.get(item.sourceId);
      setProgress(8 + (i / Math.max(1, pageList.length)) * 82, `Montando página ${i + 1} de ${pageList.length}`);

      if ((item.overlays || []).length) {
        const canvas = document.createElement('canvas');
        const info = await renderItemToCanvas(item, canvas, { mode: 'dpi', dpi: 300 });
        const blob = await canvasToBlob(canvas, 'image/png');
        const png = await out.embedPng(new Uint8Array(await blob.arrayBuffer()));
        const page = out.addPage([info.widthPt, info.heightPt]);
        page.drawImage(png, { x:0, y:0, width:info.widthPt, height:info.heightPt });
        canvas.width = 1; canvas.height = 1;
      } else if (item.kind === 'blank') {
        const page = out.addPage([item.widthPt || A4.width, item.heightPt || A4.height]);
        page.setRotation(degrees(normalizeRotation(item.rotation)));
      } else if (item.kind === 'pdf') {
        let srcDoc = loadedPdfs.get(item.sourceId);
        if (!srcDoc) {
          srcDoc = await PDFDocument.load(source.bytes.slice(), { ignoreEncryption: false });
          loadedPdfs.set(item.sourceId, srcDoc);
        }
        const [copied] = await out.copyPages(srcDoc, [item.sourcePageIndex]);
        const baseRotation = copied.getRotation()?.angle || 0;
        copied.setRotation(degrees(normalizeRotation(baseRotation + item.rotation)));
        out.addPage(copied);
      } else {
        let embedded = embeddedImages.get(item.sourceId);
        if (!embedded) {
          embedded = await sourceImageForPdfLib(source, out);
          embeddedImages.set(item.sourceId, embedded);
        }
        const spec = imagePageSpec(item);
        const page = out.addPage([spec.pageW, spec.pageH]);
        page.drawImage(embedded, { x: spec.x, y: spec.y, width: spec.drawW, height: spec.drawH });
        page.setRotation(degrees(normalizeRotation(item.rotation)));
      }
    }
    setProgress(94, 'Finalizando PDF');
    return out.save({ useObjectStreams: true, addDefaultPage: false });
  }

  function applyColorMode(canvas, mode, dither) {
    if (mode === 'color') return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const bayer4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const lum = Math.round(data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722);
        if (mode === 'grayscale') data[i] = data[i + 1] = data[i + 2] = lum;
        else {
          const threshold = dither ? 112 + bayer4[(y % 4) * 4 + (x % 4)] * 3 : 150;
          const v = lum >= threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = v;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function canvasToBlob(canvas, type = 'image/jpeg', quality = .82) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao processar a página.')), type, quality));
  }

  async function exportCompressed({ dpi, colorMode, quality, dither }, pageList = state.pages) {
    const out = await PDFDocument.create();
    const maxPixels = 68_000_000;
    for (let i = 0; i < pageList.length; i++) {
      const item = pageList[i];
      const baseSize = await getItemBaseSize(item);
      const expectedWidth = Math.ceil(baseSize.width * dpi / 72);
      const expectedHeight = Math.ceil(baseSize.height * dpi / 72);
      if (expectedWidth * expectedHeight > maxPixels) throw new Error(`A página ${i + 1} excede o limite seguro de memória em ${dpi} DPI. Reduza o DPI.`);
      const canvas = document.createElement('canvas');
      setProgress(5 + (i / Math.max(1, pageList.length)) * 86, `Rasterizando página ${i + 1} de ${pageList.length} • ${dpi} DPI`);
      const info = await renderItemToCanvas(item, canvas, { mode: 'dpi', dpi });
      applyColorMode(canvas, colorMode, dither);
      const effectiveQuality = colorMode === 'mono' ? Math.min(.88, quality) : quality;
      const blob = await canvasToBlob(canvas, 'image/jpeg', effectiveQuality);
      const jpg = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      const page = out.addPage([info.widthPt, info.heightPt]);
      page.drawImage(jpg, { x: 0, y: 0, width: info.widthPt, height: info.heightPt });
      canvas.width = 1; canvas.height = 1;
      await new Promise(r => setTimeout(r, 0));
    }
    setProgress(94, 'Otimizando estrutura do PDF');
    return out.save({ useObjectStreams: true, addDefaultPage: false });
  }

  function downloadBytes(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = ensurePdfName(name);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function extractPages(ids = orderedSelectedIds()) {
    const set = new Set(ids);
    const pages = state.pages.filter(p => set.has(p.id));
    if (!pages.length || state.busy) return;
    try {
      setBusy(true, 'Extraindo páginas...', `Preparando ${pages.length} ${pages.length === 1 ? 'página' : 'páginas'}`, 4);
      const bytes = await exportOriginal(pages);
      const name = `${fileBaseName(state.fileName)}-extrato.pdf`;
      downloadBytes(bytes, name);
      showToast(`PDF extraído com ${pages.length} ${pages.length === 1 ? 'página' : 'páginas'}.`, 'success');
    } catch (err) {
      console.error(err); showToast(err?.message || 'Falha ao extrair páginas.', 'error', 5000);
    } finally { setBusy(false); }
  }

  async function printDocument() {
    if (!state.pages.length || state.busy) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('O navegador bloqueou a janela de impressão. Permita pop-ups para esta ferramenta.', 'error', 5000); return; }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Preparando impressão</title><style>html,body{height:100%;margin:0;background:#1b1f24;color:#dce2e8;font-family:system-ui,sans-serif}body{display:grid;place-items:center}.box{text-align:center}.spin{width:30px;height:30px;border:3px solid #3b424c;border-top-color:#e24a3b;border-radius:50%;margin:0 auto 14px;animation:s .8s linear infinite}@keyframes s{to{transform:rotate(360deg)}}small{display:block;color:#8e98a4;margin-top:5px}</style></head><body><div class="box"><div class="spin"></div><strong>Preparando documento para impressão</strong><small>O PDF será aberto no visualizador do navegador.</small></div></body></html>`);
    printWindow.document.close();
    try {
      setBusy(true, 'Preparando impressão...', 'Montando documento sem compressão', 3);
      const bytes = await exportOriginal();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(state.fileName)}</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;overflow:hidden;background:#20242a}</style></head><body><iframe id="printFrame" title="Documento PDF para impressão"></iframe></body></html>`);
      printWindow.document.close();
      const frame = printWindow.document.getElementById('printFrame');
      frame.onload = () => setTimeout(() => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        catch (_) { try { printWindow.focus(); printWindow.print(); } catch (_) {} }
      }, 450);
      frame.src = url;
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      showToast('Documento aberto para impressão.', 'success');
    } catch (err) {
      console.error(err); try { printWindow.close(); } catch (_) {}
      showToast(err?.message || 'Falha ao preparar a impressão.', 'error', 5500);
    } finally { setBusy(false); }
  }

  async function confirmExport() {
    if (state.busy) return;
    const mode = currentExportMode();
    closeExportModal();
    try {
      setBusy(true, 'Gerando PDF...', mode === 'compressed' ? 'Preparando compressão' : 'Preservando conteúdo original', 2);
      const bytes = mode === 'compressed'
        ? await exportCompressed({ dpi: Number(els.dpiRange.value), colorMode: els.colorMode.value, quality: Number(els.jpegQuality.value) / 100, dither: els.monoDither.checked })
        : await exportOriginal();
      setProgress(100, 'Concluído');
      downloadBytes(bytes, state.fileName || 'documento.pdf');
      state.dirty = false;
      updateToolbarState();
      showToast('PDF exportado com sucesso.', 'success');
    } catch (err) {
      console.error(err); showToast(err?.message || 'Falha ao exportar o PDF.', 'error', 5500);
    } finally { setBusy(false); }
  }

  // Top / document
  els.newDocumentBtn.addEventListener('click', ev => { ev.stopPropagation(); toggleDocumentMenu(); });
  els.newBlankBtn.addEventListener('click', createBlankDocument);
  els.loadDocumentBtn.addEventListener('click', async () => { closeDocumentMenu(); await requestReplaceFromFile(); });
  els.openFileBtn.addEventListener('click', requestReplaceFromFile);
  els.organizeBtn.addEventListener('click', openOrganizeModal);
  els.propertiesBtn.addEventListener('click', openPropertiesModal);
  els.aboutBtn?.addEventListener('click', openAboutModal);
  els.printBtn.addEventListener('click', printDocument);
  els.exportBtn.addEventListener('click', openExportModal);

  let nameBeforeEdit = '';
  els.documentNameInput.addEventListener('focus', () => { nameBeforeEdit = state.fileName; });
  els.documentNameInput.addEventListener('change', () => {
    if (!state.pages.length) return;
    const next = ensurePdfName(els.documentNameInput.value);
    if (next !== state.fileName) {
      state.fileName = next; state.dirty = true; updateToolbarState();
    }
  });
  els.documentNameInput.addEventListener('blur', () => {
    if (!state.pages.length) return;
    state.fileName = ensurePdfName(els.documentNameInput.value || nameBeforeEdit || state.fileName);
    updateToolbarState();
  });

  // Files / insertion
  els.fileInput.addEventListener('change', () => importFiles(els.fileInput.files));
  els.insertBeforeBtn.addEventListener('click', () => openInsertMenu(Math.max(0, getSelectedIndex()), els.insertBeforeBtn.getBoundingClientRect().right + 6, els.insertBeforeBtn.getBoundingClientRect().top));
  els.insertAfterBtn.addEventListener('click', () => openInsertMenu(getSelectedIndex() < 0 ? state.pages.length : getSelectedIndex() + 1, els.insertAfterBtn.getBoundingClientRect().right + 6, els.insertAfterBtn.getBoundingClientRect().top));
  els.insertBlankMenuBtn.addEventListener('click', () => { const idx = state.pendingInsertIndex; closeInsertMenu(); insertBlankAt(idx); });
  els.insertFileMenuBtn.addEventListener('click', () => { const idx = state.pendingInsertIndex; closeInsertMenu(); triggerPicker(state.pages.length ? 'insert' : 'replace', idx); });

  els.dropzone.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openImportSourceModal();
  });
  els.dropzone.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); els.dropzone.click(); } });
  ['dragenter', 'dragover'].forEach(type => els.dropzone.addEventListener(type, ev => { ev.preventDefault(); els.dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(type => els.dropzone.addEventListener(type, ev => { ev.preventDefault(); els.dropzone.classList.remove('dragover'); }));
  els.dropzone.addEventListener('drop', ev => {
    const files = ev.dataTransfer?.files;
    if (!files?.length) return;
    importFiles(files, dropzoneImportContext());
  });

  els.closeImportSourceBtn.addEventListener('click', closeImportSourceModal);
  els.clipboardImportBtn.addEventListener('click', importFromClipboard);
  els.importSourceModal.addEventListener('click', ev => { if (ev.target === els.importSourceModal) closeImportSourceModal(); });
  els.dragImportBtn.addEventListener('click', () => {
    state.importContext = dropzoneImportContext();
    closeImportSourceModal();
    els.fileInput.value = '';
    els.fileInput.click();
  });
  ['dragenter', 'dragover'].forEach(type => els.dragImportBtn.addEventListener(type, ev => {
    if (!hasFileTransfer(ev.dataTransfer)) return;
    ev.preventDefault(); ev.stopPropagation(); els.dragImportBtn.classList.add('dragover');
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
  }));
  ['dragleave', 'drop'].forEach(type => els.dragImportBtn.addEventListener(type, ev => {
    if (!hasFileTransfer(ev.dataTransfer) && type === 'drop') return;
    ev.preventDefault(); ev.stopPropagation(); els.dragImportBtn.classList.remove('dragover');
  }));
  els.dragImportBtn.addEventListener('drop', ev => {
    const files = ev.dataTransfer?.files;
    if (!files?.length) return;
    closeImportSourceModal();
    importFiles(files, dropzoneImportContext());
  });
  document.addEventListener('paste', importPastedImage);

  // Composition / selection
  els.undoBtn.addEventListener('click', undo);
  els.redoBtn.addEventListener('click', redo);
  els.rotateAllLeftBtn.addEventListener('click', () => rotateAll(-90));
  els.rotateAllRightBtn.addEventListener('click', () => rotateAll(90));
  els.clearSelectionBtn.addEventListener('click', clearMultiSelection);
  els.selectionBar.addEventListener('click', ev => {
    const action = ev.target.closest('[data-selection-action]')?.dataset.selectionAction;
    if (!action) return;
    const ids = orderedSelectedIds();
    if (action === 'left') rotateIds(ids, -90);
    if (action === 'right') rotateIds(ids, 90);
    if (action === 'duplicate') duplicateIds(ids);
    if (action === 'extract') extractPages(ids);
    if (action === 'delete') deleteIds(ids);
  });

  // Preview
  els.prevPageBtn.addEventListener('click', () => goPage(-1));
  els.nextPageBtn.addEventListener('click', () => goPage(1));
  els.zoomOutBtn.addEventListener('click', () => changeZoom(-.25));
  els.zoomInBtn.addEventListener('click', () => changeZoom(.25));
  els.zoomValueBtn.addEventListener('click', actualSize);
  els.fitWidthBtn.addEventListener('click', fitWidth);
  els.fitBtn.addEventListener('click', fitPreview);
  els.fullscreenBtn.addEventListener('click', toggleFullscreen);
  els.pagePositionBtn.addEventListener('click', () => openMovePagePopover(state.selectedId, els.pagePositionBtn));
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.pages.length && state.fitMode !== 'manual' && state.fitMode !== 'actual') renderPreview(); }, 120); });

  // Editor visual
  els.selectToolBtn.addEventListener('click', () => setEditMode('select'));
  els.textToolBtn.addEventListener('click', () => setEditMode('text'));
  els.editExistingTextBtn.addEventListener('click', () => { if (getSelectedPage()?.kind !== 'pdf') return showToast('Selecione uma página PDF com texto para editar.', 'info'); setEditMode('edit-existing'); renderEditorLayer(getSelectedPage(), state.previewScale || 1); });
  els.imageToolBtn.addEventListener('click', () => { if (state.pages.length && !state.busy) els.overlayImageInput.click(); });
  els.overlayImageInput.addEventListener('change', () => addOverlayImage(els.overlayImageInput.files?.[0]));

  els.editorLayer.addEventListener('click', ev => {
    if (ev.target !== els.editorLayer) return;
    if (state.editMode === 'text') {
      const rect = els.editorLayer.getBoundingClientRect();
      addTextAt((ev.clientX - rect.left) / state.previewScale, (ev.clientY - rect.top) / state.previewScale);
    } else {
      state.selectedOverlayId = null;
      renderEditorLayer(getSelectedPage(), state.previewScale);
    }
  });

  els.textFontFamily.addEventListener('change', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.fontFamily = els.textFontFamily.value; }));
  els.textFontSize.addEventListener('change', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.fontSizePt = clamp(Number(els.textFontSize.value) || 18, 6, 144); }));
  els.textAlign.addEventListener('change', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.align = els.textAlign.value; }));
  els.textColor.addEventListener('change', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.color = els.textColor.value; }));
  els.textBoldBtn.addEventListener('click', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.bold = !o.bold; }));
  els.textItalicBtn.addEventListener('click', () => updateSelectedOverlay(o => { if (o.kind === 'text') o.italic = !o.italic; }));
  els.objectOpacity.addEventListener('change', () => updateSelectedOverlay(o => { o.opacity = clamp((Number(els.objectOpacity.value) || 100) / 100, .1, 1); }));
  els.objectRotation.addEventListener('change', () => updateSelectedOverlay(o => { o.rotation = Number(els.objectRotation.value) || 0; }));
  els.sendBackBtn.addEventListener('click', () => moveSelectedOverlayLayer('back'));
  els.bringFrontBtn.addEventListener('click', () => moveSelectedOverlayLayer('front'));
  els.duplicateObjectBtn.addEventListener('click', duplicateSelectedOverlay);
  els.deleteObjectBtn.addEventListener('click', deleteSelectedOverlay);

  // Mover página para posição
  els.movePageCancelBtn.addEventListener('click', closeMovePagePopover);
  els.movePageOkBtn.addEventListener('click', confirmMovePage);
  els.movePageDestination.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); confirmMovePage(); } if (ev.key === 'Escape') { ev.preventDefault(); closeMovePagePopover(); } });

  // Organize
  els.closeOrganizeBtn.addEventListener('click', closeOrganizeModal);
  els.organizeModal.addEventListener('click', ev => { if (ev.target === els.organizeModal) closeOrganizeModal(); });
  els.organizeAddBlankBtn.addEventListener('click', () => insertBlankAt(state.pages.length));
  els.organizeAddFileBtn.addEventListener('click', () => triggerPicker('insert', state.pages.length));
  els.organizeDuplicateBtn.addEventListener('click', () => duplicateIds(orderedSelectedIds()));
  els.organizeExtractBtn.addEventListener('click', () => extractPages(orderedSelectedIds()));
  els.organizeDeleteBtn.addEventListener('click', () => deleteIds(orderedSelectedIds()));
  els.organizeGrid.addEventListener('dragover', ev => {
    if (!hasFileTransfer(ev.dataTransfer) || ev.target.closest('.organize-card')) return;
    ev.preventDefault(); if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
  });
  els.organizeGrid.addEventListener('drop', ev => {
    if (ev.target.closest('.organize-card') || !ev.dataTransfer?.files?.length) return;
    ev.preventDefault(); importFiles(ev.dataTransfer.files, { mode: state.pages.length ? 'insert' : 'replace', index: state.pages.length });
  });

  // Properties
  els.closePropertiesBtn.addEventListener('click', closePropertiesModal);
  els.closeAboutBtn?.addEventListener('click', closeAboutModal);
  els.aboutModal?.addEventListener('click', ev => { if (ev.target === els.aboutModal) closeAboutModal(); });
  els.propertiesModal.addEventListener('click', ev => { if (ev.target === els.propertiesModal) closePropertiesModal(); });

  // Export
  els.closeExportModalBtn.addEventListener('click', closeExportModal);
  els.cancelExportBtn.addEventListener('click', closeExportModal);
  els.exportModal.addEventListener('click', ev => { if (ev.target === els.exportModal) closeExportModal(); });
  $$('input[name="exportMode"]').forEach(r => r.addEventListener('change', updateExportSettingsUI));
  [els.colorMode, els.dpiRange, els.jpegQuality, els.monoDither].forEach(el => el.addEventListener('input', updateExportSettingsUI));
  els.confirmExportBtn.addEventListener('click', confirmExport);

  // Context menu
  els.pageContextMenu.addEventListener('click', ev => {
    ev.stopPropagation();
    const action = ev.target.closest('[data-context-action]')?.dataset.contextAction;
    if (!action) return;
    const ids = contextIds();
    const pageId = state.contextPageId;
    const idx = state.pages.findIndex(p => p.id === pageId);
    closeContextMenu();
    if (action === 'insert-before') openInsertMenu(idx < 0 ? 0 : idx, ev.clientX, ev.clientY);
    if (action === 'insert-after') openInsertMenu(idx < 0 ? state.pages.length : idx + 1, ev.clientX, ev.clientY);
    if (action === 'duplicate') duplicateIds(ids);
    if (action === 'move-to' && pageId) openMovePagePopover(pageId, { x:ev.clientX, y:ev.clientY });
    if (action === 'rotate-left') rotateIds(ids, -90);
    if (action === 'rotate-right') rotateIds(ids, 90);
    if (action === 'extract') extractPages(ids);
    if (action === 'delete') deleteIds(ids);
    if (action === 'image-original') setImageLayout(ids, 'original');
    if (action === 'image-fit') setImageLayout(ids, 'fit-a4');
    if (action === 'image-fill') setImageLayout(ids, 'fill-a4');
  });

  // Confirm modal
  els.confirmCancelBtn.addEventListener('click', () => resolveConfirm(false));
  els.confirmProceedBtn.addEventListener('click', () => resolveConfirm(true));

  document.addEventListener('click', ev => {
    if (!ev.target.closest('.document-menu-wrap')) closeDocumentMenu();
    if (!ev.target.closest('#insertMenu') && !ev.target.closest('.insert-btn') && !ev.target.closest('#insertBeforeBtn') && !ev.target.closest('#insertAfterBtn')) closeInsertMenu();
    if (!ev.target.closest('#pageContextMenu')) closeContextMenu();
    if (!ev.target.closest('#movePagePopover') && !ev.target.closest('[data-action="move"]') && !ev.target.closest('#pagePositionBtn') && !ev.target.closest('[data-context-action="move-to"]')) closeMovePagePopover();
  });

  // Shortcuts
  window.addEventListener('keydown', ev => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !editing) { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y' && !editing) { ev.preventDefault(); redo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'p') { ev.preventDefault(); printDocument(); return; }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); openExportModal(); return; }
    if (editing) return;
    if ((ev.key === 'v' || ev.key === 'V') && state.pages.length) { setEditMode('select'); return; }
    if ((ev.key === 't' || ev.key === 'T') && state.pages.length) { setEditMode('text'); return; }
    if ((ev.key === 'e' || ev.key === 'E') && getSelectedPage()?.kind === 'pdf') { setEditMode('edit-existing'); renderEditorLayer(getSelectedPage(), state.previewScale || 1); return; }
    if (ev.key === 'Delete' && state.selectedOverlayId && allModalsClosedForDelete()) { ev.preventDefault(); deleteSelectedOverlay(); return; }
    if (ev.key === 'Delete' && state.selectedIds.size && allModalsClosedForDelete()) { ev.preventDefault(); deleteIds(orderedSelectedIds()); return; }
    if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') && state.selectedOverlayId) {
      ev.preventDefault();
      const step = ev.shiftKey ? 10 : 1;
      updateSelectedOverlay(o => {
        const size = pageDisplaySizeSync(getSelectedPage());
        if (ev.key === 'ArrowLeft') o.xPt = clamp((o.xPt||0)-step, 0, Math.max(0,size.width-o.wPt));
        if (ev.key === 'ArrowRight') o.xPt = clamp((o.xPt||0)+step, 0, Math.max(0,size.width-o.wPt));
        if (ev.key === 'ArrowUp') o.yPt = clamp((o.yPt||0)-step, 0, Math.max(0,size.height-o.hPt));
        if (ev.key === 'ArrowDown') o.yPt = clamp((o.yPt||0)+step, 0, Math.max(0,size.height-o.hPt));
      });
      return;
    }
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); goPage(-1); return; }
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown') { ev.preventDefault(); goPage(1); return; }
    if (ev.key === 'Escape') {
      if (state.editMode === 'text' || state.editMode === 'edit-existing') { setEditMode('select'); return; }
      if (state.selectedOverlayId) { state.selectedOverlayId = null; renderEditorLayer(getSelectedPage(), state.previewScale); return; }
      closeDocumentMenu(); closeInsertMenu(); closeContextMenu(); closeMovePagePopover();
      if (!els.importSourceModal.classList.contains('hidden')) closeImportSourceModal();
      else if (!els.exportModal.classList.contains('hidden')) closeExportModal();
      else if (els.aboutModal && !els.aboutModal.classList.contains('hidden')) closeAboutModal();
      else if (!els.propertiesModal.classList.contains('hidden')) closePropertiesModal();
      else if (!els.organizeModal.classList.contains('hidden')) closeOrganizeModal();
      else if (!els.confirmModal.classList.contains('hidden')) resolveConfirm(false);
    }
  });

  function allModalsClosedForDelete() {
    return [els.importSourceModal, els.exportModal, els.propertiesModal, els.confirmModal].every(el => el.classList.contains('hidden'));
  }

  // Navegação do preview ampliado: barras nativas + pan com Espaço/arraste ou botão do meio.
  let previewSpacePressed = false;
  let previewPanning = false;
  let previewPanStartX = 0;
  let previewPanStartY = 0;
  let previewPanScrollLeft = 0;
  let previewPanScrollTop = 0;

  window.addEventListener('keydown', ev => {
    if (ev.code !== 'Space') return;
    const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
    if (editing) return;
    previewSpacePressed = true;
    els.previewStage.classList.add('pan-ready');
  });

  window.addEventListener('keyup', ev => {
    if (ev.code !== 'Space') return;
    previewSpacePressed = false;
    if (!previewPanning) els.previewStage.classList.remove('pan-ready');
  });

  els.previewStage.addEventListener('pointerdown', ev => {
    const wantsPan = ev.button === 1 || (ev.button === 0 && previewSpacePressed);
    if (!wantsPan) return;
    ev.preventDefault();
    ev.stopPropagation();
    previewPanning = true;
    previewPanStartX = ev.clientX;
    previewPanStartY = ev.clientY;
    previewPanScrollLeft = els.previewStage.scrollLeft;
    previewPanScrollTop = els.previewStage.scrollTop;
    els.previewStage.classList.add('panning');
    try { els.previewStage.setPointerCapture(ev.pointerId); } catch (_) {}
  }, true);

  els.previewStage.addEventListener('pointermove', ev => {
    if (!previewPanning) return;
    ev.preventDefault();
    els.previewStage.scrollLeft = previewPanScrollLeft - (ev.clientX - previewPanStartX);
    els.previewStage.scrollTop = previewPanScrollTop - (ev.clientY - previewPanStartY);
  });

  const stopPreviewPan = ev => {
    if (!previewPanning) return;
    previewPanning = false;
    els.previewStage.classList.remove('panning');
    if (!previewSpacePressed) els.previewStage.classList.remove('pan-ready');
    if (ev?.pointerId != null) { try { els.previewStage.releasePointerCapture(ev.pointerId); } catch (_) {} }
  };
  els.previewStage.addEventListener('pointerup', stopPreviewPan);
  els.previewStage.addEventListener('pointercancel', stopPreviewPan);

  // Roda/trackpad: rolagem normal dentro da página; ao atingir uma borda vertical,
  // continua de forma intuitiva para a página anterior/seguinte. Shift + roda mantém pan horizontal.
  let previewWheelAccumulator = 0;
  let previewWheelLockedUntil = 0;
  let previewWheelResetTimer = 0;
  const PAGE_WHEEL_THRESHOLD = 54;
  const PAGE_WHEEL_LOCK_MS = 360;

  els.previewStage.addEventListener('wheel', ev => {
    const stage = els.previewStage;
    if (!state.pages.length || state.busy) return;

    if (ev.shiftKey && stage.scrollWidth > stage.clientWidth) {
      ev.preventDefault();
      stage.scrollLeft += ev.deltaY || ev.deltaX;
      return;
    }

    const dy = ev.deltaY;
    if (!dy) return;
    const maxY = Math.max(0, stage.scrollHeight - stage.clientHeight);
    const epsilon = 2;
    const atTop = stage.scrollTop <= epsilon;
    const atBottom = stage.scrollTop >= maxY - epsilon;
    const noVerticalOverflow = maxY <= epsilon;
    const wantsPrev = dy < 0 && (atTop || noVerticalOverflow);
    const wantsNext = dy > 0 && (atBottom || noVerticalOverflow);

    // Enquanto ainda há conteúdo da página na direção do gesto, deixa o scroll nativo trabalhar.
    if (!wantsPrev && !wantsNext) {
      previewWheelAccumulator = 0;
      return;
    }

    // Na borda, evita que o navegador tente rolar a página externa e acumula o gesto.
    ev.preventDefault();
    const now = performance.now();
    if (now < previewWheelLockedUntil) return;

    const sign = Math.sign(dy);
    if (Math.sign(previewWheelAccumulator) && Math.sign(previewWheelAccumulator) !== sign) previewWheelAccumulator = 0;
    previewWheelAccumulator += dy;
    clearTimeout(previewWheelResetTimer);
    previewWheelResetTimer = setTimeout(() => { previewWheelAccumulator = 0; }, 180);

    if (Math.abs(previewWheelAccumulator) < PAGE_WHEEL_THRESHOLD) return;
    previewWheelAccumulator = 0;
    previewWheelLockedUntil = now + PAGE_WHEEL_LOCK_MS;

    if (wantsNext) goPage(1, 'top');
    else if (wantsPrev) goPage(-1, 'bottom');
  }, { passive:false });


  // PWA / instalação no navegador -------------------------------------------------
  let deferredInstallPrompt = null;

  function runningStandalone() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
  }

  function refreshInstallButton() {
    if (!els.installAppBtn) return;
    if (runningStandalone()) {
      els.installAppBtn.classList.add('is-installed');
      els.installAppBtn.classList.remove('install-ready');
      els.installAppBtn.disabled = true;
      if (els.installAppLabel) els.installAppLabel.textContent = 'Instalado';
      els.installAppBtn.title = 'PDF Studio já está instalado neste navegador';
      return;
    }
    els.installAppBtn.disabled = false;
    els.installAppBtn.classList.toggle('install-ready', Boolean(deferredInstallPrompt));
    if (els.installAppLabel) els.installAppLabel.textContent = 'Instalar no navegador';
    els.installAppBtn.title = deferredInstallPrompt
      ? 'Instalar o PDF Studio como aplicativo neste navegador'
      : 'Instalar o PDF Studio pelo menu do navegador';
  }

  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    deferredInstallPrompt = ev;
    refreshInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    refreshInstallButton();
    showToast('PDF Studio instalado no navegador.', 'success', 3600);
  });

  els.installAppBtn?.addEventListener('click', async () => {
    if (runningStandalone()) return;
    if (!deferredInstallPrompt) {
      showToast('Se o aviso ainda não apareceu, use o menu do Chrome e escolha “Instalar PDF Studio”.', 'info', 5200);
      return;
    }
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (_) {
      // O navegador controla o prompt; nenhuma ação adicional é necessária.
    } finally {
      deferredInstallPrompt = null;
      refreshInstallButton();
    }
  });

  // O GitHub Pages usa HTTPS, portanto o Service Worker pode deixar o Studio offline.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('Service Worker não registrado:', err));
    }, { once:true });
  }

  // Entrada automática de arquivos ---------------------------------------------------
  // 1) PWA: ao usar "Abrir com > PDF Studio", o arquivo é entregue pela launchQueue.
  if ('launchQueue' in window && window.launchQueue?.setConsumer) {
    window.launchQueue.setConsumer(async launchParams => {
      try {
        const handles = Array.from(launchParams?.files || []);
        if (!handles.length) return;
        const files = [];
        for (const handle of handles) files.push(await handle.getFile());
        if (files.length) await importFiles(files, { mode:'replace', index:0 });
      } catch (err) {
        showToast(err?.message || 'Não foi possível abrir o arquivo enviado pelo sistema.', 'error', 5200);
      }
    });
  }

  function safeIncomingFileName(name, fallback = 'documento.pdf') {
    const clean = String(name || fallback).replace(/[\\/:*?"<>|]+/g, '-').trim() || fallback;
    return clean;
  }

  async function openIncomingPdfBuffer(buffer, name = 'documento.pdf') {
    const safeName = safeIncomingFileName(name);
    const finalName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;
    const blob = new Blob([buffer], { type:'application/pdf' });
    const file = new File([blob], finalName, { type:'application/pdf' });
    return await importFiles([file], { mode:'replace', index:0 });
  }

  // 2) Extensão: o handler MIME entrega diretamente o stream já aberto pelo Chrome.
  //    READY/PING tornam a passagem robusta mesmo quando o iframe termina antes do stream.
  window.addEventListener('message', async ev => {
    const data = ev.data || {};
    if (!String(ev.origin || '').startsWith('chrome-extension://')) return;
    if (data.source !== 'PDFSTUDIO_EXTENSION') return;

    if (data.type === 'PING') {
      try { ev.source?.postMessage({ source:'PDFSTUDIO_APP', type:'READY' }, ev.origin); } catch (_) {}
      return;
    }

    if (data.type !== 'OPEN_PDF_BUFFER' || !data.buffer) return;
    try {
      const opened = await openIncomingPdfBuffer(data.buffer, data.name || 'documento.pdf');
      if (opened === false) throw new Error('O PDF Studio não conseguiu importar o arquivo recebido.');
      try {
        ev.source?.postMessage({
          source:'PDFSTUDIO_APP',
          type:'OPEN_COMPLETE',
          requestId:data.requestId || '',
          name:safeIncomingFileName(data.name || 'documento.pdf')
        }, ev.origin);
      } catch (_) {}
    } catch (err) {
      try {
        ev.source?.postMessage({
          source:'PDFSTUDIO_APP',
          type:'OPEN_ERROR',
          requestId:data.requestId || '',
          error:err?.message || 'Não foi possível abrir o PDF.'
        }, ev.origin);
      } catch (_) {}
      showToast(err?.message || 'Não foi possível abrir o PDF recebido da extensão.', 'error', 5200);
    }
  });

  // 3) URL: ?file=https%3A%2F%2F...%2Farquivo.pdf
  //    Útil para integrações web. A URL precisa ser acessível ao navegador (CORS quando for outro domínio).
  async function openFileParameter() {
    let raw = '';
    try {
      const params = new URLSearchParams(location.search);
      raw = params.get('file') || params.get('open') || '';
      if (!raw || params.get('extension') === '1') return;
      const target = new URL(raw, location.href);
      if (!/^https?:$/.test(target.protocol)) throw new Error('O parâmetro de arquivo aceita apenas URLs HTTP/HTTPS.');

      const response = await fetch(target.href, { credentials: target.origin === location.origin ? 'same-origin' : 'omit' });
      if (!response.ok) throw new Error(`Não foi possível receber o arquivo (${response.status}).`);
      const blob = await response.blob();
      const contentType = blob.type || response.headers.get('content-type') || '';
      let name = new URL(target.href).pathname.split('/').pop() || 'documento.pdf';
      try { name = decodeURIComponent(name); } catch (_) {}
      if (!name.toLowerCase().endsWith('.pdf') && contentType.includes('pdf')) name += '.pdf';
      const file = new File([blob], safeIncomingFileName(name), { type: contentType || 'application/pdf' });
      await importFiles([file], { mode:'replace', index:0 });
    } catch (err) {
      if (raw) showToast(err?.message || 'Não foi possível abrir o arquivo informado na URL.', 'error', 6000);
    }
  }

  // Quando carregado dentro do manipulador da extensão, avisa que está pronto.
  try {
    const params = new URLSearchParams(location.search);
    if (window.parent !== window && params.get('extension') === '1') {
      window.parent.postMessage({ source:'PDFSTUDIO_APP', type:'READY' }, '*');
    } else if (params.get('file') || params.get('open')) {
      queueMicrotask(openFileParameter);
    }
  } catch (_) {}

  refreshInstallButton();

  window.addEventListener('beforeunload', ev => {
    if (!state.dirty) return;
    ev.preventDefault();
    ev.returnValue = '';
  });

  updateToolbarState();
  updateExportSettingsUI();
})();
