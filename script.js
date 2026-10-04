const KEY="imProgressing_final_v2";

const defaultData={
  name:"",
  target:120,
  subjects:["Mathematics","English","Science"],
  records:[],
  avatar:"",
  xp:0,
  level:1
};

let data=load();

function load(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY));
    return s
      ? {...structuredClone(defaultData),...s}
      : structuredClone(defaultData);
  }catch{
    return structuredClone(defaultData);
  }
}

function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
}

function todayKey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDuration(n){
  n=Math.max(0,Math.round(Number(n)||0));

  const h=Math.floor(n/60);
  const m=n%60;

  if(!h&&!m)return"0m";
  if(!h)return`${m}m`;
  if(!m)return`${h}h`;

  return`${h}h ${m}m`;
}

function formatTime(t){
  if(!t)return"";

  let[h,m]=t.split(":").map(Number);
  const ap=h>=12?"PM":"AM";

  h=h%12||12;

  return`${h}:${String(m).padStart(2,"0")} ${ap}`;
}

function initials(n){
  n=(n||"").trim();

  return n
    ? n.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()
    :"IP";
}

function plannedFromTimes(a,b){

  if(!a||!b)return 0;

  let[x,y]=a.split(":").map(Number);
  let[z,w]=b.split(":").map(Number);

  let s=x*60+y;
  let e=z*60+w;

  if(e<s)e+=1440;

  return e-s;
}

function getTimeValue(h,m){

  return Math.max(
    0,
    (Number(document.getElementById(h)?.value)||0)*60+
    (Number(document.getElementById(m)?.value)||0)
  );

}

function scoreFor(p,a){
  return p>0
    ? Math.min(100,Math.round(a/p*100))
    :0;
}

function statusFor(s){

  if(s>=90)return["Excellent","good"];
  if(s>=75)return["Good","good"];
  if(s>=50)return["Average","average"];

  return["Poor","poor"];
}

function todayRecords(){
  return data.records.filter(r=>r.date===todayKey());
}

function totals(rs=todayRecords()){

  return rs.reduce(
    (x,r)=>(
      x.planned+=r.planned,
      x.actual+=r.actual,
      x
    ),
    {planned:0,actual:0}
  );

}

function overallScore(rs=data.records){

  const t=totals(rs);

  return t.planned
    ? Math.min(100,Math.round(t.actual/t.planned*100))
    :0;
}

function showToast(m){

  const e=document.getElementById("toast");

  e.textContent=m;
  e.classList.add("show");

  clearTimeout(showToast.t);

  showToast.t=setTimeout(
    ()=>e.classList.remove("show"),
    2200
  );

}

function dayScore(key){
  return overallScore(
    data.records.filter(r=>r.date===key)
  );
}

function calculateStreak(){

  let s=0;

  let d=new Date();

  d.setHours(0,0,0,0);

  if(!data.records.some(r=>r.date===todayKey(d))){
    d.setDate(d.getDate()-1);
  }

  while(data.records.some(r=>r.date===todayKey(d))){

    s++;

    d.setDate(d.getDate()-1);

  }

  return s;
}

function bestStreak(){

  const keys=[
    ...new Set(data.records.map(r=>r.date))
  ].sort();

  let best=0;
  let cur=0;
  let prev="";

  for(const k of keys){

    if(prev){

      const a=new Date(prev);
      const b=new Date(k);

      if((b-a)/86400000===1){
        cur++;
      }else{
        cur=1;
      }

    }else{
      cur=1;
    }

    best=Math.max(best,cur);
    prev=k;
  }

  return best;
}

function activeDays(){
  return new Set(
    data.records.map(r=>r.date)
  ).size;
}

function xpForDay(score){

  if(score>=75)return 25;
  if(score>=50)return 0;

  return -15;
}

function rebuildXP(){

  const keys=[
    ...new Set(data.records.map(r=>r.date))
  ];

  let xp=0;

  for(const k of keys){
    xp=Math.max(
      0,
      xp+xpForDay(dayScore(k))
    );
  }

  data.xp=xp;
  data.level=Math.max(
    1,
    Math.floor(xp/100)+1
  );

}

function levelTitle(l){

  return l<=1
    ?"Beginner"
    :l===2
    ?"Consistent"
    :l===3
    ?"Focused"
    :l===4
    ?"Dedicated"
    :"Master";

}


/* =====================================================
   HEADER
   ===================================================== */

function renderHeader(){

  document.getElementById("headerName").textContent=
    data.name.trim()||"I'm Progressing";

  const headerAvatar=
    document.getElementById("headerAvatar");

  if(data.avatar){

    headerAvatar.innerHTML=
      `<img src="${data.avatar}" alt="Avatar">`;

    headerAvatar.style.overflow="hidden";

    const img=headerAvatar.querySelector("img");

    if(img){
      img.style.cssText=
        "width:100%;height:100%;object-fit:cover";
    }

  }else{

    headerAvatar.textContent=
      initials(data.name);

    headerAvatar.innerHTML=
      initials(data.name);

  }

  document.getElementById("welcomeTitle").textContent=
    data.name.trim()
      ?`Keep going, ${data.name.trim()}!`
      :"Let's make progress.";

}


/* =====================================================
   HOME STATS
   ===================================================== */

function renderStats(){

  const t=totals();

  const s=overallScore(
    todayRecords()
  );

  const st=calculateStreak();

  document.getElementById("plannedTotal").textContent=
    formatDuration(t.planned);

  document.getElementById("actualTotal").textContent=
    formatDuration(t.actual);

  document.getElementById("progressTotal").textContent=
    `${s}%`;

  document.getElementById("heroProgress").textContent=
    `${s}%`;

  document.getElementById("streakTotal").textContent=
    `${st} days`;

  const[e,c]=t.planned
    ?statusFor(s)
    :["No Data",""];

  const q=document.getElementById("todayStatus");

  q.textContent=e;
  q.className=`status-pill ${c}`;

}


/* =====================================================
   RECORDS
   ===================================================== */

function recordHTML(r){

  const[s,c]=statusFor(r.score);

  return`
    <div class="record">

      <div class="record-top">

        <div class="record-name">
          📚 ${escapeHTML(r.subject)}
        </div>

        <span class="score ${c}">
          ${r.score}%
        </span>

      </div>

      <div class="record-meta">

        ${
          r.start&&r.end
            ?`${formatTime(r.start)} → ${formatTime(r.end)} · `
            :""
        }

        Planned ${formatDuration(r.planned)}
        ·
        Actual ${formatDuration(r.actual)}

      </div>

      <div class="record-bottom">

        <strong>${s}</strong>

        <button
          class="delete-btn"
          data-delete="${r.id}"
        >
          Delete
        </button>

      </div>

    </div>
  `;
}

function renderRecords(){

  const rs=todayRecords();

  const html=rs.length
    ?rs.map(recordHTML).join("")
    :"<div class='empty'>No study record added yet.<br>Add your first study session above.</div>";

  document.getElementById("todayRecords").innerHTML=html;

  document.getElementById("planRecords").innerHTML=html;

  document.querySelectorAll("[data-delete]")
    .forEach(b=>{

      b.onclick=()=>{

        data.records=
          data.records.filter(
            r=>r.id!==b.dataset.delete
          );

        rebuildXP();
        save();
        renderAll();

        showToast(
          "Study record deleted"
        );

      };

    });

}


/* =====================================================
   SUBJECTS
   ===================================================== */

function renderSubjects(){

  document.getElementById("subjectSelect").innerHTML=
    `<option value="">Select a subject</option>`+
    data.subjects.map(
      s=>`
        <option value="${escapeAttr(s)}">
          ${escapeHTML(s)}
        </option>
      `
    ).join("");


  document.getElementById("subjectPreview").innerHTML=
    data.subjects.length
      ?data.subjects.map(
        s=>`
          <span class="chip">
            📚 ${escapeHTML(s)}
          </span>
        `
      ).join("")
      :"<span class='muted'>No subjects added yet.</span>";


  document.getElementById("subjectsList").innerHTML=
    data.subjects.length
      ?data.subjects.map(
        (s,i)=>`
          <div class="subject-item">

            <b>
              📚 ${escapeHTML(s)}
            </b>

            <button
              class="subject-delete"
              data-subject-index="${i}"
            >
              Remove
            </button>

          </div>
        `
      ).join("")
      :"<div class='empty'>No subjects yet.</div>";


  document.querySelectorAll(
    "[data-subject-index]"
  ).forEach(b=>{

    b.onclick=()=>{

      const i=
        Number(b.dataset.subjectIndex);

      const x=data.subjects[i];

      data.subjects.splice(i,1);

      save();
      renderAll();

      showToast(
        `${x} removed`
      );

    };

  });

}


/* =====================================================
   PROGRESS
   ===================================================== */

function renderProgress(){

  const s=overallScore();

  document.getElementById(
    "overallProgress"
  ).textContent=`${s}%`;

  document.getElementById(
    "overallBar"
  ).style.width=`${s}%`;

  document.getElementById(
    "overallMessage"
  ).textContent=
    s===0
      ?"Add study records to start tracking."
      :s>=90
      ?"Excellent consistency. Keep it going!"
      :s>=75
      ?"Good progress. Keep going."
      :s>=50
      ?"You are making progress. Aim for more."
      :"Your actual study is below your plan.";

  renderWeekChart();
  renderSubjectProgress();
  renderAchievements();

}

function renderWeekChart(){

  const a=[];

  for(let i=6;i>=0;i--){

    const d=new Date();

    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-i);

    const k=todayKey(d);

    const actual=
      data.records
        .filter(r=>r.date===k)
        .reduce(
          (x,r)=>x+r.actual,
          0
        );

    a.push({
      actual,
      label:d
        .toLocaleDateString(
          undefined,
          {weekday:"short"}
        )
        .slice(0,2)
    });

  }

  const max=Math.max(
    data.target||1,
    ...a.map(x=>x.actual),
    60
  );

  document.getElementById(
    "weekTotal"
  ).textContent=
    formatDuration(
      a.reduce(
        (x,d)=>x+d.actual,
        0
      )
    );

  document.getElementById(
    "weekChart"
  ).innerHTML=
    a.map(
      d=>`
        <div class="day-col">

          <span class="day-value">
            ${d.actual?formatDuration(d.actual):""}
          </span>

          <div
            class="day-bar"
            style="height:${Math.max(
              3,
              Math.round(
                d.actual/max*120
              )
            )}px"
          ></div>

          <span class="day-label">
            ${d.label}
          </span>

        </div>
      `
    ).join("");

}

function renderSubjectProgress(){

  document.getElementById(
    "subjectProgress"
  ).innerHTML=
    data.subjects.length
      ?data.subjects.map(s=>{

        const rs=
          data.records.filter(
            r=>r.subject===s
          );

        const p=
          rs.reduce(
            (x,r)=>x+r.planned,
            0
          );

        const a=
          rs.reduce(
            (x,r)=>x+r.actual,
            0
          );

        const v=
          p
            ?Math.min(
              100,
              Math.round(a/p*100)
            )
            :0;

        return`
          <div class="subject-progress">

            <div class="sp-head">
              <span>
                📚 ${escapeHTML(s)}
              </span>

              <span>${v}%</span>
            </div>

            <div class="sp-track">
              <div style="width:${v}%"></div>
            </div>

          </div>
        `;

      }).join("")
      :"<div class='empty'>Add subjects to see progress.</div>";

}

function renderAchievements(){

  const total=
    data.records.reduce(
      (x,r)=>x+r.actual,
      0
    );

  const st=calculateStreak();

  const days=activeDays();

  const items=[

    [
      total>=60,
      "⏱️",
      "1 Hour",
      "Study for 1 hour total"
    ],

    [
      total>=300,
      "🔥",
      "5 Hours",
      "Study for 5 hours total"
    ],

    [
      st>=3,
      "🔥",
      "3 Day Streak",
      "Study on 3 days"
    ],

    [
      st>=7,
      "🏆",
      "7 Day Streak",
      "Study on 7 days"
    ],

    [
      days>=10,
      "📅",
      "10 Study Days",
      "Record 10 study days"
    ],

    [
      overallScore()>=90&&data.records.length>0,
      "🎯",
      "90% Planner",
      "Reach 90% overall"
    ]

  ];

  document.getElementById(
    "achievements"
  ).innerHTML=
    items.map(
      x=>`
        <div class="achievement ${
          x[0]?"":"locked"
        }">

          <span>${x[1]}</span>
          <b>${x[2]}</b>
          <small>${x[3]}</small>

        </div>
      `
    ).join("");

}


/* =====================================================
   STREAK
   ===================================================== */

function renderStreak(){

  rebuildXP();

  const st=calculateStreak();
  const best=bestStreak();
  const days=activeDays();

  const level=data.level;
  const xp=data.xp;

  const into=xp%100;

  document.getElementById(
    "streakPageNumber"
  ).textContent=st;

  document.getElementById(
    "bestStreak"
  ).textContent=best;

  document.getElementById(
    "activeDays"
  ).textContent=days;

  document.getElementById(
    "streakMessage"
  ).textContent=
    st
      ?`${st} day streak! Keep showing up.`
      :"Start studying today to build your streak.";

  document.getElementById(
    "levelNumber"
  ).textContent=`Level ${level}`;

  document.getElementById(
    "levelTitle"
  ).textContent=levelTitle(level);

  document.getElementById(
    "currentXP"
  ).textContent=`${xp} XP`;

  document.getElementById(
    "nextLevelXP"
  ).textContent=
    `${Math.ceil((xp+1)/100)*100} XP`;

  document.getElementById(
    "xpBar"
  ).style.width=`${into}%`;

  document.getElementById(
    "xpMessage"
  ).textContent=
    into===0
      ?"100 XP to next level"
      :`${100-into} XP to next level`;


  const grid=
    document.getElementById(
      "streakWeekGrid"
    );

  const a=[];

  for(let i=6;i>=0;i--){

    const d=new Date();

    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-i);

    const k=todayKey(d);
    const s=dayScore(k);

    let c=
      s>=75
        ?"good"
        :s>=50
        ?"average"
        :data.records.some(
          r=>r.date===k
        )
        ?"poor"
        :"none";

    a.push(`
      <div class="streak-day ${c}">

        <b>
          ${d.toLocaleDateString(
            undefined,
            {weekday:"short"}
          ).slice(0,1)}
        </b>

        <span>
          ${
            data.records.some(
              r=>r.date===k
            )
              ?s+"%"
              :"—"
          }
        </span>

      </div>
    `);

  }

  grid.innerHTML=a.join("");


  document
    .querySelectorAll(".roadmap-item")
    .forEach(e=>{

      const l=
        Number(e.dataset.level);

      e.classList.toggle(
        "unlocked",
        l<level
      );

      e.classList.toggle(
        "current",
        l===level
      );

      e.querySelector("b")
        .textContent=`Level ${l}`;

    });

}


/* =====================================================
   PROFILE
   ===================================================== */

function renderProfile(){

  const avatar=
    document.getElementById(
      "profileAvatar"
    );

  if(avatar){

    if(data.avatar){

      avatar.innerHTML=
        `<img src="${data.avatar}" alt="Profile">`;

    }else{

      avatar.textContent=
        initials(data.name);

    }

  }


  const name=
    data.name.trim()||"Student";

  const streak=
    calculateStreak();

  const xp=
    data.xp||0;

  const subjects=
    data.subjects.length;

  const target=
    data.target||0;


  document.getElementById(
    "nameInput"
  ).value=data.name;

  document.getElementById(
    "targetHours"
  ).value=
    Math.floor(target/60)||"";

  document.getElementById(
    "targetMinutes"
  ).value=
    target%60||"";


  document.getElementById(
    "profileDisplayName"
  ).textContent=name;

  document.getElementById(
    "profileLevel"
  ).textContent=data.level;

  document.getElementById(
    "profileStreak"
  ).textContent=streak;

  document.getElementById(
    "profileXP"
  ).textContent=xp;

  document.getElementById(
    "profileStatStreak"
  ).textContent=streak;

  document.getElementById(
    "profileStatXP"
  ).textContent=xp;

  document.getElementById(
    "profileStatSubjects"
  ).textContent=subjects;

  document.getElementById(
    "profileStatTarget"
  ).textContent=
    formatDuration(target);


  document.getElementById(
    "profileGoalText"
  ).textContent=
    formatDuration(target);


  const todayTotal=
    todayRecords().reduce(
      (sum,r)=>
        sum+(Number(r.actual)||0),
      0
    );


  const goalPercent=
    target>0
      ?Math.min(
        100,
        Math.round(
          todayTotal/target*100
        )
      )
      :0;


  document.getElementById(
    "profileGoalBar"
  ).style.width=
    goalPercent+"%";


  const goalMessage=
    document.getElementById(
      "profileGoalMessage"
    );


  if(target<=0){

    goalMessage.textContent=
      "Set a daily study target to start tracking your goal.";

  }else if(goalPercent>=100){

    goalMessage.textContent=
      "🎉 Daily study goal completed!";

  }else{

    const remaining=
      Math.max(
        0,
        target-todayTotal
      );

    goalMessage.textContent=
      `${formatDuration(
        remaining
      )} remaining to reach today's goal.`;

  }

}


/* =====================================================
   SMART DAILY PLANNER
   ===================================================== */

function plannerTodayStudy(){

  return todayRecords().reduce(
    (total,record)=>
      total+(Number(record.actual)||0),
    0
  );

}

function plannerSubjectData(){

  return data.subjects.map(subject=>{

    const records=
      data.records.filter(
        record=>
          record.subject===subject
      );

    const todayForSubject=
      todayRecords().filter(
        record=>
          record.subject===subject
      );

    const planned=
      records.reduce(
        (sum,record)=>
          sum+(Number(record.planned)||0),
        0
      );

    const actual=
      records.reduce(
        (sum,record)=>
          sum+(Number(record.actual)||0),
        0
      );

    const todayActual=
      todayForSubject.reduce(
        (sum,record)=>
          sum+(Number(record.actual)||0),
        0
      );

    const score=
      planned>0
        ?Math.min(
          100,
          Math.round(actual/planned*100)
        )
        :0;

    return{
      subject,
      planned,
      actual,
      todayActual,
      score
    };

  });

}

function renderSmartPlanner(){

  const target=
    Number(data.target)||0;

  const studied=
    plannerTodayStudy();

  const remaining=
    Math.max(
      0,
      target-studied
    );

  const percentage=
    target>0
      ?Math.min(
        100,
        Math.round(
          studied/target*100
        )
      )
      :0;


  document.getElementById(
    "plannerTarget"
  ).textContent=
    formatDuration(target);

  document.getElementById(
    "plannerStudied"
  ).textContent=
    formatDuration(studied);

  document.getElementById(
    "plannerRemaining"
  ).textContent=
    formatDuration(remaining);


  document.getElementById(
    "plannerProgressBar"
  ).style.width=
    percentage+"%";


  const progressText=
    document.getElementById(
      "plannerProgressText"
    );


  if(target<=0){

    progressText.textContent=
      "Set your daily study target from Profile.";

  }else if(percentage>=100){

    progressText.textContent=
      "🎉 Today's study target is complete!";

  }else{

    progressText.textContent=
      `${percentage}% completed — ${formatDuration(
        remaining
      )} remaining.`;

  }


  renderPlannerSubjects(
    remaining
  );

}

function renderPlannerSubjects(
  remaining
){

  const container=
    document.getElementById(
      "plannerSubjects"
    );

  if(!container)return;


  const subjects=
    plannerSubjectData();


  if(subjects.length===0){

    container.innerHTML=`
      <div class="planner-recommendation">
        📚 Add a subject to start your smart plan.
      </div>
    `;

    return;

  }


  subjects.sort((a,b)=>{

    if(a.score!==b.score){
      return a.score-b.score;
    }

    return a.actual-b.actual;

  });


  const topSubjects=
    subjects.slice(0,3);


  container.innerHTML=
    topSubjects.map(
      (item,index)=>{

        let reason=
          "Needs attention";

        if(item.actual===0){

          reason=
            "Not studied yet";

        }else if(item.score<70){

          reason=
            "Needs improvement";

        }else if(item.todayActual===0){

          reason=
            "Not studied today";

        }else{

          reason=
            "Keep improving";

        }


        return`
          <div class="planner-subject">

            <div class="planner-subject-rank">
              ${index+1}
            </div>

            <div class="planner-subject-info">

              <b>
                ${escapeHTML(item.subject)}
              </b>

              <small>
                ${reason}
              </small>

            </div>

            <div class="planner-subject-score">
              ${item.score}%
            </div>

          </div>
        `;

      }
    ).join("");


  const priorityText=
    document.getElementById(
      "plannerPriorityText"
    );


  if(priorityText){

    priorityText.textContent=
      topSubjects.length===1
        ?`Focus on ${topSubjects[0].subject} today.`
        :"These subjects need the most attention.";

  }


  renderPlannerRecommendation(
    topSubjects,
    remaining
  );

}

function renderPlannerRecommendation(
  subjects,
  remaining
){

  const box=
    document.getElementById(
      "plannerRecommendation"
    );

  if(!box)return;


  if(data.target<=0){

    box.textContent=
      "💡 Set your daily target from Profile to get a personalized study plan.";

    return;

  }


  if(remaining<=0){

    box.textContent=
      "🏆 Great work! You have completed today's study target.";

    return;

  }


  if(subjects.length===0){

    box.textContent=
      `💡 You still have ${formatDuration(
        remaining
      )} left today. Add subjects and start studying.`;

    return;

  }


  const priority=
    subjects[0].subject;


  let recommendedTime=
    Math.min(
      60,
      Math.max(
        25,
        Math.round(
          remaining/2
        )
      )
    );


  if(recommendedTime>remaining){
    recommendedTime=remaining;
  }


  box.textContent=
    `💡 Smart suggestion: Focus on ${priority} for about ${formatDuration(
      recommendedTime
    )} next. You have ${formatDuration(
      remaining
    )} remaining today.`;

}


/* =====================================================
   STUDY FUNCTIONS
   ===================================================== */

function updatePlannedFromClock(){

  const n=
    plannedFromTimes(
      document.getElementById("startTime").value,
      document.getElementById("endTime").value
    );

  if(n){

    document.getElementById(
      "plannedHours"
    ).value=
      Math.floor(n/60)||"";

    document.getElementById(
      "plannedMinutes"
    ).value=
      n%60||"";

  }

  updateLiveScore();

}

function updateLiveScore(){

  const p=
    getTimeValue(
      "plannedHours",
      "plannedMinutes"
    );

  const a=
    getTimeValue(
      "actualHours",
      "actualMinutes"
    );

  const e=
    document.getElementById(
      "liveScore"
    );

  if(!p){

    e.textContent=
      "Score will appear here";

    return;

  }

  const s=
    scoreFor(p,a);

  e.textContent=
    `${s}% · ${statusFor(s)[0]}`;

}

function addStudy(){

  const subject=
    document.getElementById(
      "subjectSelect"
    ).value;

  const start=
    document.getElementById(
      "startTime"
    ).value;

  const end=
    document.getElementById(
      "endTime"
    ).value;

  const p=
    getTimeValue(
      "plannedHours",
      "plannedMinutes"
    );

  const a=
    getTimeValue(
      "actualHours",
      "actualMinutes"
    );


  if(!subject)
    return showToast(
      "Please select a subject"
    );

  if(!p)
    return showToast(
      "Add planned study time"
    );


  data.records.push({

    id:
      crypto.randomUUID
        ?crypto.randomUUID()
        :String(Date.now()),

    date:todayKey(),

    subject,

    start,

    end,

    planned:p,

    actual:a,

    score:scoreFor(p,a),

    createdAt:Date.now()

  });


  rebuildXP();
  save();


  [
    "startTime",
    "endTime",
    "plannedHours",
    "plannedMinutes",
    "actualHours",
    "actualMinutes"
  ].forEach(
    id=>
      document.getElementById(id).value=""
  );


  renderAll();

  showToast(
    "Study session added ✓"
  );

}

function addSubject(){

  const e=
    document.getElementById(
      "subjectInput"
    );

  const s=e.value.trim();


  if(!s)
    return showToast(
      "Enter a subject name"
    );


  if(
    data.subjects.some(
      x=>
        x.toLowerCase()===
        s.toLowerCase()
    )
  )
    return showToast(
      "That subject already exists"
    );


  data.subjects.push(s);

  e.value="";

  save();
  renderAll();

  showToast(
    `${s} added ✓`
  );

}


/* =====================================================
   PROFILE SAVE
   ===================================================== */

function saveProfile(){

  data.name=
    document.getElementById(
      "nameInput"
    ).value.trim();


  let hours=
    Number(
      document.getElementById(
        "targetHours"
      ).value
    )||0;


  let minutes=
    Number(
      document.getElementById(
        "targetMinutes"
      ).value
    )||0;


  hours=Math.max(
    0,
    Math.min(24,hours)
  );

  minutes=Math.max(
    0,
    Math.min(59,minutes)
  );


  data.target=
    hours*60+minutes;


  save();
  renderAll();

  const editCard=
    document.getElementById(
      "profileEditCard"
    );

  if(editCard){
    editCard.classList.remove("show");
  }

  showToast(
    "Profile saved ✓"
  );

}


/* =====================================================
   PROFILE BACKUP
   ===================================================== */

function backupProfile(){

  try{

    const backup={
      ...data,
      backupVersion:1,
      backupDate:new Date().toISOString()
    };


    const blob=
      new Blob(
        [
          JSON.stringify(
            backup,
            null,
            2
          )
        ],
        {
          type:"application/json"
        }
      );


    const url=
      URL.createObjectURL(blob);


    const a=
      document.createElement("a");

    a.href=url;

    a.download=
      "im-progressing-backup.json";

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);


    showToast(
      "Backup downloaded ✓"
    );

  }catch(error){

    console.error(error);

    showToast(
      "Backup failed"
    );

  }

}


/* =====================================================
   PROFILE RESTORE
   ===================================================== */

function restoreProfile(file){

  if(!file)return;


  const reader=
    new FileReader();


  reader.onload=function(){

    try{

      const imported=
        JSON.parse(
          reader.result
        );


      if(
        !imported||
        typeof imported!=="object"
      ){
        throw new Error(
          "Invalid backup"
        );
      }


      if(
        !Array.isArray(
          imported.subjects
        )
      ){
        throw new Error(
          "Invalid subjects"
        );
      }


      if(
        !Array.isArray(
          imported.records
        )
      ){
        throw new Error(
          "Invalid records"
        );
      }


      data={
        ...structuredClone(
          defaultData
        ),
        ...imported
      };


      save();
      renderAll();

      showToast(
        "Backup restored ✓"
      );

    }catch(error){

      console.error(error);

      showToast(
        "Invalid backup file"
      );

    }

  };


  reader.readAsText(file);

}


/* =====================================================
   CLEAR / RESET
   ===================================================== */

function clearToday(){

  if(!todayRecords().length)
    return showToast(
      "There are no records to clear"
    );


  if(
    !confirm(
      "Clear all of today's study records?"
    )
  )
    return;


  data.records=
    data.records.filter(
      r=>r.date!==todayKey()
    );


  rebuildXP();
  save();
  renderAll();

  showToast(
    "Today's records cleared"
  );

}

function resetApp(){

  if(
    !confirm(
      "This will delete all subjects, records and profile data. Continue?"
    )
  )
    return;


  localStorage.removeItem(KEY);

  data=
    structuredClone(
      defaultData
    );

  renderAll();

  showToast(
    "App data reset"
  );

}


/* =====================================================
   NAVIGATION
   ===================================================== */

function showPage(id){

  document
    .querySelectorAll(".page")
    .forEach(
      p=>p.classList.remove("active")
    );


  document
    .getElementById(id)
    ?.classList.add("active");


  document
    .querySelectorAll(".nav-btn")
    .forEach(
      b=>
        b.classList.toggle(
          "active",
          b.dataset.page===id
        )
    );


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

}


/* =====================================================
   HELPERS
   ===================================================== */

function escapeHTML(s){

  return String(s).replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c])
  );

}

function escapeAttr(s){
  return escapeHTML(s);
}


/* =====================================================
   RENDER ALL
   ===================================================== */

function renderAll(){

  rebuildXP();

  save();

  renderHeader();
  renderStats();
  renderRecords();
  renderSubjects();
  renderProgress();
  renderStreak();
  renderProfile();

  renderSmartPlanner();

  updateLiveScore();

}


/* =====================================================
   NAV EVENTS
   ===================================================== */

document
  .querySelectorAll("[data-page]")
  .forEach(
    b=>
      b.addEventListener(
        "click",
        ()=>showPage(
          b.dataset.page
        )
      )
  );


document.getElementById(
  "profileBtn"
).onclick=
  ()=>showPage("profilePage");


document.getElementById(
  "homeStreakBtn"
).onclick=
  ()=>showPage("streakPage");


document.getElementById(
  "profileStreakBtn"
).onclick=
  ()=>showPage("streakPage");


/* STUDY */

document.getElementById(
  "addStudyBtn"
).onclick=
  addStudy;

document.getElementById(
  "addSubjectBtn"
).onclick=
  addSubject;

document.getElementById(
  "clearTodayBtn"
).onclick=
  clearToday;

document.getElementById(
  "clearHomeBtn"
).onclick=
  clearToday;


/* PROFILE */

document.getElementById(
  "saveProfileBtn"
).onclick=
  saveProfile;


document.getElementById(
  "resetBtn"
).onclick=
  resetApp;


/* PROFILE EDIT */

document.getElementById(
  "editProfileBtn"
).onclick=
  ()=>{

    const card=
      document.getElementById(
        "profileEditCard"
      );

    card.classList.toggle(
      "show"
    );

    if(card.classList.contains("show")){

      card.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });

    }

  };


document.getElementById(
  "cancelProfileBtn"
).onclick=
  ()=>{

    document
      .getElementById(
        "profileEditCard"
      )
      .classList.remove(
        "show"
      );

    renderProfile();

  };


/* BACKUP */

document.getElementById(
  "profileBackupBtn"
).onclick=
  backupProfile;


/* RESTORE */

document.getElementById(
  "profileRestoreInput"
).onchange=
  function(){

    const file=
      this.files?.[0];

    if(file){
      restoreProfile(file);
    }

    this.value="";

  };


/* AVATAR */

document.getElementById(
  "avatarInput"
).onchange=
  e=>{

    const file=
      e.target.files?.[0];

    if(!file)return;


    if(
      !file.type.startsWith(
        "image/"
      )
    ){

      showToast(
        "Please select an image"
      );

      return;

    }


    const reader=
      new FileReader();


    reader.onload=()=>{

      data.avatar=
        reader.result;

      save();
      renderAll();

      showToast(
        "Profile photo updated ✓"
      );

    };


    reader.readAsDataURL(file);

  };


/* STUDY TIME */

document.getElementById(
  "startTime"
).onchange=
  updatePlannedFromClock;


document.getElementById(
  "endTime"
).onchange=
  updatePlannedFromClock;


[
  "plannedHours",
  "plannedMinutes",
  "actualHours",
  "actualMinutes"
].forEach(
  id=>
    document
      .getElementById(id)
      .addEventListener(
        "input",
        updateLiveScore
      )
  );


/* START */

renderAll();