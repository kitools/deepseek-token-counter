// @unocss-include

import {
  h as vnd, defineComponent,
  reactive,
  ref,
  onMounted,
} from 'vue';

import Panel from 'primevue/panel';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import Toolbar from 'primevue/toolbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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

    // Load persisted results on mount
    onMounted(() => {
      for (const entry of keys.value) {
        if (entry.lastBalanceResult) {
          balanceResults[entry.id] = {
            is_available: entry.lastBalanceResult.is_available,
            balance_infos: entry.lastBalanceResult.balance_infos,
            error: entry.lastBalanceResult.error,
            loading: false,
          };
        }
      }
    });

    const copyKey = async (key: string) => {
      try {
        await navigator.clipboard.writeText(key);
        toast.add({ severity: 'success', summary: '已复制', detail: 'API Key 已复制到剪贴板', life: 2000 });
      } catch {
        toast.add({ severity: 'error', summary: '复制失败', detail: '无法访问剪贴板', life: 3000 });
      }
    };

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
        const result: BalanceResult = {
          is_available: data.is_available,
          balance_infos: data.balance_infos || [],
          loading: false,
        };
        balanceResults[entry.id] = result;

        entry.lastBalanceResult = {
          is_available: data.is_available,
          balance_infos: data.balance_infos || [],
        };
        entry.lastQueryTime = Date.now();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        balanceResults[entry.id] = {
          is_available: false,
          balance_infos: [],
          loading: false,
          error: message,
        };

        entry.lastBalanceResult = {
          is_available: false,
          balance_infos: [],
          error: message,
        };
        entry.lastQueryTime = Date.now();

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

    const renderBalanceCard = (result: BalanceResult) => {
      if (result.loading) {
        return vnd('div', { class: 'flex flex-col gap-2' }, [
          vnd(Skeleton, { width: '60%', height: '1rem' }),
          vnd(Skeleton, { width: '40%', height: '1rem' }),
          vnd(Skeleton, { width: '50%', height: '1rem' }),
        ]);
      }
      if (result.error) {
        return vnd(Message, { severity: 'error' }, {
          default: () => `查询失败: ${result.error}`,
        });
      }

      return vnd('div', { class: 'flex flex-col gap-3 surface-ground border-round p-3' }, [
        vnd('div', { class: 'flex flex-row flex-items-center gap-2' }, [
          vnd('span', { class: '' }, '账户状态:'),
          vnd(Tag, {
            value: result.is_available ? '可用' : '不可用',
            severity: result.is_available ? 'success' : 'danger',
            rounded: true,
          }),
        ]),
        result.balance_infos.length > 0
          ? vnd(DataTable, {
              value: result.balance_infos,
              showGridlines: true,
              // stripedRows: true,
              size: 'small',
            }, {
              default: () => [
                vnd(Column, { field: 'currency', header: '货币', style: { width: '25%' } }),
                vnd(Column, { field: 'total_balance', header: '总额' }),
                vnd(Column, { field: 'topped_up_balance', header: '充值' }),
                vnd(Column, { field: 'granted_balance', header: '赠送' }),
              ],
            })
          : vnd(Message, { severity: 'info' }, {
              default: () => '无余额信息',
            }),
      ]);
    };

    return () => vnd(Panel, {
      header: 'API Key 余额查询',
      toggleable: true,
      class: 'my-3',
    }, {
      default: () => [
        // Add key toolbar
        vnd(Toolbar, { class: 'mb-4 border-round' }, {
          start: () => [
            vnd('div', { class: 'flex flex-row flex-wrap gap-2' }, [
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
                style: { width: '320px' },
              }),
              vnd(Button, {
                label: '添加',
                icon: 'pi pi-plus',
                onClick: addNewKey,
              }),
            ]),
          ],
        }),

        // Empty state
        count.value === 0
          ? vnd(Message, { severity: 'info' }, {
              default: () => '暂无保存的 Key，请在上方添加',
            })
          : [
              vnd('div', { class: 'mb-3 flex flex-row flex-items-center gap-2' }, [
                vnd('span', { class: 'font-semibold' }, '已保存的 Key'),
                vnd(Badge, { value: count.value.toString(), severity: 'info', size: 'small' }),
              ]),

              ...keys.value.map((entry: ApiKeyEntry) => {
                const result = balanceResults[entry.id];

                return vnd(Card, {
                  key: `key-${entry.id}`,
                  class: 'mb-3',
                }, {
                  content: () => {
                    const children: any[] = [
                      // Header row
                      vnd('div', { class: 'flex flex-row flex-items-center gap-2' }, [
                        vnd('i', { class: 'pi pi-key' }),
                        vnd('span', { class: 'font-medium' }, entry.alias),
                        vnd('span', { class: 'font-mono' }, maskKey(entry.key)),
                        vnd(Button, {
                          icon: 'pi pi-copy',
                          severity: 'secondary',
                          text: true,
                          size: 'small',
                          onClick: () => copyKey(entry.key),
                        }),

                        // Action buttons
                        vnd('div', { class: 'flex flex-row gap-2 ml-auto' }, [
                          vnd(Button, {
                            label: result && !result.error ? '刷新余额' : '查询余额',
                            icon: 'pi pi-refresh',
                            size: 'small',
                            outlined: true,
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

                      // Separator
                      vnd('hr', { class: 'my-2 border-0 border-t-1 surface-border' }),

                      // Last query time
                      entry.lastQueryTime
                        ? vnd('div', { class: 'my-0.75em flex flex-row flex-items-center gap-1' }, [
                            vnd('i', { class: 'pi pi-clock' }),
                            vnd('span', {}, `最后查询: ${new Date(entry.lastQueryTime).toLocaleString()}`),
                          ])
                        : null,

                      // Balance result
                      result ? renderBalanceCard(result) : null,
                    ];

                    return children.filter(Boolean);
                  },
                });
              }),
            ],
      ],
    });
  },
});

export default AppKeyBalanceView;
