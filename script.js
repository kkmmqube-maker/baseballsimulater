// =====================
// MLB 2025 평균 (600 PA 기준)
// =====================
const MLB_2025_AVG = {
  pa: 600,
  single: 86,
  double: 25,
  triple: 2,
  hr: 19,
  bb: 50,
  hbp: 9,
  so: 133,
  sh: 2
};

// =====================
// 1~9 타자 입력 UI 생성
// =====================
const tbody = document.getElementById("batters");

for (let i = 1; i <= 9; i++) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${i}</td>
    <td><input id="pa${i}" value="600"></td>
    <td><input id="s1_${i}" value="90"></td>
    <td><input id="s2_${i}" value="30"></td>
    <td><input id="s3_${i}" value="5"></td>
    <td><input id="hr${i}" value="25"></td>
    <td><input id="bb${i}" value="60"></td>
    <td><input id="hbp${i}" value="5"></td>
    <td><input id="so${i}" value="140"></td>
    <td><input id="sh${i}" value="5"></td>
  `;
  tbody.appendChild(row);
}

// =====================
// 주루 확률 상수
// =====================
const RUN_PROB = {
  single_1B_to_3B: 0.25,
  single_2B_to_home: 0.45,
  double_1B_to_home: 0.45,
  out_1B_to_2B: 0.25,
  out_2B_to_3B: 0.20,
  out_3B_to_home: 0.05,
  doublePlay: 0.10
};

// =====================
// 입력값 기반 확률 테이블 생성
// =====================
function buildProb(i) {
  const pa = Number(document.getElementById(`pa${i}`).value);

  const events = {
    single: Number(document.getElementById(`s1_${i}`).value),
    double: Number(document.getElementById(`s2_${i}`).value),
    triple: Number(document.getElementById(`s3_${i}`).value),
    homer: Number(document.getElementById(`hr${i}`).value),
    walk: Number(document.getElementById(`bb${i}`).value),
    hbp: Number(document.getElementById(`hbp${i}`).value),
    strikeout: Number(document.getElementById(`so${i}`).value),
    sacBunt: Number(document.getElementById(`sh${i}`).value)
  };

  let total = 0;
  for (let k in events) total += events[k];

  const probs = [];
  let acc = 0;

  for (let k in events) {
    acc += events[k] / pa;
    probs.push([acc, k]);
  }

  probs.push([1, "out"]); // 일반 아웃
  return probs;
}

// =====================
// 타석 결과 결정
// =====================
function plateAppearance(probTable) {
  const r = Math.random();
  for (let [p, event] of probTable) {
    if (r < p) return event;
  }
  return "out";
}

// =====================
// 이닝 시뮬레이션
// =====================
function simulateInning(batterIndex, probs) {
  let outs = 0;
  let bases = [0, 0, 0]; // 1,2,3루
  let score = 0;

  while (outs < 3) {
    const batter = batterIndex % 9;
    batterIndex++;

    const event = plateAppearance(probs[batter]);
    let newBases = [0, 0, 0];

    if (event === "single") {
      if (bases[2]) score++;
      if (bases[1]) score += Math.random() < RUN_PROB.single_2B_to_home ? 1 : 0;
      if (bases[0]) newBases[1] = 1;
      newBases[0] = 1;
    } else if (event === "double") {
      if (bases[2]) score++;
      if (bases[1]) score++;
      if (bases[0]) score += Math.random() < RUN_PROB.double_1B_to_home ? 1 : 0;
      newBases[1] = 1;
    } else if (event === "triple") {
      score += bases[0] + bases[1] + bases[2];
      newBases[2] = 1;
    } else if (event === "homer") {
      score += bases[0] + bases[1] + bases[2] + 1;
    } else if (["walk","hbp"].includes(event)) {
      if (bases[0] && bases[1] && bases[2]) score++;
      newBases = [1, bases[0], bases[1]];
    } else if (event === "sacBunt") {
      outs++;
      if (bases[0]) newBases[1] = 1;
      if (bases[1]) newBases[2] = 1;
      if (bases[2]) score++;
    } else { // 일반 아웃
      outs++;
      if (bases[0] && Math.random() < RUN_PROB.out_1B_to_2B) newBases[1] = 1;
      if (bases[1] && Math.random() < RUN_PROB.out_2B_to_3B) newBases[2] = 1;
      if (bases[2] && Math.random() < RUN_PROB.out_3B_to_home) score++;
      // 더블플레이 처리
      if (outs < 2 && bases[0] && Math.random() < RUN_PROB.doublePlay) {
        outs++;
        if (bases[1]) newBases[2] = 1;
        if (bases[2]) score++;
        newBases[0] = 0; // 1루주자 아웃
      }
    }

    bases = newBases;
  }

  return { score, batterIndex };
}

// =====================
// 전체 시뮬레이션
// =====================
let totalScoreAccum = 0;
let runCount = 0;

function runSimulation(repeat=1) {
  const probs = [];
  for (let i=1;i<=9;i++) probs.push(buildProb(i));

  let batterIndex = 0;
  let totalScore = 0;

  for (let r=0;r<repeat;r++) {
    for (let game=0;game<100;game++) {
      for (let inning=0; inning<9; inning++) {
        const res = simulateInning(batterIndex, probs);
        totalScore += res.score;
        batterIndex = res.batterIndex;
      }
    }
  }

  totalScoreAccum += totalScore;
  runCount += repeat;

  const avg = totalScoreAccum / (runCount*100); // 경기당 평균
  document.getElementById("lastResult").innerText = `이번 실행 결과: ${totalScore/100} 점`;
  document.getElementById("avgResult").innerText = `누적 평균: ${avg.toFixed(2)} 점`;
  document.getElementById("countResult").innerText = `실행 횟수: ${runCount}`;

  // =====================
  // kwRC+ 계산
  // =====================
  const gamma = 1.085;
  const sigma = 0.5405;
  const delta = avg - 2.78;
  const kwRC = 100 + Math.sign(delta) * Math.pow(Math.abs(delta)/sigma, gamma) * 100;
  document.getElementById("kwRCResult").innerText = `kwRC+: ${kwRC.toFixed(1)}`;
}

function runSimulation100() { runSimulation(100); }

function resetAverage() {
  totalScoreAccum = 0;
  runCount = 0;
  document.getElementById("avgResult").innerText = `누적 평균: -`;
  document.getElementById("countResult").innerText = `실행 횟수: 0`;
  document.getElementById("kwRCResult").innerText = `kwRC+: -`;
}

// =====================
// MLB 평균 적용
// =====================
function applyMLB2025Avg() {
  for (let i=1;i<=9;i++){
    document.getElementById(`pa${i}`).value = MLB_2025_AVG.pa;
    document.getElementById(`s1_${i}`).value = MLB_2025_AVG.single;
    document.getElementById(`s2_${i}`).value = MLB_2025_AVG.double;
    document.getElementById(`s3_${i}`).value = MLB_2025_AVG.triple;
    document.getElementById(`hr${i}`).value = MLB_2025_AVG.hr;
    document.getElementById(`bb${i}`).value = MLB_2025_AVG.bb;
    document.getElementById(`hbp${i}`).value = MLB_2025_AVG.hbp;
    document.getElementById(`so${i}`).value = MLB_2025_AVG.so;
    document.getElementById(`sh${i}`).value = MLB_2025_AVG.sh;
  }
}
