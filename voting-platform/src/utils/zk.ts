import * as snarkjs from 'snarkjs';
import { textToNumericCode, formatDateToInt } from './helpers';
import { signVerifiableCredential } from './authority';

const WASM_PATH = "/zk/voting.wasm";
const ZKEY_PATH = "/zk/voting_final.zkey";

export interface ProofResult {
    proof: any;
    publicSignals: any;
}

export async function generateVotingProof(
    userData: any,
    electionCriteria: any,
    contractAddress: string
): Promise<ProofResult> {
    
    const pkVCx = BigInt(userData.keys.pk[0]);
    const pkVCy = BigInt(userData.keys.pk[1]);

    const vcAttributes = new Array(8).fill(BigInt(0));
    vcAttributes[0] = BigInt(userData.id);
    vcAttributes[3] = BigInt(textToNumericCode(userData.address.city));
    vcAttributes[5] = BigInt(textToNumericCode(userData.address.region));
    
    if (userData.birthDateInt) {
        vcAttributes[7] = BigInt(userData.birthDateInt);
    } else {
        vcAttributes[7] = BigInt(formatDateToInt(userData.birthDate));
    }

    const signature = await signVerifiableCredential(
        vcAttributes, 
        pkVCx, 
        pkVCy
    );

    const requiredRegionCode = BigInt(textToNumericCode(electionCriteria.region));
    const requiredCityCode = BigInt(textToNumericCode(electionCriteria.city));
    const minBirthDateInt = BigInt(formatDateToInt(electionCriteria.minBirthDate));
    const ethAddressBigInt = BigInt(contractAddress);
    const electionIdBigInt = BigInt(electionCriteria.electionId);

    const inputSignals = {
        vcAttributes: vcAttributes.map(x => x.toString()),
        
        sigR8x: signature.R8x,
        sigR8y: signature.R8y,
        sigS: signature.S,

        pkAx: signature.Ax,
        pkAy: signature.Ay,
        pkVCx: pkVCx.toString(),
        pkVCy: pkVCy.toString(),

        allowedCity: requiredCityCode.toString(),
        allowedRegion: requiredRegionCode.toString(),
        minBirthDate: minBirthDateInt.toString(),

        ethAddress: ethAddressBigInt.toString(),
        electionId: electionIdBigInt.toString()
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputSignals,
        WASM_PATH,
        ZKEY_PATH
    );

    console.log("Public signals:", publicSignals);
        
    return { proof, publicSignals };
}