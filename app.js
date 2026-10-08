const D = window.NexoDomain;
const api = window.NexoBackend;
let state = D.freshState();
let selectedDay = D.dateKey();
let generation = 0;
const getProfile = () => state.profile;
const getPatients = () => state.patients;
const esc = D.escape;

const specialtyGroups = {
  'Medicina y especialidades': ['Medicina general','Medicina familiar','Medicina interna','Cardiología','Dermatología','Endocrinología','Geriatría','Ginecología y obstetricia','Neurología','Oftalmología','Otorrinolaringología','Pediatría','Psiquiatría','Traumatología y ortopedia','Urología'],
  'Rehabilitación y terapias': ['Fisioterapia','Medicina física y rehabilitación','Terapia ocupacional','Terapia respiratoria','Fonoaudiología / Terapia del lenguaje','Audiología','Psicomotricidad','Quiropraxia','Rehabilitación deportiva','Ortesis y prótesis'],
  'Salud integral y cuidado': ['Enfermería','Nutrición y dietética','Psicología','Odontología','Optometría','Podología / Podiatría','Gerontología','Partería / Obstetricia','Cosmetología','Cosmiatría','Estética integral'],
  'Otras áreas': ['Acupuntura','Medicina del dolor','Cuidados paliativos','Medicina preventiva','Salud ocupacional','Otra especialidad']
};

const prescriptionPalettes = {
  nexocare: { label: 'NexoCare · Azul y salvia', dark: '#0d1d2a', mid: '#415a77', accent: '#7e9d7a', soft: '#e8eee7', paper: '#fffdf9' },
  clinical: { label: 'Clínica · Azul profundo', dark: '#123b63', mid: '#2476a8', accent: '#79b9d1', soft: '#e6f4f8', paper: '#ffffff' },
  sage: { label: 'Bienestar · Verde salvia', dark: '#2f4a3d', mid: '#67836f', accent: '#b0bda5', soft: '#eef1e9', paper: '#fffef9' },
  burgundy: { label: 'Profesional · Borgoña', dark: '#552d35', mid: '#8b5360', accent: '#c5a28d', soft: '#f5ebe7', paper: '#fffdfb' }
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

document.head.insertAdjacentHTML('beforeend', `<style>
html,body{width:100%;min-height:100%;overflow-x:hidden}.app-shell{width:min(100%,1120px);margin-inline:auto}
#authDialog{inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:24px;background:radial-gradient(circle at 12% 12%,#415a77 0%,#172a3a 32%,#0d1d2a 76%);overflow:auto}
#authDialog[open]{display:grid;place-items:center}#authDialog::backdrop{background:#0d1d2a}
.auth-stage{display:grid;grid-template-columns:minmax(300px,.88fr) minmax(420px,1.12fr);width:min(100%,980px);margin:auto;border:1px solid rgba(244,237,224,.13);border-radius:30px;background:#fffdf9;box-shadow:0 35px 100px rgba(0,0,0,.32);overflow:hidden}
.auth-visual{position:relative;display:flex;min-height:680px;flex-direction:column;justify-content:space-between;padding:48px;background:linear-gradient(150deg,rgba(13,29,42,.82),rgba(13,29,42,.42)),url('assets/nexocare-clinical-background.png') center/cover no-repeat;color:#f4ede0;overflow:hidden}
.auth-visual:before{content:'';position:absolute;inset:0;background:url('assets/nexocare-mark.png') 125% 105%/330px no-repeat;opacity:.06}.auth-visual>*{position:relative;z-index:1}
.auth-visual .brand-mark{width:72px;height:72px;border-radius:20px}.auth-visual h3{max-width:310px;margin:0 0 16px;font-family:'Fraunces',serif;font-size:39px;line-height:1.05;letter-spacing:-1.3px}.auth-visual p{max-width:300px;margin:0;color:rgba(244,237,224,.72);font-size:13px;line-height:1.7}
.auth-points{display:grid;gap:13px;margin-top:30px}.auth-points span{display:flex;align-items:center;gap:10px;color:#f4ede0;font-size:12px;font-weight:700}.auth-points i{display:grid;width:24px;height:24px;place-items:center;border-radius:50%;background:rgba(126,157,122,.2);color:#c4ac88;font-style:normal}
.auth-card{width:100%;margin:0;padding:42px 48px;border:0;border-radius:0;background:#fffdf9;box-shadow:none}.auth-brand{display:flex;align-items:center;gap:10px;margin-bottom:24px;color:#0d1d2a;font-size:20px}.auth-brand .brand-mark{width:42px;height:42px}.auth-brand b span{color:#7e9d7a}.auth-card h2{margin-bottom:8px;color:#0d1d2a;font-size:34px;line-height:1.08}.auth-card .subtle{margin-bottom:22px}.auth-card label{margin:11px 0}
.text-button{display:block;margin:14px auto 0;border:0;background:none;color:#415a77;font-weight:800}.optional{color:#859098;font-weight:500}
.toast{position:fixed;z-index:30;left:50%;bottom:108px;max-width:calc(100vw - 32px);padding:12px 17px;border:1px solid rgba(244,237,224,.16);border-radius:13px;background:#0d1d2a;color:#fff;box-shadow:0 12px 30px rgba(13,29,42,.3);opacity:0;pointer-events:none;transform:translate(-50%,20px);transition:.2s;white-space:nowrap}.toast.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:760px){#authDialog{padding:0;background:#fffdf9}.auth-stage{display:block;width:100%;min-height:100dvh;border:0;border-radius:0}.auth-visual{display:none}.auth-card{min-height:100dvh;padding:32px 24px}.auth-card h2{font-size:30px}.toast{white-space:normal;text-align:center}}
</style>`);

document.body.insertAdjacentHTML('beforeend', `
  <div class="toast" id="toast" role="status"></div>
  <dialog id="authDialog" aria-labelledby="authTitle">
    <div class="auth-stage">
      <aside class="auth-visual">
        <img class="brand-mark" src="assets/nexocare-mark.png" alt="Símbolo de NexoCare" />
        <div><p class="eyebrow">AGENDA DE CITAS MÉDICAS</p><h3>Tu consulta, organizada con intención.</h3><p>Agenda, pacientes, recetas y administración en un solo espacio pensado para profesionales de la salud.</p><div class="auth-points"><span><i>✓</i>Información clínica centralizada</span><span><i>✓</i>Recetarios personalizados</span><span><i>✓</i>Experiencia adaptada a tu especialidad</span></div></div>
      </aside>
      <div class="modal-card auth-card">
        <div class="auth-brand"><img class="brand-mark" src="assets/nexocare-mark.png" alt="" /><b>Nexo<span>Care</span></b></div>
        <p class="eyebrow">TU CONSULTA, EN SINTONÍA</p><h2 id="authTitle">Inicia sesión</h2><p class="subtle" id="authCopy">Accede a tu agenda, pacientes y recetario profesional.</p>
        <p id="authMessage" class="form-message" role="status" aria-live="polite"></p><form id="registerForm" hidden><label>Nombre y apellido<input name="fullName" maxlength="100" autocomplete="name" required placeholder="Dra. Daniela Valero" /></label><label>Especialidad<select name="specialty" required></select></label><label>Número de colegiado / licencia <span class="optional">(opcional)</span><input name="license" placeholder="Ej. CMP 125.486" /></label><label>Teléfono WhatsApp<input name="phone" required placeholder="+58 412 000 0000" /></label><label>Correo profesional<input name="email" required autocomplete="email" type="email" placeholder="tu@consultorio.com" /></label><label>Contraseña<input name="password" autocomplete="new-password" required minlength="8" type="password" placeholder="Mínimo 8 caracteres" /></label><button class="primary-button" type="submit">Crear cuenta</button><button class="text-button" type="button" id="showLogin">Ya tengo una cuenta</button></form>
        <form id="loginForm"><label>Correo profesional<input name="email" required autocomplete="email" type="email" placeholder="tu@consultorio.com" /></label><label>Contraseña<input name="password" autocomplete="current-password" required type="password" placeholder="Tu contraseña" /></label><button class="primary-button" type="submit">Entrar a NexoCare</button><button class="text-button" type="button" id="showRegister">Crear una cuenta profesional</button></form>
      </div>
    </div>
  </dialog>
  <dialog id="appointmentDialog"><form class="modal-card" id="appointmentForm"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">NUEVA CITA</p><h2>Agendar consulta</h2><label>Paciente<select name="patient" required></select></label><label>Fecha y hora (zona de este dispositivo)<input name="date" required type="datetime-local" /></label><label>Honorarios estimados<input name="fee" type="number" min="0" step="0.01" value="0" required /></label><label>Estado<select name="status"><option>Pendiente</option><option>Confirmada</option><option>Completada</option><option>Cancelada</option></select></label><input name="id" type="hidden" /><label>Modalidad<select name="modality"><option>Presencial</option><option>Videoconsulta</option></select></label><button class="primary-button" type="submit">Guardar cita</button></form></dialog>
  <dialog id="profileDialog"><form class="modal-card profile-form" id="profileForm"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">PERFIL PROFESIONAL</p><h2>Identidad del consultorio</h2><div class="profile-logo-row"><div class="profile-logo-preview" id="profileLogoPreview"><img src="assets/nexocare-mark.png" alt="Logo actual" /></div><label class="upload-control">Logo del consultorio <span>PNG o JPG · máx. 3 MB</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" /></label></div><label>Nombre<input name="fullName" required /></label><label>Especialidad<select name="specialty" required></select></label><label>Licencia <span class="optional">(opcional)</span><input name="license" /></label><label>WhatsApp<input name="phone" required /></label><label>Zona horaria<input name="timezone" required placeholder="America/Caracas" /></label><label>Moneda<select name="currency"><option value="USD">USD · Dólar</option><option value="VES">VES · Bolívar</option><option value="EUR">EUR · Euro</option><option value="COP">COP · Peso colombiano</option><option value="MXN">MXN · Peso mexicano</option></select></label><label>Paleta del recetario<select name="palette"></select></label><div class="palette-preview" id="palettePreview"></div><button class="primary-button" type="submit">Guardar identidad profesional</button><p class="subtle">La moneda se aplica a todos los importes; no convierte los movimientos existentes.</p><button class="text-button" type="button" id="signOut">Cerrar sesión</button></form></dialog>
  <dialog id="prescriptionPreviewDialog"><div class="modal-card prescription-preview-modal"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">RECETA GENERADA</p><div class="section-heading"><h2>Recetario listo</h2><span class="page-count">2 páginas</span></div><p class="subtle">La primera hoja contiene los medicamentos y la segunda las indicaciones y horarios.</p><div class="prescription-pages"><figure><img id="prescriptionPage1" alt="Página de medicamentos" /><figcaption>Página 1 · Medicamentos</figcaption><a class="download-page" id="downloadPage1" download="receta-medicamentos.png">Descargar imagen</a></figure><figure><img id="prescriptionPage2" alt="Página de indicaciones" /><figcaption>Página 2 · Indicaciones</figcaption><a class="download-page" id="downloadPage2" download="receta-indicaciones.png">Descargar imagen</a></figure></div></div></dialog>
`);

function specialtyOptions(selected = '') {
  return '<option value="">Selecciona una especialidad</option>' + Object.entries(specialtyGroups).map(([group, items]) => `<optgroup label="${group}">${items.map(item => `<option${item === selected ? ' selected' : ''}>${item}</option>`).join('')}</optgroup>`).join('');
}

function paletteOptions(selected = 'nexocare') {
  return Object.entries(prescriptionPalettes).map(([value, palette]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${palette.label}</option>`).join('');
}

$('#registerForm [name="specialty"]').innerHTML = specialtyOptions();
$('#profileForm [name="palette"]').innerHTML = paletteOptions();
$('#profileForm [name="specialty"]').innerHTML = specialtyOptions();

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3000);
}


function zone() { return state.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone; }
function money(value) { return new Intl.NumberFormat('es-VE',{style:'currency',currency:state.profile?.currency || 'USD'}).format(value); }
function initials(name) { return name.split(' ').filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase(); }
function identity() {
  const profile=getProfile(); if(!profile) return;
  $('.welcome h1').textContent='Hola, ' + profile.fullName + '.';
  $('.avatar').textContent=initials(profile.fullName);
  $('.doctor-stamp').innerHTML='<b>'+esc(profile.fullName)+'</b><span>'+esc(profile.specialty)+(profile.license?' · '+esc(profile.license):'')+'</span>';
  const specialty=profile.specialty;
  const palette=/fisio|rehab|nutri|terapia/i.test(specialty)?'sage':/derma|cosm|estét/i.test(specialty)?'burgundy':/odont|cardio/i.test(specialty)?'clinical':'nexocare';
  const colors=prescriptionPalettes[palette];
  document.documentElement.style.setProperty('--sage',colors.accent);
  document.documentElement.style.setProperty('--sage-soft',colors.soft);
  document.documentElement.style.setProperty('--steel',colors.mid);
}
function appointmentCard(item, reminders=false) {
  const patient=state.patients.find(row=>row.id===item.patient_id);
  if(!patient) return '';
  const time=new Intl.DateTimeFormat('es-VE',{hour:'2-digit',minute:'2-digit',timeZone:zone()}).format(new Date(item.starts_at));
  const number=D.phone(patient.phone);
  const link=number?'<a class="whatsapp-action" aria-label="Preparar recordatorio para '+esc(patient.name)+'" target="_blank" rel="noopener" href="https://wa.me/'+number+'?text='+encodeURIComponent(D.reminder(item,patient,state.profile))+'">WhatsApp</a>':'';
  return '<article class="appointment"><time>'+esc(time)+'</time><div><h3>'+esc(patient.name)+'</h3><p>'+esc(item.modality)+'</p></div><div><span class="status">'+esc(item.status)+'</span>'+link+(reminders?'':'<button class="text-button" type="button" data-edit-appointment="'+esc(item.id)+'">Editar</button>')+'</div></article>';
}
function renderAppointments() {
  const rows=D.daily(state.appointments,selectedDay,zone());
  $('#appointmentList').innerHTML=rows.map(row=>appointmentCard(row)).join('') || '<div class="empty-inline"><h3>No tienes citas este día</h3><p>Agenda tu primera consulta con el botón «Nueva cita».</p></div>';
  const todayRows=D.daily(state.appointments,D.dateKey(new Date(),zone()),zone());
  const values=[todayRows.length,todayRows.filter(row=>row.status==='Confirmada').length,money(todayRows.reduce((total,row)=>total+Number(row.fee),0))];
  $$('.metrics b').forEach((element,index)=>element.textContent=values[index]);
  $('.welcome .subtle').textContent=todayRows.length?'Tienes '+todayRows.length+' citas programadas para hoy.':'Tu agenda de hoy está libre.';
  $('.welcome .eyebrow').textContent=new Intl.DateTimeFormat('es-VE',{dateStyle:'full',timeZone:zone()}).format(new Date());
  $('#agendaDate').value=selectedDay;
  const noon=new Date(selectedDay+'T12:00:00Z');
  const weekday=(noon.getUTCDay()+6)%7;
  const monday=D.nextDate(selectedDay,-weekday);
  $('.day-strip').innerHTML=Array.from({length:7},(_,index)=>{
    const day=D.nextDate(monday,index);
    const label=new Intl.DateTimeFormat('es-VE',{weekday:'short',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
    return '<button type="button" role="tab" aria-selected="'+(day===selectedDay)+'" data-day="'+day+'" class="'+(day===selectedDay?'selected':'')+'">'+label+'<b>'+Number(day.slice(-2))+'</b></button>';
  }).join('');
  const tomorrow=D.nextDate(D.dateKey(new Date(),zone()),1);
  const upcoming=D.daily(state.appointments,tomorrow,zone()).filter(row=>row.status!=='Completada');
  $('.icon-btn i').hidden=upcoming.length===0;
  $('#reminderList').innerHTML=upcoming.map(row=>appointmentCard(row,true)).join('') || '<p class="subtle">No tienes citas pendientes para mañana.</p>';
  $('#reminderSummary').textContent=upcoming.length+' citas para mañana';
}
function renderPatients(query='') {
  const needle=query.trim().toLocaleLowerCase('es');
  const rows=getPatients().filter(row=>(row.name+' '+row.phone).toLocaleLowerCase('es').includes(needle));
  $('#patientList').innerHTML=rows.map(row=>'<article class="patient"><span class="initials">'+esc(initials(row.name))+'</span><div><b>'+esc(row.name)+'</b><p>'+esc(row.phone)+(row.reason?' · '+esc(row.reason):'')+'</p></div><button type="button" class="link-button" data-edit-patient="'+esc(row.id)+'">Editar</button></article>').join('') || '<p class="empty-inline">'+(needle?'No hay pacientes que coincidan con la búsqueda.':'Tu lista está vacía. Agrega tu primer paciente con el botón +.')+'</p>';
}
function refreshPatientSelectors() {
  const options='<option value="">'+(state.patients.length?'Selecciona un paciente':'Primero registra un paciente')+'</option>'+getPatients().map(row=>'<option value="'+esc(row.id)+'">'+esc(row.name)+' · '+esc(row.phone)+'</option>').join('');
  ['#rxForm [name="patient"]','#appointmentForm [name="patient"]'].forEach(selector=>{
    const element=$(selector),previous=element.value; element.innerHTML=options; element.value=previous;
  });
}
function updatePalettePreview(value) {
  const palette=prescriptionPalettes[value] || prescriptionPalettes.nexocare;
  $('#palettePreview').innerHTML=[palette.dark,palette.mid,palette.accent,palette.soft,palette.paper].map(color=>'<i style="background:'+color+'"></i>').join('');
}
function openProfile() {
  if(!state.profile) return;
  const form=$('#profileForm');
  ['fullName','specialty','license','phone','timezone','currency'].forEach(key=>form.elements[key].value=state.profile[key] || '');
  form.elements.palette.value=state.profile.palette || 'nexocare';
  form.elements.logo.value='';
  $('#profileLogoPreview img').src=state.profile.logoDataUrl || 'assets/nexocare-mark.png';
  updatePalettePreview(form.elements.palette.value); $('#profileDialog').showModal();
}
function renderFinance() {
  const month=$('#financeMonth').value || D.dateKey(new Date(),zone()).slice(0,7);
  $('#financeMonth').value=month;
  const totals=D.totals(state.movements,month);
  $('.balance-card b').textContent=money(totals.balance/100);
  $('.balance-card span').textContent='Ingresos menos egresos registrados';
  const cards=$$('.finance-grid article');
  cards[0].querySelector('b').textContent=money(totals.income/100);
  cards[1].querySelector('b').textContent=money(totals.expense/100);
  cards[0].querySelector('small').textContent=totals.incomeCount+' ingresos registrados';
  cards[1].querySelector('small').textContent=totals.expenseCount+' egresos registrados';
  $('#movementList').innerHTML=state.movements.filter(row=>row.date.startsWith(month)).sort((a,b)=>b.date.localeCompare(a.date)).map(row=>'<article class="patient"><div><b>'+esc(row.description)+'</b><p>'+esc(row.date)+' · '+(row.kind==='income'?'Ingreso':'Egreso')+'</p></div><strong>'+money(Number(row.amount))+'</strong><button type="button" class="link-button" data-edit-movement="'+esc(row.id)+'">Editar</button></article>').join('') || '<p class="empty-inline">No hay movimientos en este mes. Tu balance comienza en cero.</p>';
}
function renderPrescriptions() {
  $('#prescriptionList').innerHTML=state.prescriptions.slice().sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(row=>'<article class="patient"><span class="initials">℞</span><div><b>'+esc(row.snapshot.patient)+'</b><p>'+esc(row.snapshot.date)+'</p></div><button type="button" class="link-button" data-open-prescription="'+esc(row.id)+'">Abrir</button></article>').join('');
  $('#recetas .empty-state').hidden=state.prescriptions.length>0;
}
function renderAll() { identity();renderPatients($('#patientSearch').value);refreshPatientSelectors();renderAppointments();renderFinance();renderPrescriptions(); }
function navigate(view) {
  $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  $$('.view').forEach(element=>element.classList.toggle('active',element.id===view));
}
function authMode(mode) {
  $('#registerForm').hidden=mode!=='register'; $('#loginForm').hidden=mode==='register';
  $('#authTitle').textContent=mode==='register'?'Crea tu cuenta profesional':'Inicia sesión';
  $('#authCopy').textContent=mode==='register'?'Tu cuenta comienza sin pacientes, citas ni movimientos.':'Accede a tu agenda, pacientes y recetario profesional.';
  $('#authMessage').textContent='';
}
function clearSession() {
  generation++;
  document.documentElement.style.removeProperty('--sage');document.documentElement.style.removeProperty('--sage-soft');document.documentElement.style.removeProperty('--steel'); state=D.freshState();
  $$('.app-shell,.bottom-nav').forEach(element=>element.hidden=true);
  $$('dialog[open]').forEach(dialog=>dialog.close());
  $$('form').forEach(form=>form.reset());
  $('#prescriptionPage1').removeAttribute('src');$('#prescriptionPage2').removeAttribute('src');
  $('#downloadPage1').removeAttribute('href');$('#downloadPage2').removeAttribute('href');
  $('#patientSearch').value=''; $('#financeMonth').value='';
  renderAll();authMode('login');$('#authDialog').showModal();
}
async function enter(user) {
  const ticket=++generation;
  const loaded=await api.load(user);
  if(ticket!==generation) return;
  state=loaded; selectedDay=D.dateKey(new Date(),zone());
  $('#financeMonth').value=selectedDay.slice(0,7);
  renderAll(); navigate('inicio');
  $('#authDialog').close();
  $$('.app-shell,.bottom-nav').forEach(element=>element.hidden=false);
  const count=D.daily(state.appointments,D.nextDate(selectedDay,1),zone()).length;
  if(count) toast('Tienes '+count+' citas para mañana. Revisa tus recordatorios.');
}
function humanError(error) {
  const message=String(error?.message || '');
  if(/invalid login/i.test(message)) return 'Correo o contraseña incorrectos.';
  if(/email not confirmed/i.test(message)) return 'Confirma tu correo antes de iniciar sesión.';
  if(/already registered/i.test(message)) return 'Este correo ya está registrado. Inicia sesión.';
  if(/rate limit/i.test(message)) return 'Demasiados intentos. Espera unos minutos.';
  if(/fetch|network/i.test(message)) return 'No hay conexión. Tus cambios no se guardaron; vuelve a intentar.';
  if(/duplicate|unique/i.test(message)) return 'Ya tienes una cita en ese horario. Elige otro horario.';
  return message || 'No se pudo completar la acción. Intenta otra vez.';
}
async function submit(form, action) {
  const button=form.querySelector('[type="submit"]');
  if(button.disabled) return;
  button.disabled=true; const label=button.textContent; button.textContent='Guardando…';
  let message=form.querySelector('.form-message');
  if(!message) { message=document.createElement('p');message.className='form-message';message.setAttribute('role','status');form.appendChild(message); }
  message.textContent='';
  try { await action(); }
  catch(error) { message.textContent=humanError(error); }
  finally { button.disabled=false;button.textContent=label; }
}
async function saveRow(table,values) {
  const owner=state.user?.id, ticket=generation;
  if(!owner) throw new Error('Inicia sesión para continuar.');
  const row=await api.save(table,values,owner);
  if(ticket!==generation || state.user?.id!==owner) throw new Error('La sesión cambió. Vuelve a abrir el formulario.');
  if(table==='profiles') state.profile=row;
  else state[table]=[...state[table].filter(item=>item.id!==row.id),row];
  return row;
}
function openPatient(id) {
  const row=state.patients.find(item=>item.id===id);
  const form=$('#patientForm');form.reset();
  ['id','name','phone','reason'].forEach(key=>form.elements[key].value=row?.[key] || '');
  form.querySelector('h2').textContent=row?'Editar paciente':'Crear ficha de paciente';
  $('#patientDialog').showModal();
}
function openAppointment(id) {
  if(!state.patients.length) { toast('Agrega tu primer paciente para poder agendar.');openPatient();return; }
  refreshPatientSelectors();
  const row=state.appointments.find(item=>item.id===id),form=$('#appointmentForm');form.reset();
  ['id','patient','fee','status','modality'].forEach(key=>form.elements[key].value=row?.[key==='patient'?'patient_id':key] ?? ({status:'Pendiente',modality:'Presencial',fee:0}[key] ?? ''));
  if(row) {
    const date=new Date(row.starts_at);const offset=date.getTimezoneOffset()*60000;
    form.elements.date.value=new Date(date-offset).toISOString().slice(0,16);
  } else form.elements.date.value=selectedDay+'T09:00';
  $('#appointmentDialog').showModal();
}
function openMovement(id) {
  const row=state.movements.find(item=>item.id===id),form=$('#movementForm');form.reset();
  ['id','kind','amount','description','date'].forEach(key=>form.elements[key].value=row?.[key] ?? ({kind:'income',date:D.dateKey()}[key] ?? ''));
  $('#movementDialog').showModal();
}
async function previewPrescription(data) {
  const ticket=generation;
  const [one,two]=await Promise.all([buildPrescriptionImage(data,1),buildPrescriptionImage(data,2)]);
  if(ticket!==generation) return;
  $('#prescriptionPage1').src=one;$('#downloadPage1').href=one;
  $('#prescriptionPage2').src=two;$('#downloadPage2').href=two;
  $('#rxDialog').close();$('#prescriptionPreviewDialog').showModal();
}
function addMedicineRow() {
  if ($$('.medicine-row').length >= 5) return toast('El formato de dos hojas admite hasta cinco medicamentos.');
  const template = $('#medicineRowTemplate');
  const clone = template.content.cloneNode(true);
  $('#medicineRows').appendChild(clone);
}

function collectMedicines() {
  return $$('.medicine-row').map(row => ({
    name: row.querySelector('[data-field="name"]').value.trim(),
    presentation: row.querySelector('[data-field="presentation"]').value.trim(),
    dose: row.querySelector('[data-field="dose"]').value.trim(),
    route: row.querySelector('[data-field="route"]').value.trim(),
    frequency: row.querySelector('[data-field="frequency"]').value.trim(),
    duration: row.querySelector('[data-field="duration"]').value.trim(),
    quantity: row.querySelector('[data-field="quantity"]').value.trim(),
    schedule: row.querySelector('[data-field="schedule"]').value.trim(),
    notes: row.querySelector('[data-field="notes"]').value.trim()
  })).filter(item => item.name);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 20) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (ctx.measureText(line).width > maxWidth) throw new Error('Un texto de la receta es demasiado largo para la hoja.');
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) throw new Error('Un campo de la receta excede el espacio disponible. Reduce su extensión antes de descargar.');
    } else line = test;
  }
  if (ctx.measureText(line).width > maxWidth) throw new Error('Un texto de la receta es demasiado largo para la hoja.');
  if (line && lines < maxLines) { ctx.fillText(line, x, y); y += lineHeight; }
  return y;
}

function drawSpecialtyWatermark(ctx, specialty, palette) {
  ctx.save();ctx.translate(620,850);ctx.globalAlpha=.065;ctx.strokeStyle=palette.mid;ctx.fillStyle=palette.mid;ctx.lineWidth=14;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.arc(0,0,220,0,Math.PI*2);ctx.stroke();ctx.beginPath();
  let label='SALUD Y BIENESTAR';
  if(/odont|dental/i.test(specialty)) {
    label='ODONTOLOGÍA';
    ctx.moveTo(0,-90);ctx.bezierCurveTo(-170,-170,-170,-30,-110,40);ctx.bezierCurveTo(-80,170,-35,180,-25,50);ctx.bezierCurveTo(0,20,25,20,30,65);ctx.bezierCurveTo(50,180,80,150,110,20);ctx.bezierCurveTo(170,-120,60,-150,0,-90);ctx.stroke();
  } else if(/fisio|rehab|terapia|deport/i.test(specialty)) {
    label='REHABILITACIÓN';ctx.arc(0,-110,30,0,Math.PI*2);ctx.stroke();ctx.beginPath();
    ctx.moveTo(0,-70);ctx.lineTo(0,30);ctx.moveTo(-115,-35);ctx.lineTo(0,-55);ctx.lineTo(100,-110);ctx.moveTo(0,30);ctx.lineTo(-85,140);ctx.moveTo(0,30);ctx.lineTo(100,115);ctx.stroke();
  } else if(/cosm|estét|derma/i.test(specialty)) {
    label='CUIDADO Y ESTÉTICA';
    for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-70,48,90,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  } else if(/psico|psiqu|neuro/i.test(specialty)) {
    label='BIENESTAR MENTAL';
    ctx.moveTo(0,-130);ctx.bezierCurveTo(-160,-190,-190,120,-30,125);ctx.bezierCurveTo(0,180,60,155,65,115);ctx.bezierCurveTo(200,90,145,-185,0,-130);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(0,100);ctx.moveTo(-90,-40);ctx.quadraticCurveTo(-20,-80,-20,10);ctx.moveTo(85,25);ctx.quadraticCurveTo(20,-10,20,70);ctx.stroke();
  } else {
    label=/cardio/i.test(specialty)?'CARDIOLOGÍA':/pedia/i.test(specialty)?'PEDIATRÍA':'SALUD Y BIENESTAR';
    ctx.moveTo(0,130);ctx.bezierCurveTo(-270,-40,-80,-200,0,-70);ctx.bezierCurveTo(80,-200,270,-40,0,130);ctx.stroke();ctx.beginPath();ctx.moveTo(-140,10);ctx.lineTo(-55,10);ctx.lineTo(-20,-40);ctx.lineTo(15,60);ctx.lineTo(50,10);ctx.lineTo(140,10);ctx.stroke();
  }
  ctx.textAlign='center';ctx.font='700 30px Arial';ctx.fillText(label,0,285,800);ctx.restore();
}

function drawHeader(ctx, data, pageTitle, palette, logo) {
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, 1240, 1754);
  ctx.fillStyle = palette.dark;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(1240,0); ctx.lineTo(1240,145); ctx.lineTo(930,112); ctx.lineTo(770,0); ctx.closePath(); ctx.fill();
  if (logo) {
    const ratio = Math.min(120 / logo.width, 120 / logo.height);
    const width = logo.width * ratio, height = logo.height * ratio;
    ctx.drawImage(logo, 72 + (120 - width) / 2, 52 + (120 - height) / 2, width, height);
  }
  ctx.fillStyle = palette.dark;
  ctx.font = '700 31px Arial';
  ctx.fillText(data.doctorName, 220, 85, 580);
  ctx.font = '500 20px Arial';
  ctx.fillStyle = palette.mid;
  ctx.fillText(`${data.specialty}${data.license ? ` · ${data.license}` : ''}`, 220, 120, 580);
  ctx.font = '500 18px Arial';
  ctx.fillText(data.phone || '', 220, 150);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px Arial';
  ctx.fillText('NEXOCARE', 1168, 60);
  ctx.font = '400 15px Arial';
  ctx.fillText('TU CONSULTA, EN SINTONÍA', 1168, 87);
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.dark;
  ctx.font = '700 34px Arial';
  ctx.fillText(pageTitle, 72, 235);
  ctx.fillStyle = '#59656e';
  ctx.font = '500 18px Arial';
  ctx.fillText(`Paciente: ${data.patient}`, 72, 286, 680);
  ctx.fillText(`Fecha: ${data.date}`, 800, 286);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(72, 310); ctx.lineTo(1168, 310); ctx.stroke();
}

function drawFooter(ctx, page, palette) {
  ctx.fillStyle = palette.soft;
  ctx.beginPath(); ctx.moveTo(0,1600); ctx.bezierCurveTo(320,1515,690,1690,1240,1560); ctx.lineTo(1240,1754); ctx.lineTo(0,1754); ctx.closePath(); ctx.fill();
  ctx.fillStyle = palette.mid;
  ctx.beginPath(); ctx.moveTo(0,1660); ctx.bezierCurveTo(390,1560,780,1730,1240,1610); ctx.lineTo(1240,1754); ctx.lineTo(0,1754); ctx.closePath(); ctx.fill();
  ctx.fillStyle = palette.dark;
  ctx.beginPath(); ctx.moveTo(0,1700); ctx.bezierCurveTo(410,1640,840,1760,1240,1660); ctx.lineTo(1240,1754); ctx.lineTo(0,1754); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Página ${page} de 2 · Documento emitido por NexoCare`, 620, 1722);
  ctx.textAlign = 'left';
}

async function buildPrescriptionImage(data, page) {
  const palette = prescriptionPalettes[data.palette] || prescriptionPalettes.nexocare;
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  let logo = null;
  try { logo = await loadImage(data.logo || 'assets/nexocare-mark.png'); } catch (_) {}
  drawHeader(ctx, data, page === 1 ? 'RÉCIPE · MEDICAMENTOS' : 'INDICACIONES Y HORARIOS', palette, logo);
  drawSpecialtyWatermark(ctx, data.specialty, palette);
  let y = 370;
  if (page === 1) {
    data.medicines.forEach((medicine, index) => {
      ctx.fillStyle = palette.accent;
      ctx.fillRect(72, y - 28, 48, 48);
      ctx.fillStyle = palette.dark;
      ctx.font = '700 25px Arial';
      ctx.fillText(String(index + 1).padStart(2, '0'), 82, y + 5);
      ctx.font = '700 27px Arial';
      y = wrapText(ctx, medicine.name, 145, y, 950, 32, 2) - 32;
      ctx.fillStyle = '#59656e';
      ctx.font = '500 19px Arial';
      y = wrapText(ctx, [medicine.presentation, medicine.dose, medicine.route].filter(Boolean).join(' · '), 145, y + 34, 880, 28, 2);
      y = wrapText(ctx, `Frecuencia: ${medicine.frequency || 'Según indicación'} · Duración: ${medicine.duration || '—'} · Cantidad: ${medicine.quantity || '—'}`, 145, y + 8, 880, 28, 2);
      ctx.strokeStyle = '#d9dde0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(145, y + 22); ctx.lineTo(1168, y + 22); ctx.stroke();
      y += 78;
    });
  } else {
    data.medicines.forEach((medicine, index) => {
      ctx.fillStyle = palette.dark;
      ctx.font = '700 25px Arial';
      y = wrapText(ctx, `${index + 1}. ${medicine.name}`, 72, y, 1096, 32, 2) - 32;
      ctx.fillStyle = '#59656e';
      ctx.font = '500 20px Arial';
      y = wrapText(ctx, `Horario: ${medicine.schedule || medicine.frequency || 'Según indicación médica'}`, 92, y + 36, 1020, 30, 3);
      y = wrapText(ctx, `Indicaciones: ${medicine.notes || 'Tomar según la dosis, vía y duración señaladas.'}`, 92, y + 8, 1020, 30, 4);
      ctx.strokeStyle = '#d9dde0'; ctx.beginPath(); ctx.moveTo(72, y + 20); ctx.lineTo(1168, y + 20); ctx.stroke();
      y += 72;
    });
    if (data.generalNotes) {
      ctx.fillStyle = palette.soft; ctx.fillRect(72, y, 1096, 170);
      ctx.fillStyle = palette.dark; ctx.font = '700 21px Arial'; ctx.fillText('RECOMENDACIONES GENERALES', 96, y + 42);
      ctx.fillStyle = '#59656e'; ctx.font = '500 19px Arial';
      wrapText(ctx, data.generalNotes, 96, y + 78, 1040, 29, 3);
    }
  }
  if (y > 1430 || (page === 2 && data.generalNotes && y + 170 > 1530)) {
    throw new Error('Las indicaciones exceden las dos hojas. Reduce el contenido o emite otra receta; no se ha descargado un documento cortado.');
  }
  drawFooter(ctx, page, palette);
  return canvas.toDataURL('image/png');
}

async function fileToDataUrl(file) {
  if (!file) return null;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Selecciona una imagen PNG, JPG o WebP.');
  if (file.size > 3 * 1024 * 1024) throw new Error('El logo supera 3 MB.');
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = 420; canvas.height = 220;
  const ctx = canvas.getContext('2d');
  const ratio = Math.min(380 / image.width, 180 / image.height);
  const width = image.width * ratio, height = image.height * ratio;
  ctx.drawImage(image, (420 - width) / 2, (220 - height) / 2, width, height);
  return canvas.toDataURL('image/png', .92);
}

document.body.insertAdjacentHTML('beforeend', '<dialog id="remindersDialog" aria-labelledby="reminderSummary"><div class="modal-card"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">RECORDATORIOS</p><h2 id="reminderSummary"></h2><p class="subtle">WhatsApp abre el mensaje para que lo revises y lo envíes.</p><div id="reminderList" class="appointment-list"></div></div></dialog><dialog id="movementDialog"><form id="movementForm" class="modal-card"><button class="close" type="button" aria-label="Cerrar">×</button><h2>Registrar movimiento</h2><input type="hidden" name="id"/><label>Tipo<select name="kind"><option value="income">Ingreso</option><option value="expense">Egreso</option></select></label><label>Descripción<input name="description" required maxlength="200"/></label><label>Importe<input name="amount" type="number" required min="0.01" step="0.01"/></label><label>Fecha<input name="date" type="date" required/></label><button class="primary-button" type="submit">Guardar movimiento</button></form></dialog>');
$('.day-strip').addEventListener('click',event=>{
  const button=event.target.closest('[data-day]');if(button){selectedDay=button.dataset.day;renderAppointments();}
});
$('#agendaDate').addEventListener('change',event=>{if(event.target.value){selectedDay=event.target.value;renderAppointments();}});
$('#previousWeek').addEventListener('click',()=>{selectedDay=D.nextDate(selectedDay,-7);renderAppointments();});
$('#nextWeek').addEventListener('click',()=>{selectedDay=D.nextDate(selectedDay,7);renderAppointments();});
$('#todayButton').addEventListener('click',()=>{selectedDay=D.dateKey(new Date(),zone());renderAppointments();});
$$('.nav-item').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.view)));
$('.brand').addEventListener('click',event=>{event.preventDefault();navigate('inicio');});
$('.icon-btn').addEventListener('click',()=>{renderAppointments();$('#remindersDialog').showModal();});
$('.avatar').addEventListener('click',openProfile);
document.addEventListener('click',event=>{
  const close=event.target.closest('.close');if(close){event.preventDefault();close.closest('dialog')?.close();}
  const remove=event.target.closest('.remove-medicine');
  if(remove){if($$('.medicine-row').length>1)remove.closest('.medicine-row').remove();else toast('La receta necesita al menos un medicamento.');}
  const patient=event.target.closest('[data-edit-patient]');if(patient)openPatient(patient.dataset.editPatient);
  const appointment=event.target.closest('[data-edit-appointment]');if(appointment)openAppointment(appointment.dataset.editAppointment);
  const movement=event.target.closest('[data-edit-movement]');if(movement)openMovement(movement.dataset.editMovement);
  const prescription=event.target.closest('[data-open-prescription]');
  if(prescription) {
    const row=state.prescriptions.find(item=>item.id===prescription.dataset.openPrescription);
    if(row)previewPrescription(row.snapshot).catch(error=>toast(humanError(error)));
  }
});
$('#authDialog').addEventListener('cancel',event=>event.preventDefault());
['#quickAdd','#addPatientTop'].forEach(selector=>$(selector).addEventListener('click',()=>openPatient()));
$('#newAppointment').addEventListener('click',()=>openAppointment());
$('#newMovement').addEventListener('click',()=>openMovement());
$('#financeMonth').addEventListener('change',renderFinance);
$('#patientSearch').addEventListener('input',event=>renderPatients(event.target.value));
$('#addMedicine').addEventListener('click',addMedicineRow);
['#newPrescription','#newPrescription2'].forEach(selector=>$(selector).addEventListener('click',()=>{
  if(!state.patients.length){toast('Registra un paciente para crear su receta.');openPatient();return;}
  $('#rxForm').reset();$('#medicineRows').replaceChildren();addMedicineRow();refreshPatientSelectors();$('#rxDialog').showModal();
}));
$('#profileForm [name="palette"]').addEventListener('change',event=>updatePalettePreview(event.target.value));
$('#profileForm [name="logo"]').addEventListener('change',async event=>{
  try {
    const data=await fileToDataUrl(event.target.files[0]);
    $('#profileLogoPreview img').src=data || state.profile.logoDataUrl || 'assets/nexocare-mark.png';
  } catch(error){ event.target.value='';toast(humanError(error)); }
});
$('#patientForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form));
    const name=values.name.trim(),phone=D.phone(values.phone);
    if(!name || phone.length<8 || phone.length>15)throw new Error('Completa el nombre y el teléfono con código de país (8 a 15 dígitos).');
    await saveRow('patients',{...(values.id?{id:values.id}:{}),name,phone,reason:values.reason.trim()});
    renderAll();$('#patientDialog').close();toast('Paciente guardado.');
  });
});
$('#appointmentForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form)),date=new Date(values.date);
    if(!state.patients.some(row=>row.id===values.patient))throw new Error('Selecciona un paciente registrado.');
    if(!Number.isFinite(date.getTime()))throw new Error('Indica una fecha válida.');
    if(!Number.isFinite(Number(values.fee)) || Number(values.fee)<0)throw new Error('Los honorarios no pueden ser negativos.');
    await saveRow('appointments',{...(values.id?{id:values.id}:{}),patient_id:values.patient,starts_at:date.toISOString(),modality:values.modality,status:values.status,fee:Number(values.fee)});
    selectedDay=D.dateKey(date,zone());renderAppointments();$('#appointmentDialog').close();toast('Cita guardada.');
  });
});
$('#movementForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form));
    if(!values.description.trim() || !Number.isFinite(Number(values.amount)) || Number(values.amount)<=0)throw new Error('Escribe una descripción y un importe mayor que cero.');
    await saveRow('movements',{...(values.id?{id:values.id}:{}),kind:values.kind,amount:Number(values.amount),description:values.description.trim(),date:values.date});
    $('#financeMonth').value=values.date.slice(0,7);renderFinance();$('#movementDialog').close();toast('Movimiento guardado.');
  });
});
$('#profileForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form));
    const fullName=values.fullName.trim(),phone=D.phone(values.phone);
    if(!fullName || phone.length<8 || phone.length>15)throw new Error('Revisa tu nombre y teléfono con código de país.');
    try{new Intl.DateTimeFormat('es',{timeZone:values.timezone});}catch(_){throw new Error('Indica una zona horaria válida, por ejemplo America/Caracas.');}
    const logoDataUrl=form.elements.logo.files[0]?await fileToDataUrl(form.elements.logo.files[0]):state.profile.logoDataUrl;
    await saveRow('profiles',{id:state.user.id,fullName,specialty:values.specialty,license:values.license.trim(),phone,palette:values.palette,logoDataUrl,timezone:values.timezone,currency:values.currency});
    renderAll();$('#profileDialog').close();toast('Perfil actualizado.');
  });
});
$('#rxForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const patient=state.patients.find(row=>row.id===form.elements.patient.value);
    if(!patient)throw new Error('Selecciona un paciente registrado.');
    const medicines=collectMedicines();if(!medicines.length)throw new Error('Agrega al menos un medicamento.');
    const profile=state.profile;
    const snapshot={doctorName:profile.fullName,specialty:profile.specialty,license:profile.license || '',phone:profile.phone,logo:profile.logoDataUrl,palette:profile.palette,patient:patient.name,date:new Intl.DateTimeFormat('es-VE',{timeZone:zone()}).format(new Date()),generalNotes:form.elements.generalNotes.value.trim(),medicines};
    // Render both pages first. Never save or download an incomplete prescription.
    await Promise.all([buildPrescriptionImage(snapshot,1),buildPrescriptionImage(snapshot,2)]);
    await saveRow('prescriptions',{patient_id:patient.id,snapshot});
    renderPrescriptions();await previewPrescription(snapshot);toast('Receta guardada y lista para descargar.');
  });
});
$('#showLogin').addEventListener('click',()=>authMode('login'));
$('#showRegister').addEventListener('click',()=>authMode('register'));
$('#loginForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form));
    const result=await api.login(values.email.trim().toLowerCase(),values.password);
    form.elements.password.value='';await enter(result.user);
  });
});
$('#registerForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  submit(form,async()=>{
    const values=Object.fromEntries(new FormData(form));
    const fullName=values.fullName.trim(),phone=D.phone(values.phone);
    if(!fullName || phone.length<8 || phone.length>15)throw new Error('Completa tu nombre y el teléfono con código de país.');
    const profile={fullName,specialty:values.specialty,license:values.license.trim(),phone,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,currency:'USD'};
    const result=await api.register(values.email.trim().toLowerCase(),values.password,profile);
    form.elements.password.value='';
    if(result.session) await enter(result.user);
    else {authMode('login');$('#loginForm [name="email"]').value=values.email.trim();$('#authMessage').textContent='No se pudo abrir la sesión automáticamente. Verifica que “Confirm email” esté desactivado en Supabase y vuelve a intentar.';}
  });
});
$('#signOut').addEventListener('click',async()=>{
  try {await api.logout();clearSession();}catch(error){toast(humanError(error));}
});
async function initialize() {
  clearSession();
  // The old prototype stored passwords in plaintext. Remove only that field;
  // keep the legacy profile/patient records untouched for an explicit import.
  try {
    const legacy=JSON.parse(localStorage.getItem('nexocare-doctor-profile') || 'null');
    if(legacy && Object.hasOwn(legacy,'password')){delete legacy.password;localStorage.setItem('nexocare-doctor-profile',JSON.stringify(legacy));}
  } catch(_) {}
  try {
    const session=await api.session();
    if(session)await enter(session.user);
    api.watch((event,session)=>{
      if(event==='SIGNED_OUT')clearSession();
      if(event==='SIGNED_IN' && session && state.user && session.user.id!==state.user.id) {
        clearSession(); setTimeout(()=>enter(session.user).catch(error=>{ $('#authMessage').textContent=humanError(error); }),0);
      }
    });
  } catch(error) {$('#authMessage').textContent=humanError(error);}
}
initialize();
