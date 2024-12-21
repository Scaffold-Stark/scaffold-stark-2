import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { getFunctionInputKey, getInitialTupleFormState } from "./utilsContract";
import {
  AbiEnum,
  AbiParameter,
  AbiStruct,
} from "~~/utils/scaffold-stark/contract";
import { replacer } from "~~/utils/scaffold-stark/common";
import { ContractInput } from "./ContractInput";
import { Abi } from "abi-wan-kanabi";
import { parseGenericType } from "~~/utils/scaffold-stark";
import { FormErrorMessageState } from "./utilsDisplay";

type ArrayProps = {
  abi: Abi;
  abiParameter: AbiParameter;
  parentForm: Record<string, any> | undefined;
  setParentForm: (form: Record<string, any>) => void;
  parentStateObjectKey: string;
  setFormErrorMessage: Dispatch<SetStateAction<FormErrorMessageState>>;
  isDisabled?: boolean;
};

export const ArrayInput = ({
  abi,
  parentForm,
  setParentForm,
  parentStateObjectKey,
  abiParameter,
  setFormErrorMessage,
  isDisabled,
}: ArrayProps) => {
  // array in object representation
  const [inputArr, setInputArr] = useState<any>({});
  const [arrLength, setArrLength] = useState<number>(-1);

  const elementType = useMemo(() => {
    const parsed = parseGenericType(abiParameter.type);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  }, [abiParameter.type]);

  // side effect to transform data before setState
  useEffect(() => {
    // non empty objects only
    setParentForm({
      ...parentForm,
      [parentStateObjectKey]: Object.values(inputArr).filter(
        (item) => item !== null,
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(inputArr, replacer)]);

  return (
    <div>
      <div className="custom-after collapse border-2 border-secondary bg-base-200 pb-2 pl-4 pt-1.5">
        <input type="checkbox" className="peer min-h-fit" />
        <div className="collapse-title min-h-fit p-0 text-primary-content/50 peer-checked:mb-2">
          <p className="m-0 p-0 text-[1rem]">array (length: {arrLength + 1})</p>
        </div>
        <div className="collapse-content ml-3 flex-col space-y-4 border-l-2 border-secondary/80 pl-4">
          {/*  do note here that the "index" are basically array keys */}
          {Object.keys(inputArr).map((index) => {
            return (
              <ContractInput
                abi={abi}
                key={index}
                isDisabled={isDisabled}
                setForm={(
                  nextInputRecipe:
                    | Record<string, any>
                    | ((arg: Record<string, any>) => void),
                ) => {
                  // if we find a function (a.k.a setState recipe), we run it to generate the next state based on recpe, else just use the object passed in
                  const nextInputObject: Record<string, any> =
                    typeof nextInputRecipe === "function"
                      ? nextInputRecipe(parentForm!)
                      : nextInputRecipe;

                  setInputArr((currentInputArray: any) => {
                    return {
                      ...currentInputArray,
                      [index]: nextInputObject?.[index] || null,
                    };
                  });
                }}
                form={inputArr}
                stateObjectKey={index}
                paramType={
                  {
                    name: `${abiParameter.name}[${index}]`,
                    type: elementType,
                  } as AbiParameter
                }
                setFormErrorMessage={setFormErrorMessage}
              />
            );
          })}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const nextLength = arrLength + 1;
                setInputArr((prev: any) => ({
                  ...prev,
                  [nextLength]: null,
                }));
                setArrLength(nextLength);
              }}
              className="btn btn-sm border border-success text-white shadow-none"
            >
              + Add (push)
            </button>
            <button
              className="btn btn-sm border border-error text-white shadow-none"
              onClick={() => {
                if (arrLength > -1) {
                  const nextInputArr = { ...inputArr };
                  delete nextInputArr[arrLength];
                  setInputArr(nextInputArr);
                  setArrLength((prev) => prev - 1);
                }
              }}
            >
              - Remove (pop)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
