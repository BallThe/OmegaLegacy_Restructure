var spds = [[0, 1]]
var zeroTest = {
    // [默认数值, 是否能为小数(true可以 false不可以), 是否能为负数(true可以 false不可以)]
    "speedinput": [1, true, true],
    "timeinput": [0, false, false],
    "bpminput": [100, true, false],
    "offsetinput": [0, true, true],
    "subinput": [0, false, false],
}

window.onload = () => {
    for (let i = 0; i < Object.keys(zeroTest).length; i++) noZero(Object.keys(zeroTest)[i])
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
}

function songImport() {
    isExistFile(document.getElementById("songpath").value);
}

function isExistFile(filepath) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if (this.readyState == 4) {
            console.log(this)
            if (this.status == 200) return true;
            else if (this.status == 404) return false;
        }
    }
    req.open("GET", filepath, false);
    req.send();
}