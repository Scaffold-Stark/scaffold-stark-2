import { useCallback, useEffect, useState } from "react";
import {
  CommonInputProps,
  InputBase,
  isValidInteger,
} from "~~/components/scaffold-stark";
import { parseEther } from "ethers";

type IntegerInputProps = CommonInputProps<string | bigint> & {
  variant?: string;
  disableMultiplyBy1e18?: boolean;
};

export const IntegerInput = ({
  value,
  onChange,
  name,
  placeholder,
  disabled,
  variant = "core::integer::u256",
  disableMultiplyBy1e18 = false,
}: IntegerInputProps) => {
  const [inputError, setInputError] = useState(false);
  const multiplyBy1e18 = useCallback(() => {
    if (!value) {
      return;
    }

    return inputError
      ? onChange(value)
      : onChange(parseEther(value.toString()).toString());
  }, [onChange, value, inputError]);

  useEffect(() => {
    setInputError(!isValidInteger(variant, value));
  }, [value, variant]);

  return (
    <InputBase
      name={name}
      value={value}
      placeholder={placeholder}
      error={inputError}
      onChange={onChange}
      disabled={disabled}
      suffix={
        !inputError &&
        !disableMultiplyBy1e18 && (
          <div
            className="space-x-4 flex tooltip tooltip-top tooltip-secondary before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            data-tip="Multiply by 10^18 (wei)"
          >
            <button
              className={`${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              } font-semibold px-4 text-accent`}
              onClick={multiplyBy1e18}
              disabled={disabled}
            >
              ∗
            </button>
          </div>
        )
      }
    />
  );
};
