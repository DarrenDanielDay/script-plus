import classNames from "classnames";
import React from "react";
import { useTypedIntl } from "../../i18n/core/locale";
import styles from "./style.module.css";

export interface ISkeletonProp {
  width: string | number;
  height: string | number;
}
// Snowpack cannot work with @material-ui/lab@5.0.0-alpha correctly.
export const Skeleton: React.FC<ISkeletonProp> = ({ width, height }) => {
  const intl = useTypedIntl();
  return (
    <span className={classNames(styles.waving)} style={{ width, height }}>
      {intl("components.skeleton.loading")}
    </span>
  );
};
