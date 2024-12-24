import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getFunctionInputKey, getInitialTupleFormState } from "./utilsContract";
import { AbiEnum, AbiStruct } from "~~/utils/scaffold-stark/contract";
import { replacer } from "~~/utils/scaffold-stark/common";
import { ContractInput } from "./ContractInput";
import { Abi } from "abi-wan-kanabi";
import { addError, clearError, FormErrorMessageState } from "./utilsDisplay";

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
        className={`collapse border-2 bg-base-200 pb-2 pl-4 pt-1.5 ${
          isDisabled ? "cursor-not-allowed border-base-100" : "border-secondary"
        } custom-after`}
      >
        {!isDisabled && <input type="checkbox" className="peer min-h-fit" />}
        <div
          className={`collapse-title min-h-fit p-0 text-primary-content/50 peer-checked:mb-2 ${
            isDisabled && "cursor-not-allowed"
          } `}
        >
          <p className="m-0 p-0 text-[1rem]">{abiMember.type}</p>
        </div>
        <div className="collapse-content ml-3 flex-col space-y-4 border-l-2 border-secondary/80 pl-4">
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
                      className="radio-secondary radio radio-xs"
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
                      isDisabled={index !== activeVariantIndex}
                    />
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
