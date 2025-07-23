import { useEffect, useMemo, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import {
  CommonInputProps,
  InputBase,
  SIGNED_NUMBER_REGEX,
} from "~~/components/scaffold-stark";
import { useGlobalState } from "~~/services/store/store";

const MAX_DECIMALS_USD = 2;

function starkValueToDisplayValue(
  usdMode: boolean,
  starkValue: string,
  currencyPrice: number,
) {
  if (usdMode && currencyPrice) {
    const parsedStrkValue = parseFloat(starkValue);
    if (Number.isNaN(parsedStrkValue)) {
      return starkValue;
    } else {
      // We need to round the value rather than use toFixed,
      // since otherwise a user would not be able to modify the decimal value
      return (
        Math.round(parsedStrkValue * currencyPrice * 10 ** MAX_DECIMALS_USD) /
        10 ** MAX_DECIMALS_USD
      ).toString();
    }
  } else {
    return starkValue;
  }
}

function displayValueTostarkValue(
  usdMode: boolean,
  displayValue: string,
  currencyPrice: number,
) {
  if (usdMode && currencyPrice) {
    const parsedDisplayValue = parseFloat(displayValue);
    if (Number.isNaN(parsedDisplayValue)) {
      // Invalid number.
      return displayValue;
    } else {
      // Compute the STRK value if a valid number.
      return (parsedDisplayValue / currencyPrice).toString();
    }
  } else {
    return displayValue;
  }
}

/**
 * Input for STRK amount with USD conversion.
 *
 * onChange will always be called with the value in STRK
 */
export const StarkInput = ({
  value,
  name,
  placeholder,
  onChange,
  disabled,
  usdMode,
}: CommonInputProps & { usdMode?: boolean }) => {
  const [transitoryDisplayValue, setTransitoryDisplayValue] =
    useState<string>();
  const currencyPrice = useGlobalState((state) => state.nativeCurrencyPrice);
  const [internalUsdMode, setInternalUSDMode] = useState(
    currencyPrice > 0 ? Boolean(usdMode) : false,
  );

  useEffect(() => {
    setInternalUSDMode(currencyPrice > 0 ? Boolean(usdMode) : false);
  }, [usdMode, currencyPrice]);

  const displayValue = useMemo(() => {
    const newDisplayValue = starkValueToDisplayValue(
      internalUsdMode,
      value,
      currencyPrice,
    );
    if (
      transitoryDisplayValue &&
      parseFloat(newDisplayValue) === parseFloat(transitoryDisplayValue)
    ) {
      return transitoryDisplayValue;
    }
    // Clear any transitory display values that might be set
    setTransitoryDisplayValue(undefined);
    return newDisplayValue;
  }, [currencyPrice, transitoryDisplayValue, internalUsdMode, value]);

  const handleChangeNumber = (newValue: string) => {
    if (newValue && !SIGNED_NUMBER_REGEX.test(newValue)) {
      return;
    }

    if (internalUsdMode) {
      const decimals = newValue.split(".")[1];
      if (decimals && decimals.length > MAX_DECIMALS_USD) {
        return;
      }
    }

    if (newValue.endsWith(".") || newValue.endsWith(".0")) {
      setTransitoryDisplayValue(newValue);
    } else {
      setTransitoryDisplayValue(undefined);
    }

    const newStrkValue = displayValueTostarkValue(
      internalUsdMode,
      newValue,
      currencyPrice,
    );
    onChange(newStrkValue);
  };

  const toggleMode = () => {
    if (currencyPrice > 0) {
      setInternalUSDMode(!internalUsdMode);
    }
  };

  return (
    <InputBase
      name={name}
      value={displayValue}
      placeholder={placeholder}
      onChange={handleChangeNumber}
      disabled={disabled}
      prefix={
        <span className="pl-4 mr-2 text-accent self-center">
          {internalUsdMode ? "$" : "Ξ"}
        </span>
      }
      suffix={
        <div
          className={`${
            currencyPrice > 0
              ? ""
              : "tooltip tooltip-secondary before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
          }`}
          data-tip="Unable to fetch price"
        >
          <button
            className="btn btn-primary h-8 min-h-8 mt-[.1rem]"
            onClick={toggleMode}
            disabled={!internalUsdMode && !currencyPrice}
          >
            <ArrowsRightLeftIcon
              className="h-3 w-3 cursor-pointer"
              aria-hidden="true"
            />
          </button>
        </div>
      }
    />
  );
};
