(() => {
  'use strict';
  const KEY = 'hearthplan.public.v1';
  const MAX_BYTES = 220000;
  const LIMITS = { people: 30, places: 30, pets: 20, practice: 50, text: 1200 };
  const kitSeed = [
    ['water','Water for several days'],['food','Non-perishable food'],['radio','Battery or hand-crank radio'],['flashlight','Flashlight'],['first_aid','First aid kit'],['batteries','Extra batteries'],['whistle','Whistle'],['dust_mask','Dust mask'],['shelter','Plastic sheeting and duct tape'],['sanitation','Sanitation supplies'],['utilities','Wrench or pliers'],['can_opener','Manual can opener'],['maps','Local maps'],['phone','Phone chargers and backup battery'],['hygiene','Soap and sanitizer'],['medications','Organize medications offline'],['vision','Spare glasses or lens solution'],['infant','Infant supplies'],['pets','Pet food and water'],['cash','Cash in small bills'],['documents','Copies of key papers'],['bedding','Blanket or sleeping bag'],['clothing','Change of clothing'],['extinguisher','Fire extinguisher'],['matches','Waterproof matches'],['personal_care','Personal care supplies'],['mess_kit','Mess kit'],['paper','Paper and pencil'],['kids','Books or activities']
  ];
  const defaults = () => ({ version: 1, household: { home_label:'', address:'', notes:'', out_of_town_name:'', out_of_town_phone:'', out_of_town_email:'', alert_plan:'', shelter_plan:'', evacuation_plan:'', last_practiced:'' }, people:[], places:[], pets:[], kit:kitSeed.map(([code,label]) => ({code,label,home:false})), practice:[] });
  let state = defaults();
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clean = (value, max = LIMITS.text) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
  const validPhone = (value) => !value || /^[0-9+(). \-]{7,32}$/.test(value);
  const validEmail = (value) => !value || /^[^@\s]{1,64}@[^@\s]{1,255}$/.test(value) && value.length <= 120;
  const today = () => new Date().toISOString().slice(0,10);
  const announce = (message, error = false) => { const el = $('#status'); el.hidden = false; el.className = `status${error ? ' error' : ''}`; el.textContent = message; window.setTimeout(() => { el.hidden = true; }, 4500); };
  const safeJson = (candidate) => {
    if (!candidate || candidate.version !== 1 || JSON.stringify(candidate).length > MAX_BYTES) throw new Error('That plan is not a supported HearthPlan file.');
    const base = defaults();
    const h = candidate.household || {};
    base.household = Object.fromEntries(Object.keys(base.household).map((key) => [key, clean(h[key], key === 'notes' || key.endsWith('_plan') ? 1200 : key.includes('email') ? 120 : key.includes('phone') ? 32 : 240)]));
    if (!validPhone(base.household.out_of_town_phone) || !validEmail(base.household.out_of_town_email)) throw new Error('The contact details look invalid.');
    const allowedRoles = ['adult','child','caregiver','other'];
    base.people = Array.isArray(candidate.people) ? candidate.people.slice(0, LIMITS.people).map((p) => ({name:clean(p.name,80),role:allowedRoles.includes(p.role)?p.role:'other',mobile:clean(p.mobile,32),pickup_notes:clean(p.pickup_notes,240),extra_help:Boolean(p.extra_help)})).filter((p) => p.name && validPhone(p.mobile)) : [];
    base.places = Array.isArray(candidate.places) ? candidate.places.slice(0,LIMITS.places).map((p) => ({kind:clean(p.kind,32),name:clean(p.name,80),address:clean(p.address,240),instructions:clean(p.instructions,240)})).filter((p) => p.name) : [];
    base.pets = Array.isArray(candidate.pets) ? candidate.pets.slice(0,LIMITS.pets).map((p) => ({name:clean(p.name,80),kind:clean(p.kind,80),notes:clean(p.notes,240)})).filter((p) => p.name) : [];
    const flags = new Map(Array.isArray(candidate.kit) ? candidate.kit.map((item) => [item.code, Boolean(item.home)]) : []);
    base.kit.forEach((item) => { item.home = flags.get(item.code) === true; });
    base.practice = Array.isArray(candidate.practice) ? candidate.practice.slice(0,LIMITS.practice).map((p) => ({date:clean(p.date,10),notes:clean(p.notes,400)})).filter((p) => /^\d{4}-\d\d-\d\d$/.test(p.date)) : [];
    return base;
  };
  const load = () => { try { const raw = localStorage.getItem(KEY); if (raw) state = safeJson(JSON.parse(raw)); } catch (_) { state = defaults(); } };
  const save = () => { const raw = JSON.stringify(state); if (raw.length > MAX_BYTES) throw new Error('This plan is too large to save.'); localStorage.setItem(KEY, raw); render(); };
  const formData = (form) => Object.fromEntries(new FormData(form).entries());
  const complete = () => {
    const h = state.household, kinds = new Set(state.places.map((p) => p.kind)), basics = state.kit.slice(0,14), checks = [Boolean(h.home_label), Boolean(h.out_of_town_name && h.out_of_town_phone), Boolean(h.alert_plan), Boolean(h.shelter_plan), Boolean(h.evacuation_plan), state.people.length > 0, state.people.some((p) => p.mobile), kinds.has('home_meet'), kinds.has('neighborhood'), kinds.has('out_of_town'), basics.filter((i) => i.home).length >= 7, state.practice.length > 0 || Boolean(h.last_practiced)];
    return { done: checks.filter(Boolean).length, total: checks.length, percent: Math.round(checks.filter(Boolean).length / checks.length * 100) };
  };
  const render = () => {
    const h = state.household;
    $('#household-form').querySelectorAll('[name]').forEach((input) => { input.value = h[input.name] || ''; });
    const result = complete(); $('#score').textContent = `${result.percent}%`; $('#meter-fill').style.width = `${result.percent}%`; $('#score-detail').textContent = `${result.done} of ${result.total} checks`;
    $('#people-list').innerHTML = state.people.length ? state.people.map((p,i) => `<div class="item-card"><div><strong>${esc(p.name)}</strong><small>${esc(p.role)}${p.mobile ? ` · ${esc(p.mobile)}` : ''}${p.extra_help ? ' · extra help' : ''}</small>${p.pickup_notes ? `<small>${esc(p.pickup_notes)}</small>` : ''}</div><button class="remove" aria-label="Remove person ${esc(p.name)}" data-remove="people" data-index="${i}" type="button">Remove</button></div>`).join('') : '<p class="muted">Add the people your household needs to check in with.</p>';
    $('#places-list').innerHTML = state.places.length ? state.places.map((p,i) => `<div class="item-card"><div><strong>${esc(p.name)}</strong><small>${esc(p.kind)}${p.address ? ` · ${esc(p.address)}` : ''}</small>${p.instructions ? `<small>${esc(p.instructions)}</small>` : ''}</div><button class="remove" aria-label="Remove place ${esc(p.name)}" data-remove="places" data-index="${i}" type="button">Remove</button></div>`).join('') : '<p class="muted">Add a place where people can regroup.</p>';
    $('#pets-list').innerHTML = state.pets.length ? state.pets.map((p,i) => `<div class="item-card"><div><strong>${esc(p.name)}</strong><small>${esc(p.kind)}${p.notes ? ` · ${esc(p.notes)}` : ''}</small></div><button class="remove" aria-label="Remove pet ${esc(p.name)}" data-remove="pets" data-index="${i}" type="button">Remove</button></div>`).join('') : '<p class="muted">No pets added yet.</p>';
    $('#kit-list').innerHTML = state.kit.map((item,i) => `<label class="kit-item"><input type="checkbox" data-kit-index="${i}" ${item.home ? 'checked' : ''}> <span>${esc(item.label)}${i < 14 ? '' : ' <small>(additional)</small>'}</span></label>`).join(''); $('#kit-count').textContent = `${state.kit.slice(0,14).filter((i) => i.home).length} / 14 basics`;
    $('#practice-list').innerHTML = state.practice.length ? state.practice.slice().reverse().map((p) => `<div class="practice-entry"><strong>${esc(p.date)}</strong>${p.notes ? ` <span>${esc(p.notes)}</span>` : ''}</div>`).join('') : '<p class="muted">No practice sessions logged yet.</p>';
    bindDynamic();
  };
  const bindDynamic = () => {
    document.querySelectorAll('[data-remove]').forEach((button) => button.onclick = () => { state[button.dataset.remove].splice(Number(button.dataset.index),1); save(); announce('Removed.'); });
    document.querySelectorAll('[data-kit-index]').forEach((box) => box.onchange = () => { state.kit[Number(box.dataset.kitIndex)].home = box.checked; save(); });
  };
  const onSubmit = (id, fn) => { $(`#${id}`).addEventListener('submit', (event) => { event.preventDefault(); try { fn(formData(event.currentTarget)); save(); announce('Saved locally in this browser.'); event.currentTarget.reset(); } catch (error) { announce(error.message, true); } }); };
  onSubmit('household-form', (data) => { Object.keys(state.household).forEach((key) => { if (key !== 'last_practiced') state.household[key] = clean(data[key], key === 'notes' || key.endsWith('_plan') ? 1200 : key.includes('email') ? 120 : key.includes('phone') ? 32 : 240); }); if (!validPhone(state.household.out_of_town_phone)) throw new Error('Out-of-town phone looks invalid.'); if (!validEmail(state.household.out_of_town_email)) throw new Error('Out-of-town email looks invalid.'); });
  onSubmit('person-form', (data) => { const person = {name:clean(data.name,80),role:['adult','child','caregiver','other'].includes(data.role)?data.role:'other',mobile:clean(data.mobile,32),pickup_notes:clean(data.pickup_notes,240),extra_help:data.extra_help === 'on'}; if (!person.name) throw new Error('A name is required.'); if (!validPhone(person.mobile)) throw new Error('Phone number looks invalid.'); if (state.people.length >= LIMITS.people) throw new Error('People limit reached.'); state.people.push(person); });
  onSubmit('place-form', (data) => { if (!clean(data.name,80)) throw new Error('A place name is required.'); if (state.places.length >= LIMITS.places) throw new Error('Place limit reached.'); state.places.push({kind:clean(data.kind,32),name:clean(data.name,80),address:clean(data.address,240),instructions:clean(data.instructions,240)}); });
  onSubmit('pet-form', (data) => { if (!clean(data.name,80)) throw new Error('A pet name is required.'); if (state.pets.length >= LIMITS.pets) throw new Error('Pet limit reached.'); state.pets.push({name:clean(data.name,80),kind:clean(data.kind,80),notes:clean(data.notes,240)}); });
  onSubmit('practice-form', (data) => { const date = clean(data.practiced_on,10) || today(); if (!/^\d{4}-\d\d-\d\d$/.test(date)) throw new Error('Use a valid practice date.'); state.practice.push({date,notes:clean(data.notes,400)}); state.practice = state.practice.slice(-LIMITS.practice); state.household.last_practiced = date; });
  $('#export-btn').onclick = () => { const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hearthplan-${today()}.json`; link.click(); URL.revokeObjectURL(link.href); announce('Export created. Remember: it is unencrypted JSON.'); };
  $('#import-file').onchange = async (event) => { const file = event.target.files[0]; if (!file) return; try { if (file.size > MAX_BYTES) throw new Error('That file is too large to import.'); const imported = safeJson(JSON.parse(await file.text())); state = imported; save(); announce('Plan restored locally.'); } catch (error) { announce(error.message || 'Could not import that file.', true); } event.target.value = ''; };
  $('#reset-btn').onclick = () => { if (window.confirm('Clear this HearthPlan from this browser? This cannot be undone.')) { state = defaults(); save(); announce('Local plan cleared.'); } };
  $('#print-btn').onclick = () => { const h = state.household; const people = state.people.map((p) => `${esc(p.name)}${p.mobile ? ` — ${esc(p.mobile)}` : ''}`).join('<br>') || 'Add household contacts'; const places = state.places.map((p) => `${esc(p.name)}${p.address ? ` — ${esc(p.address)}` : ''}`).join('<br>') || 'Add meeting places'; const card = `<div class="print-card"><h1>${esc(h.home_label || 'HearthPlan')}</h1><h2>CHECK IN</h2><p>${people}</p><h2>MEET</h2><p>${places}</p><h2>REMEMBER</h2><p>${esc(h.alert_plan || 'Follow your household plan and official local guidance.')}</p><small>Not 911 or an alert service. In an emergency, contact local emergency services.</small></div>`; const printWindow = window.open('', '_blank', 'noopener'); if (!printWindow) { announce('Allow pop-ups to print wallet cards.', true); return; } printWindow.document.write(`<title>HearthPlan wallet cards</title><style>body{font:16px/1.4 system-ui;padding:24px;color:#101828}.print-card{border:2px solid #101828;border-radius:16px;padding:20px;max-width:420px;min-height:260px;margin-bottom:24px}h1{font-size:24px}h2{font-size:12px;letter-spacing:.12em;border-bottom:1px solid #aaa;padding-bottom:4px}small{color:#596579}</style>${card}${card}`); printWindow.document.close(); printWindow.focus(); printWindow.print(); };
  try { load(); render(); } catch (_) { state = defaults(); render(); }
})();
