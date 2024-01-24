import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import { MyTheme } from './components/MyTheme';
import { Panel2 } from './components/Panel2';

const PLUGIN_NAME = 'FlexHackathonPlugin';

export default class FlexHackathonPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex: typeof Flex, manager: Flex.Manager): Promise<void> {
    // Width of the Tasks
    flex.AgentDesktopView.defaultProps.splitterOptions = {
      initialFirstPanelSize: '275px',
      minimumFirstPanelSize: '100px',
    };

    // Add iFrame to the second panel
    flex.AgentDesktopView.Panel2.Content.replace(
      <MyTheme key='MyTheme'>
        <Panel2 />
      </MyTheme>
    );

    // Auto Accept Tasks
    manager.workerClient!.on('reservationCreated', (reservation) => {
      console.log('@@@reservationCreated', reservation.task.attributes);

      if (!!reservation.task.attributes.autoAccept) {
        window.Twilio.Flex.Actions.invokeAction('AcceptTask', { sid: reservation.sid });
        window.Twilio.Flex.Actions.invokeAction('SelectTask', { sid: reservation.sid });
      }
    });

    // Change Activity to Available when Agent clicks on "Hijack Call" button within the iFrame
    window.addEventListener(
      'message',
      (event) => {
        const { type } = event.data;
        console.log('postMessage received in Flex: ', type);
        flex.Actions.invokeAction('SetActivity', { activityName: 'Available' });
      },
      false
    );
  }
}
