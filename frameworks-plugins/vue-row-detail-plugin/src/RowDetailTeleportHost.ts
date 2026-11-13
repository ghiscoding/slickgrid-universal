import { defineComponent, h, nextTick, shallowRef, Teleport, watch, type PropType } from 'vue';
import type { RowDetailTeleportEntry, VueRowDetailView } from './vueRowDetailView.js';

/** Render row details under this component's Vue providers. */
export const RowDetailTeleportHost = defineComponent({
  name: 'RowDetailTeleportHost',
  props: { plugin: { type: Object as PropType<VueRowDetailView>, required: true } },
  setup(props) {
    const entries = shallowRef<RowDetailTeleportEntry[]>([]);
    watch(
      () => props.plugin,
      (plugin, _previous, onCleanup) => {
        plugin.registerTeleportHost((value) => {
          entries.value = value;
          return nextTick();
        });
        onCleanup(() => plugin.registerTeleportHost());
      },
      { immediate: true }
    );
    return () => entries.value.map((entry) => h(Teleport, { to: entry.target, key: entry.generation }, h(entry.component, entry.props)));
  },
});
