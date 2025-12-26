import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar, { type TabId } from './components/Navbar';
import DeployPage from './pages/DeployPage';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('deploy');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);

    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].address);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onConnectWallet={connectWallet}
        walletAddress={walletAddress}
      />

      <main>
        {activeTab === 'deploy' && <DeployPage />}
        {activeTab === 'vote' && <VotePage />}
        {activeTab === 'results' && <ResultsPage />}
      </main>
    </div>
  );
}