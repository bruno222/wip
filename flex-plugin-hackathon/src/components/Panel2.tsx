import { Box, Button, Separator } from '@twilio-paste/core';
import { withTheme, withTaskContext, Manager } from '@twilio/flex-ui';
import { useEffect, useState } from 'react';

interface Props {
  task?: Task;
}

interface PanelTab {
  name: string;
  url: string;
}

interface Task {
  attributes: {
    tabs?: PanelTab[];
  };
  sid: string;
}

export const Panel2 = withTaskContext(({ task }: Props) => {
  // const url = `http://localhost:3001/`; // when you run "npm run dev" from the "/front-end" folder (it has hot-reloading)
  const url = `http://localhost:3000/`; // when you run "npm run build" from the "/front-end" folder and then "npm run dev" from the /back-end folder (static html files only, without hot-reloading)

  try {
    // make iframe full height
    useEffect(() => {
      try {
        // @ts-ignore
        document.getElementsByTagName('iframe')[0].parentElement.style.padding = 0;

        document.getElementsByTagName('iframe')[0].style.minHeight = `${
          // @ts-ignore
          document.getElementsByTagName('iframe')[0].parentElement.parentElement.parentElement.clientHeight - 5
        }px`;
      } catch (err) {
        console.log('@@@ err', err);
      }
    }, [document.getElementsByTagName('iframe')[0].parentElement?.parentElement?.parentElement!.clientHeight]);
  } catch (err) {}

  return (
    <Box padding='space40' key='iframe-box'>
      <iframe src={url} width='100%' height='100vh' style={{ display: 'block' }} key='iframe'></iframe>
    </Box>
  );
});
