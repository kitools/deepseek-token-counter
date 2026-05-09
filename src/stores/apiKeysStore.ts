import _ from 'lodash';
import { defineStore } from 'pinia';
import { parse, stringify } from 'zipson';

export interface ApiKeyEntry {
  id: number;
  alias: string;
  key: string;
  timestamp: number;
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
