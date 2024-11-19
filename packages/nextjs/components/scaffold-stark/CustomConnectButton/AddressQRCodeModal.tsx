import { QRCodeSVG } from "qrcode.react";
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
  return (
    <>
      <div>
        <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
        <label htmlFor={`${modalId}`} className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="absolute left-0 top-0 h-0 w-0" />
            <label
              htmlFor={`${modalId}`}
              className="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
            >
              ✕
            </label>
            <div className="space-y-3 py-6">
              <div className="flex flex-col items-center gap-6 space-x-4">
                <QRCodeSVG value={address} size={256} />
                <Address address={address} format="short" disableAddressLink />
              </div>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
