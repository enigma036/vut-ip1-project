import { useState } from 'react';
import { MapPin, Calendar, Users, Loader2, Network } from 'lucide-react';
import { ethers } from 'ethers';

import { textToNumericCode, formatDateToInt } from '../utils/helpers';
import { switchNetwork, deployVotingContract } from '../utils/blockchain';
import { VERIFIER_ADDRESS } from '../utils/config';

import DeploymentSuccessModal from '../components/DeploymentSuccessModal';

export default function DeployPage() {
    const [formData, setFormData] = useState({
        region: '',
        city: '',
        duration: '',
        candidates: '',
        minBirthDate: ''
    });

    const [networkType, setNetworkType] = useState<'testnet' | 'mainnet'>('testnet');
    const [isDeploying, setIsDeploying] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<{
        address: string;
        endTime: Date;
        zkConfig: any;
    } | null>(null);

    const handleSubmit = async () => {
        if (!window.ethereum) return alert("Please install MetaMask");

        setIsDeploying(true);

        try {
            setStatusMessage(`Switching to Oasis Sapphire ${networkType}...`);
            await switchNetwork(networkType);

            setStatusMessage("Preparing transaction...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const generatedElectionId = Math.floor(Date.now() / 1000).toString();

            const cityCode = textToNumericCode(formData.city);
            const regionCode = textToNumericCode(formData.region);
            const birthDateInt = formatDateToInt(formData.minBirthDate);
            const durationMins = parseInt(formData.duration);

            const deployArgs = {
                verifierAddress: VERIFIER_ADDRESS,
                numCandidates: formData.candidates,
                durationSeconds: (durationMins * 60).toString(),
                cityCode: cityCode,
                regionCode: regionCode,
                birthDateInt: birthDateInt,
                electionId: generatedElectionId
            };

            setStatusMessage("Confirm transaction in MetaMask...");
            const address = await deployVotingContract(signer, deployArgs);

            console.log("Deployed at:", address);

            const calculatedEndTime = new Date(Date.now() + durationMins * 60 * 1000);

            const zkConfigJSON = {
                contractAddress: address,
                electionId: generatedElectionId,
                allowedCity: formData.city,
                allowedRegion: formData.region,
                minBirthDate: formData.minBirthDate,
                _intFormat: {
                    city: cityCode,
                    region: regionCode,
                    minDob: birthDateInt
                }
            };

            setModalData({
                address: address,
                endTime: calculatedEndTime,
                zkConfig: zkConfigJSON
            });

            setIsDeploying(false);
            setStatusMessage("");
            setShowModal(true);

            setFormData({ region: '', city: '', duration: '', candidates: '', minBirthDate: '' });

        } catch (error: any) {
            console.error("Deployment failed:", error);
            setIsDeploying(false);
            if (error.code === 'ACTION_REJECTED') {
                setStatusMessage("Transaction rejected by user.");
                setTimeout(() => setStatusMessage(""), 2000);
            } else {
                alert("Error: " + (error.reason || error.message));
            }
        }
    };

    const isFormValid = formData.region && formData.city && formData.duration && formData.candidates && formData.minBirthDate;

    return (
        <>
            <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
                <div className="w-full max-w-xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-light text-zinc-900">
                                Deploy Contract
                            </h1>
                        </div>
                    </div>

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

                    {/* Main Form Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200">
                        <div className="p-8 space-y-6">

                            {/* Region & City Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <MapPin className="w-4 h-4 text-zinc-400" /> Region
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        placeholder="Region"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <MapPin className="w-4 h-4 text-zinc-400" /> City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Duration Input */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                    <Calendar className="w-4 h-4 text-zinc-400" /> Duration (mins)
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <Users className="w-4 h-4 text-zinc-400" /> Candidates
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.candidates}
                                        onChange={(e) => setFormData({ ...formData, candidates: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                                        <Calendar className="w-4 h-4 text-zinc-400" /> Min Birth Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.minBirthDate}
                                        onChange={(e) => setFormData({ ...formData, minBirthDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                            </div>

                            {/* Deploy Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isDeploying}
                                className={`w-full py-3.5 rounded-lg font-medium text-sm transition-all ${isDeploying
                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                        : isFormValid
                                            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                    }`}
                            >
                                {isDeploying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> {statusMessage || 'Deploying...'}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4" /> Deploy
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {modalData && (
                <DeploymentSuccessModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    contractAddress={modalData.address}
                    electionEndTime={modalData.endTime}
                    zkConfig={modalData.zkConfig}
                />
            )}
        </>
    );
}