/***********************
 * 입력 UI 생성
 ***********************/
const tbody = document.getElementById("batters");

for (let i = 1; i <= 9; i++) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${i}</td>
    <td><input id="pa_${i}" type="number" value="600"></td>
    <td><input id="single_${i}" type="number" value="86"></td>
    <td><input id="double_${i}" type="number" value="25"></td>
    <td><input id="triple_${i}" type="number" value="2"></td>
    <td><input id="hr_${i}" type="number" value="19"></td>
    <td><input id="bb_${i}" type="number" value="50"></td>
    <td><input id="hbp_${i}" type="number" value="9"></td>
    <td><input id="so_${i}" type="number" value="133"></td>
    <td><input id="sh_${i}" type="number" value="2"></td>
  `;
  tbody.appendChild(row);
}

/***********************
 * 주루 확률 상수
 ***********************/
const RUN_PROB = {
  single_2B_to_home: [0.45, 0.58, 0.75],
  single_1B_to_3B:   [0.20, 0.28, 0.45],
  double_1B_to_home: [0.45, 0.62, 0.85],
  out_1B_to_2B:      0.25,
  out_2B_to_3B:      0.20,
  out_3B_to_home:    0.05,
  doublePlayProb:    0.10
};

/***********************
 * 확률 테이블 생성
 ***********************/
function buildProb(i) {
  const pa = Number(document.getElementById(`pa_${i}`).value);

  const events = {
    single: Number(document.getElementById(`single_${i}`).value),
    double: Number(document.getElementById(`double_${i}`).value),
    triple: Number(document.getElementById(`triple_${i}`).value),
    homer: Number(document.getElementById(`hr_${i}`).value),
    walk: Number(document.getElementById(`bb_${i}`).value),
    hbp: Number(document.getElementById(`hbp_${i}`).value),
    strikeout: Number(document.getElementById(`so_${i}`).value),
    sacBunt: Number(document.getElementById(`sh_${i}`).value)
  };

  let total = 0;
  for (let k in events) total += events[k];

  const probs = [];
  let acc = 0;

  for (let k in events) {
    acc += events[k] / pa;
    probs.push([acc, k]);
  }

  probs.push([1, "out"]);
  return probs;
}

/***********************
 * 타석 결과 결정
 ***********************/
function plateAppearance(probTable) {
  const r = Math.random();
  for (let [p, event] of probTable) {
    if (r < p) return event;
  }
  return "out";
}

/***********************
 * 이닝 시뮬레이션
 ***********************/
function simulateInning(batterIndex, probs) {
  let outs = 0;
  let bases = [0, 0, 0];
  let score = 0;

  while (outs < 3) {
    const batter = batterIndex % 9;
    batterIndex++;

    const event = plateAppearance(probs[batter]);
    let newBases = [0, 0, 0];

    if (event === "strikeout") {
      outs++;
    }
    else if ((outs === 0 || outs === 1) && bases[0] && Math.random() < RUN_PROB.doublePlayProb) {
      outs += 2;
      bases[0] = 0;
      if (bases[1]) newBases[2] = 1;
      if (bases[2]) score++;
      continue;
    }
    else if (event === "single") {
      if (bases[2]) score++;
      if (bases[1]) {
        if (Math.random() < RUN_PROB.single_2B_to_home[outs]) score++;
        else newBases[2] = 1;
      }
      if (bases[0]) {
        if (Math.random() < RUN_PROB.single_1B_to_3B[outs]) newBases[2] = 1;
        else newBases[1] = 1;
      }
      newBases[0] = 1;
    }
    else if (event === "double") {
      if (bases[2]) score++;
      if (bases[1]) score++;
      if (bases[0]) {
        if (Math.random() < RUN_PROB.double_1B_to_home[outs]) score++;
        else newBases[2] = 1;
      }
      newBases[1] = 1;
    }
    else if (event === "triple") {
      score += bases[0] + bases[1] + bases[2];
      newBases[2] = 1;
    }
    else if (event === "homer") {
      score += bases[0] + bases[1] + bases[2] + 1;
    }
    else if (["walk","hbp","sacBunt"].includes(event)) {
      if (bases[0] && bases[1] && bases[2]) score++;
      newBases = [1, bases[0], bases[1]];
      if (event === "sacBunt") outs++;
    }
    else {
      outs++;
      if (bases[0] && Math.random() < RUN_PROB.out_1B_to_2B) newBases[1] = 1;
      else if (bases[0]) newBases[0] = 1;
      if (bases[1] && Math.random() < RUN_PROB.out_2B_to_3B) newBases[2] = 1;
      else if (bases[1]) newBases[1] = 1;
      if (bases[2] && Math.random() < RUN_PROB.out_3B_to_home) score++;
      else if (bases[2]) newBases[2] = 1;
    }

    bases = newBases;
  }

  return { score, batterIndex };
}

/***********************
 * 전체 시뮬레이션
 ***********************/
let cumulativeScore = 0;
let cumulativeCount = 0;

// 1회 실행 버튼용
function runSimulation() {
  const avg = runSimulationSingle();
  cumulativeScore += avg;
  cumulativeCount++;
  document.getElementById("lastResult").innerText = `이번 실행 결과: ${avg.toFixed(2)} 점`;
  document.getElementById("avgResult").innerText = `누적 평균: ${(cumulativeScore/cumulativeCount).toFixed(2)} 점`;
  document.getElementById("countResult").innerText = `실행 횟수: ${cumulativeCount}`;
}

// 1회 100경기 × 9이닝
function runSimulationSingle() {
  const probs = [];
  for (let i = 1; i <= 9; i++) probs.push(buildProb(i));

  let batterIndex = 0;
  let totalScore = 0;
  for (let game = 0; game < 100; game++) {
    for (let inning = 0; inning < 9; inning++) {
      const res = simulateInning(batterIndex, probs);
      totalScore += res.score;
      batterIndex = res.batterIndex;
    }
  }
  return totalScore / 100;
}

// 100회 반복 실행 버튼용
function runSimulation100Times() {
  let results = [];
  for (let i = 0; i < 100; i++) {
    const avg = runSimulationSingle();
    results.push(avg);
    cumulativeScore += avg;   // 누적 평균 반영
    cumulativeCount++;        // 실행 횟수 반영
  }

  const avg100 = results.reduce((a,b)=>a+b,0)/results.length;

  document.getElementById("lastResult").innerText = `100회 마지막 실행 결과: ${results[results.length-1].toFixed(2)} 점`;
  document.getElementById("avgResult").innerText = `누적 평균: ${(cumulativeScore/cumulativeCount).toFixed(2)} 점`;
  document.getElementById("countResult").innerText = `실행 횟수: ${cumulativeCount}`;
}

// 초기화
function resetAverage() {
  cumulativeScore = 0;
  cumulativeCount = 0;
  document.getElementById("avgResult").innerText = `누적 평균: -`;
  document.getElementById("countResult").innerText = `실행 횟수: 0`;
}

/***********************
 * MLB 2025 평균 적용
 ***********************/
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

function applyMLB2025Avg() {
  for (let i = 1; i <= 9; i++) {
    document.getElementById(`pa_${i}`).value = MLB_2025_AVG.pa;
    document.getElementById(`single_${i}`).value = MLB_2025_AVG.single;
    document.getElementById(`double_${i}`).value = MLB_2025_AVG.double;
    document.getElementById(`triple_${i}`).value = MLB_2025_AVG.triple;
    document.getElementById(`hr_${i}`).value = MLB_2025_AVG.hr;
    document.getElementById(`bb_${i}`).value = MLB_2025_AVG.bb;
    document.getElementById(`hbp_${i}`).value = MLB_2025_AVG.hbp;
    document.getElementById(`so_${i}`).value = MLB_2025_AVG.so;
    document.getElementById(`sh_${i}`).value = MLB_2025_AVG.sh;
  }
}


