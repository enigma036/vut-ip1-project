import { buildEddsa, buildBabyjub, buildPoseidon } from 'circomlibjs';

const AUTHORITY_PRIVATE_KEY_HEX = "0001020304050607080900010203040506070809000102030405060708090001";

function hexToUint8Array(hexString: string): Uint8Array {
    const arrayBuffer = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        arrayBuffer[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return arrayBuffer;
}

export interface VCSignatureResult {
    Ax: string;
    Ay: string;
    R8x: string;
    R8y: string;
    S: string;
}

export async function signVerifiableCredential(
    vcAttributes: bigint[], 
    pkVCx: bigint, 
    pkVCy: bigint
): Promise<VCSignatureResult> {
    const eddsa = await buildEddsa();
    const babyJub = await buildBabyjub();
    const poseidon = await buildPoseidon();

    if (vcAttributes.length !== 8) {
        throw new Error("vcAttributes must have exactly 8 elements");
    }

    const inputs = [...vcAttributes, pkVCx, pkVCy];
    
    const credentialHash = poseidon(inputs);

    const prvKeyAuth = hexToUint8Array(AUTHORITY_PRIVATE_KEY_HEX);
    const signature = eddsa.signPoseidon(prvKeyAuth, credentialHash);
    const pubKeyAuth = eddsa.prv2pub(prvKeyAuth);

    return {
        Ax: babyJub.F.toString(pubKeyAuth[0]),
        Ay: babyJub.F.toString(pubKeyAuth[1]),
        R8x: babyJub.F.toString(signature.R8[0]),
        R8y: babyJub.F.toString(signature.R8[1]),
        S: signature.S.toString(),
    };
}