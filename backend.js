/* Supabase owns authentication and enforces account isolation through RLS. */
window.NexoBackend = (() => {
  let client;
  function connect() {
    const config=window.NEXOCARE_CONFIG;
    if (!config?.url || !config?.publishableKey || !window.supabase) throw new Error('El servicio de acceso todavía no está disponible. Intenta más tarde.');
    return client ||= window.supabase.createClient(config.url, config.publishableKey);
  }
  function check(result) { if(result.error) throw result.error; return result.data; }
  const tables=['patients','appointments','movements','prescriptions'];
  async function readAll(db,table,userId) {
    const rows=[];
    for(let start=0;;start+=500) {
      const batch=check(await db.from(table).select('*').eq('doctor_id',userId).order('id').range(start,start+499));
      rows.push(...batch);if(batch.length<500)return rows;
    }
  }
  async function load(user) {
    const db=connect();
    const results=await Promise.all([db.from('profiles').select('*').eq('id',user.id).single(),...tables.map(async table=>({data:await readAll(db,table,user.id)}))]);
    const [profile,...data]=results.map(check);
    return {user,profile,...Object.fromEntries(tables.map((table,index)=>[table,data[index]]))};
  }
  async function save(table,row,expectedUserId) {
    const db=connect();
    const {data,error}=await db.auth.getUser();
    if(error || !data.user) throw new Error('Tu sesión terminó. Inicia sesión otra vez.');
    if(expectedUserId && data.user.id!==expectedUserId) throw new Error('La sesión cambió. Inicia sesión otra vez.');
    const owner=table==='profiles' ? {id:data.user.id} : {doctor_id:data.user.id};
    const values={...row,...owner};
    const query = row.id ? db.from(table).update(values).eq('id',row.id) : db.from(table).insert(values);
    return check(await query.select().single());
  }
  async function session() { return check(await connect().auth.getSession()).session; }
  return {
    connect,load,save,session,
    login:async(email,password)=>check(await connect().auth.signInWithPassword({email,password})),
    register:async(email,password,profile)=>check(await connect().auth.signUp({
      email,
      password,
      options:{data:profile,emailRedirectTo:window.location.origin}
    })),
    logout:async()=>{ const r=await connect().auth.signOut(); if(r.error) throw r.error; },
    watch:fn=>connect().auth.onAuthStateChange(fn)
  };
})();
