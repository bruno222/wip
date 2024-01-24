import React from 'react';
import { Theme } from '@twilio-paste/core/theme';

interface Props {
  children: JSX.Element;
  task?: any;
}

export const MyTheme = ({ children, task }: Props): JSX.Element | null => {
  return <Theme.Provider theme='default'>{children}</Theme.Provider>;
};
