import _ from 'lodash';
import { defineStore } from 'pinia';
import { parse, stringify } from 'zipson';

export interface ApiKeyEntry {
  id: number;
  alias: string;
  key: string;
  timestamp: number;
  lastBalanceResult?: {
    is_available: boolean;
    balance_infos: Array<{
      currency: string;
      total_balance: string;
      topped_up_balance: string;
      granted_balance: string;
    }>;
    error?: string;
  };
  lastQueryTime?: number;
}

export const useApiKeysStore = defineStore('apiKeysStore', {
  state: () => ({
    keys: [] as ApiKeyEntry[],
  }),
  getters: {
    count: (state) => state.keys.length,
    maxId: (state) => _.maxBy(state.keys, 'id')?.id ?? 0,
  },
  actions: {
    addKey(alias: string, key: string) {
      const entry: ApiKeyEntry = {
        id: this.maxId + 1,
        alias,
        key,
        timestamp: Date.now(),
      };
      this.keys.unshift(entry);
    },
    removeKey(id: number) {
      _.remove(this.keys, { id });
    },
  },
  persist: {
    serializer: {
      deserialize: parse,
      serialize: stringify,
    },
  },
});
