var isPausing = false;

// 获取谱面
function getChart() {
    let req = new XMLHttpRequest();
    var res = {};
    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // 利用JSON解码文件
            res = JSON.parse(this.responseText);
            // 这里的JSON文件读取完后会是一个对象
            // 包含bpm、offset和谱面
            // 谱面格式如下：
            // [["距离上一个音符的拍数","格式",*速度],..]
            return;
        }
    }
    req.open("GET", `../chart/${document.getElementById("openFile").value}.json`, false);
    req.send();
    return res;
}

// 解析谱面
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

function newImage(path) {
    let res = new Image();
    res.src = path;
    return res;
}

function drawLine(ctx, lineImg) {
    // 画四个判定条
    for (let i = 0; i < 4; i++) {
        ctx.drawImage(lineImg, i * 103-3.5, 0);
    }
}

function drawTap(ctx, tapImg, time, tapTimeAry, speeds, liney, autoplay, hit) {
    // tapTimeAry = [[int,..],[int,..],[int,..],[int,..]]
    // 每个内部列表就代表每条轨道上的所有音符的打击时间

    for (let i = 0; i < 4; i++) {
        for (let j = tapTimeAry[i].length - 1; j >= 0; j--) {
            if (time - tapTimeAry[i][j] > 150) {
                // judges(time - tapTimeAry[i][j]);
                tapTimeAry[i].splice(j, 1);
                continue;
            } else if (time - tapTimeAry[i][j] >= 65) {
                ctx.globalAlpha = 1 - (time - tapTimeAry[i][j] - 65) / (150 - 65);
            }
            let tapY = getY(time, speeds, tapTimeAry[i][j], liney);
            if (autoplay && -20 <= time - tapTimeAry[i][j] && time - tapTimeAry[i][j] <= 20) {
                tapTimeAry[i].splice(j, 1);
                hit.currentTime = 0;
                hit.play();
            }
            // if (tapY >= 10 || tapY <= 700) {
                ctx.drawImage(tapImg, i * 103 + 2, tapY);
            // }
            ctx.globalAlpha = 1;
        }
    }
}

function drawHold(ctx, holdImg, time, holdTimeAry, speeds, liney, autoplay, hit) {
    // holdTimeAry = [[line, starttime, endtime, isholding],..]
    // 每个内部列表就代表一个长条的[所在轨道编号(0-3),开始时间,结束时间,是否被按住]

    for (let i = holdTimeAry.length - 1; i >= 0; i--) {
        if (time - holdTimeAry[i][1] >= 0) {
            var holdStartY = liney;
            if (holdTimeAry[i][3] == false && autoplay) {
                holdTimeAry[i][3] = true;
                hit.currentTime = 0;
                hit.play();
            }
            if (time - holdTimeAry[i][1] > 150 && holdTimeAry[i][3] != true) {
                ctx.globalAlpha = 0.5;
                if (holdTimeAry[i][3] == false) {
                    holdTimeAry[i][3] = null;
                    // judges(time - holdTimeAry[i][1]);
                }
            }
        } else {
            var holdStartY = getY(time, speeds, holdTimeAry[i][1], liney);
        }
        if (time - holdTimeAry[i][2] >= 0) {
            holdTimeAry.splice(i, 1);
            continue;
        }
        let holdEndY = getY(time, speeds, holdTimeAry[i][2], liney);
        // if (holdStartY >= 10 || holdStartY <= 700 || holdEndY >= 10 || holdEndY <= 700) {
            ctx.drawImage(holdImg, holdTimeAry[i][0] * 103 + 2, holdEndY, 93, holdStartY - holdEndY);
        // }
    }
    ctx.globalAlpha = 1;
}

function drawSubLine(ctx, time, bpmms, substart, speeds, time_all, subLineImg){
    // 画小节线
    // bpmms为一个八分音符的时值
    // 一个小节 = 4个4分音符 = 8个8分音符 = 8*bpmms
    // 即为8*bpmms + substart
    
    for(let i = 0; i < parseInt((time_all - substart)/(bpmms*4)); i++){
        ctx.drawImage(subLineImg, 0, getY(time, speeds, bpmms*4*i + substart, 500), 405, 5);
    }
}

function game(time, taps, holds, speeds, liney, hit, autoplay, bpmms, substart, time_all, notetype) {
    // 图片对象
    let lineImg = newImage("../imgs/line"+notetype+".png");
    let tapImg = newImage("../imgs/tap"+notetype+".png");
    let holdImg = newImage("../imgs/hold"+notetype+".png");
    let subLineImg = newImage("../imgs/subLine"+notetype+"-0.png");

    // 画笔对象
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.clearRect(0, 0, 405, 684);
    drawLine(ctx, lineImg);
    drawSubLine(ctx, time, bpmms, substart, speeds, time_all, subLineImg);
    drawHold(ctx, holdImg, time, holds, speeds, liney, autoplay, hit);
    drawTap(ctx, tapImg, time, taps, speeds, liney, autoplay, hit);
}

function main() {
    // 获取谱面
    let chart = parseChart(getChart());
    console.log(chart)

    // 获取音乐
    let music = new Audio(`../audio/${document.getElementById("openFile").value}.mp3`);

    // 获取打击音效
    var hit = new Audio("../audio/hit.wav");

    // 自动播放
    let auto = document.getElementById("autoplay").checked;

    // 设置禁用组件
    document.getElementById("autoplay").setAttribute("disabled", true);
    document.getElementById("start").setAttribute("disabled", true);
    document.getElementById("openFile").setAttribute("disabled", true);

    // 音乐加载完成
    music.addEventListener("canplaythrough", event => {
        chart["time"] = parseInt(music.duration)*1000;
        chart["speeds"].push([parseInt(chart["time"]) + 1000, 1]);
        // 播放音乐
        music.play();
        // 主程序
        var gameloop = setInterval(function () {
            // 当前时间获取(我好聪明啊哈哈哈, 根据这个特性哈哈哈, 我太聪明了！ ——BallThe)
            var time = parseInt(music.currentTime * 1000);
            if (!isPausing) {
                // 播放音乐
                music.play();
                document.getElementById("time").innerHTML = "Time: " + time;
                if (time > chart["time"] + 1000) clearInterval(gameloop);
                // if (time % 1000 >= 500) game(time, chart["taps"], chart["holds"], chart["speeds"], 500, hit, auto, chart["bpmms"], chart["subStart"], chart["time"], 1);
                game(time, chart["taps"], chart["holds"], chart["speeds"], 500, hit, auto, chart["bpmms"], chart["subStart"], chart["time"], 0);
            } else {
                music.pause();
            }
        }, 1000 / 60); // 60次/秒
    })
}

function pause() {
    isPausing = !isPausing;
    if (isPausing) {
        document.getElementById("pause").innerHTML = "CONTINUE";
    } else {
        document.getElementById("pause").innerHTML = "PAUSE";
    }
}