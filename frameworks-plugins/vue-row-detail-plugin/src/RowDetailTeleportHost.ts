import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, Teleport } from 'vue';
import type { PropType } from 'vue';
import type { TeleportEntry, VueRowDetailView } from './vueRowDetailView.js';

/**
 * RowDetailTeleportHost — place this component once in your app template (e.g. alongside your SlickGrid component).
 * It renders each open row detail via Vue's built-in `<Teleport>`, keeping every detail panel inside the Vue
 * component tree so that provide/inject, Pinia, Vue Router, and other providers are fully accessible.
 *
 * Without this host, the plugin falls back to creating an isolated `createApp()` per row detail,
 * which breaks provide/inject chains and Pinia store access.
 *
 * @example
 * ```ts
 * import { VueRowDetailView } from '@slickgrid-universal/vue-row-detail-plugin';
 * import { RowDetailTeleportHost } from '@slickgrid-universal/vue-row-detail-plugin';
 *
 * // create the plugin instance once
 * const rowDetailPlugin = new VueRowDetailView(eventPubSubService);
 * ```
 *
 * ```html
 * <!-- place the host anywhere in the same component as your grid -->
 * <SlickgridVue ... :external-resources="[rowDetailPlugin]" />
 * <RowDetailTeleportHost :plugin="rowDetailPlugin" />
 * ```
 */
export const RowDetailTeleportHost = defineComponent({
  name: 'RowDetailTeleportHost',
  props: {
    plugin: {
      type: Object as PropType<VueRowDetailView>,
      required: true,
    },
  },
  setup(props) {
    const entries = shallowRef<TeleportEntry[]>([]);

    onMounted(() => {
      props.plugin.registerTeleportHost((newEntries) => {
        entries.value = [...newEntries];
      });
    });

    onBeforeUnmount(() => {
      props.plugin.registerTeleportHost(undefined);
    });

    return () =>
      entries.value.map((entry) =>
        h(Teleport as any, { to: entry.selector, key: String(entry.id) }, () => h(entry.component as any, entry.data))
      );
  },
});
