import { Button, ContextMenu } from "@radix-ui/themes";
import FaucetMenu from "./FaucetMenu";
import ConnectModal from "./wallet/ConnectModal";
import ConnectWalletButton from "./wallet2/ConnectWalletButton";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-primary text-neutral">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold"> 🏗️ Scaffold-STRK</h1>

        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="/debug">Debug</a>
            </li>
            <li>
              <a href="/contracts">Contracts</a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        {/* 
        <ConnectWalletButton />
        */}
        <FaucetMenu />
      </div>
    </header>
  );
}
