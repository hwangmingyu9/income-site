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

// ✅ 한글 컬렉션 지정
const coupangRef = collection(db, "쿠팡");
const baeminRef = collection(db, "배민");
const extraRef = collection(db, "추가수익");

let coupangData = [];
let baeminData = [];
let extraData = [];

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
onSnapshot(query(coupangRef, orderBy("day")), (snap) => {
  coupangData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  refreshCalendar("eats-calendar");
  updateHistory();
});

onSnapshot(query(baeminRef, orderBy("day")), (snap) => {
  baeminData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  refreshCalendar("eats-calendar");
  updateHistory();
});

onSnapshot(query(extraRef, orderBy("day")), (snap) => {
  extraData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  refreshCalendar("income-calendar");
  updateHistory();
});

// ✅ 달력 갱신
function refreshCalendar(id) {
  const data = id === "eats-calendar" ? [...coupangData, ...baeminData] : extraData;
  document.querySelectorAll(`#${id} .day`).forEach(c => {
    const day = c.dataset.daynum;
    const record = data.filter(e => e.day == day);
    if (record.length) {
      const html = record.map(r => `<div class='income'>${r.amount.toLocaleString()}원</div>`).join("");
      c.innerHTML = `<div class='date'>${day}</div>${html}`;
    } else {
      c.innerHTML = `<div class='date'>${day}</div>`;
    }
  });
}

// ✅ 히스토리 갱신
function updateHistory() {
  // 쿠팡/배민 히스토리
  const eatsList = document.getElementById("eatsHistoryList");
  eatsList.innerHTML = "";
  [...coupangData, ...baeminData].forEach(e => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${e.day}일 | ${e.amount.toLocaleString()}원`;
    eatsList.appendChild(div);
  });

  // 추가 수익 히스토리
  const incomeList = document.getElementById("historyList");
  incomeList.innerHTML = "";
  extraData.forEach(e => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerText = `📅 ${e.day}일 | ${e.amount.toLocaleString()}원 (${e.reason || "-"})`;
    incomeList.appendChild(div);
  });

  // 총합 계산
  const total = [...coupangData, ...baeminData, ...extraData].reduce((a, b) => a + Number(b.amount || 0), 0);
  document.getElementById("monthTotal").innerText = total.toLocaleString();
}

// ✅ 등록
document.getElementById("saveEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("📅 날짜를 선택하세요.");
  const day = Number(sel.dataset.daynum);
  const eats = Number(document.getElementById("eats").value || 0);
  const bae = Number(document.getElementById("baemin").value || 0);
  if (eats > 0) await addDoc(coupangRef, { day, amount: eats });
  if (bae > 0) await addDoc(baeminRef, { day, amount: bae });
  alert("✅ 등록 완료!");
};

// ✅ 삭제
document.getElementById("deleteEats").onclick = async () => {
  const sel = window["eats-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택하세요.");
  const day = Number(sel.dataset.daynum);
  const targets = [...coupangData, ...baeminData].filter(e => e.day == day);
  for (const t of targets) {
    const refName = coupangData.includes(t) ? "쿠팡" : "배민";
    await deleteDoc(doc(db, refName, t.id));
  }
  alert("🧹 해당 날짜의 수익 삭제 완료!");
};

document.getElementById("addIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("📅 날짜를 선택하세요.");
  const day = Number(sel.dataset.daynum);
  const amount = Number(document.getElementById("incomeAmount").value || 0);
  const reason = document.getElementById("incomeReason").value || "";
  await addDoc(extraRef, { day, amount, reason });
  alert("✅ 추가 수익 등록 완료!");
};

document.getElementById("deleteIncome").onclick = async () => {
  const sel = window["income-calendarSel"];
  if (!sel) return alert("🗓️ 삭제할 날짜를 선택하세요.");
  const day = Number(sel.dataset.daynum);
  const targets = extraData.filter(e => e.day == day);
  for (const t of targets) await deleteDoc(doc(db, "추가수익", t.id));
  alert("🧹 추가 수익 삭제 완료!");
};
