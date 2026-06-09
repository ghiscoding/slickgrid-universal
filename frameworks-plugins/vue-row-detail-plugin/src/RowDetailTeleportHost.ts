import { createVNode, defineComponent, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, render, shallowRef } from 'vue';
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
    const hostInstance = getCurrentInstance ? getCurrentInstance() : undefined;
    const entries = shallowRef<TeleportEntry[]>([]);
    // Map entry id -> { comp: ComponentType, presets: boolean }
    const _hostMountCompMap = new Map<string, { comp: any; presets: boolean }>();

    onMounted(() => {
      props.plugin.registerTeleportHost((newEntries) => {
        // Evict cached HostMount components for entries that were removed
        const incomingIds = new Set(newEntries.map((e) => String(e.id)));
        Array.from(_hostMountCompMap.keys()).forEach((cachedId) => {
          if (!incomingIds.has(cachedId)) {
            const meta = _hostMountCompMap.get(cachedId);
            // Only evict cache when the entry was NOT using inner-grid state presets
            if (meta && !meta.presets) {
              _hostMountCompMap.delete(cachedId);
            }
          }
        });

        entries.value = [...newEntries];
      });
    });

    onBeforeUnmount(() => {
      props.plugin.registerTeleportHost(undefined);
      // Clear any cached host mount components on unmount
      _hostMountCompMap.clear();
    });

    return () => {
      return entries.value.map((entry) => {
        const key = `${String(entry.id)}-${entry.gen ?? 0}`;

        // HostMount: programmatically render the provided component into the target container
        const HostMount = (entry: any) => {
          return defineComponent({
            name: `RowDetailHostMount_${String(entry.id)}`,
            setup() {
              let vnode: any = null;
              const mount = () => {
                const target = document.querySelector(entry.selector) as Element | null;
                if (!target) {
                  return;
                }
                vnode = createVNode(entry.component as any, { ...entry.data });
                if (hostInstance && vnode) vnode.appContext = hostInstance.appContext;
                render(vnode, target);
              };

              onMounted(() => {
                nextTick(mount);
              });

              onBeforeUnmount(() => {
                const target = document.querySelector(entry.selector) as Element | null;
                if (target) {
                  render(null, target);
                }
              });

              return () => null;
            },
          });
        };

        // Cache HostMount component types per entry generation key so vnode type remains stable
        const idKey = String(entry.id);
        // Determine whether this entry wants inner-grid state presets
        const wantsPresets = !!(entry?.data && (entry.data as any).model && (entry.data as any).model.isUsingInnerGridStatePresets);

        // If cache exists for this id, reuse it; otherwise create and store metadata
        let Comp = _hostMountCompMap.get(idKey)?.comp;
        if (!Comp) {
          Comp = HostMount(entry);
          _hostMountCompMap.set(idKey, { comp: Comp, presets: wantsPresets });
        } else {
          // Update presets flag if changed while still cached
          const meta = _hostMountCompMap.get(idKey);
          if (meta && meta.presets !== wantsPresets) {
            meta.presets = wantsPresets;
            _hostMountCompMap.set(idKey, meta);
          }
        }

        return h(Comp as any, { key });
      });
    };
  },
});
