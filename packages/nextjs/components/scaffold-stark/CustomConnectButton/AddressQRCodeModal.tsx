import { useState, useEffect } from "react";
import { Address as AddressType } from "@starknet-react/chains";
import { Address } from "~~/components/scaffold-stark";

type AddressQRCodeModalProps = {
  address: AddressType;
  modalId: string;
};

export const AddressQRCodeModal = ({
  address,
  modalId,
}: AddressQRCodeModalProps) => {
  const [QRCodeSVG, setQRCodeSVG] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen && !QRCodeSVG) {
      // Lazy load QRCodeSVG only when modal is opened
      import("qrcode.react").then((module) => {
        setQRCodeSVG(() => module.QRCodeSVG);
      });
    }
  }, [isModalOpen, QRCodeSVG]);

  const handleModalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsModalOpen(e.target.checked);
  };

  return (
    <>
      <div>
        <input
          type="checkbox"
          id={`${modalId}`}
          className="modal-toggle"
          onChange={handleModalToggle}
        />
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label
              htmlFor={`${modalId}`}
              className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
            >
              ✕
            </label>
            <div className="space-y-3 py-6">
              <div className="flex space-x-4 flex-col items-center gap-6">
                {QRCodeSVG ? (
                  <QRCodeSVG value={address} size={256} />
                ) : (
                  <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center">
                    <span className="text-sm text-gray-500">
                      Loading QR Code...
                    </span>
                  </div>
                )}
                <Address address={address} format="short" disableAddressLink />
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
