import {
  Component,
  computed,
  defineComponent,
  h,
  inject,
  InjectionKey,
  provide,
  Ref
} from 'vue'
import { useData } from 'vitepress'
import type {
  Config,
  MultiSidebarConfig,
  SidebarConfig,
  SidebarGroup
} from '../config'
import type { MenuItem, MenuItemChild } from '../../core'
import { normalizeLink } from '../support/utils'

const configSymbol: InjectionKey<Ref<Config>> = Symbol('config')

/**
 * Wrap root App component to provide the resolved theme config
 * so that we reuse the same computed ref across the entire app instead of
 * re-creating one in every consumer component.
 */
export function withConfigProvider(App: Component) {
  return defineComponent({
    name: 'VPConfigProvider',
    setup(_, { slots }) {
      const { theme } = useData()
      const config = computed(() => resolveConfig(theme.value))
      provide(configSymbol, config)
      return () => h(App, null, slots)
    }
  })
}

export function useConfig() {
  return {
    config: inject(configSymbol)!
  }
}

function resolveConfig(config: Config): Config {
  return {
    appearance: true,
    ...config,
    nav: config.nav?.map(normalizeMenuItem),
    sidebar: config.sidebar && normalizeSideBar(config.sidebar)
  }
}

function normalizeMenuItem<T extends MenuItem | MenuItemChild>(item: T): T {
  if ('link' in item) {
    return { ...item, link: normalizeLink(item.link) }
  } else {
    return { ...item, items: item.items.map(normalizeMenuItem) }
  }
}

function normalizeSideBar(sidebar: SidebarConfig): SidebarConfig {
  if (Array.isArray(sidebar)) {
    return sidebar.map(normalizeMenuItem)
  } else {
    const ret: MultiSidebarConfig = {}
    for (const key in sidebar) {
      ret[key] = normalizeSideBar(sidebar[key]) as SidebarGroup[]
    }
    return ret
  }
}
