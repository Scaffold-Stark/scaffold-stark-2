import { Button, ContextMenu } from "@radix-ui/themes";
import FaucetMenu from "./FaucetMenu";
import ConnectModal from "./wallet/ConnectModal";
import ConnectWalletButton from "./wallet2/ConnectWalletButton";


export default function Header() {
  return (
    
    <header className="flex items-center justify-between p-4  text-neutral">
      <div className="flex items-center space-x-4">
      <img src="/logo.svg" alt="Logo" className="logo w-auto h-12 md:h-16 lg:h-20" />
        <nav className="hidden md:flex">
        <ul className="flex space-x-2 md:space-x-4 btn-lg btn-neutral">

            <li>
              <button className="btn-lg btn-primary-outline">
              <a href="/debug">Debug
              </a>
              </button>
              
            </li>
            <li>
            <button className="btn-lg btn-primary-outline border-primary">
              <a href="/contracts">Contracts</a>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        
        <ConnectWalletButton/>
        
        <FaucetMenu />
      </div>
    </header>
  );
}
