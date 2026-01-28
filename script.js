/***********************
 * 전역 통계 변수
 ***********************/
let totalRuns = 0;
let runCount = 0;

/***********************
 * 입력 UI 생성
 ***********************/
const tbody = document.getElementById("batters");

for (let i = 1; i <= 9; i++) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${i}</td>
    <td><input id="pa${i}" value="600"></td>
    <td><input id="s1_${i}" value="80"></td>
    <td><input id="s2_${i}" value="25"></td>
    <td><input id="s3_${i}" value="2"></td>
    <td><input id="hr${i}" value="20"></td>
    <td><input id="bb${i}" value="50"></td>
    <td><input id="hbp${i}" value="9"></td>
    <td><input id="so${i}" value="130"></td>
    <td><input id="sh${i}" value="2"></td>
    <td><input id="bunt${i}" value="2"></td>
    <td><input id="int${i}" value="0"></td>
  `;
  tbody.appendChild(row);
}

/***********************
 * 2025 MLB 평균 (600 PA)
 ***********************/
const MLB_2025 = {
  pa: 600,
  s1: 86,
  s2: 25,
  s3: 2,
  hr: 19,
  bb: 50,
  hbp: 9,
  so: 133,
  sh: 2,
  bunt: 2,
  int: 0
};

function applyMLB2025Avg() {
  for (let i = 1; i <= 9; i++) {
    document.getElementById(`pa${i}`).value = MLB_2025.pa;
    document.getElementById(`s1_${i}`).value = MLB_2025.s1;
    document.getElementById(`s2_${i}`).value = MLB_2025.s2;
    document.getElementById(`s3_${i}`).value = MLB_2025.s3;
    document.getElementById(`hr${i}`).value = MLB_2025.hr;
    document.getElementById(`bb${i}`).value = MLB_2025.bb;
    document.getElementById(`hbp${i}`).value = MLB_2025.hbp;
    document.getElementById(`so${i}`).value = MLB_2025.so;
    document.getElementById(`sh${i}`).value = MLB_2025.sh;
    document.getElementById(`bunt${i}`).value = MLB_2025.bunt;
    document.getElementById(`int${i}`).value = MLB_2025.int;
  }
}

/***********************
 * 주루 확률
 ***********************/
const RUN_PROB = {
  single_2B_to_home: [0.45, 0.58, 0.75],
  single_1B_to_3B: [0.20, 0.28, 0.45],
  double_1B_to_home: [0.45, 0.62, 0.85]
};

/***********************
 * 확률 테이블 생성
 ***********************/
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
    sacBunt: Number(document.getElementById(`sh${i}`).value),
    buntHit: Number(document.getElementById(`bunt${i}`).value),
    interference: Number(document.getElementById(`int${i}`).value)
  };

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
 * 타석 결과
 ***********************/
function plateAppearance(probTable) {
  const r = Math.random();
  for (let [p, e] of probTable) {
    if (r < p) return e;
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

    if (event === "single") {
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

    else if (["walk", "hbp", "buntHit", "interference"].includes(event)) {
      if (bases[0] && bases[1] && bases[2]) score++;
      newBases = [1, bases[0], bases[1]];
    }

    else if (event === "sacBunt") {
      outs++;
      if (bases[0]) newBases[1] = 1;
      if (bases[1]) newBases[2] = 1;
      if (bases[2]) newBases[2] = 1;
    }

    else {
      outs++;
    }

    bases = newBases;
  }

  return { score, batterIndex };
}

/***********************
 * 전체 시뮬레이션
 ***********************/
function runSimulation() {
  const probs = [];
  for (let i = 1; i <= 9; i++) probs.push(buildProb(i));

  let batterIndex = 0;
  let gameScore = 0;

  for (let g = 0; g < 100; g++) {
    for (let inn = 0; inn < 9; inn++) {
      const res = simulateInning(batterIndex, probs);
      gameScore += res.score;
      batterIndex = res.batterIndex;
    }
  }

  const avgGameScore = gameScore / 100;

  runCount++;
  totalRuns += avgGameScore;

  document.getElementById("lastResult").innerText =
    `이번 실행 결과: ${avgGameScore.toFixed(2)} 점`;

  document.getElementById("avgResult").innerText =
    `누적 평균: ${(totalRuns / runCount).toFixed(2)} 점`;

  document.getElementById("countResult").innerText =
    `실행 횟수: ${runCount}`;
}

/***********************
 * 평균 초기화
 ***********************/
function resetAverage() {
  totalRuns = 0;
  runCount = 0;

  document.getElementById("lastResult").innerText = "이번 실행 결과: -";
  document.getElementById("avgResult").innerText = "누적 평균: -";
  document.getElementById("countResult").innerText = "실행 횟수: 0";
}
