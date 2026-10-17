/* HudumaLink demo app.
   Data is stored in localStorage for demonstration only. Do not use for real citizen data.
   Production deployment requires a server-side API, password hashing, access control and database. */
(() => {
  const $ = (id) => document.getElementById(id);
  const STORE = { users: 'hudumalink_users_v1', requests: 'hudumalink_requests_v1', session: 'hudumalink_session_v1' };
  const ADMIN_EMAIL = 'admin@hudumalink.test';
  const ADMIN_PASSWORD = 'Admin123!';
  let selectedImage = '';
  let toastTimer;

  const get = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => get(STORE.session, null);
  const allRequests = () => get(STORE.requests, []);
  const allUsers = () => get(STORE.users, []);
  const escapeHtml = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = (s) => { const d = new Date(s); return Number.isNaN(+d) ? '—' : d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); };
  const statusClass = s => s === 'Resolved' ? 'status-resolved' : s === 'In Progress' ? 'status-in-progress' : 'status-pending';
  const statusSlug = s => s.toLowerCase().replace(/\s+/g,'-');
  const iconFor = c => c === 'Water & Sanitation' ? '≈' : c === 'Roads & Streetlights' ? '⌁' : c === 'Waste Collection' ? '♻' : '✳';
  const toast = (msg) => { const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3200); };
  const seedAdmin = () => {
    const users = allUsers();
    if (!users.some(u=>u.email.toLowerCase()===ADMIN_EMAIL)) {
      users.push({name:'Demo Administrator',email:ADMIN_EMAIL,phone:'',password:ADMIN_PASSWORD,role:'admin'});
      set(STORE.users,users);
    }
  };
  seedAdmin();

  function showView(name) {
    const s = session();
    if (name === 'dashboard' && s?.role !== 'admin') { name='auth'; toast('Sign in with the demo admin account to access the dashboard.'); }
    if (name === 'report' && !s) { name='auth'; toast('Please sign in or create a citizen account before reporting.'); }
    document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${name}`));
    document.querySelectorAll('[data-view].nav-link').forEach(el=>el.classList.toggle('active',el.dataset.view===name));
    $('nav').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
    if(name==='dashboard') renderAdmin();
    if(name==='home') renderHome();
    if(name==='track') { $('trackResult').innerHTML=''; }
  }
  document.addEventListener('click', e => {
    const viewBtn=e.target.closest('[data-view]');
    if(viewBtn){e.preventDefault();showView(viewBtn.dataset.view);}
    const catBtn=e.target.closest('[data-category]');
    if(catBtn){$('requestCategory').value=catBtn.dataset.category;showView('report');}
  });
  $('mobileMenu').addEventListener('click',()=>$('nav').classList.toggle('open'));

  function updateNav() {
    const s=session();
    $('signInNav').hidden=!!s;
    $('signOutBtn').hidden=!s;
    $('dashboardNav').hidden=s?.role!=='admin';
    $('reportNav').textContent=s?'Report an issue ↗':'Report an issue ↗';
  }
  $('signOutBtn').addEventListener('click',()=>{localStorage.removeItem(STORE.session);updateNav();showView('home');toast('You have signed out.');});

  function authTab(tab) {
    const login=tab==='login';
    $('loginTab').classList.toggle('active',login); $('registerTab').classList.toggle('active',!login);
    $('loginForm').hidden=!login; $('registerForm').hidden=login;
  }
  $('loginTab').addEventListener('click',()=>authTab('login'));
  $('registerTab').addEventListener('click',()=>authTab('register'));
  $('loginForm').addEventListener('submit',e=>{
    e.preventDefault();
    const email=$('loginEmail').value.trim().toLowerCase(), password=$('loginPassword').value;
    const user=allUsers().find(u=>u.email.toLowerCase()===email&&u.password===password);
    if(!user){toast('Email or password is incorrect.');return;}
    set(STORE.session,{name:user.name,email:user.email,role:user.role});
    updateNav();toast(`Welcome${user.role==='admin'?', administrator':''}, ${user.name.split(' ')[0]}!`);
    showView(user.role==='admin'?'dashboard':'home');
  });
  $('registerForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('regName').value.trim(), email=$('regEmail').value.trim().toLowerCase(), phone=$('regPhone').value.trim(), password=$('regPassword').value;
    if(name.length<2){toast('Please enter your full name.');return;}
    if(password.length<8){toast('Use a password with at least 8 characters.');return;}
    const users=allUsers();
    if(users.some(u=>u.email.toLowerCase()===email)){toast('An account with this email already exists.');return;}
    users.push({name,email,phone,password,role:'citizen'});set(STORE.users,users);
    set(STORE.session,{name,email,role:'citizen'});updateNav();$('registerForm').reset();toast('Account created. Welcome to HudumaLink!');showView('home');
  });

  $('requestImage').addEventListener('change',e=>{
    const file=e.target.files?.[0];selectedImage='';
    if(!file){$('imagePreview').innerHTML='';return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){e.target.value='';toast('Please choose a JPG, PNG or WebP image.');return;}
    if(file.size>2*1024*1024){e.target.value='';toast('Image must be 2 MB or smaller.');return;}
    const reader=new FileReader();
    reader.onload=()=>{selectedImage=reader.result;$('imagePreview').innerHTML=`Selected: ${escapeHtml(file.name)}<img alt="Selected report image preview" src="${selectedImage}">`;};
    reader.readAsDataURL(file);
  });
  const makeTracking = () => `HBL-${new Date().getFullYear()}-${Math.floor(100000+Math.random()*900000)}`;
  $('requestForm').addEventListener('submit',e=>{
    e.preventDefault();const s=session();if(!s){showView('auth');return;}
    const req={id:makeTracking(),userEmail:s.email,userName:s.name,category:$('requestCategory').value,location:$('requestLocation').value.trim(),description:$('requestDescription').value.trim(),image:selectedImage,status:'Pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    const requests=allRequests();requests.unshift(req);set(STORE.requests,requests);$('requestForm').reset();$('imagePreview').innerHTML='';selectedImage='';
    toast(`Request submitted. Tracking number: ${req.id}`);showView('track');$('trackingInput').value=req.id;renderTrack(req.id);
  });

  $('trackForm').addEventListener('submit',e=>{e.preventDefault();renderTrack($('trackingInput').value.trim().toUpperCase());});
  function renderTrack(id) {
    const req=allRequests().find(r=>r.id.toUpperCase()===id.toUpperCase());
    if(!req){$('trackResult').innerHTML='<div class="panel empty-state">We could not find that tracking number. Check it and try again.</div>';return;}
    const stages=['Pending','In Progress','Resolved'], active=stages.indexOf(req.status);
    $('trackResult').innerHTML=`<article class="panel result-card"><div class="result-top"><div><h2>${escapeHtml(req.category)}</h2><p>Tracking number: <strong>${escapeHtml(req.id)}</strong></p></div><span class="status-pill ${statusClass(req.status)}">${escapeHtml(req.status)}</span></div><div class="result-details"><div><span class="detail-label">Location</span><span class="detail-value">${escapeHtml(req.location)}</span></div><div><span class="detail-label">Date submitted</span><span class="detail-value">${fmtDate(req.createdAt)}</span></div><div><span class="detail-label">Submitted by</span><span class="detail-value">${escapeHtml(req.userName)}</span></div><div><span class="detail-label">Last updated</span><span class="detail-value">${fmtDate(req.updatedAt)}</span></div></div><span class="detail-label">Issue description</span><div class="result-description">${escapeHtml(req.description)}</div>${req.image?`<img src="${req.image}" alt="Photo attached to request" style="display:block;max-width:100%;max-height:260px;border-radius:10px;margin-top:15px">`:''}<div class="progress-track">${stages.map((st,i)=>`<div class="progress-step ${i<=active?'done':''}"><div class="progress-dot">${i<active?'✓':i+1}</div>${st}</div>`).join('')}</div></article>`;
  }

  function renderHome() {
    const rs=allRequests(), total=rs.length, resolved=rs.filter(r=>r.status==='Resolved').length, progress=rs.filter(r=>r.status==='In Progress').length, open=rs.filter(r=>r.status==='Pending').length;
    $('statTotal').textContent=total;$('statResolved').textContent=resolved;$('statProgress').textContent=progress;$('statOpen').textContent=open;
    const recent=rs.slice(0,4);
    $('recentRequests').innerHTML=recent.length?recent.map(r=>`<div class="recent-row"><span class="request-mini-icon">${iconFor(r.category)}</span><div class="recent-main"><strong>${escapeHtml(r.category)} · ${escapeHtml(r.location)}</strong><small>${escapeHtml(r.id)} · ${fmtDate(r.createdAt)}</small></div><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span></div>`).join(''):'<div class="empty-state">No reports yet. Sign in and submit the first service request.</div>';
  }
  function renderAdmin() {
    const rs=allRequests();$('adminTotal').textContent=rs.length;$('adminPending').textContent=rs.filter(r=>r.status==='Pending').length;$('adminProgress').textContent=rs.filter(r=>r.status==='In Progress').length;$('adminResolved').textContent=rs.filter(r=>r.status==='Resolved').length;
    const q=$('adminSearch').value.trim().toLowerCase(), status=$('statusFilter').value;
    const filtered=rs.filter(r=>(status==='All'||r.status===status)&&[r.id,r.category,r.location,r.description,r.userName].some(v=>String(v||'').toLowerCase().includes(q)));
    $('adminTableBody').innerHTML=filtered.map(r=>`<tr><td><strong>${escapeHtml(r.id)}</strong><small>${escapeHtml(r.userName)}</small></td><td><strong>${escapeHtml(r.category)}</strong><small>${escapeHtml(r.location)}</small></td><td>${fmtDate(r.createdAt)}</td><td><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td><td><select class="status-select" data-status-id="${escapeHtml(r.id)}" aria-label="Update status for ${escapeHtml(r.id)}">${['Pending','In Progress','Resolved'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('');
    $('adminEmpty').hidden=filtered.length!==0;
  }
  $('adminSearch').addEventListener('input',renderAdmin);$('statusFilter').addEventListener('change',renderAdmin);
  $('adminTableBody').addEventListener('change',e=>{
    const select=e.target.closest('[data-status-id]');if(!select)return;
    const rs=allRequests(),req=rs.find(r=>r.id===select.dataset.statusId);if(!req)return;
    req.status=select.value;req.updatedAt=new Date().toISOString();set(STORE.requests,rs);renderAdmin();renderHome();toast(`Request ${req.id} updated to ${req.status}.`);
  });

  updateNav();renderHome();
})();