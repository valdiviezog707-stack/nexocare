/* Pure domain rules shared by the interface and verification. */
window.NexoDomain = (() => {
  const dateKey = (date = new Date(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone) =>
    new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const nextDate = (key, days) => {
    const date = new Date(key + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0,10);
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const freshState = () => ({user:null,profile:null,patients:[],appointments:[],movements:[],prescriptions:[]});
  const daily = (rows, day, zone) => rows.filter(row => dateKey(new Date(row.starts_at), zone) === day && row.status !== 'Cancelada')
    .sort((a,b) => a.starts_at.localeCompare(b.starts_at));
  const totals = (rows, month) => rows.filter(row=>row.date.startsWith(month)).reduce((sum,row)=>{
    const cents=Math.round(Number(row.amount)*100);
    if(row.kind === 'income') { sum.income += cents; sum.incomeCount++; }
    else { sum.expense += cents; sum.expenseCount++; }
    sum.balance=sum.income-sum.expense; return sum;
  },{income:0,expense:0,balance:0,incomeCount:0,expenseCount:0});
  const phone = value => String(value || '').replace(/\D/g,'');
  const reminder = (appointment,patient,profile) => {
    const when = new Intl.DateTimeFormat('es-VE',{dateStyle:'long',timeStyle:'short',timeZone:profile.timezone}).format(new Date(appointment.starts_at));
    return 'Hola ' + patient.name + ', le recordamos amablemente su cita con ' + profile.fullName + ' el ' + when + '. Si necesita reprogramarla, por favor responda a este mensaje. Gracias por su confianza.';
  };
  return {dateKey,nextDate,escape,freshState,daily,totals,phone,reminder};
})();
