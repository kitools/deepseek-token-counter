// @unocss-include

import {
  h as vnd, defineComponent,
  reactive,
  ref,
} from 'vue';

import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { useApiKeysStore } from '@stores/apiKeysStore';
import { storeToRefs } from 'pinia';
import type { ApiKeyEntry } from '@stores/apiKeysStore';

interface BalanceInfo {
  currency: string;
  total_balance: string;
  topped_up_balance: string;
  granted_balance: string;
}

interface BalanceResult {
  is_available: boolean;
  balance_infos: BalanceInfo[];
  loading?: boolean;
  error?: string;
}

const AppKeyBalanceView = defineComponent({
  name: "AppKeyBalanceView",
  setup() {
    const toast = useToast();
    const apiKeysStore = useApiKeysStore();
    const { keys, count } = storeToRefs(apiKeysStore);
    const { addKey, removeKey } = apiKeysStore;

    const newAlias = ref('');
    const newKey = ref('');
    const balanceResults = reactive<Record<number, BalanceResult>>({});

    const queryBalance = async (entry: ApiKeyEntry) => {
      balanceResults[entry.id] = { is_available: false, balance_infos: [], loading: true };
      try {
        const response = await fetch('https://api.deepseek.com/user/balance', {
          headers: {
            'Authorization': `Bearer ${entry.key}`,
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errBody}`);
        }
        const data = await response.json();
        balanceResults[entry.id] = {
          is_available: data.is_available,
          balance_infos: data.balance_infos || [],
          loading: false,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        balanceResults[entry.id] = {
          is_available: false,
          balance_infos: [],
          loading: false,
          error: message,
        };
        toast.add({ severity: 'error', summary: '查询失败', detail: message, life: 5000 });
      }
    };

    const addNewKey = () => {
      const alias = newAlias.value.trim();
      const key = newKey.value.trim();
      if (!alias || !key) {
        toast.add({ severity: 'warn', summary: '请填写完整', detail: '别名和 Key 都不能为空', life: 3000 });
        return;
      }
      addKey(alias, key);
      newAlias.value = '';
      newKey.value = '';
      toast.add({ severity: 'success', summary: '添加成功', detail: `已添加 Key: ${alias}`, life: 3000 });
    };

    const maskKey = (key: string) => {
      if (key.length <= 8) return `****${key.slice(-4)}`;
      return `${key.slice(0, 4)}****${key.slice(-4)}`;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        addNewKey();
      }
    };

    return () => vnd(Panel, {
      header: 'API Key 余额查询',
      toggleable: true,
      class: 'my-3',
    }, {
      default: () => [

        // Add key form
        vnd('div', { class: 'flex flex-row flex-items-center flex-wrap gap-2 mb-3 p-3 border-round bg-var-p-surface-ground' }, [
          vnd(InputText, {
            placeholder: '别名（如：我的主 Key）',
            modelValue: newAlias.value,
            'onUpdate:modelValue': (v: string) => { newAlias.value = v; },
            onKeydown: handleKeydown,
          }),
          vnd(InputText, {
            placeholder: 'DeepSeek API Key（sk-...）',
            modelValue: newKey.value,
            'onUpdate:modelValue': (v: string) => { newKey.value = v; },
            onKeydown: handleKeydown,
            style: { width: '300px' },
          }),
          vnd(Button, {
            label: '添加',
            icon: 'pi pi-plus',
            onClick: addNewKey,
          }),
        ]),

        // Keys list
        count.value === 0
          ? vnd('div', { class: 'text-sm opacity-60 p-3' }, '暂无保存的 Key，请在上方添加')
          : vnd('div', { class: 'stack-v gap-3' }, [
              vnd('div', { class: 'text-sm opacity-70' }, `已保存 ${count.value} 个 Key`),

              ...keys.value.map((entry: ApiKeyEntry) => {
                const result = balanceResults[entry.id];

                return vnd('div', {
                  key: `key-${entry.id}`,
                  class: 'p-3 border-round surface-border border-1 flex flex-column gap-2',
                }, [
                  // Key header with actions
                  vnd('div', { class: 'flex flex-row flex-items-center flex-justify-between' }, [
                    vnd('div', { class: 'flex flex-row flex-items-center gap-2' }, [
                      vnd('i', { class: 'pi pi-key' }),
                      vnd('span', { class: 'font-bold' }, entry.alias),
                      vnd('span', { class: 'text-sm opacity-60 font-mono' }, maskKey(entry.key)),
                    ]),
                    vnd('div', { class: 'flex flex-row gap-2' }, [
                      vnd(Button, {
                        label: result && !result.error ? '刷新' : '查询余额',
                        icon: 'pi pi-search',
                        size: 'small',
                        loading: result?.loading,
                        onClick: () => queryBalance(entry),
                      }),
                      vnd(Button, {
                        icon: 'pi pi-trash',
                        size: 'small',
                        severity: 'danger',
                        text: true,
                        onClick: () => { removeKey(entry.id); delete balanceResults[entry.id]; },
                      }),
                    ]),
                  ]),

                  // Balance result
                  result && !result.loading
                    ? vnd('div', { class: 'mt-2 p-2 border-round surface-ground' }, [
                        result.error
                          ? vnd('div', { class: 'text-red-500 flex flex-row flex-items-center gap-2' }, [
                              vnd('i', { class: 'pi pi-exclamation-circle' }),
                              vnd('span', {}, `查询失败: ${result.error}`),
                            ])
                          : vnd('div', { class: 'stack-v gap-1' }, [
                              vnd('div', { class: 'flex flex-row flex-items-center gap-2' }, [
                                vnd('span', {}, '账户状态:'),
                                vnd(Tag, {
                                  value: result.is_available ? '可用' : '不可用',
                                  severity: result.is_available ? 'success' : 'danger',
                                }),
                              ]),
                              ...result.balance_infos.map((info) =>
                                vnd('div', {
                                  class: 'flex flex-row flex-items-center gap-3 text-sm',
                                  key: info.currency,
                                }, [
                                  vnd('span', { class: 'font-bold w-3rem' }, info.currency),
                                  vnd('span', {}, `总额: ${info.total_balance}`),
                                  vnd('span', {}, `充值: ${info.topped_up_balance}`),
                                  vnd('span', {}, `赠送: ${info.granted_balance}`),
                                ])
                              ),
                            ]),
                      ])
                    : null,
                ]);
              }),
            ]),
      ],
    });
  },
});

export default AppKeyBalanceView;
