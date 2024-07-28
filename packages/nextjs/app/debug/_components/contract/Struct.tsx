import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getFunctionInputKey, getInitialTupleFormState } from "./utilsContract";
import { AbiEnum, AbiStruct } from "~~/utils/scaffold-stark/contract";
import { replacer } from "~~/utils/scaffold-stark/common";
import { ContractInput } from "./ContractInput";
import { Abi } from "abi-wan-kanabi";

type StructProps = {
  abi?: Abi;
  parentForm: Record<string, any> | undefined;
  setParentForm: (form: Record<string, any>) => void;
  parentStateObjectKey: string;
  abiMember?: AbiStruct | AbiEnum;
  setFormErrorMessage: Dispatch<SetStateAction<string | null>>;
};

export const Struct = ({
  parentForm,
  setParentForm,
  parentStateObjectKey,
  abiMember,
  abi,
  setFormErrorMessage,
}: StructProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialTupleFormState(
      abiMember ?? { type: "struct", name: "", members: [] },
    ),
  );

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
          value: values[index],
        };
      });

      // check for enum validity
      if (values.filter((item) => (item || "").length > 0).length > 1) {
        setFormErrorMessage("Enums can only have one defined value");
      } else {
        setFormErrorMessage(null);
      }
    }

    setParentForm({
      ...parentForm,
      [parentStateObjectKey]:
        abiMember.type === "struct" ? argsStruct : { variant: argsStruct },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abiMember, JSON.stringify(form, replacer)]);

  if (!abiMember) return null;

  return (
    <div>
      <div className="collapse bg-base-200 pl-4 pt-1.5 pb-2 border-2 border-secondary custom-after">
        <input type="checkbox" className="min-h-fit peer" />
        <div className="collapse-title p-0 min-h-fit peer-checked:mb-2 text-primary-content/50">
          <p className="m-0 p-0 text-[1rem]">{abiMember.type}</p>
        </div>
        <div className="ml-3 flex-col space-y-4 border-secondary/80 border-l-2 pl-4 collapse-content">
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
                  <ContractInput
                    setFormErrorMessage={setFormErrorMessage}
                    abi={abi}
                    setForm={setForm}
                    form={form}
                    key={index}
                    stateObjectKey={key}
                    paramType={variant}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
};
