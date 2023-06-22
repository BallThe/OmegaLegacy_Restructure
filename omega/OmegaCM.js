var spds = [[0, 1]];
var zeroTest = {
    // [默认数值, 是否能为小数(true可以 false不可以), 是否能为负数(true可以 false不可以), 能否为0(true可以 false不可以)]
    "speedinput": [1, true, true, true],
    "timeinput": [0, false, false, true],
    "bpminput": [100, true, false, false],
    "offsetinput": [0, true, true, true],
    "subinput": [0, false, false, true],
}
var music = null;

// 获取打击音效
var hit = new Audio("../audio/hit.wav");

// 谱面
var chart = {
    "bpm": 100,
    "bpmms": 600,
    "offset": 0,
    "subStart": 0,
    "holds": [],
    "speeds": [[0, 1]],
    "taps": [[], [], [], []],
    "time": 0,
};

var isPausing = false;

window.onload = () => {
    for (let i = 0; i < Object.keys(zeroTest).length; i++) noZero(Object.keys(zeroTest)[i]);
}


function eventAppend() {
    let time = parseInt(document.getElementById("timeinput").value);
    let speed = parseFloat(document.getElementById("speedinput").value);
    for (let i = 0; i < spds.length; i++) {
        if (time == spds[i][0]) {
            alert("输入的时间不能与已经存在的时间相等！");
            return;
        }
    }

    spds.push([time, speed]);
    let times = [];
    for (let i = 0; i < spds.length; i++) times.push(spds[i][0]);
    times.sort((a, b) => a - b);
    spds.splice(times.indexOf(time), 0, [time, speed])
    spds.splice(spds.length - 1, 1);
    sortSpd(spds);
}

function eventRemove(index) {
    spds.splice(index, 1);
    sortSpd(spds);
}

function eventModify(index) {
    let time = document.getElementById("timeinput");
    let speed = document.getElementById("speedinput");
    let eventaddbtn = document.getElementById("eventadd");
    let eventdelbtn = document.getElementById("deleteevent");
    let eventmodbtn = document.getElementById("modifyevent");
    time.value = spds[index][0];
    speed.value = spds[index][1];
    eventaddbtn.outerHTML = `<button id="eventadd" class="bluebtn" style="background-color: limegreen;" onclick="eventConfirm(${index})">确认</button>`;
    eventdelbtn.outerHTML = `<button id="deleteevent" class="bluebtn" style="background-color: gray;font-size:18px;">删除</button>`;
    eventmodbtn.outerHTML = `<button id="deleteevent" class="redbtn" style="background-color: gray;">修改</button>`;
}

function eventConfirm(index) {
    eventRemove(index);
    eventAppend();
    document.getElementById("eventadd").outerHTML = `<button id="eventadd" class="bluebtn" onclick="eventAppend()">添加</button>`
    document.getElementById("timeinput").value = zeroTest["timeinput"][0];
    document.getElementById("speedinput").value = zeroTest["speedinput"][0];
}

function sortSpd(spds) {
    let events = document.getElementById("eventsList");
    events.innerHTML = "";
    for (let i = 1; i < spds.length; i++) {
        events.innerHTML += `<div class="event" id="spd${i}"><div>${spds[i][0]}</div><div>${spds[i][1]}</div><button id="deleteevent" class="redbtn" onclick="eventRemove(${i})">删除</button>
        <button id="modifyevent" class="bluebtn" style="font-size:18px;" onclick="eventModify(${i})">修改</button></div>`
    }
}

function noZero(elementId) {
    let element = document.getElementById(elementId);
    if (element.value == "") element.value = `${zeroTest[elementId][0]}`;
    if (!zeroTest[elementId][1]) element.value = `${parseInt(element.value)}`;
    if (!zeroTest[elementId][2] && parseInt(element.value) < 0) element.value = `${-element.value}`;
    if (!zeroTest[elementId][3] && parseInt(element.value) == 0) element.value = `${zeroTest[elementId][0]}`
}

function songImport() {
    let file = document.getElementById('songfile');
    if (file != "" && file != null) {
        file.setAttribute("disabled", true);
        music = new Audio(URL.createObjectURL(file.files[0]));
        document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="redbtn" style="font-size: 25px;" onclick="changePause()">暂停</button>`;
        main();
    }
}

function changePause() {
    isPausing = !isPausing;
    if (isPausing) document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="bluebtn"  onclick="changePause()">继续</button>`;
    else document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="redbtn" style="font-size: 25px;" onclick="changePause()">暂停</button>`;
}

function newImage(path) {
    let res = new Image();
    res.src = path;
    return res;
}

function getY(time, speeds, hittime, liney) {
    // 设置标识符
    let flag = [false, false];
    // 获取当前时间的速度和音符所在时间的速度
    for (let k = speeds.length - 1; k >= 0; k--) {
        // 当前时间的速度
        if (speeds[k][0] <= time && !flag[0]) {
            var time_speed = speeds[k][1];
            var time_speedindex = k;
            flag[0] = true;
        }
        // 当前音符所在时间的速度
        if (speeds[k][0] <= hittime && !flag[1]) {
            var note_speed = speeds[k][1];
            var note_speedtime = speeds[k][0];
            var note_speedindex = k;
            flag[1] = true;
        }
        if (flag[0] && flag[1]) {
            break;
        }
    }

    // 推出y值
    let y = 0;
    // 当时间和音符都在一个速度阶段的时候
    if (time_speedindex == note_speedindex) {
        y = (hittime - note_speedtime - (time - note_speedtime)) * note_speed;
    } else { // 当不在一个速度阶段的时候
        if (time_speedindex + 1 != note_speedindex) {
            // 计算所有中间的速度段所占的高度
            for (let i = time_speedindex + 1; i < note_speedindex; i++) {
                y += speeds[i][0] * speeds[i][1];
            }
        }
        // console.log(flag, time_speedindex, note_speedindex)
        // 加上时间和音符所在的速度段高度
        y += (speeds[time_speedindex + 1][0] - time) * time_speed;
        y += (hittime - note_speedtime) * note_speed;
    }
    // 判定线高度
    y = liney - y;
    return y;
}

function drawLine(ctx, lineImg) {
    // 画四个判定条
    for (let i = 0; i < 4; i++) {
        ctx.drawImage(lineImg, i * 103 - 3.5, 0);
    }
}

function getSub(numerator, denominator) {
    var gcd = 1;
    var smaller = Math.min(numerator, denominator);
    for (var i = 2; i <= smaller; i++) {
        if (numerator % i === 0 && denominator % i === 0) {
            gcd = i;
        }
    }
    let res = denominator / gcd;
    // return [numerator / gcd, denominator / gcd];
    if (res != 1 && res != 2 && res != 4 && res != 8) res = 0;
    if (res == 4) res = 3;
    if (res == 8) res = 4;
    return res;
}

function drawSubLine(ctx, time, bpmms, substart, speeds, time_all, subLines) {
    let subs = parseInt(document.getElementById("subinput").value);
    // for(let i = 0; i < parseInt((time_all - substart)/(bpmms*4)); i++){
    //     ctx.drawImage(subLines[0], 0, getY(time, speeds, bpmms*4*i + substart, 500), 405, 5);
    // }
    // bpmms: 8分音符时值
    // 大多数: 每小节4拍, 4分音符为一拍
    // 4分音符 = 2*8分音符 = 2*bpmms;
    // 8分音符 = 1*bpmms;
    // 12分音符 = 2/3*8分音符 = bpmms*2/3;
    // 20分音符 = 1/5*4分音符 = 2/5*8分音符 = bpmms*2/5;
    // 28分音符 = 1/7*4分音符 = 2/7*8分音符 = bpmms*2/7;
    // 节拍细分：(模拟输入)
    // 1 > [1]  1/1 = 1/1(1)
    // 2 > [1,2]  1/2 = 1/2(2); 2/2 = 1/1(1)
    // 3 > [1,0,0] 1/3 = 1/3(3); 2/3 = 2/3(3); 3/3 = 1/1(1)
    // 4 > [1,4,2,4]  1/4 = 1/4(4); 2/4 = 1/2(2); 3/4 = 3/4(4); 4/4 = 1/1(1);
    // 5 > [1,0,0,0,0]
    // 6 > [1,0,0,2,0,0]  1/6 = 1/6(6); 3/6 = 1/2(2);
    // 7 > [1,0,0,0,0,0,0]
    // 8 > [1,0,4,0,2,0,4,0] 1/8 = 1/8(0); 2/8 = 1/4(4);
    let subList = [];
    for (let i = 1; i <= subs; i++) {
        subList.unshift(getSub(i, subs));
    }
    console.log(parseInt((time_all - substart) / (bpmms * 4) * subs))
    for (let i = 0; i < parseInt((time_all - substart) / (bpmms * 4) * subs); i++) {
        let subCode = subList[i % subs];
        let y = getY(time, speeds, (bpmms * 4 / subs) * i + substart, 500);
        if(y <= 5 || y >= -690) ctx.drawImage(subLines[subCode], 0, y, 405, 5);
    }
}

function game(time, taps, holds, speeds, liney, hit, autoplay, bpmms, substart, time_all, notetype) {
    // 图片对象
    let lineImg = newImage("../imgs/line" + notetype + ".png");
    let tapImg = newImage("../imgs/tap" + notetype + ".png");
    let holdImg = newImage("../imgs/hold" + notetype + ".png");
    let subLines = [];
    for (let i = 0; i <= 4; i++) subLines.push(newImage(`../imgs/subLine${notetype}-${i}.png`));

    // 画笔对象
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.clearRect(0, 0, 405, 684);
    drawLine(ctx, lineImg);
    drawSubLine(ctx, time, bpmms, substart, speeds, time_all, subLines);
    // drawHold(ctx, holdImg, time, holds, speeds, liney, autoplay, hit);
    // drawTap(ctx, tapImg, time, taps, speeds, liney, autoplay, hit);
}

function main() {
    // 音乐加载完成
    music.addEventListener("canplaythrough", () => {
        chart["time"] = parseInt(music.duration) * 1000;
        chart["speeds"].push([parseInt(chart["time"]) + 1000, 1]);
        // 播放音乐
        music.play();
        // 主程序
        setInterval(function () {
            // 当前时间获取(我好聪明啊哈哈哈, 根据这个特性哈哈哈, 我太聪明了！ ——BallThe)
            var time = parseInt(music.currentTime * 1000);
            // chart["speeds"].push([])
            chart["bpmms"] = 60 * 1000 / parseFloat(document.getElementById("bpminput").value);
            if (!isPausing) {
                // 播放音乐
                music.play();
                // document.getElementById("time").innerHTML = "Time: " + time;
                if (time > chart["time"] + 1000) music.currentTime = 0;
                // if (time % 1000 >= 500) game(time, chart["taps"], chart["holds"], chart["speeds"], 500, hit, auto, chart["bpmms"], chart["subStart"], chart["time"], 1);
                game(time, chart["taps"], chart["holds"], chart["speeds"], 500, hit, true, chart["bpmms"], chart["subStart"], chart["time"], 0);
            } else {
                music.pause();
            }
        }, 1000 / 120); // 60次/秒
    })
}