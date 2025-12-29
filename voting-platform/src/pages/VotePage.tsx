import { useState } from 'react';
import { User, FileKey, Vote, Loader2, ShieldCheck, MapPin, Calendar, Building2, Hash, CheckCircle2, Network } from 'lucide-react';
import usersData from '../data/users.json';
import { generateVotingProof } from '../utils/zk';
import { castVote, switchNetwork } from '../utils/blockchain';
import { ethers } from 'ethers';

export default function VotePage() {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [networkType, setNetworkType] = useState<'testnet' | 'mainnet'>('testnet');

    const [electionCriteria, setElectionCriteria] = useState({
        electionId: '',
        region: '',
        city: '',
        minBirthDate: ''
    });

    const [voteData, setVoteData] = useState({
        contractAddress: '',
        candidateId: ''
    });

    // Process states
    const [isGeneratingProof, setIsGeneratingProof] = useState(false);
    const [zkArtifacts, setZkArtifacts] = useState<{ proof: any, publicSignals: any } | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [txHash, setTxHash] = useState('');

    const handleGenerateProof = async () => {
        if (!selectedUserId || !electionCriteria.electionId || !electionCriteria.region ||
            !electionCriteria.minBirthDate) return;

        setIsGeneratingProof(true);
        setZkArtifacts(null);

        try {
            const user = usersData.find((u: any) => u.id.toString() === selectedUserId);
            if (!user) throw new Error("User not found");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const result = await generateVotingProof(
                user,
                electionCriteria,
                address
            );

            setZkArtifacts(result);

        } catch (error: any) {
            console.error(error);
            alert("Proof Generation Failed: " + error.message);
        } finally {
            setIsGeneratingProof(false);
        }
    };

    const handleVote = async () => {
        if (!zkArtifacts || !voteData.contractAddress || !voteData.candidateId) return;

        setIsVoting(true);
        setTxHash('');

        try {
            await switchNetwork(networkType);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const hash = await castVote(
                signer,
                voteData.contractAddress,
                zkArtifacts.proof,
                zkArtifacts.publicSignals,
                parseInt(voteData.candidateId)
            );

            setTxHash(hash);

            setZkArtifacts(null);

        } catch (error: any) {
            console.error("Voting Error:", error);
            // Handle specific Metamask errors
            if (error.code === 'ACTION_REJECTED') {
                alert("Transaction rejected by user.");
            } else {
                alert("Voting Failed: " + (error.reason || error.message));
            }
        } finally {
            setIsVoting(false);
        }
    };

    const isCriteriaValid = selectedUserId && electionCriteria.electionId && electionCriteria.region && electionCriteria.city && electionCriteria.minBirthDate;
    const isVoteFormValid = zkArtifacts && voteData.contractAddress && voteData.candidateId;

    return (
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
            <div className="w-full max-w-xl">
                {/* Network Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 mb-6 p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-3">
                        <Network className="w-4 h-4 text-zinc-400" />
                        Select Network
                    </label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setNetworkType('testnet')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${networkType === 'testnet'
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                }`}
                        >
                            Sapphire Testnet
                        </button>
                        <button
                            onClick={() => setNetworkType('mainnet')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${networkType === 'mainnet'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                }`}
                        >
                            Sapphire Mainnet
                        </button>
                    </div>
                </div>


                <div className="mb-8">
                    <h1 className="text-3xl font-light text-zinc-900 mb-2">Cast Your Vote</h1>
                    <p className="text-zinc-500">Private voting using Zero-Knowledge Proofs on Oasis Sapphire.</p>
                </div>

                <div className="space-y-6">

                    {/* Identity & Proof Generation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Step 1: Generate Proof</span>
                            {zkArtifacts && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>

                        <div className="p-8 space-y-6">

                            {/* Identity Selection */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <User className="w-4 h-4 text-zinc-400" /> Select Identity
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none"
                                    >
                                        <option value="" disabled>-- Select User from users.json --</option>
                                        {usersData.map((user: any) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} (ID: {user.id}) - {user.address.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <hr className="border-zinc-100" />

                            {/* Public Inputs (Criteria) */}
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <Hash className="w-4 h-4 text-zinc-400" /> Election ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Paste Election ID here..."
                                        value={electionCriteria.electionId}
                                        onChange={(e) => setElectionCriteria({ ...electionCriteria, electionId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                            <MapPin className="w-4 h-4 text-zinc-400" /> Region
                                        </label>
                                        <input
                                            type="text"
                                            value={electionCriteria.region}
                                            onChange={(e) => setElectionCriteria({ ...electionCriteria, region: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                            <Building2 className="w-4 h-4 text-zinc-400" /> City
                                        </label>
                                        <input
                                            type="text"
                                            value={electionCriteria.city}
                                            onChange={(e) => setElectionCriteria({ ...electionCriteria, city: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <Calendar className="w-4 h-4 text-zinc-400" /> Min Birth Date
                                    </label>
                                    <input
                                        type="date"
                                        value={electionCriteria.minBirthDate}
                                        onChange={(e) => setElectionCriteria({ ...electionCriteria, minBirthDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateProof}
                                disabled={!isCriteriaValid || isGeneratingProof || !!zkArtifacts}
                                className={`w-full py-3.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${zkArtifacts
                                        ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                        : isGeneratingProof
                                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                            : isCriteriaValid
                                                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                    }`}
                            >
                                {isGeneratingProof ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Generating ZK Proof...
                                    </>
                                ) : zkArtifacts ? (
                                    <>
                                        <ShieldCheck className="w-4 h-4" /> Proof Generated Ready
                                    </>
                                ) : (
                                    <>
                                        <FileKey className="w-4 h-4" /> Generate zk-SNARK Proof
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Voting */}
                    <div className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden transition-all duration-500 ${zkArtifacts ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none grayscale'}`}>
                        <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100">
                            <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Step 2: Submit to Blockchain</span>
                        </div>

                        <div className="p-8 space-y-6">

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <FileKey className="w-4 h-4 text-zinc-400" /> Contract Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={voteData.contractAddress}
                                    onChange={(e) => setVoteData({ ...voteData, contractAddress: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <Vote className="w-4 h-4 text-zinc-400" /> Candidate ID (Index)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 0, 1, 2..."
                                    value={voteData.candidateId}
                                    onChange={(e) => setVoteData({ ...voteData, candidateId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                />
                            </div>

                            {txHash && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 break-all">
                                    <strong>Success!</strong> Tx Hash: {txHash}
                                </div>
                            )}

                            <button
                                onClick={handleVote}
                                disabled={!isVoteFormValid || isVoting}
                                className={`w-full py-3.5 rounded-lg font-medium text-sm transition-all ${isVoting
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                        : isVoteFormValid
                                            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                    }`}
                            >
                                {isVoting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Confirming Transaction...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Vote className="w-4 h-4" /> Cast Vote
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}