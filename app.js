/*
  app.js - Functional skeleton for a classroom question list manager

  Highlights:
  - SPA-like view switching (Home, Editor, Play)
  - Create workflow via two modals
  - Question model supporting single-answer and multiple-choice (2–4 options)
  - LocalStorage persistence for lists
  - Background music with volume and mute controls
  - Preview/Play view with reveal answer (for single) and choices (for multi)

  Data model (stored in localStorage under KEY = "questionLists"):
  [
    {
      id: string,
      name: string,
      questions: [
        // type: "single"
        { id: string, type: 'single', text: string, answer: string, alternates?: string[] },
        // type: "multi"
        { id: string, type: 'multi', text: string, options: string[], correct: number[] } // correct indexes
      ]
    }
  ]
*/

(function () {
  console.log('✅ Question List Manager - app.js loaded successfully');

  var GENERATOR_URL = 'http://localhost:3001/generate';
  if (window.location.hostname === 'wingit.games' || window.location.hostname == 'zbw07syu.github.io') {
      GENERATOR_URL = 'https://wingit-question-generator.fly.dev/generate';
  }
  
  // ----- Utilities -----
  const uid = () => Math.random().toString(36).slice(2, 9);

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const toast = (msg, ms = 1800) => {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => (el.hidden = true), ms);
  };

  const saveToStorage = (lists) => localStorage.setItem('questionLists', JSON.stringify(lists));
  const loadFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem('questionLists') || '[]');
    } catch {
      return [];
    }
  };

  const normalizeIcebreakQuestion = (raw) => {
    if (!raw) return null;
    const id = raw.id || uid();
    const prompt = Object.prototype.hasOwnProperty.call(raw, 'prompt') ? raw.prompt : raw.text || '';
    const acceptedSource = Array.isArray(raw.accepted)
      ? raw.accepted
      : [
          ...(typeof raw.answer === 'string' && raw.answer.trim() ? [raw.answer] : []),
          ...(Array.isArray(raw.alternates) ? raw.alternates : []),
        ];
    const accepted = acceptedSource
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
    const result = { id, type: 'icebreak', prompt: prompt || '', accepted };
    if (raw.image) result.image = raw.image;
    return result;
  };

  const normalizeRegularQuestion = (raw) => {
    if (!raw) return null;
    const id = raw.id || uid();
    if (raw.type === 'multi') {
      const options = Array.isArray(raw.options) && raw.options.length ? raw.options.slice(0, 4) : ['', ''];
      const correct = Array.isArray(raw.correct) ? raw.correct.filter((idx) => Number.isInteger(idx)) : [];
      const result = {
        id,
        type: 'multi',
        text: raw.text || '',
        options: options.map((opt) => (typeof opt === 'string' ? opt : '')),
        correct: [...new Set(correct)].sort((a, b) => a - b),
      };
      if (raw.image) result.image = raw.image;
      return result;
    }

    const alternates = Array.isArray(raw.alternates) ? raw.alternates.filter((a) => typeof a === 'string') : [];
    const result = {
      id,
      type: 'single',
      text: raw.text || raw.prompt || '',
      answer: typeof raw.answer === 'string' ? raw.answer : (raw.accepted && typeof raw.accepted[0] === 'string' ? raw.accepted[0] : ''),
      alternates,
    };
    if (raw.image) result.image = raw.image;
    return result;
  };

  const normalizeList = (list) => {
    if (!list) return null;
    const listType = list.listType === 'icebreak' ? 'icebreak' : list.listType === 'vocab' ? 'vocab' : 'regular';
    const questions = Array.isArray(list.questions)
      ? list.questions
          .map((q) => {
            if (!q) return null;
            const id = q.id || uid();
            if (listType === 'icebreak') {
              const prompt = Object.prototype.hasOwnProperty.call(q, 'prompt') ? q.prompt : (q.text || '');
              const acceptedSource = Array.isArray(q.accepted)
                ? q.accepted
                : [
                    ...(typeof q.answer === 'string' && q.answer.trim() ? [q.answer] : []),
                    ...(Array.isArray(q.alternates) ? q.alternates : []),
                  ];
              const accepted = acceptedSource
                .map((a) => (typeof a === 'string' ? a.trim() : ''))
                .filter(Boolean);
              const result = { id, type: 'icebreak', prompt: prompt || '', accepted };
              if (q.image) result.image = q.image;
              return result;
            }

            if (listType === 'vocab' || q.type === 'vocab') {
              const result = {
                id,
                type: 'vocab',
                word: q.word || '',
                image: q.image || '',
                definition: q.definition || '',
              };
              return result;
            }

            if (q.type === 'multi') {
              const options = Array.isArray(q.options) && q.options.length ? q.options.slice(0, 4) : ['', ''];
              const correct = Array.isArray(q.correct) ? q.correct.filter((idx) => Number.isInteger(idx)) : [];
              const result = {
                id,
                type: 'multi',
                text: q.text || '',
                options: options.map((opt) => (typeof opt === 'string' ? opt : '')),
                correct: [...new Set(correct)].sort((a, b) => a - b),
              };
              if (q.image) result.image = q.image;
              return result;
            }

            const alternates = Array.isArray(q.alternates) ? q.alternates.filter((a) => typeof a === 'string') : [];
            const result = {
              id,
              type: 'single',
              text: q.text || '',
              answer: typeof q.answer === 'string' ? q.answer : '',
              alternates,
            };
            if (q.image) result.image = q.image;
            return result;
          })
          .filter(Boolean)
      : [];

    return {
      id: list.id || uid(),
      name: list.name || 'Untitled',
      listType,
      questions,
    };
  };

  const normalizeLists = (lists) => {
    return Array.isArray(lists) ? lists.map(normalizeList).filter(Boolean) : [];
  };

  // ----- App State -----
  let state = {
    view: 'home', // 'home' | 'editor' | 'play'
    lists: normalizeLists(loadFromStorage()),
    // editor state
    editingListId: null, // if editing existing
    draft: null, // { id, name, listType, questions: [...] }
    // play state
    play: { listId: null, index: 0 },
  };

  // ----- View Management -----
  function showView(name) {
    state.view = name;
    $('#homeView').hidden = name !== 'home';
    $('#editorView').hidden = name !== 'editor';
    $('#playView').hidden = name !== 'play';
  }

  // ----- Render Home -----
  function renderHome() {
    const container = $('#listsContainer');
    container.innerHTML = '';

    const query = $('#searchInput').value.toLowerCase().trim();
    const filtered = state.lists.filter((l) => !query || (l.name || '').toLowerCase().includes(query));

    $('#emptyState').hidden = filtered.length !== 0;

    for (const list of filtered) {
      const li = document.createElement('li');
      li.className = 'list-item';
      const displayName = list.listType === 'icebreak' 
        ? `Icebreak QL: ${escapeHtml(list.name || 'Untitled')}`
        : list.listType === 'vocab'
        ? `Vocab List: ${escapeHtml(list.name || 'Untitled')}`
        : escapeHtml(list.name || 'Untitled');
      li.innerHTML = `
        <div class="title">${displayName}</div>
        <div class="meta">${list.questions.length} ${list.listType === 'vocab' ? 'word(s)' : 'question(s)'}</div>
        <div class="actions">
          <button data-action="edit" class="secondary">Edit</button>
          <button data-action="delete" class="danger">Delete</button>
          <button data-action="play" class="primary">Play</button>
        </div>
      `;

      li.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(list.id));
      li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteList(list.id));
      li.querySelector('[data-action="play"]').addEventListener('click', () => startPlay(list.id));

      container.appendChild(li);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ----- Create Workflow (Modals) -----
  const modal1 = $('#modal1');
  const modal2 = $('#modal2');

  const ICEBREAK_TOTALS = [8, 12, 16];

  function openModal1() {
    $('#modalListName').value = '';
    $('#modalListType').value = 'regular';
    $('#modalTotalQuestions').value = '';
    $('#modalIcebreakCount').value = '8';
    modal1.dataset.listType = 'regular';
    modal1.dataset.total = '';
    modal1.dataset.name = '';
    updateModal1Visibility('regular');
    modal1.hidden = false;
  }
  function closeModal1() { modal1.hidden = true; }

  function updateModal1Visibility(type) {
    const isIcebreak = type === 'icebreak';
    const isVocab = type === 'vocab';
    const totalInput = $('#modalTotalQuestions');
    const totalLabel = totalInput?.closest('label');
    const icebreakSelect = $('#modalIcebreakCount');
    const icebreakLabel = icebreakSelect?.closest('label');

    if (totalLabel) totalLabel.hidden = isIcebreak;
    if (totalInput) totalInput.hidden = false;
    if (totalInput) totalInput.disabled = isIcebreak;

    if (icebreakLabel) icebreakLabel.hidden = !isIcebreak;
    if (icebreakSelect) icebreakSelect.hidden = !isIcebreak;
    if (icebreakSelect) icebreakSelect.disabled = !isIcebreak;

    $('#icebreakCountHint').hidden = !isIcebreak;
    modal1.dataset.listType = type;
  }

  function openModal2(listType = 'regular') {
    modal2.dataset.listType = listType;
    $('#modalSingleCount').value = '0';
    $('#modalMultiCount').value = '0';
    $('#modal2Error').hidden = true;

    const singleLabel = $('#modalSingleCount')?.closest('label');
    const multiLabel = $('#modalMultiCount')?.closest('label');
    const isIcebreak = listType === 'icebreak';

    if (singleLabel) singleLabel.hidden = isIcebreak;
    if (multiLabel) multiLabel.hidden = isIcebreak;

    if (isIcebreak) {
      modal2.hidden = true;
      return;
    }

    modal2.hidden = false;
  }
  function closeModal2() { modal2.hidden = true; }

  function validateIcebreakTotal(value) {
    const num = Number(value);
    if (!Number.isInteger(num)) return null;
    return ICEBREAK_TOTALS.includes(num) ? num : null;
  }

  // This builds the initial draft per modal inputs
  function createDraft({ listName, listType, total, singleCount, multiCount }) {
    const questions = [];

    if (listType === 'icebreak') {
      for (let i = 0; i < total; i++) {
        questions.push({ id: uid(), type: 'icebreak', prompt: '', accepted: ['', '', '', '', '', '', '', ''] });

      }
    } else if (listType === 'vocab') {
      for (let i = 0; i < total; i++) {
        questions.push({ id: uid(), type: 'vocab', word: '', image: '', definition: '' });
      }
    } else {
      for (let i = 0; i < singleCount; i++) {
        questions.push({ id: uid(), type: 'single', text: '', answer: '', alternates: [] });
      }
      for (let i = 0; i < multiCount; i++) {
        questions.push({ id: uid(), type: 'multi', text: '', options: ['', ''], correct: [] });
      }
    }

    const id = uid();
    state.draft = {
      id,
      name: listName || 'Untitled',
      listType,
      questions,
    };

    state.editingListId = null;

    enterEditor();
  }

  // ----- Editor View -----
  function enterEditor() {
    showView('editor');
    updateEditorCounters();
    $('#editorTitle').textContent = state.editingListId ? 'Edit List' : 'New List';
    $('#listNameInput').value = state.draft?.name || '';
    renderQuestionsEditor();
  }

  function updateEditorCounters() {
    const total = state.draft?.questions.length || 0;
    const single = state.draft?.questions.filter((q) => q.type === 'single').length || 0;
    const multi = state.draft?.questions.filter((q) => q.type === 'multi').length || 0;
    const icebreak = state.draft?.questions.filter((q) => q.type === 'icebreak').length || 0;
    const vocab = state.draft?.questions.filter((q) => q.type === 'vocab').length || 0;

    $('#countTotal').textContent = total;
    $('#countSingle').textContent = single;
    $('#countMulti').textContent = multi;

    const listType = state.draft?.listType;
    $('#countListType').textContent = listType === 'icebreak' ? 'Icebreak' : listType === 'vocab' ? 'Vocab List' : 'Regular';
    $('#countSingleWrap').hidden = listType === 'icebreak' || listType === 'vocab';
    $('#countMultiWrap').hidden = listType === 'icebreak' || listType === 'vocab';
    const icebreakWrap = $('#countIcebreakWrap');
    if (icebreakWrap) {
      icebreakWrap.hidden = listType !== 'icebreak';
      if (icebreakWrap.querySelector('strong')) {
        icebreakWrap.querySelector('strong').textContent = icebreak;
      }
    }
  }

  function renderQuestionsEditor() {
    const container = $('#questionsContainer');
    container.innerHTML = '';

    if (!state.draft) return;

    const isIcebreakList = state.draft.listType === 'icebreak';

    state.draft.questions.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'question-card';

      if (isIcebreakList) {
        card.classList.add('icebreak-card');
      }

      if (q.type === 'icebreak') {
        card.innerHTML = `
          <div class="row">
            <label>Prompt
              <textarea data-kind="prompt" data-qid="${q.id}" rows="2" placeholder="Type the prompt..."></textarea>
            </label>
          </div>
          <div class="row">
            <label>Image (optional)
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" data-kind="image" data-qid="${q.id}" placeholder="e.g., question-images/my-image.gif" style="flex:1;" />
                <input type="file" data-kind="image-upload" data-qid="${q.id}" accept="image/*" style="display:none;" />
                <button class="ghost" data-action="upload-image" data-qid="${q.id}" title="Upload image file">📁 Upload</button>
              </div>
              <div class="image-preview" data-qid="${q.id}" style="margin-top:8px; display:none;">
                <img src="" alt="Preview" style="max-width:200px; max-height:150px; border-radius:4px; border:1px solid #ddd;" />
              </div>
            </label>
          </div>
          <div class="row">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <label>Accepted questions</label>
              <button class="ghost" data-action="add-accepted" data-qid="${q.id}">+ Add accepted question</button>
            </div>
            <div class="accepted-list" data-qid="${q.id}" style="display:flex; flex-direction:column; gap:6px; margin-top:6px;"></div>
          </div>
          <div class="row" style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="ghost" data-action="delete-q" data-qid="${q.id}">Delete</button>
          </div>
        `;
      } else if (q.type === 'vocab') {
        card.innerHTML = `
          <div class="row">
            <label>Word
              <input type="text" data-kind="word" data-qid="${q.id}" placeholder="Type the word..." />
            </label>
          </div>
          <div class="row">
            <label>Image (optional - but either image OR definition required)
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" data-kind="image" data-qid="${q.id}" placeholder="e.g., question-images/my-image.gif" style="flex:1;" />
                <input type="file" data-kind="image-upload" data-qid="${q.id}" accept="image/*" style="display:none;" />
                <button class="ghost" data-action="upload-image" data-qid="${q.id}" title="Upload image file">📁 Upload</button>
              </div>
              <div class="image-preview" data-qid="${q.id}" style="margin-top:8px; display:none;">
                <img src="" alt="Preview" style="max-width:200px; max-height:150px; border-radius:4px; border:1px solid #ddd;" />
              </div>
            </label>
          </div>
          <div class="row">
            <label>Definition (optional - but either image OR definition required)
              <textarea data-kind="definition" data-qid="${q.id}" rows="3" placeholder="Type the definition..."></textarea>
            </label>
          </div>
          <div class="row" style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="ghost" data-action="delete-q" data-qid="${q.id}">Delete</button>
          </div>
        `;
      } else if (q.type === 'single') {
        card.innerHTML = `
          <div class="row">
            <label>Question text
              <textarea data-kind="text" data-qid="${q.id}" rows="2" placeholder="Type the question..."></textarea>
            </label>
          </div>
          <div class="row">
            <label>Image (optional)
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" data-kind="image" data-qid="${q.id}" placeholder="e.g., question-images/my-image.gif" style="flex:1;" />
                <input type="file" data-kind="image-upload" data-qid="${q.id}" accept="image/*" style="display:none;" />
                <button class="ghost" data-action="upload-image" data-qid="${q.id}" title="Upload image file">📁 Upload</button>
              </div>
              <div class="image-preview" data-qid="${q.id}" style="margin-top:8px; display:none;">
                <img src="" alt="Preview" style="max-width:200px; max-height:150px; border-radius:4px; border:1px solid #ddd;" />
              </div>
            </label>
          </div>
          <div class="row cols-2">
            <label>Correct answer
              <input type="text" data-kind="answer" data-qid="${q.id}" placeholder="Type the correct answer" />
            </label>
            <div style="align-self:end; display:flex; gap:8px;">
              <button class="ghost" data-action="delete-q" data-qid="${q.id}">Delete</button>
            </div>
          </div>
          <div class="row">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <label>Other accepted answers</label>
              <button class="ghost" data-action="add-alt" data-qid="${q.id}">+ Add accepted answer</button>
            </div>
            <div class="alt-answers" data-qid="${q.id}" style="display:flex; flex-direction:column; gap:6px; margin-top:6px;"></div>
          </div>
        `;
      } else {
        // Multiple-choice
        const optionsHtml = (q.options || []).map((opt, i) => `
          <div class="option-row">
            <input type="text" data-kind="option" data-index="${i}" data-qid="${q.id}" placeholder="Option ${i + 1}" />
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" data-kind="correct" data-index="${i}" data-qid="${q.id}" />
              Correct
            </label>
            <button class="ghost" data-action="remove-opt" data-index="${i}" data-qid="${q.id}">✕</button>
          </div>
        `).join('');

        card.innerHTML = `
          <div class="row">
            <label>Question text
              <textarea data-kind="text" data-qid="${q.id}" rows="2" placeholder="Type the question..."></textarea>
            </label>
          </div>
          <div class="row">
            <label>Image (optional)
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" data-kind="image" data-qid="${q.id}" placeholder="e.g., question-images/my-image.gif" style="flex:1;" />
                <input type="file" data-kind="image-upload" data-qid="${q.id}" accept="image/*" style="display:none;" />
                <button class="ghost" data-action="upload-image" data-qid="${q.id}" title="Upload image file">📁 Upload</button>
              </div>
              <div class="image-preview" data-qid="${q.id}" style="margin-top:8px; display:none;">
                <img src="" alt="Preview" style="max-width:200px; max-height:150px; border-radius:4px; border:1px solid #ddd;" />
              </div>
            </label>
          </div>
          <div class="row">
            <div class="choices">
              ${optionsHtml}
            </div>
            <button class="ghost add-option" data-action="add-opt" data-qid="${q.id}">+ Add option</button>
          </div>
          <div class="row" style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="ghost" data-action="delete-q" data-qid="${q.id}">Delete</button>
          </div>
        `;
      }

      // Append then set values and states
      container.appendChild(card);

      if (q.type === 'icebreak') {
        const promptInput = card.querySelector('[data-kind="prompt"]');
        if (promptInput) promptInput.value = q.prompt || '';
        const acceptedWrap = card.querySelector(`.accepted-list[data-qid="${q.id}"]`);
        if (acceptedWrap) {
          const acceptedList = Array.isArray(q.accepted) ? q.accepted : [];
          acceptedWrap.innerHTML = acceptedList.map((value, index) => `
            <div class="option-row">
              <input type="text" data-kind="accepted" data-index="${index}" data-qid="${q.id}" placeholder="Accepted question ${index + 1}" />
              <button class="ghost" data-action="remove-accepted" data-index="${index}" data-qid="${q.id}">✕</button>
            </div>
          `).join('');
          acceptedList.forEach((value, index) => {
            const input = card.querySelector(`[data-kind="accepted"][data-index="${index}"]`);
            if (input) input.value = value;
          });
        }
      } else if (q.type === 'vocab') {
        const wordInput = card.querySelector('[data-kind="word"]');
        if (wordInput) wordInput.value = q.word || '';
        const definitionInput = card.querySelector('[data-kind="definition"]');
        if (definitionInput) definitionInput.value = q.definition || '';
        const imageInput = card.querySelector('[data-kind="image"]');
        if (imageInput) imageInput.value = q.image || '';
        // Show image preview if image exists
        if (q.image) {
          const previewContainer = card.querySelector(`.image-preview[data-qid="${q.id}"]`);
          if (previewContainer) {
            const img = previewContainer.querySelector('img');
            if (img) {
              img.src = q.image;
              previewContainer.style.display = 'block';
            }
          }
        }
      } else if (q.type === 'single') {
        const textInput = card.querySelector('[data-kind="text"]');
        if (textInput) textInput.value = q.text || '';
        const answerInput = card.querySelector('[data-kind="answer"]');
        if (answerInput) answerInput.value = q.answer || '';
        const altWrap = card.querySelector(`.alt-answers[data-qid="${q.id}"]`);
        if (altWrap) {
          const alts = Array.isArray(q.alternates) ? q.alternates : [];
          altWrap.innerHTML = alts.map((a, i) => `
            <div class="option-row">
              <input type="text" data-kind="alt" data-index="${i}" data-qid="${q.id}" placeholder="Alternate answer ${i + 1}" />
              <button class="ghost" data-action="remove-alt" data-index="${i}" data-qid="${q.id}">✕</button>
            </div>
          `).join('');
          alts.forEach((a, i) => {
            const inp = card.querySelector(`[data-kind="alt"][data-index="${i}"]`);
            if (inp) inp.value = a;
          });
        }
      } else {
        const textInput = card.querySelector('[data-kind="text"]');
        if (textInput) textInput.value = q.text || '';
        (q.options || []).forEach((opt, i) => {
          const inp = card.querySelector(`[data-kind="option"][data-index="${i}"]`);
          if (inp) inp.value = opt;
        });
        (q.correct || []).forEach((ci) => {
          const chk = card.querySelector(`[data-kind="correct"][data-index="${ci}"]`);
          if (chk) chk.checked = true;
        });
      }

      // Wire up events for this card
      card.addEventListener('input', (e) => {
        const t = e.target;
        const qid = t.getAttribute('data-qid');
        const kind = t.getAttribute('data-kind');
        const qRef = state.draft.questions.find((x) => x.id === qid);
        if (!qRef) return;

        if (kind === 'text') qRef.text = t.value;
        if (kind === 'answer') qRef.answer = t.value;
        if (kind === 'alt') {
          const idx = Number(t.getAttribute('data-index'));
          qRef.alternates = Array.isArray(qRef.alternates) ? qRef.alternates : [];
          qRef.alternates[idx] = t.value;
        }
        if (kind === 'option') {
          const idx = Number(t.getAttribute('data-index'));
          qRef.options[idx] = t.value;
        }
        if (kind === 'correct') {
          const idx = Number(t.getAttribute('data-index'));
          const checked = t.checked;
          const arr = new Set(qRef.correct || []);
          if (checked) arr.add(idx); else arr.delete(idx);
          qRef.correct = Array.from(arr).sort((a,b)=>a-b);
        }
        if (kind === 'prompt') {
          qRef.prompt = t.value;
        }
        if (kind === 'accepted') {
          const idx = Number(t.getAttribute('data-index'));
          qRef.accepted = Array.isArray(qRef.accepted) ? qRef.accepted : [];
          qRef.accepted[idx] = t.value;
        }
        if (kind === 'word') {
          qRef.word = t.value;
        }
        if (kind === 'definition') {
          qRef.definition = t.value;
        }
        if (kind === 'image') {
          qRef.image = t.value.trim();
          // Update preview
          const previewContainer = card.querySelector(`.image-preview[data-qid="${qid}"]`);
          if (previewContainer) {
            const img = previewContainer.querySelector('img');
            if (qRef.image) {
              img.src = qRef.image;
              previewContainer.style.display = 'block';
            } else {
              previewContainer.style.display = 'none';
            }
          }
        }
      });

      card.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const qid = btn.getAttribute('data-qid');
        const qRef = state.draft.questions.find((x) => x.id === qid);
        if (!qRef) return;

        if (action === 'reveal' && qRef.type === 'single') {
          alert(`Answer: ${qRef.answer || '(not set)'}`);
        }

        if (action === 'add-opt' && qRef.type === 'multi') {
          // Allow 2–4 options
          qRef.options = qRef.options || [];
          if (qRef.options.length >= 4) {
            toast('Maximum of 4 options.');
          } else {
            qRef.options.push('');
          }
          renderQuestionsEditor();
        }

        if (action === 'remove-opt' && qRef.type === 'multi') {
          const idx = Number(btn.getAttribute('data-index'));
          if ((qRef.options || []).length <= 2) {
            toast('Minimum of 2 options.');
          } else {
            qRef.options.splice(idx, 1);
            // remove any correct index that pointed to removed item and reindex
            qRef.correct = (qRef.correct || [])
              .filter(i => i !== idx)
              .map(i => (i > idx ? i - 1 : i));
          }
          renderQuestionsEditor();
        }

        if (action === 'delete-q') {
          state.draft.questions = state.draft.questions.filter((x) => x.id !== qid);
          updateEditorCounters();
          renderQuestionsEditor();
        }

        if (action === 'add-alt' && qRef.type === 'single') {
          qRef.alternates = Array.isArray(qRef.alternates) ? qRef.alternates : [];
          qRef.alternates.push('');
          renderQuestionsEditor();
        }

        if (action === 'remove-alt' && qRef.type === 'single') {
          const idx = Number(btn.getAttribute('data-index'));
          if (idx >= 0) {
            qRef.alternates = (qRef.alternates || []).filter((_, i) => i !== idx);
          }
          renderQuestionsEditor();
        }

        if (action === 'add-accepted' && qRef.type === 'icebreak') {
          qRef.accepted = Array.isArray(qRef.accepted) ? qRef.accepted : [];
          qRef.accepted.push('');
          renderQuestionsEditor();
        }

        if (action === 'remove-accepted' && qRef.type === 'icebreak') {
          const idx = Number(btn.getAttribute('data-index'));
          if (idx >= 0) {
            qRef.accepted = (qRef.accepted || []).filter((_, i) => i !== idx);
          }
          renderQuestionsEditor();
        }

        if (action === 'upload-image') {
          const fileInput = card.querySelector(`[data-kind="image-upload"][data-qid="${qid}"]`);
          if (fileInput) fileInput.click();
        }
      });

      // Handle file upload
      const fileInput = card.querySelector('[data-kind="image-upload"]');
      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast('Please select an image file.');
            return;
          }

          // Validate file size (max 500KB recommended)
          if (file.size > 500 * 1024) {
            const proceed = confirm('File is larger than 500KB. This may affect loading performance. Continue?');
            if (!proceed) {
              e.target.value = '';
              return;
            }
          }

          const qid = fileInput.getAttribute('data-qid');
          const qRef = state.draft.questions.find((x) => x.id === qid);
          if (!qRef) return;

          try {
            // Create the path for the image
            const imagePath = `question-images/${file.name}`;
            
            // Update the question with the image path
            qRef.image = imagePath;
            
            // Update the text input field
            const imageInput = card.querySelector(`[data-kind="image"][data-qid="${qid}"]`);
            if (imageInput) imageInput.value = imagePath;
            
            // Show preview
            const previewContainer = card.querySelector(`.image-preview[data-qid="${qid}"]`);
            if (previewContainer) {
              const img = previewContainer.querySelector('img');
              const reader = new FileReader();
              reader.onload = (evt) => {
                img.src = evt.target.result;
                previewContainer.style.display = 'block';
              };
              reader.readAsDataURL(file);
            }
            
            toast(`Image "${file.name}" ready. Remember to place it in Games/question-images/ folder.`);
          } catch (err) {
            console.error('Error handling image upload:', err);
            toast('Error processing image file.');
          }

          // Reset file input
          e.target.value = '';
        });
      }
    });

    // Populate image fields for existing questions
    state.draft.questions.forEach((q) => {
      if (q.image) {
        const card = container.querySelector(`.question-card[data-qid="${q.id}"]`);
        if (card) {
          const imageInput = card.querySelector(`[data-kind="image"][data-qid="${q.id}"]`);
          if (imageInput) imageInput.value = q.image;
          
          const previewContainer = card.querySelector(`.image-preview[data-qid="${q.id}"]`);
          if (previewContainer) {
            const img = previewContainer.querySelector('img');
            img.src = q.image;
            previewContainer.style.display = 'block';
          }
        }
      }
    });
  }

  function saveDraftToLists() {
    // Validate basic constraints for multiple choice options
    for (const q of state.draft.questions) {
      if (q.type === 'multi') {
        if (!q.options || q.options.length < 2 || q.options.length > 4) {
          toast('Each multiple-choice question must have 2–4 options.');
          return false;
        }
      }
      // Validate vocab items have either image OR definition
      if (q.type === 'vocab') {
        const hasImage = q.image && q.image.trim() !== '';
        const hasDefinition = q.definition && q.definition.trim() !== '';
        if (!hasImage && !hasDefinition) {
          toast('Each vocab item must have either an image OR a definition (or both).');
          return false;
        }
      }
    }

    const idx = state.lists.findIndex((l) => l.id === state.draft.id);
    if (idx >= 0) state.lists[idx] = { ...state.draft };
    else state.lists.push({ ...state.draft });

    saveToStorage(state.lists);
    toast('Saved');
    return true;
  }

  function cancelEditing() {
    state.draft = null;
    state.editingListId = null;
    showView('home');
    renderHome();
  }

  function startEdit(listId) {
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return;
    state.editingListId = listId;
    state.draft = JSON.parse(JSON.stringify(list)); // deep clone for editing
    enterEditor();
  }

  // ----- Play/Preview View -----
  // Open the game selection modal instead of launching built-in play
  function startPlay(listId, asPreview = false) {
    // Pause background music when starting to play
    const audio = $('#bgAudio');
    if (audio) {
      audio.pause();
    }
    
    // Store selected list for game hand-off
    state.play.listId = listId;
    state.play.index = 0;

    // If called as preview from editor, keep existing preview behavior
    if (asPreview) {
      showView('play');
      const list = state.lists.find((l) => l.id === listId);
      $('#playTitle').textContent = `Preview: ${list?.name || 'Untitled'}`;
      renderPlay();
      return;
    }

    // Check if this is an Icebreak questionlist
    const list = state.lists.find((l) => l.id === listId);
    if (list && list.listType === 'icebreak') {
      // Directly launch Icebreak for Icebreak questionlists
      const payload = {
        id: list.id,
        name: list.name || 'Untitled',
        questions: list.questions.map(q => ({
          type: 'single',
          text: q.prompt || '',
          answer: q.accepted && q.accepted[0] ? q.accepted[0] : '',
          alternates: Array.isArray(q.accepted) ? q.accepted.slice(1).filter(a => a && a.trim() !== '') : []
        }))
      };
      const data = encodeURIComponent(JSON.stringify(payload));
      window.open(`./Games/Icebreak/index.html#questions=${data}`, '_blank');
      return;
    }

    // Otherwise, open game selection modal
    openGameSelectModal(listId);
  }

  function renderPlay() {
    const cont = $('#playContainer');
    const list = state.lists.find((l) => l.id === state.play.listId);
    const idx = state.play.index;
    if (!list) return;

    $('#playProgress').textContent = `${idx + 1} / ${list.questions.length}`;

    const q = list.questions[idx];
    cont.innerHTML = '';

    const qEl = document.createElement('div');
    qEl.className = 'question';
    qEl.textContent = q.text || '(no question text)';

    cont.appendChild(qEl);

    if (q.type === 'single') {
      const revealBtn = document.createElement('button');
      revealBtn.className = 'secondary';
      revealBtn.textContent = 'Reveal Answer';
      const ans = document.createElement('div');
      ans.className = 'answer';
      const altList = Array.isArray(q.alternates) ? q.alternates.filter(a => a && a.trim() !== '') : [];
      const altSuffix = altList.length ? `\n(Also accepted: ${altList.join(', ')})` : '';
      ans.textContent = (q.answer || '(no answer)') + altSuffix;
      ans.style.display = 'none';
      revealBtn.addEventListener('click', () => {
        ans.style.display = ans.style.display === 'none' ? 'block' : 'none';
      });
      cont.appendChild(revealBtn);
      cont.appendChild(ans);
    } else {
      const choices = document.createElement('div');
      choices.className = 'choices';
      (q.options || []).forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'ghost';
        b.textContent = opt || `Option ${i + 1}`;
        b.addEventListener('click', () => {
          // simple feedback: highlight selection if correct
          const isCorrect = (q.correct || []).includes(i);
          b.style.borderColor = isCorrect ? '#00ffa3' : '#ff5a5a';
        });
        choices.appendChild(b);
      });
      cont.appendChild(choices);
    }
  }

  function nextQuestion() {
    const list = state.lists.find((l) => l.id === state.play.listId);
    if (!list) return;
    state.play.index = Math.min(state.play.index + 1, list.questions.length - 1);
    renderPlay();
  }
  function prevQuestion() {
    state.play.index = Math.max(state.play.index - 1, 0);
    renderPlay();
  }

  // ----- Delete List -----
  function deleteList(listId) {
    if (!confirm('Delete this list?')) return;
    state.lists = state.lists.filter((l) => l.id !== listId);
    saveToStorage(state.lists);
    renderHome();
  }

  // ----- Audio Controls -----
  let audioStarted = false;
  
  function setupAudio() {
    const audio = $('#bgAudio');
    const vol = $('#audioVolume');
    const toggle = $('#audioToggle');

    // Initialize volume
    audio.volume = parseFloat(vol.value || '0.2');

    // Function to start audio on first user interaction
    const tryPlay = () => {
      if (!audioStarted) {
        audio.play().catch(() => {/* will start after user interaction */});
        audioStarted = true;
      }
    };

    vol.addEventListener('input', () => {
      audio.volume = parseFloat(vol.value);
      if (audio.muted && audio.volume > 0) {
        audio.muted = false;
        toggle.textContent = '🔈';
      }
    });

    toggle.addEventListener('click', () => {
      audio.muted = !audio.muted;
      toggle.textContent = audio.muted ? '🔇' : '🔈';
    });

    // Return the tryPlay function so it can be called from homepage buttons
    return tryPlay;
  }
  
  // ----- Homepage Navigation -----
  function setupHomepage(tryPlayAudio) {
    const homepageContainer = $('#homepageContainer');
    const editorContainer = $('#editorContainer');
    const openEditorBtn = $('#openEditorBtn');
    const openAboutBtn = $('#openAboutBtn');
    const backToHomepageBtn = $('#backToHomepage');
    const aboutModal = $('#aboutModal');
    const aboutCloseBtn = $('#aboutCloseBtn');
    
    // Open Question Editor
    openEditorBtn.addEventListener('click', () => {
      tryPlayAudio(); // Start audio on first interaction
      homepageContainer.hidden = true;
      editorContainer.hidden = false;
    });
    
    // Open About Modal
    openAboutBtn.addEventListener('click', () => {
      tryPlayAudio(); // Start audio on first interaction
      aboutModal.hidden = false;
    });
    
    // Close About Modal
    aboutCloseBtn.addEventListener('click', () => {
      aboutModal.hidden = true;
    });
    
    // Close About Modal when clicking outside
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        aboutModal.hidden = true;
      }
    });
    
    // Back to Homepage
    backToHomepageBtn.addEventListener('click', () => {
      editorContainer.hidden = true;
      homepageContainer.hidden = false;
      showView('home');
      renderHome();
    });
  }

  // ----- Event Wiring -----
  function wireEvents() {
    // Home toolbar
    $('#createBtn').addEventListener('click', () => {
      openModal1();
    });

    $('#searchInput').addEventListener('input', renderHome);

    // Export/Import data
    $('#exportDataBtn').addEventListener('click', () => {
      const lists = loadFromStorage();
      if (lists.length === 0) {
        toast('No question lists to export');
        return;
      }
      const dataStr = JSON.stringify(lists, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-lists-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('✅ Question lists exported!');
    });

    $('#importDataBtn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (!Array.isArray(imported)) {
              toast('❌ Invalid file format');
              return;
            }
            const currentLists = loadFromStorage();
            const merged = [...currentLists];
            let addedCount = 0;
            
            imported.forEach(list => {
              const normalized = normalizeList(list);
              if (normalized) {
                // Check if list with same ID already exists
                const existingIndex = merged.findIndex(l => l.id === normalized.id);
                if (existingIndex >= 0) {
                  // Replace existing
                  merged[existingIndex] = normalized;
                } else {
                  // Add new
                  merged.push(normalized);
                  addedCount++;
                }
              }
            });
            
            saveToStorage(merged);
            renderHome();
            toast(`✅ Imported ${addedCount} new list(s), updated ${imported.length - addedCount}`);
          } catch (err) {
            console.error('Import error:', err);
            toast('❌ Failed to import file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    // Modal 1
    $('#modal1Cancel').addEventListener('click', closeModal1);
    $('#modalListType').addEventListener('change', (e) => {
      const value = e.target.value;
      const type = value === 'icebreak' ? 'icebreak' : value === 'vocab' ? 'vocab' : 'regular';
      updateModal1Visibility(type);
    });
    $('#modal1Next').addEventListener('click', () => {
      const name = $('#modalListName').value.trim();
      const value = $('#modalListType').value;
      const type = value === 'icebreak' ? 'icebreak' : value === 'vocab' ? 'vocab' : 'regular';
      let total;
      if (type === 'icebreak') {
        const selected = $('#modalIcebreakCount').value;
        const validTotal = validateIcebreakTotal(selected);
        if (validTotal == null) {
          toast('Icebreak lists must use 8, 12, or 16 prompts.');
          return;
        }
        total = validTotal;
      } else {
        const totalStr = $('#modalTotalQuestions').value;
        total = Number(totalStr);
        if (!Number.isInteger(total) || total <= 0) {
          toast('Please enter a valid total number (> 0).');
          return;
        }
      }

      closeModal1();
      // Store temp for modal2 validation
      modal1.dataset.total = String(total);
      modal1.dataset.name = name;
      if (type === 'icebreak') {
        createDraft({ listName: name, listType: 'icebreak', total, singleCount: 0, multiCount: 0 });
        return;
      }
      if (type === 'vocab') {
        createDraft({ listName: name, listType: 'vocab', total, singleCount: 0, multiCount: 0 });
        return;
      }
      openModal2(type);
    });

    // Modal 2
    $('#modal2Back').addEventListener('click', () => {
      closeModal2();
      openModal1();
    });
    $('#modal2Create').addEventListener('click', () => {
      const total = Number(modal1.dataset.total || '0');
      const name = modal1.dataset.name || '';
      const s = Number($('#modalSingleCount').value || '0');
      const m = Number($('#modalMultiCount').value || '0');
      if (s + m !== total) {
        $('#modal2Error').hidden = false;
        return;
      }
      closeModal2();
      createDraft({
        listName: name,
        listType: 'regular',
        total,
        singleCount: s,
        multiCount: m,
      });
    });

    // Game select modal
    $('#gameSelectCancel').addEventListener('click', () => {
      closeGameSelectModal();
    });
    $('#gameSelectPlay').addEventListener('click', () => {
      const choice = document.querySelector('input[name="gameChoice"]:checked')?.value;
      if (!choice) return;
      if (!state.play.listId) return;
      const list = state.lists.find(l => l.id === state.play.listId);
      if (!list) return;
      // Build a compact transferable format
      const payload = {
        id: list.id,
        name: list.name || 'Untitled',
        questions: list.questions.map(q => {
          const base = q.type === 'single'
            ? { type: 'single', text: q.text || '', answer: q.answer || '', alternates: Array.isArray(q.alternates) ? q.alternates.filter(a => a && a.trim() !== '') : [] }
            : { type: 'multi', text: q.text || '', options: (q.options || []).slice(0,4), correct: (q.correct || []).slice(0,4) };
          if (q.image) base.image = q.image;
          return base;
        })
      };
      const data = encodeURIComponent(JSON.stringify(payload));
      closeGameSelectModal();
      if (choice === 'runrunrabbit') {
        // Open the game in a new tab with data in hash (avoids URL length issues somewhat)
        window.open(`./Games/RunRunRabbit/index.html#questions=${data}`, '_blank');
      } else if (choice === 'tornado') {
        window.open(`./Games/Tornado/index.html#questions=${data}`, '_blank');
      } else if (choice === 'snakeinabox') {
        window.open(`./Games/Snake in a Box/index.html#questions=${data}`, '_blank');
      } else if (choice === '2truthsandalie') {
        window.open(`./Games/2 Truths and a Lie/index.html#questions=${data}`, '_blank');
      } else if (choice === 'icebreak') {
        window.open(`./Games/Icebreak/index.html#questions=${data}`, '_blank');
      }
    });

    // Editor actions
    $('#saveBtn').addEventListener('click', () => {
      // update name
      if (state.draft) state.draft.name = $('#listNameInput').value.trim() || 'Untitled';
      if (saveDraftToLists()) {
        showView('home');
        renderHome();
      }
    });

    $('#cancelBtn').addEventListener('click', () => {
      if (confirm('Discard changes?')) cancelEditing();
    });

    $('#previewBtn').addEventListener('click', () => {
      // Save draft temporarily into lists for preview (without overwriting existing id collisions)
      if (!state.draft) return;
      const backupLists = JSON.parse(JSON.stringify(state.lists));
      const idx = state.lists.findIndex((l) => l.id === state.draft.id);
      if (idx >= 0) state.lists[idx] = { ...state.draft };
      else state.lists.push({ ...state.draft });

      saveToStorage(state.lists);
      startPlay(state.draft.id, true);

      // On leaving play, we will restore from storage anyway or keep as is until save/cancel
      // Here we keep current state; user can still cancel to discard by reloading or choosing Cancel.
    });

    $('#backToHomeFromEditor').addEventListener('click', () => {
      if (confirm('Leave editor? Unsaved changes will be lost.')) {
        cancelEditing();
      }
    });

    $('#aiGenerateBtn').addEventListener('click', async () => {
      if (!state.draft) return;
      
      const listName = $('#listNameInput').value.trim();
      if (!listName) {
        alert('Please enter a list name first. This will be used as the theme for question generation.');
        $('#listNameInput').focus();
        return;
      }

      const numQuestions = state.draft.questions.length;
      if (numQuestions === 0) {
        alert('No questions to generate. Please create a question list first.');
        return;
      }

      // Show loading state
      const generateBtn = $('#aiGenerateBtn');
      const originalText = generateBtn.textContent;
      generateBtn.textContent = '⏳ Generating...';
      generateBtn.disabled = true;

      try {
        // Calculate question type breakdown
        const singleCount = state.draft.questions.filter(q => q.type === 'single').length;
        const multiCount = state.draft.questions.filter(q => q.type === 'multi').length;
        
        const response = await fetch(GENERATOR_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: listName,
            type: state.draft.listType || 'regular',
            numQuestions: numQuestions,
            singleCount: singleCount,
            multiCount: multiCount
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !Array.isArray(data.questions)) {
          throw new Error('Invalid response format from server');
        }

        // Update the draft with generated questions
        data.questions.forEach((generatedQ, index) => {
          if (index < state.draft.questions.length) {
            const existingQ = state.draft.questions[index];
            
            if (state.draft.listType === 'icebreak') {
              // For icebreak questions
              existingQ.prompt = generatedQ.prompt || existingQ.prompt || '';
              existingQ.accepted = Array.isArray(generatedQ.accepted) ? generatedQ.accepted : (existingQ.accepted || []);
            } else {
              // For regular questions - respect the original question type
              existingQ.text = generatedQ.question || existingQ.text || '';
              
              // Only use the generated question type if it matches the existing question type
              if (existingQ.type === 'multi' && generatedQ.type === 'multiple' && Array.isArray(generatedQ.options) && generatedQ.options.length >= 2) {
                // Multiple-choice question - use generated options
                existingQ.options = generatedQ.options.slice(0, 4);
                existingQ.correct = [0]; // First option is correct
              } else if (existingQ.type === 'single') {
                // Single-answer question - use generated answer or extract from options
                if (generatedQ.type === 'multiple' && Array.isArray(generatedQ.options) && generatedQ.options.length > 0) {
                  // AI returned multiple choice but we need single answer - use first option as answer
                  existingQ.answer = generatedQ.options[0] || existingQ.answer || '';
                } else {
                  existingQ.answer = generatedQ.answer || existingQ.answer || '';
                }
                existingQ.alternates = existingQ.alternates || [];
              }
            }
          }
        });

        renderQuestionsEditor();
        toast(`Generated ${data.questions.length} questions using AI!`);

      } catch (error) {
        console.error('Error generating questions:', error);
        
        let errorMessage = 'Failed to generate questions. ';
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          errorMessage += 'Make sure the server is running on port 3001. You can start it by running ./start-server.sh';
        } else if (error.message.includes('quota')) {
          errorMessage += 'OpenAI API quota exceeded. Please check your API credits.';
        } else if (error.message.includes('api_key')) {
          errorMessage += 'Invalid OpenAI API key. Please check your server/.env configuration.';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      } finally {
        // Restore button state
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
      }
    });

    // Play view
    $('#nextQuestion').addEventListener('click', nextQuestion);
    $('#prevQuestion').addEventListener('click', prevQuestion);
    $('#backFromPlay').addEventListener('click', () => {
      // Return to editor if preview, or home if play started from list
      if (state.draft && state.play.listId === state.draft.id) {
        showView('editor');
        renderQuestionsEditor();
      } else {
        showView('home');
        renderHome();
      }
    });
  }

  // ----- App Init -----
  function init() {
    const tryPlayAudio = setupAudio();
    setupHomepage(tryPlayAudio);
    wireEvents();
    showView('home');
    renderHome();
  }

  // ----- Game Selection Modal helpers -----
  function openGameSelectModal(listId) {
    const modal = $('#gameSelectModal');
    const list = state.lists.find((l) => l.id === listId);
    const icebreakOption = $('#icebreakGameOption');
    
    // Hide Icebreak option for regular questionlists (since they're not compatible)
    if (icebreakOption) {
      const shouldHide = !list || list.listType !== 'icebreak';
      icebreakOption.style.display = shouldHide ? 'none' : 'flex';
    }
    
    // Ensure a valid option is selected if Icebreak was previously selected but is now hidden
    const icebreakRadio = document.querySelector('input[name="gameChoice"][value="icebreak"]');
    if (icebreakRadio && icebreakRadio.checked && icebreakOption && icebreakOption.style.display === 'none') {
      // Select RunRunRabbit as default when Icebreak is hidden
      const runrunrabbitRadio = document.querySelector('input[name="gameChoice"][value="runrunrabbit"]');
      if (runrunrabbitRadio) {
        runrunrabbitRadio.checked = true;
      }
    }
    
    modal.hidden = false;
  }
  function closeGameSelectModal() {
    const modal = $('#gameSelectModal');
    modal.hidden = true;
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
