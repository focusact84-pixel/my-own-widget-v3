
let supabaseClient = null;

function initSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) return null;
  supabaseClient = window.supabase.createClient(url, key);
  return supabaseClient;
}

function initHamburger(currentPage){
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("menuPanel");
  if (!btn || !panel) return;
  [...panel.querySelectorAll(".menu-link")].forEach(link => {
    if (link.getAttribute("href") === currentPage) link.classList.add("active");
  });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-wrap")) panel.classList.remove("open");
  });
}

function setUserBadge(user) {
  const badge = document.getElementById("userBadge");
  const signOutBtn = document.getElementById("signOutBtn");
  if (!badge || !signOutBtn) return;
  if (user) {
    badge.hidden = false;
    badge.textContent = user.email || "Signed in";
    signOutBtn.hidden = false;
  } else {
    badge.hidden = true;
    signOutBtn.hidden = true;
  }
}

function formatDateLong(d) {
  return new Intl.DateTimeFormat(undefined, { weekday:"long", month:"short", day:"numeric" }).format(d);
}
function keyFromDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function monthLabel(d) {
  return new Intl.DateTimeFormat(undefined, { month:"long", year:"numeric" }).format(d);
}

async function getUser() {
  const supabase = initSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
async function signUp(email, password) {
  const supabase = initSupabaseClient();
  return await supabase.auth.signUp({ email, password });
}
async function signIn(email, password) {
  const supabase = initSupabaseClient();
  return await supabase.auth.signInWithPassword({ email, password });
}
async function signOut() {
  const supabase = initSupabaseClient();
  return await supabase.auth.signOut();
}

async function fetchGlobalWorkouts(userId) {
  const supabase = initSupabaseClient();
  const { data, error } = await supabase.from("global_workouts").select("label").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(row => row.label);
}
async function addGlobalWorkout(userId, label) {
  const supabase = initSupabaseClient();
  const { error } = await supabase.from("global_workouts").insert({ user_id: userId, label });
  if (error && !String(error.message || "").toLowerCase().includes("duplicate")) throw error;
}
async function deleteAllGlobalWorkouts(userId) {
  const supabase = initSupabaseClient();
  const { error } = await supabase.from("global_workouts").delete().eq("user_id", userId);
  if (error) throw error;
}
async function fetchDayPlan(userId, day) {
  const supabase = initSupabaseClient();
  const { data, error } = await supabase.from("plans").select("*").eq("user_id", userId).eq("day", day).maybeSingle();
  if (error) throw error;
  return data || { day, groups: [], planned: [], completed: [] };
}
async function upsertDayPlan(userId, day, groups, planned, completed) {
  const supabase = initSupabaseClient();
  const { error } = await supabase.from("plans").upsert({
    user_id: userId, day, groups, planned, completed, updated_at: new Date().toISOString()
  }, { onConflict: "user_id,day" });
  if (error) throw error;
}
async function fetchPlansInRange(userId, startDay, endDay) {
  const supabase = initSupabaseClient();
  const { data, error } = await supabase.from("plans").select("*").eq("user_id", userId).gte("day", startDay).lte("day", endDay);
  if (error) throw error;
  const map = {};
  data.forEach(row => { map[row.day] = row; });
  return map;
}

function statusForPlan(dayData){
  const planned = Array.isArray(dayData && dayData.planned) ? dayData.planned : [];
  const total = planned.length;
  if (!total) return { label:"No plan", cls:"status-empty", color:"var(--empty)", done:0, total:0 };
  const completed = Array.isArray(dayData && dayData.completed) ? dayData.completed : [];
  const done = planned.filter(label => completed.includes(label)).length;
  if (done === 0) return { label:"Skipped", cls:"status-red", color:"var(--red)", done, total };
  if (done >= total) return { label:"Complete", cls:"status-green", color:"var(--green)", done, total };
  return { label:"Partial", cls:"status-orange", color:"var(--orange)", done, total };
}

function renderConfigError(container) {
  container.innerHTML = '<div class="auth-wrap"><div class="panel"><div class="title">Supabase config needed</div><div class="subtitle">Open <code>supabase-config.js</code> and add your project URL and anon key.</div></div></div>';
}

function renderAuth(container, onAuthed) {
  container.innerHTML = '<div class="auth-wrap"><div class="panel"><div class="title">Sign in</div><div class="subtitle">Use the same account on phone and computer to sync your tracker.</div><div class="auth-grid"><input id="authEmail" class="field" type="email" placeholder="Email" /><input id="authPassword" class="field" type="password" placeholder="Password" /><div style="display:flex; gap:8px; flex-wrap:wrap;"><button id="signInBtn" class="btn primary" type="button">Sign in</button><button id="signUpBtn" class="btn" type="button">Create account</button></div><div id="authMessage" class="helper">If you already created an account, just sign in.</div></div></div></div>';
  const msg = document.getElementById("authMessage");
  document.getElementById("signInBtn").onclick = async () => {
    try {
      msg.className = "helper";
      msg.textContent = "Signing in...";
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const { error } = await signIn(email, password);
      if (error) throw error;
      msg.className = "success";
      msg.textContent = "Signed in.";
      const user = await getUser();
      if (user) onAuthed(user);
    } catch (e) {
      msg.className = "error";
      msg.textContent = e.message || "Sign in failed.";
    }
  };
  document.getElementById("signUpBtn").onclick = async () => {
    try {
      msg.className = "helper";
      msg.textContent = "Creating account...";
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const { error } = await signUp(email, password);
      if (error) throw error;
      msg.className = "success";
      msg.textContent = "Account created. If email confirmation is enabled, confirm first, then sign in.";
    } catch (e) {
      msg.className = "error";
      msg.textContent = e.message || "Sign up failed.";
    }
  };
}

async function initPage(currentPage, renderPage) {
  initHamburger(currentPage);
  const authMount = document.getElementById("authMount");
  const pageContent = document.getElementById("pageContent");
  const signOutBtn = document.getElementById("signOutBtn");
  const supabase = initSupabaseClient();
  if (!supabase) {
    renderConfigError(authMount);
    pageContent.hidden = true;
    return;
  }

  signOutBtn.onclick = async () => {
    await signOut();
    setUserBadge(null);
    pageContent.hidden = true;
    renderAuth(authMount, async (user) => {
      setUserBadge(user);
      authMount.innerHTML = "";
      pageContent.hidden = false;
      await renderPage(user);
    });
  };

  async function boot() {
    const user = await getUser();
    if (!user) {
      setUserBadge(null);
      pageContent.hidden = true;
      renderAuth(authMount, async (signedInUser) => {
        setUserBadge(signedInUser);
        authMount.innerHTML = "";
        pageContent.hidden = false;
        await renderPage(signedInUser);
      });
    } else {
      setUserBadge(user);
      authMount.innerHTML = "";
      pageContent.hidden = false;
      await renderPage(user);
    }
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session && session.user ? session.user : null;
    if (!user) {
      setUserBadge(null);
      pageContent.hidden = true;
      renderAuth(authMount, async (signedInUser) => {
        setUserBadge(signedInUser);
        authMount.innerHTML = "";
        pageContent.hidden = false;
        await renderPage(signedInUser);
      });
    }
  });

  await boot();
}
