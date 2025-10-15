import { SharedService } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { ContainerService } from './container.service.js';

export const GlobalEventPubSubService = new EventPubSubService();
export const GlobalEventSharedService = new SharedService();
export const GlobalContainerService = new ContainerService();
