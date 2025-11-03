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

// ✅ 동적 컬렉션 생성
function getRefs(day) {
  const now = new Date();
  const yearName = `${now.getFullYear()}년✔️`;
  const monthName = `${now.getMonth() + 1}월✔️`;
  const dayName = `${day}일✔️`;

  return {
    coupangRef: collection(db, `${yearName}/${monthName}/${dayName}/쿠팡✔️`),
    baeminRef: collection(db, `${yearName}/${monthName}/${dayName}/배민✔️`),
    extraRef: collection(db, `${yearName}/${monthName}/추가수익✔️`)
  };
}

// ✅ 페이지 전환
window.showPage = function (id) {
  document.querySelectorAll(".page").forEach(p => (p.style.display = "none"));
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ 달력 만들기
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

// ✅ 쿠팡/배민 등록
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const { coupangRef, baeminRef } = getRefs(day);

  const eats = document.getElementById("eats").value.trim();
  const bae = document.getElementById("baemin").value.trim();
  if (!eats || !bae) return alert("💬 등록하실 금액을 모두 입력 해주세요!");

  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const existsC = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  const existsB = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));
  if (!existsC.empty || !existsB.empty) return alert("⚠️ 이미 등록된 날짜입니다 삭제후 시도 해주세요!");

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
  const { coupangRef, baeminRef } = getRefs(day);

  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;
  const delTargets = [];

  const coupangSnap = await getDocs(query(coupangRef, where("등록_날짜", "==", dateText)));
  coupangSnap.forEach(d => delTargets.push(doc(db, coupangRef.path, d.id)));

  const baeminSnap = await getDocs(query(baeminRef, where("등록_날짜", "==", dateText)));
  baeminSnap.forEach(d => delTargets.push(doc(db, baeminRef.path, d.id)));

  for (const t of delTargets) await deleteDoc(t);
  alert("🧹 삭제 완료!");
};

// ✅ 추가 수익 등록
document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = Number(sel.dataset.daynum);
  const { extraRef } = getRefs(day);

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
  const { extraRef } = getRefs(day);
  const dateText = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${day}`;

  const snap = await getDocs(query(extraRef, where("등록_날짜", "==", dateText)));
  snap.forEach(async (d) => await deleteDoc(doc(db, extraRef.path, d.id)));
  alert("🧹 해당 날짜 추가 수익 삭제 완료!");
};
