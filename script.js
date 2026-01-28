/***********************
 * 타자 입력 UI 생성
 ***********************/
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
    <td><input id="bunt${i}" value="5"></td>
    <td><input id="int${i}" value="0"></td>
  `;
  tbody.appendChild(row);
}

/***********************
 * 2025 MLB 평균 (600 PA)
 ***********************/
const MLB_2025_AVG = {
  pa: 600,
  s1: 86,
  s2: 25,
  s3: 2,
  hr: 19,
  bb: 50,
  hbp: 9,
  so: 133,
  sh: 2,
  bunt: 1,
  int: 0
};

function applyMLB2025Avg() {
  for (let i = 1; i <= 9; i++) {
    setVal(`pa${i}`, MLB_2025_AVG.pa);
    setVal(`s1_${i}`, MLB_2025_AVG.s1);
    setVal(`s2_${i}`, MLB_2025_AVG.s2);
    setVal(`s3_${i}`, MLB_2025_AVG.s3);
    setVal(`hr${i}`, MLB_2025_AVG.hr);
    setVal(`bb${i}`, MLB_2025_AVG.bb);
    setVal(`hbp${i}`, MLB_2025_AVG.hbp);
    setVal(`so${i}`, MLB_2025_AVG.so);
    setVal(`sh${i}`, MLB_2025_AVG.sh);
    setVal(`bunt${i}`, MLB_2025_AVG.bunt);
    setVal(`int${i}`, MLB_2025_AVG.int);
  }
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/***********************
 * 주루 확률
 ***********************/
const RUN_PROB = {
  single_2B_to_home: [0.45, 0.58, 0.75],
  single_1B_to_3B:   [0.20, 0.28, 0.45],
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
    homer:  Number(document.getElementById(`hr${i}`).value),
    walk:   Number(document.getElementById(`bb${i}`).value),
    hbp:    Number(document.getElementById(`hbp${i}`).value),
    strikeout: Number(document.getElementById(`so${i}`).value),
    sacBunt: Number(document.getElementById(`sh${i}`).value),
    buntHit: Number(document.getElementById(`bunt${i}`).value),
    interference: Number(document.getElementById(`int${i}`).value)
  };

  let acc = 0;
  const probs = [];

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
      if (bases[2]) newBases[2] = 1;
      if (bases[1]) newBases[2] = 1;
      if (bases[0]) newBases[1] = 1;
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
  let totalScore = 0;

  for (let g = 0; g < 100; g++) {
    for (let inn = 0; inn < 9; inn++) {
      const res = simulateInning(batterIndex, probs);
      totalScore += res.score;
      batterIndex = res.batterIndex;
    }
  }

  document.getElementById("result").innerText =
    `결과: 경기당 평균 득점 ${(totalScore / 100).toFixed(2)} 점`;
}
