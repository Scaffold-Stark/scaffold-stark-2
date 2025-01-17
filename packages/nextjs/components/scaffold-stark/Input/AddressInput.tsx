import { useCallback } from "react";
import { blo } from "blo";
import { useDebounceValue } from "usehooks-ts";
import { CommonInputProps, InputBase } from "~~/components/scaffold-stark";
import { Address } from "@starknet-react/chains";
import { isAddress } from "~~/utils/scaffold-stark/common";
import Image from "next/image";

/**
 * Address input with ENS name resolution
 */
export const AddressInput = ({
  value,
  name,
  placeholder,
  onChange,
  disabled,
}: CommonInputProps<Address | string>) => {
  // TODO : Add Starkname functionality here with cached profile, check ENS on scaffold-eth
  const [_debouncedValue] = useDebounceValue(value, 500);

  const handleChange = useCallback(
    (newValue: Address) => {
      const sanitizedValue = newValue.toLowerCase();

      if (sanitizedValue === "0x") {
        onChange("0x0" as Address);
        return;
      }

      const isValid =
        /^(0x)([a-fA-F0-9]{40})$/.test(sanitizedValue) &&
        !/0x.*0x/.test(sanitizedValue);
      if (!isValid) {
        return;
      }

      if (sanitizedValue.length !== 42) {
        return;
      }

      onChange(newValue);
    },
    [onChange],
  );

  return (
    <InputBase<Address>
      name={name}
      placeholder={placeholder}
      value={value as Address}
      onChange={handleChange}
      disabled={disabled}
      prefix={null}
      suffix={
        // eslint-disable-next-line @next/next/no-img-element
        value && (
          <Image
            alt=""
            className="!rounded-full"
            src={blo(value as `0x${string}`)}
            width="35"
            height="35"
          />
        )
      }
    />
  );
};
