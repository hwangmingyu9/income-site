// ✅ Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  getDocs, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Firebase 설정
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

// ✅ 페이지 전환
window.showPage = function (id) {
  document.querySelectorAll(".page").forEach(p => (p.style.display = "none"));
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ 현재 날짜 기반 경로 자동 생성
function getCollections() {
  const now = new Date();
  const year = `${now.getFullYear()}년✅`;
  const month = `${now.getMonth() + 1}월✅`;
  return {
    coupangRef: collection(db, `${year}/${month}/02_쿠팡✅`),
    baeminRef: collection(db, `${year}/${month}/01_배민✅`),
    extraRef: collection(db, `${year}/${month}/03_추가수익✅`)
  };
}

// ✅ 데이터 캐시
let coupangData = [];
let baeminData = [];
let extraData = [];

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

// ✅ 데이터 로드
function loadData() {
  const { coupangRef, baeminRef, extraRef } = getCollections();
  onSnapshot(coupangRef, snap => { coupangData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); updateUI(); });
  onSnapshot(baeminRef, snap => { baeminData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); updateUI(); });
  onSnapshot(extraRef, snap => { extraData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); updateUI(); });
}
loadData();

// ✅ UI 갱신
function updateUI() {
  const eatsList = document.getElementById("eatsHistoryList");
  const incomeList = document.getElementById("historyList");
  eatsList.innerHTML = "";
  incomeList.innerHTML = "";

  const combinedDays = {};

  // 쿠팡/배민 데이터 결합
  [...coupangData, ...baeminData].forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    if (!combinedDays[day]) combinedDays[day] = { coupang: 0, baemin: 0, extra: 0 };
    if (e["금액"]) {
      if (e.path?.includes("쿠팡")) combinedDays[day].coupang += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
      else combinedDays[day].baemin += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
    }
  });

  // 추가수익
  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].extra += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 히스토리 출력
  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang || 0;
    const b = combinedDays[day].baemin || 0;
    const total = c + b;
    if (total > 0) {
      const div = document.createElement("div");
      div.classList.add("history-item");
      div.innerText = `📅 ${day}일 | [쿠팡이츠] ${c.toLocaleString()}원 [배민커넥트] ${b.toLocaleString()}원 [합계] ${total.toLocaleString()}원`;
      eatsList.appendChild(div);
    }
  });

  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${day}일 | ${e["금액"]} (${e["원천_사유"] || "-"})`;
    incomeList.appendChild(div);
  });

  makeCalendar("eats-calendar");
  makeCalendar("income-calendar");

  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang || 0;
    const b = combinedDays[day].baemin || 0;
    const e = combinedDays[day].extra || 0;
    const html = `
      <div class='date'>${day}</div>
      ${c || b ? `<div class='income'>${(c + b).toLocaleString()}원</div>` : ""}
      ${e ? `<div class='income added'>[추가] ${e.toLocaleString()}원</div>` : ""}
    `;
    const eatCell = document.querySelector(`#eats-calendar .day[data-daynum="${day}"]`);
    const incomeCell = document.querySelector(`#income-calendar .day[data-daynum="${day}"]`);
    if (eatCell) eatCell.innerHTML = html;
    if (incomeCell) incomeCell.innerHTML = html;
  });

  const totalAll = Object.values(combinedDays)
    .reduce((a, b) => a + b.coupang + b.baemin + b.extra, 0);
  document.getElementById("monthTotal").innerText = totalAll.toLocaleString();
}

// ✅ 등록 / 삭제 로직 동일
document.getElementById("saveEats").onclick = async () => {
  const { coupangRef, baeminRef } = getCollections();
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const eats = document.getElementById("eats").value.trim();
  const bae = document.getElementById("baemin").value.trim();
  if (!eats || !bae) return alert("💬 등록하실 금액을 모두 입력 해주세요!");

  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const eatsVal = Number(eats).toLocaleString() + "원";
  const baeVal = Number(bae).toLocaleString() + "원";

  await addDoc(coupangRef, { 등록_날짜: dateText, 금액: eatsVal });
  await addDoc(baeminRef, { 등록_날짜: dateText, 금액: baeVal });
  alert("✅ 등록 완료!");
};

document.getElementById("deleteEats").onclick = async () => {
  const { coupangRef, baeminRef } = getCollections();
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;

  const coupangSnap = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  coupangSnap.forEach(async d => await deleteDoc(doc(db, coupangRef.path, d.id)));
  const baeminSnap = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));
  baeminSnap.forEach(async d => await deleteDoc(doc(db, baeminRef.path, d.id)));
  alert("🧹 삭제 완료!");
};

// ✅ 추가 수익 등록/삭제
document.getElementById("addIncome").onclick = async () => {
  const { extraRef } = getCollections();
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const amount = document.getElementById("incomeAmount").value.trim();
  const reason = document.getElementById("incomeReason").value.trim();
  if (!amount || !reason) return alert("💬 금액과 사유를 모두 입력해주세요!");

  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const amountStr = Number(amount).toLocaleString() + "원";
  await addDoc(extraRef, { 등록_날짜: dateText, 금액: amountStr, 원천_사유: reason });
  alert("✅ 추가 수익 등록 완료!");
};

document.getElementById("deleteIncome").onclick = async () => {
  const { extraRef } = getCollections();
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const snap = await getDocs(query(extraRef, where("등록_날짜", "==", dateText)));
  snap.forEach(async d => await deleteDoc(doc(db, extraRef.path, d.id)));
  alert("🧹 해당 날짜 추가 수익 삭제 완료!");
};
