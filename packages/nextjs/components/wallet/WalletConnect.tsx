import {useAccount, useDisconnect} from "@starknet-react/core";
import {useEffect, useRef, useState} from "react";
import ConnectModal from "~~/components/wallet/ConnectModal";

const WalletConnect = () => {
  const {address: connectedAddress} = useAccount();
  const {disconnect} = useDisconnect();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(connectedAddress!);
      setIsMenuVisible(false);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleClickOutside = (event: MouseEvent | Event) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuVisible(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsMenuVisible(false);
  }

  const handleWalletConnect = () => {
    if (connectedAddress) {
      toggleMenu();
    } else {
      setModalOpen(true);
    }
  }

  const handleModalClose = () => {
    setModalOpen(false);
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <div ref={menuRef} style={{position: "relative"}}>
      <ConnectModal isOpen={modalOpen} onClose={handleModalClose}/>
      <button
        onClick={handleWalletConnect}
        className="bg-blue-100 font-semibold py-2 px-4 rounded-full w-40"
      >
        {connectedAddress ? `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}` : "Connect Wallet"}
      </button>
      {isMenuVisible && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          backgroundColor: "#fff",
          boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
          padding: "10px",
          borderRadius: "5px"
        }}>
          <ul style={{listStyle: "none", margin: 0, padding: 0}}>
            <li style={{marginBottom: "10px", cursor: "pointer"}} onClick={handleCopyAddress}>Copy Address</li>
            <li style={{cursor: "pointer"}} onClick={handleDisconnect}>Disconnect</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default WalletConnect;