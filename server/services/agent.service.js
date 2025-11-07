import fs from "fs";
const agents = JSON.parse(fs.readFileSync("./data/agents.json"));

export function getAgentsByDistrict(district){
    district=district.toLowerCase()
    return agents.filter(a=>a.district.toLowerCase() === district)
}