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

  // ----- App State -----
  let state = {
    view: 'home', // 'home' | 'editor' | 'play'
    lists: loadFromStorage(),
    // editor state
    editingListId: null, // if editing existing
    draft: null, // { id, name, questions: [...] }
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
      li.innerHTML = `
        <div class="title">${escapeHtml(list.name || 'Untitled')}</div>
        <div class="meta">${list.questions.length} question(s)</div>
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

  function openModal1() {
    $('#modalListName').value = '';
    $('#modalTotalQuestions').value = '';
    modal1.hidden = false;
  }
  function closeModal1() { modal1.hidden = true; }

  function openModal2() {
    $('#modalSingleCount').value = '0';
    $('#modalMultiCount').value = '0';
    $('#modal2Error').hidden = true;
    modal2.hidden = false;
  }
  function closeModal2() { modal2.hidden = true; }

  // This builds the initial draft per modal inputs
  function createDraft(listName, total, singleCount, multiCount) {
    // Construct questions array: single first, then multi
    const questions = [];
    for (let i = 0; i < singleCount; i++) {
      questions.push({ id: uid(), type: 'single', text: '', answer: '', alternates: [] });
    }
    for (let i = 0; i < multiCount; i++) {
      questions.push({ id: uid(), type: 'multi', text: '', options: ['', ''], correct: [] }); // start with 2 options
    }

    state.draft = {
      id: uid(),
      name: listName || 'Untitled',
      questions,
    };

    // Push into editor
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
    const multi = total - single;

    $('#countTotal').textContent = total;
    $('#countSingle').textContent = single;
    $('#countMulti').textContent = multi;
  }

  function renderQuestionsEditor() {
    const container = $('#questionsContainer');
    container.innerHTML = '';

    if (!state.draft) return;

    state.draft.questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';

      if (q.type === 'single') {
        card.innerHTML = `
          <div class="row">
            <label>Question text
              <textarea data-kind="text" data-qid="${q.id}" rows="2" placeholder="Type the question..."></textarea>
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

      // Populate values
      card.querySelector('[data-kind="text"]').value = q.text || '';

      if (q.type === 'single') {
        card.querySelector('[data-kind="answer"]').value = q.answer || '';
        // Populate alternate accepted answers
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
      });
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
  function setupAudio() {
    const audio = $('#bgAudio');
    const vol = $('#audioVolume');
    const toggle = $('#audioToggle');

    // Initialize volume
    audio.volume = parseFloat(vol.value || '0.2');

    // Try autoplay (many browsers require user interaction first)
    const tryPlay = () => audio.play().catch(() => {/* will start after user interaction */});
    tryPlay();

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

    // On first user gesture, if not playing, attempt play
    const resumeOnUser = () => {
      if (audio.paused) tryPlay();
      window.removeEventListener('pointerdown', resumeOnUser);
      window.removeEventListener('keydown', resumeOnUser);
    };
    window.addEventListener('pointerdown', resumeOnUser);
    window.addEventListener('keydown', resumeOnUser);
  }

  // ----- Event Wiring -----
  function wireEvents() {
    // Home toolbar
    $('#createBtn').addEventListener('click', () => {
      openModal1();
    });

    $('#searchInput').addEventListener('input', renderHome);

    // Modal 1
    $('#modal1Cancel').addEventListener('click', closeModal1);
    $('#modal1Next').addEventListener('click', () => {
      const name = $('#modalListName').value.trim();
      const totalStr = $('#modalTotalQuestions').value;
      const total = Number(totalStr);
      if (!Number.isInteger(total) || total <= 0) {
        toast('Please enter a valid total number (> 0).');
        return;
      }
      closeModal1();
      // Store temp for modal2 validation
      modal1.dataset.total = String(total);
      modal1.dataset.name = name;
      openModal2();
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
      createDraft(name, total, s, m);
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
        questions: list.questions.map(q => q.type === 'single'
          ? { type: 'single', text: q.text || '', answer: q.answer || '', alternates: Array.isArray(q.alternates) ? q.alternates.filter(a => a && a.trim() !== '') : [] }
          : { type: 'multi', text: q.text || '', options: (q.options || []).slice(0,4), correct: (q.correct || []).slice(0,4) }
        )
      };
      const data = encodeURIComponent(JSON.stringify(payload));
      closeGameSelectModal();
      if (choice === 'runrunrabbit') {
        // Open the game in a new tab with data in hash (avoids URL length issues somewhat)
        window.open(`../My%20games/RunRunRabbit/index.html#questions=${data}`, '_blank');
      } else if (choice === 'tornado') {
        window.open(`../My%20games/Tornado/index.html#questions=${data}`, '_blank');
      } else if (choice === 'icebreak') {
        window.open(`../My%20games/Icebreak/index.html#questions=${data}`, '_blank');
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

    $('#aiGenerateBtn').addEventListener('click', () => {
      // Placeholder behavior: populate bare-bones demo content
      if (!state.draft) return;
      state.draft.questions.forEach((q, i) => {
        q.text = q.text || `Auto Q${i + 1}: Example question?`;
        if (q.type === 'single') {
          q.answer = q.answer || 'Example answer';
        } else {
          q.options = q.options && q.options.length >= 2 ? q.options : ['Option A', 'Option B'];
          if (!q.correct || q.correct.length === 0) q.correct = [0];
        }
      });
      renderQuestionsEditor();
      toast('Generated placeholder questions.');
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
    wireEvents();
    setupAudio();
    showView('home');
    renderHome();
  }

  // ----- Game Selection Modal helpers -----
  function openGameSelectModal(listId) {
    const modal = $('#gameSelectModal');
    modal.hidden = false;
  }
  function closeGameSelectModal() {
    const modal = $('#gameSelectModal');
    modal.hidden = true;
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();