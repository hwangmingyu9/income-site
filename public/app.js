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

// ✅ 페이지 전환 함수
window.showPage = function (id) {
  document.querySelectorAll(".page").forEach(p => (p.style.display = "none"));
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 🔹 현재 연도·월 정보
const currentYear = "2025년✅";
const currentMonth = "11월✅";
const dayGroup = "날짜✅";

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

// ✅ Firestore 컬렉션 참조 함수
const getColRef = (day, type) =>
  collection(db, currentYear, currentMonth, dayGroup, `${day}일✅`, `${type}✅`);

// ✅ 데이터 불러오기
async function loadData() {
  coupangData = [];
  baeminData = [];
  extraData = [];

  for (let day = 1; day <= 31; day++) {
    const types = ["쿠팡", "배민", "추가수익"];
    for (const type of types) {
      const snap = await getDocs(getColRef(day, type));
      snap.forEach(docu => {
        const data = { id: docu.id, ...docu.data(), day, type };
        if (type === "쿠팡") coupangData.push(data);
        if (type === "배민") baeminData.push(data);
        if (type === "추가수익") extraData.push(data);
      });
    }
  }
  updateUI();
}
loadData();

// ✅ UI 갱신
function updateUI() {
  const eatsList = document.getElementById("eatsHistoryList");
  const incomeList = document.getElementById("historyList");
  eatsList.innerHTML = "";
  incomeList.innerHTML = "";

  const combinedDays = {};

  // 쿠팡
  coupangData.forEach(e => {
    const day = e.day;
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].coupang += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 배민
  baeminData.forEach(e => {
    const day = e.day;
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].baemin += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 추가수익
  extraData.forEach(e => {
    const day = e.day;
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].extra += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 히스토리
  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang;
    const b = combinedDays[day].baemin;
    const total = c + b;
    if (total > 0) {
      const div = document.createElement("div");
      div.classList.add("history-item");
      div.innerText = `📅 ${day}일 | [쿠팡이츠] ${c.toLocaleString()}원 [배민커넥트] ${b.toLocaleString()}원 [합계] ${total.toLocaleString()}원`;
      eatsList.appendChild(div);
    }
  });

  extraData.forEach(e => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${e.day}일 | ${e["금액"]} (${e["원천_사유"] || "-"})`;
    incomeList.appendChild(div);
  });

  makeCalendar("eats-calendar");
  makeCalendar("income-calendar");

  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang;
    const b = combinedDays[day].baemin;
    const e = combinedDays[day].extra;
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

  const eatsVal = Number(eats).toLocaleString() + "원";
  const baeVal = Number(bae).toLocaleString() + "원";

  await addDoc(getColRef(day, "쿠팡"), { 금액: eatsVal, 등록_날짜: `${day}일`, 원천_사유: "쿠팡이츠" });
  await addDoc(getColRef(day, "배민"), { 금액: baeVal, 등록_날짜: `${day}일`, 원천_사유: "배민커넥트" });
  alert("✅ 등록 완료!");
  loadData();
};

// ✅ 쿠팡/배민 삭제
document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  for (const type of ["쿠팡", "배민"]) {
    const snap = await getDocs(getColRef(day, type));
    snap.forEach(async (d) => await deleteDoc(doc(db, currentYear, currentMonth, dayGroup, `${day}일✅`, `${type}✅`, d.id)));
  }
  alert("🧹 삭제 완료!");
  loadData();
};

// ✅ 추가 수익 등록
document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const amount = document.getElementById("incomeAmount").value.trim();
  const reason = document.getElementById("incomeReason").value.trim();
  if (!amount || !reason) return alert("💬 금액과 사유를 모두 입력해주세요!");

  const amountStr = Number(amount).toLocaleString() + "원";
  await addDoc(getColRef(day, "추가수익"), { 금액: amountStr, 등록_날짜: `${day}일`, 원천_사유: reason });
  alert("✅ 추가 수익 등록 완료!");
  loadData();
};

// ✅ 추가 수익 삭제
document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const snap = await getDocs(getColRef(day, "추가수익"));
  snap.forEach(async (d) => await deleteDoc(doc(db, currentYear, currentMonth, dayGroup, `${day}일✅`, "추가수익✅", d.id)));
  alert("🧹 해당 날짜 추가 수익 삭제 완료!");
  loadData();
};
