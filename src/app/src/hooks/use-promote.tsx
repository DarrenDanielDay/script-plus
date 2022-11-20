import * as R from "ramda";
import React, { useState } from "react";
import { createFutureValue } from "../../../common/shared-utils";
import { setStateEffect } from "../utils/well-typed";

export interface IPromoteModalProps<P extends {}> {
  open: boolean;
  onSave: (payload: P) => void;
  onCancel: () => void;
}
export const usePromote = <P extends {}>(
  ModalComponent: React.FC<IPromoteModalProps<P>>
) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(() => createFutureValue<P>());
  const askForSave = () => {
    const newPending = createFutureValue<P>();
    setPending(newPending);
    setOpen(true);
    return newPending.promise;
  };
  return {
    view: (
      <ModalComponent
        open={open}
        onSave={R.pipe(pending.done, R.F, setStateEffect(setOpen))}
        onCancel={R.pipe(R.F, setStateEffect(setOpen), pending.abort)}
      />
    ),
    askForSave,
  };
};
