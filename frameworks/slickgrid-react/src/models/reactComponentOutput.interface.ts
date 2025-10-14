/* oxlint-disable @typescript-eslint/consistent-type-imports */
import React, { type ReactInstance } from 'react';

export interface SlickgridReactComponentOutput {
  componentInstance?: ReactInstance;
  componentElement?: React.CElement<any, React.Component<any, any, any>>;
  domElement?: Element | Text | null;
}
