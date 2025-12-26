import { useState } from 'react';
import { Search, BarChart3, Loader2, AlertCircle, Clock, Hash, Lock } from 'lucide-react';
import { fetchElectionResults, type ElectionData } from '../utils/blockchain';
import { ethers } from 'ethers';

export default function ResultsPage() {
    const [contractAddress, setContractAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [data, setData] = useState<ElectionData | null>(null);

    const handleFetchResults = async () => {
        if (!contractAddress) return;

        setIsLoading(true);
        setError('');
        setData(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const result = await fetchElectionResults(contractAddress, signer);
            setData(result);
        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch data. Check contract address and network.");
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePercentage = (votes: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((votes / total) * 100);
    };

    return (
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
            <div className="w-full max-w-xl space-y-6">

                <div className="text-center md:text-left mb-8">
                    <h1 className="text-3xl font-light text-zinc-900 mb-2">Election Results</h1>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-2">
                    <div className="flex items-center gap-2 p-2">
                        <div className="pl-2">
                            <Search className="w-5 h-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Contract Address (0x...)"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            className="flex-1 px-2 py-2 bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none font-mono text-sm"
                        />
                        <button
                            onClick={handleFetchResults}
                            disabled={!contractAddress || isLoading}
                            className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all min-w-[100px] flex justify-center"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Result Card */}
                {data && (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                        {/* Election Info */}
                        <div className="bg-zinc-50 border-b border-zinc-100 p-6">

                            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 ${data.isActive
                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${data.isActive ? 'bg-blue-500 animate-pulse' : 'bg-zinc-400'}`} />
                                    {data.isActive ? 'Voting In Progress' : 'Election Ended'}
                                </div>

                                <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono">
                                    <Clock className="w-4 h-4" />
                                    {data.endTime}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div className="bg-white border border-zinc-200 px-4 py-3 rounded-xl">
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                                        Election ID
                                    </span>
                                    <div className="flex items-center gap-2 text-zinc-900 font-mono text-sm break-all">
                                        <Hash className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        {data.electionId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="p-8">

                            {data.isActive ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                        <Lock className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="text-lg text-zinc-900 font-medium mb-2">Results are Encrypted</h3>
                                    <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                                        This election is currently active. The vote tally is hidden on-chain. Results will be revealed automatically when the election ends.
                                    </p>
                                </div>
                            ) : (
    
                                <div className="space-y-8">

                                    <div className="flex items-center gap-2 text-sm text-zinc-500 pb-4 border-b border-zinc-100">
                                        <BarChart3 className="w-4 h-4" />
                                        Total Votes Cast: <span className="font-semibold text-zinc-900 text-base">{data.totalVotes}</span>
                                    </div>

                                    <div className="space-y-6">
                                        {data.results.map((votes, index) => {
                                            const candidateId = index + 1;
                                            const percentage = calculatePercentage(votes, data.totalVotes);

                                            return (
                                                <div key={index} className="group">
                                                    <div className="flex items-end justify-between mb-2">
                                                        <span className="font-medium text-zinc-900 text-sm">
                                                            Candidate #{candidateId}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="block text-sm font-bold text-zinc-900">{percentage}%</span>
                                                            <span className="block text-xs text-zinc-400 font-mono">{votes} votes</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-zinc-100 rounded-md h-4 overflow-hidden border border-zinc-100">
                                                        <div
                                                            className="h-full bg-zinc-800 rounded-sm transition-all duration-1000 ease-out"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {data.results.length === 0 && (
                                            <div className="text-center text-zinc-400 italic text-sm">
                                                No results found (0 votes or error reading data).
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}