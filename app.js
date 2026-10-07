const PROFILE_KEY = 'nexocare-doctor-profile';
const PATIENTS_KEY = 'nexocare-patients';

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

const defaultPatients = [
  { name: 'María González', phone: '+58 412 203 1220', reason: 'Seguimiento' },
  { name: 'Carlos Méndez', phone: '+58 414 864 5192', reason: 'Consulta general' },
  { name: 'Ana Pérez', phone: '+58 424 981 3350', reason: 'Control' }
];

const appointments = [
  { time:'08:30', name:'María González', phone:'584122031220', note:'Consulta de seguimiento', status:'Confirmada', accent:'#7e9d7a', bg:'#dfe8dd', color:'#49664e' },
  { time:'10:00', name:'Carlos Méndez', phone:'584148645192', note:'Primera consulta · Presencial', status:'Pendiente', accent:'#c4ac88', bg:'#eee4d2', color:'#7a6548' }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const getProfile = () => JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
const getPatients = () => JSON.parse(localStorage.getItem(PATIENTS_KEY) || 'null') || defaultPatients;
const savePatients = value => localStorage.setItem(PATIENTS_KEY, JSON.stringify(value));

document.head.insertAdjacentHTML('beforeend', `<style>
html,body{width:100%;min-height:100%;overflow-x:hidden}.app-shell{width:100%;margin-inline:auto}
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
  <dialog id="authDialog">
    <div class="auth-stage">
      <aside class="auth-visual">
        <img class="brand-mark" src="assets/nexocare-mark.png" alt="Símbolo de NexoCare" />
        <div><p class="eyebrow">AGENDA DE CITAS MÉDICAS</p><h3>Tu consulta, organizada con intención.</h3><p>Agenda, pacientes, recetas y administración en un solo espacio pensado para profesionales de la salud.</p><div class="auth-points"><span><i>✓</i>Información clínica centralizada</span><span><i>✓</i>Recetarios personalizados</span><span><i>✓</i>Experiencia adaptada a tu especialidad</span></div></div>
      </aside>
      <div class="modal-card auth-card">
        <div class="auth-brand"><img class="brand-mark" src="assets/nexocare-mark.png" alt="" /><b>Nexo<span>Care</span></b></div>
        <p class="eyebrow">TU CONSULTA, EN SINTONÍA</p><h2 id="authTitle">Inicia sesión</h2><p class="subtle" id="authCopy">Accede a tu agenda, pacientes y recetario profesional.</p>
        <form id="registerForm" hidden><label>Nombre y apellido<input name="fullName" required placeholder="Dra. Daniela Valero" /></label><label>Especialidad<select name="specialty" required></select></label><label>Número de colegiado / licencia <span class="optional">(opcional)</span><input name="license" placeholder="Ej. CMP 125.486" /></label><label>Teléfono WhatsApp<input name="phone" required placeholder="+58 412 000 0000" /></label><label>Correo profesional<input name="email" required type="email" placeholder="tu@consultorio.com" /></label><label>Contraseña<input name="password" required minlength="8" type="password" placeholder="Mínimo 8 caracteres" /></label><button class="primary-button" type="submit">Crear cuenta y entrar</button><button class="text-button" type="button" id="showLogin">Ya tengo una cuenta</button></form>
        <form id="loginForm"><label>Correo profesional<input name="email" required type="email" placeholder="tu@consultorio.com" /></label><label>Contraseña<input name="password" required type="password" placeholder="Tu contraseña" /></label><button class="primary-button" type="submit">Entrar a NexoCare</button><button class="text-button" type="button" id="showRegister">Crear una cuenta profesional</button></form>
      </div>
    </div>
  </dialog>
  <dialog id="appointmentDialog"><form class="modal-card" id="appointmentForm"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">NUEVA CITA</p><h2>Agendar consulta</h2><label>Paciente<select name="patient" required></select></label><label>Fecha y hora<input name="date" required type="datetime-local" /></label><label>Modalidad<select name="modality"><option>Presencial</option><option>Videoconsulta</option></select></label><button class="primary-button" type="submit">Guardar cita</button></form></dialog>
  <dialog id="profileDialog"><form class="modal-card profile-form" id="profileForm"><button class="close" type="button" aria-label="Cerrar">×</button><p class="eyebrow">PERFIL PROFESIONAL</p><h2>Identidad del consultorio</h2><div class="profile-logo-row"><div class="profile-logo-preview" id="profileLogoPreview"><img src="assets/nexocare-mark.png" alt="Logo actual" /></div><label class="upload-control">Logo del consultorio <span>PNG o JPG · máx. 3 MB</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" /></label></div><label>Nombre<input name="fullName" required /></label><label>Especialidad<input name="specialty" required /></label><label>Licencia <span class="optional">(opcional)</span><input name="license" /></label><label>WhatsApp<input name="phone" required /></label><label>Paleta del recetario<select name="palette"></select></label><div class="palette-preview" id="palettePreview"></div><button class="primary-button" type="submit">Guardar identidad profesional</button><button class="text-button" type="button" id="signOut">Cerrar sesión</button></form></dialog>
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

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3000);
}

function identity() {
  const profile = getProfile();
  if (!profile) return;
  const firstName = profile.fullName.replace(/^Dra?\.?\s*/i, '').split(' ')[0];
  const credential = profile.license ? ` · ${profile.license}` : '';
  $('.welcome h1').innerHTML = `Buenos días, <em>${firstName}.</em>`;
  $('.avatar').textContent = profile.fullName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  $('.doctor-stamp').innerHTML = `<b>${profile.fullName}</b><span>${profile.specialty}${credential}</span>`;
}

function renderAppointments() {
  $('#appointmentList').innerHTML = appointments.map(item => {
    const message = encodeURIComponent(`Hola ${item.name}, le recordamos amablemente su cita médica de mañana a las ${item.time}. Si necesita reprogramarla, por favor responda a este mensaje.`);
    const whatsApp = item.phone ? `<a class="whatsapp-action" aria-label="Recordar por WhatsApp a ${item.name}" target="_blank" rel="noopener" href="https://wa.me/${item.phone}?text=${message}">◔</a>` : '';
    return `<article class="appointment" style="--accent:${item.accent};--bg:${item.bg};--color:${item.color}"><time>${item.time}</time><div><h3>${item.name}</h3><p>${item.note}</p></div><div><span class="status">${item.status}</span>${whatsApp}</div></article>`;
  }).join('');
}

function initials(name) {
  return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function renderPatients(query = '') {
  const normalized = query.toLowerCase();
  const matches = getPatients().filter(patient => `${patient.name} ${patient.phone}`.toLowerCase().includes(normalized));
  $('#patientList').innerHTML = matches.map(patient => `<article class="patient"><span class="initials">${initials(patient.name)}</span><div><b>${patient.name}</b><p>${patient.phone}${patient.reason ? ` · ${patient.reason}` : ''}</p></div></article>`).join('') || '<p class="subtle">No encontramos pacientes.</p>';
}

function refreshPatientSelectors() {
  const options = '<option value="">Selecciona un paciente</option>' + getPatients().map(patient => `<option value="${patient.name}">${patient.name} · ${patient.phone}</option>`).join('');
  $('#rxForm [name="patient"]').innerHTML = options;
  $('#appointmentForm [name="patient"]').innerHTML = options;
}

function updatePalettePreview(value) {
  const palette = prescriptionPalettes[value] || prescriptionPalettes.nexocare;
  $('#palettePreview').innerHTML = [palette.dark, palette.mid, palette.accent, palette.soft, palette.paper].map(color => `<i style="background:${color}"></i>`).join('');
}

function openProfile() {
  const profile = getProfile();
  if (!profile) return;
  const form = $('#profileForm');
  ['fullName','specialty','license','phone'].forEach(key => form.elements[key].value = profile[key] || '');
  form.elements.palette.value = profile.palette || 'nexocare';
  form.elements.logo.value = '';
  $('#profileLogoPreview img').src = profile.logoDataUrl || 'assets/nexocare-mark.png';
  updatePalettePreview(form.elements.palette.value);
  $('#profileDialog').showModal();
}

function addMedicineRow() {
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
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) break;
    } else line = test;
  }
  if (line && lines < maxLines) { ctx.fillText(line, x, y); y += lineHeight; }
  return y;
}

function drawSpecialtyWatermark(ctx, specialty, palette) {
  const label = /odont|dental/i.test(specialty) ? 'ODONTOLOGÍA' : /fisio|rehab|terapia/i.test(specialty) ? 'REHABILITACIÓN' : /psico|psiqu/i.test(specialty) ? 'BIENESTAR MENTAL' : /cosm|estética|derma/i.test(specialty) ? 'CUIDADO Y ESTÉTICA' : /pedia/i.test(specialty) ? 'PEDIATRÍA' : 'SALUD Y BIENESTAR';
  ctx.save();
  ctx.globalAlpha = .075;
  ctx.strokeStyle = palette.mid;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(620, 920, 255, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = palette.mid;
  ctx.textAlign = 'center';
  ctx.font = '700 48px Arial';
  ctx.fillText(label, 620, 905);
  ctx.font = '400 25px Arial';
  ctx.fillText('NEXOCARE · CONSULTA CONECTADA', 620, 958);
  ctx.restore();
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
  ctx.fillText(data.doctorName, 220, 85);
  ctx.font = '500 20px Arial';
  ctx.fillStyle = palette.mid;
  ctx.fillText(`${data.specialty}${data.license ? ` · ${data.license}` : ''}`, 220, 120);
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
  ctx.fillText(`Paciente: ${data.patient}`, 72, 286);
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
      ctx.fillText(medicine.name, 145, y);
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
      ctx.fillText(`${index + 1}. ${medicine.name}`, 72, y);
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
  drawFooter(ctx, page, palette);
  return canvas.toDataURL('image/png');
}

async function fileToDataUrl(file) {
  if (!file) return null;
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

renderAppointments();
renderPatients();
refreshPatientSelectors();
identity();

const currentDate = new Intl.DateTimeFormat('es-VE', { weekday:'long', day:'numeric', month:'long' }).format(new Date()).toUpperCase();
const dateEyebrow = $('.welcome .eyebrow');
if (dateEyebrow) dateEyebrow.textContent = currentDate;

$$('.nav-item').forEach(button => button.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  $$('.view').forEach(view => view.classList.toggle('active', view.id === button.dataset.view));
}));

$$('.day-strip button').forEach(button => button.addEventListener('click', () => {
  $$('.day-strip button').forEach(item => { item.classList.remove('selected'); item.removeAttribute('aria-selected'); });
  button.classList.add('selected');
  button.setAttribute('aria-selected', 'true');
  toast(`Agenda del ${button.textContent.trim()}`);
}));

document.addEventListener('click', event => {
  const closeButton = event.target.closest('.close');
  if (closeButton) {
    event.preventDefault();
    closeButton.closest('dialog')?.close();
  }
  const removeButton = event.target.closest('.remove-medicine');
  if (removeButton) {
    const rows = $$('.medicine-row');
    if (rows.length > 1) removeButton.closest('.medicine-row').remove();
    else toast('La receta necesita al menos un medicamento.');
  }
});

['#quickAdd','#addPatientTop'].forEach(selector => $(selector).addEventListener('click', () => $('#patientDialog').showModal()));
['#newPrescription','#newPrescription2'].forEach(selector => $(selector).addEventListener('click', () => { refreshPatientSelectors(); $('#rxDialog').showModal(); }));
$('#newAppointment').addEventListener('click', () => { refreshPatientSelectors(); $('#appointmentDialog').showModal(); });
$('#todayButton').addEventListener('click', () => toast('Agenda de hoy seleccionada.'));
$('.icon-btn').addEventListener('click', () => toast('Tienes 2 recordatorios para enviar mañana.'));
$('.avatar').addEventListener('click', openProfile);
$('#addMedicine').addEventListener('click', addMedicineRow);
$('#patientSearch').addEventListener('input', event => renderPatients(event.target.value));
$('#profileForm [name="palette"]').addEventListener('change', event => updatePalettePreview(event.target.value));
$('#profileForm [name="logo"]').addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) $('#profileLogoPreview img').src = URL.createObjectURL(file);
});

$('#patientForm').addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const patients = getPatients();
  patients.unshift({ name: values.name.trim(), phone: values.phone.trim(), reason: values.reason.trim() });
  savePatients(patients);
  renderPatients(); refreshPatientSelectors();
  event.currentTarget.reset();
  $('#patientDialog').close();
  toast(`${values.name} fue agregado.`);
});

$('#appointmentForm').addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const patient = getPatients().find(item => item.name === values.patient);
  const date = new Date(values.date);
  appointments.unshift({ time: date.toLocaleTimeString('es-VE', {hour:'2-digit',minute:'2-digit'}), name: values.patient, phone: (patient?.phone || '').replace(/\D/g,''), note:`${values.modality} · Nueva consulta`, status:'Pendiente', accent:'#c4ac88', bg:'#eee4d2', color:'#7a6548' });
  renderAppointments();
  event.currentTarget.reset();
  $('#appointmentDialog').close();
  toast('Cita guardada.');
});

$('#rxForm').addEventListener('submit', async event => {
  event.preventDefault();
  const profile = getProfile();
  if (!profile) return toast('Completa primero tu perfil profesional.');
  const medicines = collectMedicines();
  if (!medicines.length) return toast('Agrega al menos un medicamento.');
  const form = new FormData(event.currentTarget);
  const data = {
    doctorName: profile.fullName,
    specialty: profile.specialty,
    license: profile.license || '',
    phone: profile.phone || '',
    logo: profile.logoDataUrl || '',
    palette: profile.palette || 'nexocare',
    patient: form.get('patient'),
    date: new Intl.DateTimeFormat('es-VE').format(new Date()),
    generalNotes: form.get('generalNotes'),
    medicines
  };
  const submit = event.currentTarget.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Generando imágenes…';
  try {
    const [page1, page2] = await Promise.all([buildPrescriptionImage(data, 1), buildPrescriptionImage(data, 2)]);
    $('#prescriptionPage1').src = page1; $('#downloadPage1').href = page1;
    $('#prescriptionPage2').src = page2; $('#downloadPage2').href = page2;
    $('#rxDialog').close();
    $('#prescriptionPreviewDialog').showModal();
    toast('Recetario de dos páginas generado.');
  } catch (error) { toast('No pudimos generar la receta. Intenta de nuevo.'); }
  finally { submit.disabled = false; submit.textContent = 'Generar recetario de 2 páginas'; }
});

$('#profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  const previous = getProfile();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const logoDataUrl = event.currentTarget.elements.logo.files[0] ? await fileToDataUrl(event.currentTarget.elements.logo.files[0]) : previous.logoDataUrl;
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...previous, fullName:values.fullName, specialty:values.specialty, license:values.license, phone:values.phone, palette:values.palette, logoDataUrl }));
    identity();
    $('#profileDialog').close();
    toast('Identidad profesional actualizada.');
  } catch (error) { toast(error.message || 'No pudimos guardar el logo.'); }
});

$('#signOut').addEventListener('click', () => { localStorage.removeItem(PROFILE_KEY); location.reload(); });
$('#registerForm').addEventListener('submit', event => {
  event.preventDefault();
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...Object.fromEntries(new FormData(event.currentTarget)), palette:'nexocare', logoDataUrl:'' }));
  $('#authDialog').close(); identity(); toast('¡Perfil profesional listo!');
});
$('#loginForm').addEventListener('submit', event => { event.preventDefault(); if (getProfile()) { $('#authDialog').close(); toast('Sesión iniciada.'); } else toast('Crea tu perfil primero.'); });
$('#showLogin').addEventListener('click', () => { $('#registerForm').hidden = true; $('#loginForm').hidden = false; $('#authTitle').textContent = 'Bienvenido de nuevo'; $('#authCopy').textContent = 'Accede a tu agenda clínica y continúa donde lo dejaste.'; });
$('#showRegister').addEventListener('click', () => { $('#registerForm').hidden = false; $('#loginForm').hidden = true; $('#authTitle').textContent = 'Crea tu cuenta profesional'; $('#authCopy').textContent = 'Configura tu perfil y disfruta una agenda adaptada a tu especialidad.'; });

if (!getProfile()) {
  $('#registerForm').hidden = true;
  $('#loginForm').hidden = false;
  $('#authTitle').textContent = 'Inicia sesión';
  $('#authCopy').textContent = 'Accede a tu agenda, pacientes y recetario profesional.';
  $('#authDialog').showModal();
}
