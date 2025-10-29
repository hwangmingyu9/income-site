import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_JssdYuI3Lq8CUJibU2ex9cPRTlJWFSw",
  authDomain: "income-site-89fcf.firebaseapp.com",
  projectId: "income-site-89fcf",
  storageBucket: "income-site-89fcf.firebasestorage.app",
  messagingSenderId: "645854803885",
  appId: "1:645854803885:web:1771b066b5b3f9e12d1324"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ 한글 컬렉션
const coupangRef = collection(db, "쿠팡✅");
const baeminRef = collection(db, "배민✅");
const extraRef = collection(db, "추가수익✅");

let coupangData = [];
let baeminData = [];
let extraData = [];

// ✅ 페이지 이동
window.showPage = function(id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ 달력 생성
function makeCalendar(id) {
  const cal = document.getElementById(id);
  for (let i = 1; i <= 31; i++) {
    const d = document.createElement("div");
    d.classList.add("day");
    d.dataset.daynum = i;
    d.innerHTML = `<div class='date'>${i}</div>`;
    d.onclick = () => {
      document.querySelectorAll(`#${id} .day`).forEach(x => x.classList.remove("selected"));
      d.classList.add("selected");
      window[id + "Sel"] = d;
    };
    cal.appendChild(d);
  }
}
makeCalendar("eats-calendar");
makeCalendar("income-calendar");

// ✅ 실시간 반영
function loadRealtime() {
  onSnapshot(query(coupangRef, orderBy("day")), snap => {
    coupangData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    refresh();
  });
  onSnapshot(query(baeminRef, orderBy("day")), snap => {
    baeminData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    refresh();
  });
  onSnapshot(query(extraRef, orderBy("day")), snap => {
    extraData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    refresh();
  });
}
loadRealtime();

// ✅ 갱신 함수
function refresh() {
  const eatsList = document.getElementById("eatsHistoryList");
  const incomeList = document.getElementById("historyList");
  eatsList.innerHTML = "";
  incomeList.innerHTML = "";

  const allEats = [...coupangData, ...baeminData];
  allEats.forEach(e => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${e.day}일 | ${e.amount.toLocaleString()}원`;
    eatsList.appendChild(div);
  });

  extraData.forEach(e => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${e.day}일 | ${e.amount.toLocaleString()}원 (${e.reason || "-"})`;
    incomeList.appendChild(div);
  });

  const total = allEats.concat(extraData).reduce((a, b) => a + (b.amount || 0), 0);
  document.getElementById("monthTotal").innerText = total.toLocaleString();
}

// ✅ 등록 / 삭제
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const eats = Number(document.getElementById("eats").value || 0);
  const bae = Number(document.getElementById("baemin").value || 0);
  if (eats > 0) await addDoc(coupangRef, { day, amount: eats });
  if (bae > 0) await addDoc(baeminRef, { day, amount: bae });
  alert("✅ 등록 완료!");
};

document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const targets = [...coupangData, ...baeminData].filter(e => e.day == day);
  for (const t of targets) {
    const refName = coupangData.includes(t) ? "쿠팡✅" : "배민✅";
    await deleteDoc(doc(db, refName, t.id));
  }
  alert("🧹 삭제 완료!");
};

document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const amount = Number(document.getElementById("incomeAmount").value || 0);
  const reason = document.getElementById("incomeReason").value || "";
  await addDoc(extraRef, { day, amount, reason });
  alert("✅ 추가 수익 등록 완료!");
};

document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const targets = extraData.filter(e => e.day == day);
  for (const t of targets) await deleteDoc(doc(db, "추가수익✅", t.id));
  alert("🧹 삭제 완료!");
};
