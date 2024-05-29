import { useEffect, useState } from "react";
import {
  getFunctionInputKey,
  getInitialFormState,
  getInitialTupleFormState,
} from "./utilsContract";
import { AbiEnum, AbiStruct } from "~~/utils/scaffold-stark/contract";
import { replacer } from "~~/utils/scaffold-stark/common";
import { ContractInput } from "./ContractInput";

type StructProps = {
  parentForm: Record<string, any> | undefined;
  setParentForm: (form: Record<string, any>) => void;
  parentStateObjectKey: string;
  abiMember?: AbiStruct | AbiEnum;
};

export const Struct = ({
  parentForm,
  setParentForm,
  parentStateObjectKey,
  abiMember,
}: StructProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialTupleFormState(
      abiMember ?? { type: "struct", name: "", members: [] },
    ),
  );

  useEffect(() => {
    const values = Object.values(form);
    const argsStruct: Record<string, any> = {};
    if (!abiMember) return;

    if (abiMember.type === "struct") {
      abiMember.members.forEach((member, index) => {
        argsStruct[member.name || `input_${index}_`] = values[index];
      });
    } else {
      abiMember.variants.forEach((variant, index) => {
        argsStruct[variant.name || `input_${index}_`] = values[index];
      });
    }

    setParentForm({
      ...parentForm,
      [parentStateObjectKey]: JSON.stringify(argsStruct, replacer),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abiMember, JSON.stringify(form, replacer)]);

  if (!abiMember) return null;

  return (
    <div>
      <div className="collapse collapse-arrow bg-base-200 pl-4 py-1.5 border-2 border-secondary">
        <input type="checkbox" className="min-h-fit peer" />
        <div className="collapse-title p-0 min-h-fit peer-checked:mb-2 text-primary-content/50">
          <p className="m-0 p-0 text-[1rem]">{abiMember.type}</p>
        </div>
        <div className="ml-3 flex-col space-y-4 border-secondary/80 border-l-2 pl-4 collapse-content">
          {abiMember.type === "struct"
            ? abiMember.members.map((member, index) => {
                const key = getFunctionInputKey(
                  abiMember.name || "stuple",
                  member,
                  index,
                );
                return (
                  <ContractInput
                    setForm={setForm}
                    form={form}
                    key={index}
                    stateObjectKey={key}
                    paramType={member}
                  />
                );
              })
            : abiMember.variants.map((variant, index) => {
                const key = getFunctionInputKey(
                  abiMember.name || "stuple",
                  variant,
                  index,
                );
                return (
                  <ContractInput
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
