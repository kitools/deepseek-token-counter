// @unocss-include

// import _ from "lodash";

import {
  h as vnd, defineComponent,
  reactive,
} from 'vue';

import { deepseek_tokenizer_encode } from '@utils/functions';

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

            vnd("div", {class: "stack-h"}, [
              vnd(ToolButton, { label: "分析", icon: "pi pi-play", class: "mr-1.5rem",
                onClick: async () => {
                  await deepseek_tokenizer_encode(demoData.input).then((res) => {
                    demoData.output = res;
                  }
                  ).catch((err) => {
                    console.error(err);
                  }
                  );
                },
              }),
            ]),

            vnd("pre", { class: "w-full max-h-50vh p-panel p-1rem overflow-auto" }, demoData.output),

            vnd("div", {class: "stack-h"}, []),
          ]),
        }),
      ]);
    };
  }
})

export default AppToolView;
