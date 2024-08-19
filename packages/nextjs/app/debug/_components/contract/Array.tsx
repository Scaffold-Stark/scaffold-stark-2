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

type ArrayProps = {
  abi: Abi;
  abiParameter: AbiParameter;
  parentForm: Record<string, any> | undefined;
  setParentForm: (form: Record<string, any>) => void;
  parentStateObjectKey: string;
  setFormErrorMessage: Dispatch<SetStateAction<string | null>>;
};

export const ArrayInput = ({
  abi,
  parentForm,
  setParentForm,
  parentStateObjectKey,
  abiParameter,
  setFormErrorMessage,
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
      <div className="collapse bg-base-200 pl-4 pt-1.5 pb-2 border-2 border-secondary custom-after">
        <input type="checkbox" className="min-h-fit peer" />
        <div className="collapse-title p-0 min-h-fit peer-checked:mb-2 text-primary-content/50">
          <p className="m-0 p-0 text-[1rem]">array (length: {arrLength + 1})</p>
        </div>
        <div className="ml-3 flex-col space-y-4 border-secondary/80 border-l-2 pl-4 collapse-content">
          {/*  do note here that the "index" are basically array keys */}
          {Object.keys(inputArr).map((index) => {
            return (
              <ContractInput
                abi={abi}
                key={index}
                setForm={(
                  nextInputRecipe:
                    | Record<string, any>
                    | ((arg: Record<string, any>) => void),
                ) => {
                  let nextInputObject: Record<string, any> = nextInputRecipe;

                  // set state recipe function, handle
                  if (typeof nextInputRecipe === "function") {
                    nextInputObject = nextInputRecipe(parentForm!);
                  }

                  const currentInputArray = { ...inputArr };

                  // we do some nasty workaround
                  currentInputArray[index] =
                    nextInputObject?.[`input_${index}`] || null;

                  setInputArr(currentInputArray);
                }}
                form={inputArr[index]}
                stateObjectKey={`input_${index}`}
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
              className="btn  btn-sm shadow-none border border-success text-white"
            >
              + Add (push)
            </button>
            <button
              className="btn  btn-sm shadow-none border border-error text-white"
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
