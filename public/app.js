import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, where 
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
  cal.innerHTML = "";
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
  onSnapshot(coupangRef, snap => {
    coupangData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateUI();
  });
  onSnapshot(baeminRef, snap => {
    baeminData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateUI();
  });
  onSnapshot(extraRef, snap => {
    extraData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateUI();
  });
}
loadRealtime();

// ✅ UI 업데이트 (히스토리 + 달력)
function updateUI() {
  const eatsList = document.getElementById("eatsHistoryList");
  const incomeList = document.getElementById("historyList");
  eatsList.innerHTML = "";
  incomeList.innerHTML = "";

  // 🧾 쿠팡/배민 합산
  const combinedDays = {};
  coupangData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0 };
    combinedDays[day].coupang = e["금액"];
  });
  baeminData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0 };
    combinedDays[day].baemin = e["금액"];
  });

  // 히스토리 렌더링
  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang || 0;
    const b = combinedDays[day].baemin || 0;
    const total = c + b;
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${day}일 | [쿠팡이츠] ${c.toLocaleString()}원 [배민커넥트] ${b.toLocaleString()}원 [합계] ${total.toLocaleString()}원`;
    eatsList.appendChild(div);
  });

  // 추가수익
  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${day}일 | ${e["금액"].toLocaleString()}원 (${e["원천_사유"] || "-"})`;
    incomeList.appendChild(div);
  });

  // 달력 업데이트
  makeCalendar("eats-calendar");
  makeCalendar("income-calendar");

  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang || 0;
    const b = combinedDays[day].baemin || 0;
    const total = c + b;
    const cell = document.querySelector(`#eats-calendar .day[data-daynum="${Number(day)}"]`);
    if (cell) cell.innerHTML = `<div class='date'>${day}</div><div class='income'>${total.toLocaleString()}원</div>`;
  });

  extraData.forEach(e => {
    const day = e["등록_날짜"].split("-")[2];
    const cell = document.querySelector(`#income-calendar .day[data-daynum="${Number(day)}"]`);
    if (cell) cell.innerHTML = `<div class='date'>${day}</div><div class='income added'>[추가] ${e["금액"].toLocaleString()}원</div>`;
  });

  // 총합
  const totalAll = Object.values(combinedDays).reduce((a, b) => a + (b.coupang + b.baemin), 0)
    + extraData.reduce((a, b) => a + b["금액"], 0);
  document.getElementById("monthTotal").innerText = totalAll.toLocaleString();
}

// ✅ 등록
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const eats = Number(document.getElementById("eats").value || 0);
  const bae = Number(document.getElementById("baemin").value || 0);
  const now = new Date();
  const dateText = `${now.getFullYear()}-${now.getMonth() + 1}-${day}`;
  if (eats > 0) await addDoc(coupangRef, { 등록_날짜: dateText, 금액: eats });
  if (bae > 0) await addDoc(baeminRef, { 등록_날짜: dateText, 금액: bae });
  alert("✅ 등록 완료!");
};

// ✅ 삭제
document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const now = new Date();
  const dateText = `${now.getFullYear()}-${now.getMonth() + 1}-${day}`;
  for (let col of ["쿠팡✅", "배민✅"]) {
    const q = query(collection(db, col), where("등록_날짜", "==", dateText));
    const snap = await getDocs(q);
    snap.forEach(async docu => await deleteDoc(doc(db, col, docu.id)));
  }
  alert("🧹 삭제 완료!");
};

// ✅ 추가 수익 등록
document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const amount = Number(document.getElementById("incomeAmount").value || 0);
  const reason = document.getElementById("incomeReason").value || "";
  const now = new Date();
  const dateText = `${now.getFullYear()}-${now.getMonth() + 1}-${day}`;
  await addDoc(extraRef, { 등록_날짜: dateText, 금액: amount, 원천_사유: reason });
  alert("✅ 추가 수익 등록 완료!");
};

// ✅ 추가 수익 삭제
document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = Number(sel.dataset.daynum);
  const now = new Date();
  const dateText = `${now.getFullYear()}-${now.getMonth() + 1}-${day}`;
  const q = query(collection(db, "추가수익✅"), where("등록_날짜", "==", dateText));
  const snap = await getDocs(q);
  snap.forEach(async docu => await deleteDoc(doc(db, "추가수익✅", docu.id)));
  alert("🧹 추가 수익 삭제 완료!");
};
