import { ethers } from 'ethers';
import { NETWORKS, CONTRACT_ABI, CONTRACT_BYTECODE } from './config';
import { wrapEthersSigner } from '@oasisprotocol/sapphire-ethers-v6';

export interface ElectionData {
    electionId: string;
    isActive: boolean;
    endTime: string;
    region: string;
    city: string;
    totalVotes: number;
    results: number[];
}

export async function switchNetwork(networkType: 'testnet' | 'mainnet') {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const targetNetwork = NETWORKS[networkType];

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork.chainId }],
        });
    } catch (switchError: any) {
        // Error 4902: Chain not added yet
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [targetNetwork],
            });
        } else {
            throw switchError;
        }
    }
}

interface DeployArgs {
    verifierAddress: string;
    numCandidates: string;
    durationSeconds: string;
    cityCode: string;
    regionCode: string;
    birthDateInt: string;
    electionId: string;
}

export async function deployVotingContract(
    signer: ethers.Signer,
    args: DeployArgs
): Promise<string> {

    const sapphireSigner = wrapEthersSigner(signer);

    const factory = new ethers.ContractFactory(
        CONTRACT_ABI,
        CONTRACT_BYTECODE,
        sapphireSigner
    );

    console.log("Deploying contract with args:", args);

    const contract = await factory.deploy(
        args.verifierAddress,
        args.numCandidates,
        args.durationSeconds,
        args.cityCode,
        args.regionCode,
        args.birthDateInt,
        args.electionId
    );

    await contract.waitForDeployment();

    return await contract.getAddress();
}

export function getVotingContract(contractAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    let runner = signerOrProvider;

    return new ethers.Contract(contractAddress, CONTRACT_ABI, runner);
}

export async function castVote(
    signer: ethers.Signer,
    contractAddress: string,
    proof: any,
    publicSignals: any,
    candidateId: number
) {
    const sapphireSigner = wrapEthersSigner(signer);

    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, sapphireSigner);

    console.log(proof)
    const pA = [proof.pi_a[0], proof.pi_a[1]];
    const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
    ];
    const pC = [proof.pi_c[0], proof.pi_c[1]];
    
    console.log("Submitting Vote Transaction...");

    const tx = await contract.vote(pA, pB, pC, publicSignals, candidateId);

    console.log("Tx Hash:", tx.hash);
    await tx.wait();

    return tx.hash;
}

export async function fetchElectionResults(contractAddress: string, signer: ethers.Signer,): Promise<ElectionData> {
    if (!window.ethereum) throw new Error("MetaMask not found");
    
    const sapphireSigner = wrapEthersSigner(signer);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, sapphireSigner);

    const electionId = await contract.ELECTION_ID();
    const regionHash = await contract.ALLOWED_REGION();
    const cityHash = await contract.ALLOWED_CITY();
    const endTimeBigInt = await contract.electionEndTime();
    
    const endTimeDate = new Date(Number(endTimeBigInt) * 1000);
    const now = new Date();
    const isActive = now < endTimeDate;

    let results: number[] = [];

    if (!isActive) {
        try {
            const rawResults = await contract.getAllResults();
            results = rawResults.map((v: any) => Number(v));
        } catch (e) {
            console.warn("Could not fetch results (maybe contract reverted?):", e);
            results = [];
        }
    }

    const totalVotes = results.reduce((a, b) => a + b, 0);

    return {
        electionId: electionId.toString(),
        isActive: isActive,
        endTime: endTimeDate.toLocaleString('cs-CZ'),
        region: regionHash.toString(),
        city: cityHash.toString(),
        totalVotes: totalVotes,
        results: results
    };
}