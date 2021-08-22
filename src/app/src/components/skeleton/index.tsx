import classNames from "classnames";
import React from "react";
import styles from "./style.module.css";

export interface ISkeletonProp {
  width: string | number;
  height: string | number;
}
// Snowpack cannot work with @material-ui/lab@5.0.0-alpha correctly.
export const Skeleton: React.FC<ISkeletonProp> = ({ width, height }) => {
  return (
    <span className={classNames(styles.waving)} style={{ width, height }}>
      loading
    </span>
  );
};
