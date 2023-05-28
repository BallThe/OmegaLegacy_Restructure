import json


a = "D:\.Programs\.Python项目\Omega-Legacy\Legacy-Omega\Legacy-Omega_Restructure\chart\Mujinku-Vacuum-Track_ADD8E6-.txt"

with open(a,"r",encoding='utf-8') as fp:
    read = fp.read()
    fp.close()

read = read.replace("!ChartType OMEGA\n","").split("\n")

new = {
    "bpm":0,
    "offset":0,
    "chart":"",
    "ChartInfo":[]
}
ci_list = []
for _ in range(len(read)):
    if _ % 2 == 0:
        for using in new.keys():
            if using == read[_]:
                new[using] = read[_+1]
        if "/" in read[_]:
            temp = read[_].split("/")
            try:
                int(temp[1])
            except:
                speed = int(temp[1].split(" ")[1])
                pai = "/".join([temp[0],temp[1].split(" ")[0]])
                note = read[_+1]
                ci_list.append([pai,note,speed])
            else:
                pai = read[_]
                note = read[_+1]
                ci_list.append([pai,note])

new["ChartInfo"] = ci_list
new["bpm"] = int(new["bpm"])
new["offset"] = int(new["offset"])

new = json.dumps(new)

with open("\\".join(a.split("\\")[0:-2])+"\\"+a.split("\\")[-1].replace(".txt",".json"),"w",encoding="utf-8") as fp:
    fp.write(new)
    fp.close()