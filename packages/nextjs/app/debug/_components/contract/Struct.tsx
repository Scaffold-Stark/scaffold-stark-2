import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getFunctionInputKey, getInitialTupleFormState } from "./utilsContract";
import { AbiEnum, AbiStruct } from "~~/utils/scaffold-stark/contract";
import { replacer } from "~~/utils/scaffold-stark/common";
import { ContractInput } from "./ContractInput";
import { Abi } from "abi-wan-kanabi";
import { addError, clearError, FormErrorMessageState } from "./utilsDisplay";
import { isCairoOption } from "~~/utils/scaffold-stark/types";

type StructProps = {
  abi?: Abi;
  parentForm: Record<string, any> | undefined;
  setParentForm: (form: Record<string, any>) => void;
  parentStateObjectKey: string;
  abiMember?: AbiStruct | AbiEnum;
  setFormErrorMessage: Dispatch<SetStateAction<FormErrorMessageState>>;
  isDisabled?: boolean;
};

export const Struct = ({
  parentForm,
  setParentForm,
  parentStateObjectKey,
  abiMember,
  abi,
  setFormErrorMessage,
  isDisabled = false,
}: StructProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialTupleFormState(
      abiMember ?? { type: "struct", name: "", members: [] },
    ),
  );

  // select enum
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  // side effect to transform data before setState
  useEffect(() => {
    const values = Object.values(form);
    const argsStruct: Record<string, any> = {};
    if (!abiMember) return;

    if (abiMember.type === "struct") {
      abiMember.members.forEach((member, index) => {
        argsStruct[member.name || `input_${index}_`] = {
          type: member.type,
          value: values[index],
        };
      });
    } else {
      abiMember.variants.forEach((variant, index) => {
        argsStruct[variant.name || `input_${index}_`] = {
          type: variant.type,
          value: index === activeVariantIndex ? values[index] : undefined,
        };
      });
    }

    setParentForm({
      ...parentForm,
      [parentStateObjectKey]:
        abiMember.type === "struct" ? argsStruct : { variant: argsStruct },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abiMember, JSON.stringify(form, replacer), activeVariantIndex]);

  if (!abiMember) return null;

  return (
    <div>
      <div
        className={`collapse bg-base-200 pl-4 pt-1.5  border-2 ${
          isDisabled ? "border-base-100 cursor-not-allowed" : "border-secondary"
        } custom-after`}
      >
        {!isDisabled && <input type="checkbox" className="min-h-fit peer" />}
        <div
          className={`collapse-title p-0 min-h-fit peer-checked:mb-2 text-primary-content/50 ${
            isDisabled && "cursor-not-allowed pb-2"
          } `}
        >
          <p className="m-0 p-0 text-[1rem]">{abiMember.type}</p>
        </div>
        <div className="ml-3 flex-col space-y-4 border-secondary/80 peer-checked:mb-3 border-l-2 pl-4 collapse-content">
          {abiMember.type === "struct"
            ? abiMember.members.map((member, index) => {
                const key = getFunctionInputKey(
                  abiMember.name || "struct",
                  member,
                  index,
                );
                return (
                  <ContractInput
                    setFormErrorMessage={setFormErrorMessage}
                    abi={abi}
                    setForm={setForm}
                    form={form}
                    key={index}
                    stateObjectKey={key}
                    paramType={{ name: member.name, type: member.type }}
                  />
                );
              })
            : abiMember.variants.map((variant, index) => {
                const key = getFunctionInputKey(
                  abiMember.name || "tuple",
                  variant,
                  index,
                );

                return (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name={`radio-${index}`}
                      className="radio radio-xs radio-secondary"
                      checked={index === activeVariantIndex}
                      onChange={() => {}}
                      onClick={() => {
                        setActiveVariantIndex(index);
                      }}
                    />
                    <ContractInput
                      setFormErrorMessage={setFormErrorMessage}
                      abi={abi}
                      setForm={setForm}
                      form={form}
                      key={index}
                      stateObjectKey={key}
                      paramType={variant}
                      isDisabled={
                        index !== activeVariantIndex ||
                        // this will disable the input box if the variant is None
                        // added option type check for safety
                        (isCairoOption(abiMember.name) &&
                          variant.name === "None")
                      }
                    />
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
