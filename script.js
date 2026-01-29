// ------------------ 입력 UI 생성 ------------------
const tbody = document.getElementById("batters");
for (let i = 1; i <= 9; i++) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${i}</td>
    <td><input id="pa${i}" value="600"></td>
    <td><input id="s1_${i}" value="86"></td>
    <td><input id="s2_${i}" value="25"></td>
    <td><input id="s3_${i}" value="2"></td>
    <td><input id="hr${i}" value="19"></td>
    <td><input id="bb${i}" value="50"></td>
    <td><input id="hbp${i}" value="9"></td>
    <td><input id="so${i}" value="133"></td>
    <td><input id="sh${i}" value="2"></td>
    <td id="kwRC${i}">-</td>
  `;
  tbody.appendChild(row);
}

// ------------------ MLB 2025 평균 ------------------
const MLB_2025_AVG = { pa:600, s1:86, s2:25, s3:2, hr:19, bb:50, hbp:9, so:133, sh:2 };

function applyMLB2025Avg() {
  for (let i=1;i<=9;i++){
    document.getElementById(`pa${i}`).value=MLB_2025_AVG.pa;
    document.getElementById(`s1_${i}`).value=MLB_2025_AVG.s1;
    document.getElementById(`s2_${i}`).value=MLB_2025_AVG.s2;
    document.getElementById(`s3_${i}`).value=MLB_2025_AVG.s3;
    document.getElementById(`hr${i}`).value=MLB_2025_AVG.hr;
    document.getElementById(`bb${i}`).value=MLB_2025_AVG.bb;
    document.getElementById(`hbp${i}`).value=MLB_2025_AVG.hbp;
    document.getElementById(`so${i}`).value=MLB_2025_AVG.so;
    document.getElementById(`sh${i}`).value=MLB_2025_AVG.sh;
  }
  updateKwRC();
}

// ------------------ 주루 확률 ------------------
const RUN_PROB = {
  single_2B_to_home:[0.45,0.58,0.75],
  single_1B_to_3B:[0.2,0.28,0.45],
  double_1B_to_home:[0.45,0.62,0.85]
};

// ------------------ 확률 테이블 ------------------
function buildProb(i){
  const pa=Number(document.getElementById(`pa${i}`).value);
  const events={
    single:Number(document.getElementById(`s1_${i}`).value),
    double:Number(document.getElementById(`s2_${i}`).value),
    triple:Number(document.getElementById(`s3_${i}`).value),
    homer:Number(document.getElementById(`hr${i}`).value),
    walk:Number(document.getElementById(`bb${i}`).value),
    hbp:Number(document.getElementById(`hbp${i}`).value),
    strikeout:Number(document.getElementById(`so${i}`).value),
    sacBunt:Number(document.getElementById(`sh${i}`).value)
  };
  let total=0;
  for(let k in events) total+=events[k];
  let probs=[];
  let acc=0;
  for(let k in events){
    acc+=events[k]/pa;
    probs.push([acc,k]);
  }
  probs.push([1,"out"]);
  return probs;
}

// ------------------ 타석 결과 결정 ------------------
function plateAppearance(probTable){
  const r=Math.random();
  for(let [p,event] of probTable){
    if(r<p) return event;
  }
  return "out";
}

// ------------------ 이닝 시뮬레이션 ------------------
function simulateInning(batterIndex,probs){
  let outs=0, bases=[0,0,0], score=0;
  while(outs<3){
    const batter=batterIndex%9;
    batterIndex++;
    const event=plateAppearance(probs[batter]);
    let newBases=[0,0,0];

    if(event==="single"){
      if(bases[2]) score++;
      if(bases[1]){
        if(Math.random()<RUN_PROB.single_2B_to_home[outs]) score++;
        else newBases[2]=1;
      }
      if(bases[0]){
        if(Math.random()<RUN_PROB.single_1B_to_3B[outs]) newBases[2]=1;
        else newBases[1]=1;
      }
      newBases[0]=1;
    }
    else if(event==="double"){
      if(bases[2]) score++;
      if(bases[1]) score++;
      if(bases[0]){
        if(Math.random()<RUN_PROB.double_1B_to_home[outs]) score++;
        else newBases[2]=1;
      }
      newBases[1]=1;
    }
    else if(event==="triple"){ score+=bases[0]+bases[1]+bases[2]; newBases[2]=1; }
    else if(event==="homer"){ score+=bases[0]+bases[1]+bases[2]+1; }
    else if(event==="walk"||event==="hbp"){ 
      if(bases[2]&&bases[1]&&bases[0]) score++;
      newBases=[1,bases[0],bases[1]];
    }
    else if(event==="sacBunt"){
      outs++;
      if(bases[1]) newBases[2]=1;
      if(bases[0]) newBases[1]=1;
    }
    else{
      if(event==="strikeout") outs++;
      else{
        outs++;
        // 일반 아웃 주자 진루
        if(bases[2]&&Math.random()<0.05){ score++; bases[2]=0; }
        if(bases[1]&&Math.random()<0.20){ bases[2]=1; bases[1]=0; }
        if(bases[0]&&Math.random()<0.25){ bases[1]=1; bases[0]=0; }
      }
    }

    // 더블플레이
    if(outs<2 && bases[0]===1 && Math.random()<0.1){
      outs+=1;
      if(bases[1]){ score++; bases[1]=0; }
      bases[0]=0;
    }

    bases=newBases;
  }
  return {score,batterIndex};
}

// ------------------ kwRC+ 계산 ------------------
function calcKwRC(score){
  const delta=score-3.36;
  const deltaNorm=delta/0.44;
  const kwrc=100+Math.sign(delta)*Math.pow(Math.abs(deltaNorm),1.35)*100;
  return kwrc.toFixed(1);
}

// ------------------ 각 타자 kwRC+ 업데이트 ------------------
function updateKwRC(){
  for(let i=1;i<=9;i++){
    const pa=Number(document.getElementById(`pa${i}`).value);
    const events=Number(document.getElementById(`s1_${i}`).value)+
                 Number(document.getElementById(`s2_${i}`).value)+
                 Number(document.getElementById(`s3_${i}`).value)+
                 Number(document.getElementById(`hr${i}`).value)+
                 Number(document.getElementById(`bb${i}`).value)+
                 Number(document.getElementById(`hbp${i}`).value)+
                 Number(document.getElementById(`so${i}`).value)+
                 Number(document.getElementById(`sh${i}`).value);
    const avgScore=(events/pa)*3.36;
    document.getElementById(`kwRC${i}`).innerText=calcKwRC(avgScore);
  }
}

// ------------------ 시뮬레이션 실행 ------------------
let totalScore=0, runCount=0;

function runSimulation(){ runSimulationN(1); }
function runSimulation100(){ runSimulationN(100); }

function runSimulationN(n){
  const probs=[];
  for(let i=1;i<=9;i++) probs.push(buildProb(i));

  let gameScore=0;
  for(let repeat=0;repeat<n;repeat++){
    let batterIndex=0;
    for(let game=0;game<100;game++){
      for(let inning=0;inning<9;inning++){
        const res=simulateInning(batterIndex,probs);
        gameScore+=res.score;
        batterIndex=res.batterIndex;
      }
    }
  }

  totalScore+=gameScore;
  runCount+=n;
  const avg=totalScore/runCount;

  document.getElementById("lastResult").innerText=`이번 실행 결과: ${gameScore}`;
  document.getElementById("countResult").innerText=`실행 횟수: ${runCount}`;
  document.getElementById("avgResult").innerText=`누적 평균: ${avg.toFixed(2)} / kwRC+: ${calcKwRC(avg)}`;

  updateKwRC();
}

function resetAverage(){
  totalScore=0; runCount=0;
  document.getElementById("avgResult").innerText="누적 평균: - / kwRC+: -";
  document.getElementById("countResult").innerText="실행 횟수: 0";
  document.getElementById("lastResult").innerText="이번 실행 결과: -";
  updateKwRC();
}
