const fs = require('fs');
const { buildEddsa, buildBabyjub, buildPoseidon } = require("circomlibjs");

function textToInt(text) {
    let hash = 0n;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 8n) + BigInt(text.charCodeAt(i));
    }
    return hash.toString();
}

async function main() {
    const babyJub = await buildBabyjub();
    const eddsa = await buildEddsa();
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const rawData = fs.readFileSync('scenarios.json');
    const data = JSON.parse(rawData);

    const authPrivKey = Buffer.from(data.authority.privateKey, 'hex'); 
    const authPubKey = eddsa.prv2pub(authPrivKey);

    console.log("Generating input files for scenarios:");

    for (const scenario of data.scenarios) {
        const idVal = Number(scenario.id); 
        const nameLen = scenario.voter.name.length;
        const skVC = BigInt(nameLen + idVal); 
        
        const pkPoint = babyJub.mulPointEscalar(babyJub.Base8, skVC);
        
        const pkVCx = F.toObject(pkPoint[0]).toString();
        const pkVCy = F.toObject(pkPoint[1]).toString();

        const vcAttributes = [
            textToInt(scenario.voter.name),
            textToInt(scenario.voter.surname),
            textToInt(scenario.voter.address),
            BigInt(scenario.voter.city).toString(),
            BigInt(scenario.voter.district).toString(),
            BigInt(scenario.voter.region).toString(),
            BigInt(scenario.voter.country).toString(),
            BigInt(scenario.voter.dob).toString()
        ];

        const inputsForHash = [...vcAttributes, pkVCx, pkVCy]; 
        const vcHash = poseidon(inputsForHash);

        const signature = eddsa.signPoseidon(authPrivKey, vcHash);

        const inputCircuit = {
            "vcAttributes": vcAttributes,
            "skVC": skVC.toString(),
            
            "sigR8x": F.toObject(signature.R8[0]).toString(),
            "sigR8y": F.toObject(signature.R8[1]).toString(),
            "sigS": signature.S.toString(),
            
            "pkAx": F.toObject(authPubKey[0]).toString(),
            "pkAy": F.toObject(authPubKey[1]).toString(),
            
            "pkVCx": pkVCx,
            "pkVCy": pkVCy,
            
            "allowedCity": data.filteringCriteria.allowedCity.toString(),
            "allowedRegion": data.filteringCriteria.allowedRegion.toString(),
            "minBirthDate": data.filteringCriteria.minBirthDate.toString(),
            
            "ethAddress": "12345678901234567890", 
            "electionId": "1"
        };

        const filename = `input_${scenario.id}.json`;
        fs.writeFileSync(filename, JSON.stringify(inputCircuit, null, 2));
        console.log(`- Generated: ${filename} (${scenario.name})`);
    }
}

main();