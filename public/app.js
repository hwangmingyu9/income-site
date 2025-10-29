// ✅ Firebase 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

// ✅ 기본 UI 제어
window.showPage = id => {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ 전역 데이터
let eatsData = [], incomeData = [], excelData = [];

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
["eats-calendar", "income-calendar", "excel-calendar"].forEach(makeCalendar);

// ✅ 데이터 렌더링
function refreshCalendars() {
  const combined = {};
  eatsData.forEach(e => (combined[e.day] = (combined[e.day] || []), combined[e.day].push(e.amount)));
  incomeData.forEach(e => (combined[e.day] = (combined[e.day] || []), combined[e.day].push(`[추가] ${e.amount}`)));

  ["eats-calendar", "income-calendar", "excel-calendar"].forEach(id => {
    document.querySelectorAll(`#${id} .day`).forEach(c => {
      const day = c.dataset.daynum;
      if (combined[day]) {
        const arr = combined[day];
        let html = `<div class='date'>${day}</div><div class='income'>`;
        html += arr.map(v =>
          typeof v === "string" ? `<span class='added'>${v.replace(/\d+/, m => Number(m).toLocaleString())}원</span>` : `${v.toLocaleString()}원`
        ).join("<br>");
        html += "</div>";
        c.innerHTML = html;
      } else c.innerHTML = `<div class='date'>${day}</div>`;
    });
  });
  const total = Object.values(combined).flat().map(v => parseInt(String(v).replace(/\D/g, "") || 0)).reduce((a, b) => a + b, 0);
  document.getElementById("monthTotal").innerText = total.toLocaleString();
}

// ✅ Firebase 로드
async function loadData() {
  const eatsSnap = await getDocs(collection(db, "eats"));
  const incomeSnap = await getDocs(collection(db, "income"));
  eatsData = eatsSnap.docs.map(d => d.data());
  incomeData = incomeSnap.docs.map(d => d.data());
  refreshCalendars();
  console.log("✅ Firebase 데이터 불러옴");
}
loadData();

// ✅ 등록 (쿠팡/배민)
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 먼저 선택해주세요!");
  const day = sel.dataset.daynum;
  const eats = Number(document.getElementById("eats").value || 0);
  const bae = Number(document.getElementById("baemin").value || 0);
  const total = eats + bae;
  await addDoc(collection(db, "eats"), { day, amount: total });
  eatsData.push({ day, amount: total });
  refreshCalendars();
  alert("✅ 등록 완료!");
};

// ✅ 삭제 (쿠팡/배민)
document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = sel.dataset.daynum;
  const qSnap = await getDocs(query(collection(db, "eats"), where("day", "==", day)));
  qSnap.forEach(async d => await deleteDoc(d.ref));
  eatsData = eatsData.filter(e => e.day != day);
  refreshCalendars();
  alert("🧹 삭제 완료!");
};

// ✅ 등록 (수익)
document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜 선택 먼저!");
  const day = sel.dataset.daynum;
  const amount = Number(document.getElementById("incomeAmount").value || 0);
  const reason = document.getElementById("incomeReason").value || "";
  if (!amount || !reason) return alert("💬 금액 + 사유 입력!");
  await addDoc(collection(db, "income"), { day, amount, reason });
  incomeData.push({ day, amount, reason });
  refreshCalendars();
  alert("✅ 수익 등록 완료!");
};

// ✅ 삭제 (수익)
document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜 선택!");
  const day = sel.dataset.daynum;
  const qSnap = await getDocs(query(collection(db, "income"), where("day", "==", day)));
  qSnap.forEach(async d => await deleteDoc(d.ref));
  incomeData = incomeData.filter(e => e.day != day);
  refreshCalendars();
  alert("🧹 수익 삭제 완료!");
};
