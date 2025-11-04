// ✅ Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, getDocs,
  query, where, onSnapshot
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

// ✅ 현재 년/월 기반 컬렉션 경로 자동 생성
function getCollections() {
  const now = new Date();
  const year = `${now.getFullYear()}년✅`;
  const month = `${now.getMonth() + 1}월✅`;
  return {
    coupangRef: collection(db, `${year}/${month}/02_쿠팡✅`),
    baeminRef: collection(db, `${year}/${month}/01_배민✅`),
    extraRef: collection(db, `${year}/${month}/03_추가수익✅`),
    totalRef: collection(db, `${year}/${month}/04_합계✅`)
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

// ✅ 실시간 반영
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

  // 쿠팡
  coupangData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].coupang += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 배민
  baeminData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].baemin += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 추가수익
  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    combinedDays[day] = combinedDays[day] || { coupang: 0, baemin: 0, extra: 0 };
    combinedDays[day].extra += parseInt(e["금액"].replace(/[^\d]/g, "")) || 0;
  });

  // 히스토리 표시
  Object.keys(combinedDays).forEach(day => {
    const c = combinedDays[day].coupang;
    const b = combinedDays[day].baemin;
    const t = c + b;
    if (t > 0) {
      const div = document.createElement("div");
      div.classList.add("history-item");
      div.innerText = `📅 ${day}일 | [쿠팡이츠] ${c.toLocaleString()}원 [배민커넥트] ${b.toLocaleString()}원 [합계] ${t.toLocaleString()}원`;
      eatsList.appendChild(div);
    }
  });

  // 추가 수익 히스토리
  extraData.forEach(e => {
    const d = e["등록_날짜"];
    const day = d.split("-")[2];
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${day}일 | ${e["금액"]} (${e["원천_사유"] || "-"})`;
    incomeList.appendChild(div);
  });

  // 달력 표시
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
  const { coupangRef, baeminRef, totalRef, extraRef } = getCollections();
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const eats = document.getElementById("eats").value.trim();
  const bae = document.getElementById("baemin").value.trim();
  if (!eats || !bae) return alert("💬 등록하실 금액을 모두 입력 해주세요!");

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const dateText = `${year}-${month}-${day}`;
  const docId = dateText;

  const eatsVal = Number(eats).toLocaleString() + "원";
  const baeVal = Number(bae).toLocaleString() + "원";

  await setDoc(doc(coupangRef, docId), { 등록_날짜: dateText, 금액: eatsVal });
  await setDoc(doc(baeminRef, docId), { 등록_날짜: dateText, 금액: baeVal });

  // ✅ 자동 합계 계산
  const extras = await getDocs(query(extraRef, where("등록_날짜", "==", dateText)));
  let extraVal = 0;
  let reasonTxt = "";
  extras.forEach(d => {
    extraVal += parseInt(d.data()["금액"].replace(/[^\d]/g, "")) || 0;
    reasonTxt = d.data()["원천_사유"] || "";
  });

  const totalSum = Number(eats) + Number(bae) + Number(extraVal);
  await setDoc(doc(totalRef, docId), {
    "01_배민커넥트": baeVal,
    "02_쿠팡이츠": eatsVal,
    "03_추가_수입": extraVal ? extraVal.toLocaleString() + "원" : "-",
    "04_원천_사유": reasonTxt || "-",
    "05_전체_합계": totalSum.toLocaleString() + "원",
    "06_등록_날짜": dateText
  });

  alert("✅ 등록 및 합계 계산 완료!");
};

// ✅ 추가 수익 등록
document.getElementById("addIncome").onclick = async () => {
  const { extraRef, totalRef, coupangRef, baeminRef } = getCollections();
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const amount = document.getElementById("incomeAmount").value.trim();
  const reason = document.getElementById("incomeReason").value.trim();
  if (!amount || !reason) return alert("💬 금액과 사유를 모두 입력해주세요!");

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const dateText = `${year}-${month}-${day}`;
  const docId = dateText;

  const amountStr = Number(amount).toLocaleString() + "원";
  await setDoc(doc(extraRef, docId), {
    등록_날짜: dateText,
    금액: amountStr,
    원천_사유: reason
  });

  // ✅ 자동 합계 계산
  const coupangSnap = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  const baeminSnap = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));

  let coupangVal = 0, baeminVal = 0;
  coupangSnap.forEach(d => coupangVal += parseInt(d.data()["금액"].replace(/[^\d]/g, "")) || 0);
  baeminSnap.forEach(d => baeminVal += parseInt(d.data()["금액"].replace(/[^\d]/g, "")) || 0);

  const totalSum = coupangVal + baeminVal + Number(amount);
  await setDoc(doc(totalRef, docId), {
    "01_배민커넥트": baeminVal ? baeminVal.toLocaleString() + "원" : "-",
    "02_쿠팡이츠": coupangVal ? coupangVal.toLocaleString() + "원" : "-",
    "03_추가_수입": amountStr,
    "04_원천_사유": reason,
    "05_전체_합계": totalSum.toLocaleString() + "원",
    "06_등록_날짜": dateText
  });

  alert("✅ 추가 수익 등록 및 합계 반영 완료!");
};

// ✅ 쿠팡/배민 삭제
document.getElementById("deleteEats").onclick = async () => {
  const { coupangRef, baeminRef, totalRef } = getCollections();
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;

  let deleted = false;

  const coupangSnap = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  for (const d of coupangSnap.docs) {
    await deleteDoc(doc(coupangRef, d.id));
    deleted = true;
  }

  const baeminSnap = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));
  for (const d of baeminSnap.docs) {
    await deleteDoc(doc(baeminRef, d.id));
    deleted = true;
  }

  const totalSnap = await getDocs(query(totalRef, where("06_등록_날짜", "==", dateText)));
  for (const d of totalSnap.docs) {
    await deleteDoc(doc(totalRef, d.id));
  }

  if (deleted) alert("🧹 해당 날짜 수익이 삭제되었습니다!");
  else alert("⚠️ 삭제할 데이터가 없습니다.");
};

// ✅ 추가 수익 삭제
document.getElementById("deleteIncome").onclick = async () => {
  const { extraRef, totalRef } = getCollections();
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택해주세요 !");
  const day = Number(sel.dataset.daynum);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;

  let deleted = false;

  const snap = await getDocs(query(extraRef, where("등록_날짜", "==", dateText)));
  for (const d of snap.docs) {
    await deleteDoc(doc(extraRef, d.id));
    deleted = true;
  }

  const totalSnap = await getDocs(query(totalRef, where("06_등록_날짜", "==", dateText)));
  for (const d of totalSnap.docs) {
    await deleteDoc(doc(totalRef, d.id));
  }

  if (deleted) alert("🧹 해당 날짜 추가 수익이 삭제되었습니다!");
  else alert("⚠️ 삭제할 데이터가 없습니다.");
};
