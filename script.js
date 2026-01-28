/***********************
 * 입력 UI 생성
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
 * 주루 확률 상수
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
    homer: Number(document.getElementById(`hr${i}`).value),
    walk: Number(document.getElementById(`bb${i}`).value),
    hbp: Number(document.getElementById(`hbp${i}`).value),
    strikeout: Number(document.getElementById(`so${i}`).value),
    sacBunt: Number(document.getElementById(`sh${i}`).value),
    buntHit: Number(document.getElementById(`bunt${i}`).value),
    interference: Number(document.getElementById(`int${i}`).value)
  };

  let total = 0;
  for (let k in events) total += events[k];

  const probs = [];
  let acc = 0;

  for (let k in events) {
    acc += events[k] / pa;
    probs.push([acc, k]);
  }

  // 일반 아웃
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
      if (bases[2] && bases[1] && bases[0]) score++;
      newBases = [
        1,
        bases[0],
        bases[1]
      ];
    }

    else if (event === "sacBunt") {
      outs++;
      if (bases[1]) newBases[2] = 1;
      if (bases[0]) newBases[1] = 1;
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
  for (let i = 1; i <= 9; i++) {
    probs.push(buildProb(i));
  }

  let batterIndex = 0;
  let totalScore = 0;

  for (let game = 0; game < 100; game++) {
    for (let inning = 0; inning < 9; inning++) {
      const res = simulateInning(batterIndex, probs);
      totalScore += res.score;
      batterIndex = res.batterIndex;
    }
  }

  const avg = (totalScore / 100).toFixed(2);
  document.getElementById("result").innerText =
    `결과: 경기당 평균 득점 ${avg} 점`;
}
<script>
/* =========================
   2025 MLB 평균 (600 PA)
   ========================= */
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

/* =========================
   전체 타순 적용
   ========================= */
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
</script>
