// @unocss-include

// import _ from "lodash";

import {
  h as vnd, defineComponent,
  reactive,
} from 'vue';

import { deepseek_tokenizer_encode, load_deepseek_tokenizer, initialize_deepseek_tokenizer } from '@utils/functions';

import Panel from 'primevue/panel';
import Textarea from 'primevue/textarea';
import ToolButton from '@components/shared/ToolButton';

// import { useToast } from 'primevue/usetoast';


const AppToolView = defineComponent({
  name: "AppToolView",
  setup() {

    // const toast = useToast();

    // /** data **/ //
    const demoData = reactive({

      input: "",

      processing: false,
      output: [] as number[],

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenizerJSON: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenizerConfig: null as any,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokenizer: null as any,

    });

    return ()=>{
      return vnd("div", {
      }, [

        vnd(Panel, { header: "输入分析", toggleable: true, class: "my-1.5rem! col" }, {
          default: () => vnd("div", {class: "stack-v"}, [
            vnd(Textarea, { class: "w-full", placeholder: "输入",
              modelValue: demoData.input,
              "onUpdate:modelValue": (value: string) => {
                demoData.input = value;
              },
              disabled: demoData.processing,
            }),

            !(demoData.tokenizer!=null)?null:
            vnd("div", {class: "stack-h"}, [
              vnd(ToolButton, { label: "分析", icon: "pi pi-play", class: "mr-1.5rem",
                onClick: async () => {
                  await deepseek_tokenizer_encode(demoData.tokenizer, demoData.input).then((res) => {
                    console.log(res);
                    demoData.output = res;
                  }).catch((err) => {
                    console.error(err);
                  });
                },
              }),
            ]),

            !(demoData.tokenizer==null&&(demoData.tokenizerJSON!=null&&demoData.tokenizerConfig!=null))?null:
            vnd("div", {class: "stack-h"}, [
              vnd(ToolButton, { label: "初始化", icon: "pi pi-cog", class: "mr-1.5rem",
                onClick: async () => {
                  await initialize_deepseek_tokenizer(demoData);
                },
              }),
            ]),

            !(demoData.tokenizerJSON==null||demoData.tokenizerConfig==null)?null:
            vnd("div", {class: "stack-h"}, [
              vnd(ToolButton, { label: "加载", icon: "pi pi-cog", class: "mr-1.5rem",
                onClick: async () => {
                  await load_deepseek_tokenizer(demoData);
                },
              }),
            ]),

            vnd("pre", { class: "w-full max-h-50vh p-panel p-1rem overflow-auto" }, String(demoData.output)),

            vnd("div", {class: "stack-h"}, []),
          ]),
        }),
      ]);
    };
  }
})

export default AppToolView;
