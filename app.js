const appointments = [
  { time: '08:30', name: 'María González', phone: '584122031220', note: 'Consulta de seguimiento', status: 'Confirmada', accent: '#52b49b', bg: '#e1f4ed', color: '#258670' },
  { time: '10:00', name: 'Carlos Méndez', note: 'Primera consulta · Presencial', status: 'Pendiente', accent: '#f1b675', bg: '#fff1e1', color: '#a96519' },
  { time: '11:30', name: 'Ana Pérez', note: 'Control de tratamiento', status: 'Confirmada', accent: '#a794dd', bg: '#eee9fb', color: '#715da8' },
  { time: '15:00', name: 'Jorge Ramírez', note: 'Consulta de seguimiento', status: 'Por confirmar', accent: '#ef765f', bg: '#fff0ec', color: '#b8523d' },
  { time: '16:30', name: 'Laura Flores', note: 'Videoconsulta', status: 'Confirmada', accent: '#52b49b', bg: '#e1f4ed', color: '#258670' }
];
const patients = [
  ['María González', '+58 412 203 1220', 'MG'], ['Carlos Méndez', '+58 414 864 5192', 'CM'], ['Ana Pérez', '+58 424 981 3350', 'AP'], ['Jorge Ramírez', '+58 416 728 9942', 'JR'], ['Laura Flores', '+58 412 655 8772', 'LF']
];
const appointmentList = document.querySelector('#appointmentList');
function renderAppointments() { appointmentList.innerHTML = appointments.map(a => { const phone = a.phone || '584120000000'; const message = encodeURIComponent(`Hola ${a.name}, le recordamos amablemente su cita médica de mañana a las ${a.time}. Si necesita reprogramarla, por favor responda a este mensaje. Dra. Daniela Valero.`); return `<article class="appointment" style="--accent:${a.accent};--bg:${a.bg};--color:${a.color}"><time>${a.time}</time><div><h3>${a.name}</h3><p>${a.note}</p></div><div><span class="status">${a.status}</span> <a target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${message}" style="color:#168f62;text-decoration:none;font-size:18px" aria-label="Enviar recordatorio por WhatsApp">◔</a></div></article>`; }).join(''); }
function renderPatients(filter = '') { const term = filter.toLowerCase(); document.querySelector('#patientList').innerHTML = patients.filter(p => p.join(' ').toLowerCase().includes(term)).map(p => `<article class="patient"><span class="initials">${p[2]}</span><div><b>${p[0]}</b><p>${p[1]}</p></div></article>`).join('') || '<p class="subtle">No encontramos pacientes con ese nombre.</p>'; }
renderAppointments(); renderPatients();
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); button.classList.add('active'); document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.querySelector('#' + button.dataset.view).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }));
const patientDialog = document.querySelector('#patientDialog'); const rxDialog = document.querySelector('#rxDialog');
['#quickAdd','#addPatientTop'].forEach(id => document.querySelector(id).addEventListener('click', () => patientDialog.showModal()));
['#newPrescription','#newPrescription2'].forEach(id => document.querySelector(id).addEventListener('click', () => rxDialog.showModal()));
document.querySelector('#newAppointment').addEventListener('click', () => patientDialog.showModal());
document.querySelector('#patientForm').addEventListener('submit', e => { const f = new FormData(e.currentTarget); patients.unshift([f.get('name'), f.get('phone'), f.get('name').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()]); renderPatients(); });
document.querySelector('#rxForm').addEventListener('submit', () => alert('Receta lista. Al conectar Supabase, se guardará y podrá descargarse o enviarse desde el historial del paciente.'));
document.querySelector('#patientSearch').addEventListener('input', e => renderPatients(e.target.value));
