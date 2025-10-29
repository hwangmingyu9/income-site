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

// ✅ 한글 컬렉션
const coupangRef = collection(db, "쿠팡✅");
const baeminRef = collection(db, "배민✅");
const extraRef = collection(db, "추가수익✅");

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

// ✅ 실시간 반영
onSnapshot(coupangRef, snap => {
  coupangData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateUI();
});
onSnapshot(baeminRef, snap => {
  baeminData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateUI();
});
onSnapshot(extraRef, snap => {
  extraData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateUI();
});

// ✅ UI 업데이트 (달력 + 히스토리)
function updateUI() {
  const eatsList = document.getElementById("eatsHistoryList");
  const incomeList = document.getElementById("historyList");
  eatsList.innerHTML = "";
  incomeList.innerHTML = "";

  const combinedDays = {};

  // 쿠팡
  coupangData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].coupang = parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 배민
  baeminData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].baemin = parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 추가수익
  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].extra += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 히스토리
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

  // 달력 통합 반영
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

// ✅ 쿠팡/배민 등록
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const eats = document.getElementById("eats").value.trim();
  const bae = document.getElementById("baemin").value.trim();
  if (!eats || !bae) return alert("💬 등록하실 금액을 모두 입력 해주세요!");

  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const exists = coupangData.some(e => e["등록_날짜"] === dateText) || baeminData.some(e => e["등록_날짜"] === dateText);
  if (exists) return alert("⚠️ 이미 등록된 날짜입니다 삭제후 시도 해주세요!");

  const eatsVal = Number(eats).toLocaleString() + "원";
  const baeVal = Number(bae).toLocaleString() + "원";

  await addDoc(coupangRef, { 등록_날짜: dateText, 금액: eatsVal });
  await addDoc(baeminRef, { 등록_날짜: dateText, 금액: baeVal });
  alert("✅ 등록 완료!");
};

// ✅ 쿠팡/배민 삭제
document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;

  const delTargets = [];
  const coupangSnap = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  coupangSnap.forEach(d => delTargets.push(doc(db, "쿠팡✅", d.id)));
  const baeminSnap = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));
  baeminSnap.forEach(d => delTargets.push(doc(db, "배민✅", d.id)));

  for (const t of delTargets) await deleteDoc(t);
  alert("🧹 삭제 완료!");
};

// ✅ 추가 수익 등록
document.getElementById("addIncome").onclick = async () => {
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

// ✅ 추가 수익 삭제
document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const snap = await getDocs(query(extraRef, where("등록_날짜", "==", dateText)));
  snap.forEach(async (d) => await deleteDoc(doc(db, "추가수익✅", d.id)));
  alert("🧹 해당 날짜 추가 수익 삭제 완료!");
};
