/* =====================================================
   CONNECT YOUR BACKEND HERE
   ===================================================== */
const API_URL = "http://localhost:5000/chat";   // Flask route in app.py

async function getBotReply(message){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if(!res.ok) throw new Error("Server error " + res.status);
  return await res.json();                        // { reply, sources:[{file,page}] }
}
/* ===================================================== */

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const chips = document.getElementById("chips");
const history = [];

function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmt(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")}

function addMsg(text, who, sources){
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.innerHTML = fmt(text);
  if(sources && sources.length){
    const s = document.createElement("div");
    s.className = "srcs";
    s.innerHTML = sources.map(x=>`<span class="src">📖 ${esc(String(x.file))} · p.${esc(String(x.page))}</span>`).join("");
    d.appendChild(s);
  }
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}
function showTyping(){
  const d = document.createElement("div");
  d.className = "msg bot typing";
  d.innerHTML = "<i></i><i></i><i></i>";
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}

async function handleSend(text){
  text = (text ?? input.value).trim();
  if(!text) return;
  chips.style.display = "none";
  addMsg(text, "user");
  history.push({ role: "user", content: text });
  input.value = "";
  send.disabled = true;
  const t = showTyping();
  try{
    const data = await getBotReply(text);
    t.remove();
    addMsg(data.reply, "bot", data.sources);
    history.push({ role: "assistant", content: data.reply });
  }catch(err){
    t.remove();
    addMsg("I couldn't reach the server. Make sure app.py is running on port 5000.", "bot");
    console.error(err);
  }
  send.disabled = false;
  input.focus();
}

send.addEventListener("click", e=>{
  const r = document.createElement("span");
  const b = send.getBoundingClientRect();
  r.className = "ripple";
  r.style.cssText = `width:30px;height:30px;left:${e.clientX-b.left-15}px;top:${e.clientY-b.top-15}px`;
  send.appendChild(r); setTimeout(()=>r.remove(),600);
  handleSend();
});
input.addEventListener("keydown", e=>{ if(e.key==="Enter") handleSend(); });
chips.addEventListener("click", e=>{
  if(e.target.classList.contains("chip")) handleSend(e.target.textContent.replace(/^\S+\s/,""));
});

/* cursor-following glow */
const glow = document.getElementById("glow");
window.addEventListener("pointermove", e=>{ glow.style.left = e.clientX+"px"; glow.style.top = e.clientY+"px"; });

/* welcome message */
addMsg("Hi! I'm **PulseAI** 👋 Ask me a medical question and I'll answer from my medical book, with the page numbers shown under each reply. What would you like to know?", "bot");
