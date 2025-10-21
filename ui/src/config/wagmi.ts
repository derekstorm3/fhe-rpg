import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Wallet connections may fail.');
}

export const config = getDefaultConfig({
  appName: 'FHE Quiz',
  projectId: projectId || 'placeholder-project-id',
  chains: [sepolia],
  ssr: false,
});
