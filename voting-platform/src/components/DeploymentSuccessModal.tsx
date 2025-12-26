import { FileJson, Clock, CheckCircle2 } from 'lucide-react';

interface DeploymentSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractAddress: string;
    electionEndTime: Date;
    zkConfig: {
        electionId: string;
        allowedCity: string;
        allowedRegion: string;
        minBirthDate: string;
    };
}

export default function DeploymentSuccessModal({
    isOpen,
    onClose,
    contractAddress,
    electionEndTime,
    zkConfig
}: DeploymentSuccessModalProps) {
    if (!isOpen) return null;

    const formattedDate = new Intl.DateTimeFormat('cs-CZ', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    }).format(electionEndTime);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-green-50 p-6 flex items-start justify-between border-b border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-green-900">Election Deployed!</h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">

                    {/* Contract Address Section */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                            Contract Address
                        </label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-lg font-mono text-sm text-zinc-700 break-all">
                                {contractAddress}
                            </code>
                        </div>
                    </div>

                    {/* Election Info Row */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div className="text-sm">
                            <span className="font-semibold">Election Ends:</span> {formattedDate}
                        </div>
                    </div>

                    {/* ZK Config JSON Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <FileJson className="w-4 h-4" />
                                ZK Proof Configuration
                            </label>
                            <span className="text-xs text-zinc-400">Copy this for the voting client</span>
                        </div>
                        <div className="relative group">
                            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
                                {JSON.stringify(zkConfig, null, 2)}
                            </pre>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}