import { Vote, Wallet, } from 'lucide-react';

export type TabId = 'results' | 'deploy' | 'vote';

interface NavbarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onConnectWallet: () => void;
    walletAddress: string | null;
}

export default function Navbar({
    activeTab,
    onTabChange,
    onConnectWallet,
    walletAddress
}: NavbarProps) {

    const formatAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    const NavButton = ({ id, label }: { id: TabId; label: string }) => (
        <button
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
        >
            {label}
        </button>
    );

    return (
        <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => onTabChange('results')}
                    >
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <Vote className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-medium text-zinc-900">Voting Platform</span>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        <NavButton id="results" label="Results" />
                        <NavButton id="deploy" label="Deploy" />
                        <NavButton id="vote" label="Vote" />
                    </div>

                    {walletAddress ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg border border-zinc-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-mono">{formatAddress(walletAddress)}</span>
                        </div>
                    ) : (
                        <button
                            onClick={onConnectWallet}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-all active:scale-95 shadow-sm hover:shadow-md"
                        >
                            <Wallet className="w-4 h-4" />
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}