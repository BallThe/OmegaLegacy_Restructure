var zeroTest = {
    // [默认数值, 是否能为小数(true可以 false不可以), 是否能为负数(true可以 false不可以), 能否为0(true可以 false不可以)]
    "speedinput": [1, true, true, true],
    "timeinput": [0, false, false, true],
    "bpminput": [100, true, false, false],
    "offsetinput": [0, false, true, true],
    "subinput": [0, false, false, true],
    "substartinput": [0, false, true, true],
    "playbackspeedinput": [1, true, false, false],
}

// 定义音频
var music = new Audio();

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

var tapTouch = [[], [], [], []];
var isPausing = false;
var isAutoplay = true;

// 检查所有的输入框是否有非法情况
window.onload = () => {
    for (let i = 0; i < Object.keys(zeroTest).length; i++) noZero(Object.keys(zeroTest)[i]);
}

// 添加变速
function eventAppend() {
    let time = parseInt(document.getElementById("timeinput").value);
    let speed = parseFloat(document.getElementById("speedinput").value);
    // 检查是否相等
    for (let i = 0; i < chart["speeds"].length; i++) {
        if (time == chart["speeds"][i][0]) {
            alert("输入的时间不能与已经存在的时间相等！");
            return;
        }
    }
    // 添加速度
    chart["speeds"].push([time, speed]);
    let times = [];
    // 时间排序(小到大)
    for (let i = 0; i < chart["speeds"].length; i++) times.push(chart["speeds"][i][0]);
    times.sort((a, b) => a - b);
    // 速度排序
    chart["speeds"].splice(times.indexOf(time), 0, [time, speed]);
    chart["speeds"].splice(chart["speeds"].length - 1, 1);
    // 展现列表
    sortSpd(chart["speeds"].slice(0, -1));
}

// 删除速度
function eventRemove(index) {
    chart["speeds"].splice(index, 1);
    sortSpd(chart["speeds"].slice(0, -1));
}

// 修改速度
function eventModify(index) {
    // 获取输入框
    let time = document.getElementById("timeinput");
    let speed = document.getElementById("speedinput");
    let eventaddbtn = document.getElementById("eventadd");
    let eventdelbtn = document.getElementById("deleteevent" + index);
    let eventmodbtn = document.getElementById("modifyevent" + index);
    // 定义时间速度
    time.value = chart["speeds"][index][0];
    speed.value = chart["speeds"][index][1];
    // 初始速度不可更改
    if (index == 0) time.setAttribute("disabled", true);
    // 按钮修改样式
    eventaddbtn.outerHTML = `<button id="eventadd" class="bluebtn" style="background-color: limegreen;" onclick="eventConfirm(${index})">确认</button>`;
    eventdelbtn.outerHTML = `<button id="deleteevent${index}" class="bluebtn" style="background-color: gray;font-size:18px;">删除</button>`;
    eventmodbtn.outerHTML = `<button id="deleteevent${index}" class="redbtn" style="background-color: gray;">修改</button>`;
}

// 确认修改
function eventConfirm(index) {
    // 删除原来修改的变速
    eventRemove(index);
    // 增加新的变速
    eventAppend();
    // 修改样式
    document.getElementById("timeinput").outerHTML = `<input id="timeinput" type="number" class="text" style="width:180px" onchange="noZero('timeinput')" placeholder="时间">`
    document.getElementById("eventadd").outerHTML = `<button id="eventadd" class="bluebtn" onclick="eventAppend()">添加</button>`
    document.getElementById("timeinput").value = zeroTest["timeinput"][0];
    document.getElementById("speedinput").value = zeroTest["speedinput"][0];
}

// 展示变速列表
function sortSpd(spds) {
    // 获取展示框
    let events = document.getElementById("eventsList");
    // 清空
    events.innerHTML = "";
    // 一个个添加
    for (let i = 0; i < spds.length; i++) {
        if (i == 0) events.innerHTML += `<div class="event" id="spd${i}"><div>${spds[i][0]}</div><div>${spds[i][1]}</div><button id="deleteevent${i}" class="redbtn" style="background-color: gray;">删除</button>
        <button id="modifyevent${i}" class="bluebtn" style="font-size:18px;" onclick="eventModify(${i})">修改</button></div>`
        else events.innerHTML += `<div class="event" id="spd${i}"><div>${spds[i][0]}</div><div>${spds[i][1]}</div><button id="deleteevent${i}" class="redbtn" onclick="eventRemove(${i})">删除</button>
        <button id="modifyevent${i}" class="bluebtn" style="font-size:18px;" onclick="eventModify(${i})">修改</button></div>`
    }
}

// 输入框非法情况判别
function noZero(elementId) {
    let element = document.getElementById(elementId);
    if (element.value == "") element.value = `${zeroTest[elementId][0]}`;
    if (!zeroTest[elementId][1]) element.value = `${parseInt(element.value)}`;
    if (!zeroTest[elementId][2] && parseFloat(element.value) < 0) element.value = `${-element.value}`;
    if (!zeroTest[elementId][3] && parseFloat(element.value) == 0) element.value = `${zeroTest[elementId][0]}`
}

// 选择的文件类型变换
function inputModeChange() {
    if (document.getElementById("inputfilemode1").checked) document.getElementById("inputfile").outerHTML = `<input id="inputfile" type="file" accept="audio/*" class="file" onchange="fileImport(true)">`;
    else document.getElementById("inputfile").outerHTML = `<input id="inputfile" type="file" accept=".json" class="file" onchange="fileImport(false)">`;
}

// 解析获取的谱面
function parseChart(chart) {
    let chartInfo = chart["ChartInfo"];  // 获取chart内的谱面(ChartInfo)
    let bpmms = 1000 * 60 / chart["bpm"]; // 1个bpm对应的毫秒数(ms)
    chart["bpmms"] = bpmms;
    let time = chart["offset"]; // 偏移值(ms)
    let speeds = []; // 所有速度及其时间(ms)
    for (let i = 0; i < chartInfo.length; i++) { // 1/2 -> 1/2*bpmms+time
        let beat = parseInt(chartInfo[i][0].split("/")[0]) / parseInt(chartInfo[i][0].split("/")[1]); // 距离上一个拍的bpmms的比例
        time += beat * bpmms;
        if (chartInfo[i].length > 2) { // 有速度标识的情况
            speeds.push([parseInt(time), chartInfo[i][2]]);
            chartInfo[i].splice(2, 1);
        }
        chartInfo[i][0] = parseInt(time); // 时间化为ms形式(ms)
        if (i == chartInfo.length - 1) chart["total_time"] = time;
    }
    speeds[0] = [0, speeds[0][1]];
    chart["speeds"] = speeds;

    let taps = [[], [], [], []];
    let holds = [];
    let tempHolds = [, , ,];

    for (let i = 0; i < chartInfo.length; i++) {
        if (chartInfo[i][1].length <= 4) {
            for (let j = 0; j < 4; j++) {
                switch (chartInfo[i][1][j]) {
                    case "1":
                        taps[j].push(chartInfo[i][0]);
                        tapTouch[j].push(false);
                        break;
                    case "2":
                        tempHolds[j] = chartInfo[i][0];
                        break;
                    case "4":
                        holds.push([j, tempHolds[j], chartInfo[i][0], false]);
                        break;
                }
            }
        }
    }

    Reflect.deleteProperty(chart, "ChartInfo");
    chart["taps"] = taps;
    chart["holds"] = holds;

    return chart;
}

// 导入音乐或谱面文件
function fileImport(isSong) {
    let file = document.getElementById('inputfile');
    if (file != "" && file != null) {
        file.setAttribute("disabled", true);
        document.getElementById("inputfilemode1").setAttribute("disabled", true);
        document.getElementById("inputfilemode2").setAttribute("disabled", true);
        document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="redbtn" style="font-size: 25px;" onclick="changePause()">暂停</button>`;
        if (isSong) {
            music = new Audio(URL.createObjectURL(file.files[0]));
            sortSpd(chart["speeds"]);
            main();
        }
        else {
            music = new Audio(`../audio/${file.files[0].name.replace(/.json/, "")}.mp3`);
            let reader = new FileReader();
            reader.onload = (e) => {
                chart = parseChart(JSON.parse(e.currentTarget.result));
                document.getElementById("bpminput").value = chart["bpm"];
                document.getElementById("nameinput").value = file.files[0].name.replace(/.json/, "");
                document.getElementById("offsetinput").value = chart["offset"];
                document.getElementById("substartinput").value = chart["subStart"];
                console.log(chart);
                sortSpd(chart["speeds"]);
                main();
            }
            reader.readAsText(file.files[0], "UTF-8", false);
        }
    }
}

function reloadTapTouch() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < chart["taps"][i].length; j++) {
            if (music.currentTime * 1000 < chart["taps"][i][j]) {
                for (let k = j; k < chart["taps"][i].length; k++) tapTouch[i][k] = false;
                break;
            }
            tapTouch[i][j] = true;
        }
    }
}

function changePause() {
    isPausing = !isPausing;
    reloadTapTouch();
    if (isPausing) document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="bluebtn"  onclick="changePause()">继续</button>`;
    else {
        document.getElementById("pausechange").outerHTML = `<button id="pausechange" class="redbtn" style="font-size: 25px;" onclick="changePause()">暂停</button>`;
        music.play();
    }
}

function newImage(path) {
    let res = new Image();
    res.src = path;
    return res;
}

function _gety(i, time, liney, speeds) {
    let y = 0;
    for (let j = 0; j < i; j++) y -= (speeds[j + 1][0] - speeds[j][0]) * speeds[j][1];
    y -= (time - speeds[i][0]) * speeds[i][1] - liney;
    return y;
}
function getY(time, speeds, hittime, liney) {
    let flag = [false, false];
    let hity = 0;
    let timey = 0;
    for (let i = speeds.length - 1; i >= 0; i--) {
        if (speeds[i][0] <= hittime && !flag[0]) {
            hity = _gety(i, hittime, liney, speeds);
            flag[0] = !flag[0];
        }
        if (speeds[i][0] <= time && !flag[1]) {
            timey = _gety(i, time, liney, speeds);
            flag[1] = !flag[1];
        }
        if (flag[0] && flag[1]) break;
    }
    let y = hity - timey + liney;
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
    // console.log(parseInt((time_all - substart) / (bpmms * 4) * subs))
    for (let i = 0; i < parseInt((time_all - substart) / (bpmms * 4) * subs); i++) {
        let subCode = subList[i % subs];
        let y = getY(time, speeds, (bpmms * 4 / subs) * i + substart, 500);
        if (y <= 5 || y >= -690) ctx.drawImage(subLines[subCode], 0, y, 405, 5);
    }
}

function drawTap(ctx, tapImg, time, tapTimeAry, speeds, liney, autoplay, hit, tapTouch) {
    // tapTimeAry = [[int,..],[int,..],[int,..],[int,..]]
    // 每个内部列表就代表每条轨道上的所有音符的打击时间
    for (let i = 0; i < 4; i++) {
        for (let j = tapTimeAry[i].length - 1; j >= 0; j--) {
            let tapY = getY(time, speeds, tapTimeAry[i][j], liney);
            if (time >= tapTimeAry[i][j] && tapTouch[i][j] == false && autoplay) {
                tapTouch[i][j] = true;
                hit.currentTime = 0;
                hit.play();
            }
            else if (!autoplay && time - tapTimeAry[i][j] >= 65) ctx.globalAlpha = 1 - (time - tapTimeAry[i][j] - 65) / (150 - 65);
            if (!tapTouch[i][j] && !(time - tapTimeAry[i][j] >= 150)) ctx.drawImage(tapImg, i * 103 + 2, tapY);
            ctx.globalAlpha = 1;
        }
    }
}

function drawHold(ctx, holdImg, time, holdTimeAry, speeds, liney, autoplay, hit) {
    // holdTimeAry = [[line, starttime, endtime, isholding],..]
    // 每个内部列表就代表一个长条的[所在轨道编号(0-3),开始时间,结束时间,是否被按住]
    for (let i = holdTimeAry.length - 1; i >= 0; i--) {
        // 长条没到点击的时候
        if (time < holdTimeAry[i][1]) {
            // 获取y值
            let holdStartY = getY(time, speeds, holdTimeAry[i][1], liney);
            let holdEndY = getY(time, speeds, holdTimeAry[i][2], liney);
            holdTimeAry[i][3] = false;
            // 画框外的不画，减少内存使用
            if (holdStartY >= 10 || holdStartY <= 700 || holdEndY >= 10 || holdEndY <= 700) {
                ctx.drawImage(holdImg, holdTimeAry[i][0] * 103 + 2, holdEndY, 93, holdStartY - holdEndY);
            }
        }
        // 当前时间大于开始时间(代表长条已经要点击)
        else if (time >= holdTimeAry[i][1] && time < holdTimeAry[i][2]) {
            // 改变按住状态+播放声音(在开启自动播放 且 没有被点击过 的情况下)
            if (!holdTimeAry[i][3] && autoplay) {
                holdTimeAry[i][3] = true;
                hit.currentTime = 0;
                hit.play();
            }
            else if (!autoplay && time - holdTimeAry[i][1] > 150) ctx.globalAlpha = 0.5;
            // 长条开始部位在判定线上
            let holdStartY = liney;
            let holdEndY = getY(time, speeds, holdTimeAry[i][2], liney);
            ctx.drawImage(holdImg, holdTimeAry[i][0] * 103 + 2, holdEndY, 93, holdStartY - holdEndY);
            ctx.globalAlpha = 1;
        }
        // 当前时间大于结束时间(代表长条要结束点击)
        else if (time >= holdTimeAry[i][2]) {
            // 释放长条
            holdTimeAry[i][3] = false;
        }
    }
}

function autoplayChange(isAuto) {
    if (!isAuto) document.getElementById("autoplay").outerHTML = `<button id="autoplay" class="bluebtn" style="font-size: 18px;" onclick="autoplayChange(true)">开启</button>`;
    else document.getElementById("autoplay").outerHTML = `<button id="autoplay" class="redbtn" onclick="autoplayChange(false)">关闭</button>`;
    isAutoplay = isAuto;
}

function getYTime(y, speeds, time) {
    let yTotal = getY(time, speeds, 0, 0);
    let speedspx = [yTotal];
    for (let i = 0; i < speeds.length - 1; i++) {
        speedspx.push(speedspx[i] - (speeds[i + 1][0] - speeds[i][0]) * speeds[i][1] + yTotal);
    }
    console.log(speedspx);
    for (let i = 0; i < speedspx.length - 1; i++) {
        if ((speedspx[i] > y && y > speedspx[i + 1]) || (speeds[i] < y && y < speedspx[i + 1])) {
            return speeds[i][0] + (speedspx[i] + y) / speeds[i][1];
        }
    }
}

function game(time, taps, holds, speeds, liney, hit, autoplay, bpmms, substart, time_all, tapTocuh, notetype) {
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
    drawHold(ctx, holdImg, time, holds, speeds, liney, autoplay, hit);
    drawTap(ctx, tapImg, time, taps, speeds, liney, autoplay, hit, tapTocuh);
}

function main() {
    // 音乐加载完成
    music.addEventListener("canplaythrough", () => {
        chart["time"] = parseInt(music.duration) * 1000;
        if (chart["speeds"].slice(-1)[0][0] != parseInt(chart["time"] + 1000)) chart["speeds"].push([parseInt(chart["time"]) + 1000, 1]);
        document.getElementById("timerange").outerHTML = `<input type="range" id="timerange" step="1" min="0" max="${chart["time"]}" style="width:20vw;">`;
        // 播放音乐
        music.play();
        document.getElementById("timerange").addEventListener("input", () => {
            music.currentTime = parseInt(document.getElementById("timerange").value) / 1000;
            reloadTapTouch();
        })
        // 主程序
        setInterval(function () {
            music.playbackRate = parseFloat(document.getElementById("playbackspeedinput").value);
            // 当前时间获取(我好聪明啊哈哈哈, 根据这个特性哈哈哈, 我太聪明了！ ——BallThe)
            var time = parseInt(music.currentTime * 1000);
            document.getElementById("timeshow").outerHTML = `<span style="font-size:20px;" id="timeshow">${parseInt(time / 1000 / 60)}:${parseInt(time / 1000 % 60)}.${time % 1000} / ${parseInt(chart["time"] / 1000 / 60)}:${parseInt(chart["time"] / 1000 % 60)}.${chart["time"] % 1000} (${time})</span>`;
            document.getElementById("timerange").value = time;
            chart["bpm"] = parseFloat(document.getElementById("bpminput").value);
            chart["bpmms"] = 60 * 1000 / parseFloat(document.getElementById("bpminput").value);
            chart["offset"] = parseInt(document.getElementById("offsetinput").value);
            chart["subStart"] = parseInt(document.getElementById("substartinput").value);
            game(time, chart["taps"], chart["holds"], chart["speeds"], 500, hit, isAutoplay, chart["bpmms"], chart["subStart"], chart["time"], tapTouch, 0);
            if (!isPausing) {
                // 播放音乐
                if (time >= chart["time"]) {
                    changePause();
                    music.currentTime = 0;
                }
            } else {
                music.pause();
            }

        }, 1000 / 60); // 60次/秒
    })
}

window.onkeydown = (key) => {
    if (key.keyCode == 32) changePause();
}