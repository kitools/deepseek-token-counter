// @unocss-include

// import _ from "lodash";
import clipboard from "clipboard";

import {
  h as vnd, defineComponent,
  ref, reactive,
  onMounted, onUnmounted,
  // nextTick,
} from 'vue';

// import Live2DDemo from '@components/Live2DDemo';

import Panel from 'primevue/panel';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
// import Fieldset from 'primevue/fieldset';
import ToolButton from '@components/shared/ToolButton';
import Bubble from "@components/chat/Bubble";

import AppFileView from '@views/appViews/AppFileView';

import { useToast } from 'primevue/usetoast';


/**
 * @file
 */



const 系统提示词 = `你需要按照以下要求回应后续任务：
你被提供了一个 js 代码运行环境「JsTool」，这是一个安全的沙盒环境，可以通过发送代码给它来获取运行结果，并且可以调用现代浏览器中的各类API功能。

- 每当你收到用户的消息，你都需要**第一时间**判断回复此消息是否需要调用 JsTool，
  - 如果需要，你必须**立即**标记 \`【JsToolUsed】\`，否则程序会出错。
  - 需要调用 JsTool 的情形包括但不限于；数学计算、字符串处理、数据处理、网络请求、文件读写等等。
  - 对于不需要调用 JsTool 的消息，你可以直接回复，不需要标记。
- 在你需要用 JsTool 时，你应该用一个代码块包裹要发送给它的代码，并且在这个代码块前后分别增加一行\`【CallStart】\`和\`【CallEnd】\`标记。你每次发言最多只能调用 1 次 JsTool。

需要注意的是：

- 在 JsTool 环境中，无法使用 import 来导入外部模块或库。
- 在 JsTool 环境中，无法使用 \`console.log\` 之类的打印方法。作为替代，你可以使用 \`JsTool.log\` 来查看你希望查看的数据。
- 每次运行 JsTool 环境的变量都是独立的，无法使用先前轮次的变量。除非使用 \`JsTool.set(key, value)\` 和 \`JsTool.get(key)\`来存取你希望后续使用的变量值。

- 在 JsTool 环境中，还提供了 lodash 库来帮助你更好地完成任务，可通过\`_\`调用。
- 在 JsTool 环境中，还提供了一个 id 为 \`the-only-art-board-wrap\` 的 div ，你可以在这个 div 中自行添加 canvas 或 svg 元素来绘制图形，以完成一些图形类任务。
- 对于数学计算类任务，要充分考虑js的精度问题，尽量使用整数计算，避免浮点数计算。
- 如果你认为必须引入某些外部库才能完成任务，请不用调用 JsTool ，而是用自然语言告知用户。

- 用户会用\`【ReturnStart】\`和\`【ReturnEnd】\`来包裹 \`JsTool.log\` 打印的内容。
- 你并不能直接获取 JsTool 返回的结果，而是需要由用户帮助你获得返回结果并告诉你。
  因此，你可能需要和用户进行多轮对话，执行多次代码，才能得到最终结果，并完成原本的任务。

当你最终完成了任务，你应该将最终结果包裹在\`【ResultStart】\`和\`【ResultEnd】\`之中。`;



declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JsTool?: any;
  }
}

type JsTool = {
  __KV__: Record<string, unknown>;
  __History__: string[];
  log: (xxx: unknown) => void;
  clear: () => void;
  set: (kk: string, vv: unknown) => void;
  get: (kk: string) => unknown;
  last: () => string;
  history: () => string[];
  runCode: (code: string) => string;
};

const TemplateJsTool: JsTool = {
  __KV__: {},
  __History__: [],
  log(xxx) {
    const ttt = JSON.stringify(xxx);
    this.__History__.push(ttt);
    console.log(ttt);
  },
  clear() {
    this.__KV__ = {};
    this.__History__ = [];
  },
  set(kk, vv) { this.__KV__[kk] = vv; },
  get(kk) { return this.__KV__[kk]; },
  last() { return this.__History__[this.__History__.length - 1]; },
  history() { return this.__History__; },
  runCode(code: string) {
    const frags = code.split(/(【CallStart】|【CallEnd】)/g);
    while (frags[0] !== "【CallStart】") {
      frags.shift();
      if (frags.length === 0) {
        this.log("【Error】 Code block not found.");
        return this.last();
      }
    }
    frags.shift();
    while (frags[frags.length - 1] !== "【CallEnd】") {
      frags.pop();
      if (frags.length === 0) {
        this.log("【Error】 Code block not found.");
        return this.last();
      }
    }
    frags.pop();
    code = frags.join('').trim();

    code = code.replace(/^```([Jj](ava)?[Ss](cript)?)?/g, '');
    code = code.replace(/```$/g, '');
    code = code.trim();
    try {
      eval(code);
    } catch (error) {
      this.log(String(error));
    }
    return this.last();
  },
};


const AppRootView = defineComponent({
  setup() {

    const toast = useToast();

    // /** data **/ //
    const textBoxContent = ref("");
    const JsTool = reactive(TemplateJsTool);
    const llmOptions = reactive({
      url: "",
      key: "",
      model: "",
    } as Record<string, string>);

    // /** methods **/ //
    const runCode = (code: string) => {
      return JsTool.runCode(code);
    };

    // /** lifecycle **/ //
    onMounted(()=>{
      window.JsTool = JsTool;
    });
    onUnmounted(()=>{
      window.JsTool = undefined;
    });

    return ()=>{
      return [

        vnd(Panel, { header: "说明", toggleable: true, class: "my-1.5rem! col" }, {
          default: () => vnd("div", {class: "stack-v"}, [
            vnd("p", {}, [ "把系统提示词（按加号展开）发给各家语言模型，然后让它们做一些需要写代码才能完成的任务。将它们的回复放到文本输入面板中运行即可看到结果。" ]),
          ]),
        }),

        vnd(Panel, { header: "系统提示词", toggleable: true, collapsed: true, class: "my-1.5rem! col" }, {
          default: () => vnd("div", {class: "stack-v"}, [
            vnd(ToolButton, {icon: "pi pi-copy", label: "复制", command: ()=>{
              clipboard.copy(系统提示词);
              toast.add({ severity:'info', summary:'已复制', detail: `已复制系统提示词`, life: 2000 });
            }}),
            vnd("pre", {class: "overflow-auto w-full"}, [
              系统提示词,
            ]),
          ]),
        }),

        // vnd(Panel, { header: "Live2D", toggleable: true, class: "my-1.5rem! col" }, {
        //   default: () => vnd(Live2DDemo),
        // }),

        vnd(Panel, { header: "画板", toggleable: true, class: "my-1.5rem! col" }, {
          default: () => vnd("div", {class: "stack-v", id: "the-only-art-board-wrap"}, [
          ]),
        }),

        vnd(Panel, { header: "消息记录", toggleable: true, class: "my-1.5rem! col" }, {

          default: () => vnd("div", {class: "stack-v max-w-640px mx-auto max-h-80vh overflow-auto"}, [

            vnd(Bubble, { content: "这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息", loading: false, placement: "start", avatarProps: { icon: "pi pi-face-smile" } }),

            vnd(Message, { severity: "secondary", size: "small", class: "max-w-80% mx-auto -outline-width-0!", pt: { text: {class: "-fw-400!"}} }, {default:()=>["这是一条系统消息"]}),
            vnd(Message, { severity: "secondary", size: "small", class: "max-w-80% mx-auto -outline-width-0!", pt: { text: {class: "-fw-400!"}} }, {default:()=>["这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息这是一条系统消息"]}),

            vnd(Bubble, { content: "检测到敌情，已开启歼灭模式", loading: false, placement: "start",
              avatarProps: { image: "/js-ai/images/avatar-robot.png", }
            }, {
              header: ()=>vnd("div", {class: "stack-h fw-500 text-red"}, ["陌生机器人"]),
            }),

            vnd(Bubble, { content: "躲在我身后，保护好自己！", loading: false, placement: "start",
              avatarProps: { image: "/js-ai/images/avatar-master.png", }
            }, {
              header: ()=>vnd("div", {class: "stack-h fw-500 text-green"}, ["牛头族大将军"]),
            }),

            vnd(Bubble, { content: "好的…", loading: false, placement: "end",
              avatarProps: { image: "/js-ai/images/avatar-mou.png", }
            }, {
              header: ()=>vnd("div", {class: "stack-h fw-500"}, ["好牛儿"]),
            }),

            vnd(Bubble, { content: "这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息这是一条消息", loading: false, placement: "end", avatarProps: { icon: "pi pi-user" } }),

            vnd(Bubble, { content: "这是一条消息", loading: false, placement: "start", avatarProps: { icon: "pi pi-face-smile" } }, {
              header: ()=>vnd("div", {class: "stack-h"}, ["Assistant"]),
            }),
            vnd(Bubble, { content: "这是一条消息", loading: false, placement: "start" }),

            vnd(Bubble, { content: "这是一条消息", loading: false, placement: "end", avatarProps: { icon: "pi pi-user" } }, {
              header: ()=>vnd("div", {class: "stack-h"}, ["User"]),
            }),
            vnd(Bubble, { content: "这是一条消息", loading: false, placement: "end" }),

          ]),

        }),

        vnd(Panel, { header: "文本输入面板", toggleable: true, class: "my-1.5rem!" }, {
          default: () => vnd("div", {class: "stack-v"}, [
            vnd(Textarea, { fluid: true, modelValue: textBoxContent.value,
              "onUpdate:modelValue": (value: string) => { textBoxContent.value = value; },
            }),
            vnd("div", {class: "stack-h"}, [
              vnd(ToolButton, {icon: "pi pi-send", label: "发送", class: "ml-auto", command: ()=>{
                if (textBoxContent.value.trim() === "") return;
                toast.add({ severity:'info', summary:'添加', detail: `共 ${textBoxContent.value?.length} 字符。`, life: 2000 });
                textBoxContent.value = "";
              }}),
              vnd(ToolButton, {icon: "pi pi-play", label: "运行", command: ()=>{ runCode(textBoxContent.value); }}),
              vnd(ToolButton, {icon: "pi pi-copy", label: "复制", command: ()=>{
                clipboard.copy(textBoxContent.value);
                toast.add({ severity:'info', summary:'已复制', detail: `【${textBoxContent.value?.length} 字符】\n${textBoxContent.value.slice(0,20)}${textBoxContent.value?.length<=20?"":"..."}`, life: 2000 });
              }}),
              vnd(ToolButton, {icon: "pi pi-trash", label: "清空", command: ()=>{ textBoxContent.value = ""; }}),
            ]),
          ]),
        }),

        vnd("div", {
          class: "grid grid-cols-2 gap-4",
        }, [
          vnd(Panel, { header: "JsTool 历史", toggleable: true, class: "my-1.5rem! col" }, {
            default: () => vnd("div", {class: "stack-v"}, [
              vnd(ToolButton, {icon: "pi pi-copy", label: "复制最新结果", command: ()=>{
                clipboard.copy(`【ReturnStart】${JsTool.last()}【ReturnEnd】`);
                toast.add({ severity:'info', summary:'已复制', detail: `已复制 ${`${JsTool.last()}`?.length} 个字符`, life: 2000 });
              }}),
              JSON.stringify(JsTool.history(), null, 2),
            ]),
          }),
          vnd(Panel, { header: "JsTool 缓存", toggleable: true, class: "my-1.5rem! col" }, {
            default: () => vnd("div", {class: "stack-v"}, [
              JSON.stringify(JsTool.__KV__, null, 2),
            ]),
          }),
        ]),

        // vnd(Panel, { header: "文件读取面板", toggleable: true, class: "my-1.5rem!" }, {
        //   default: () => vnd("div", {class: "stack-v"}, [
            // https://tailwindcss.com/docs/hover-focus-and-other-states#file-input-buttons
            vnd(AppFileView, {class: "w-full"}),
        //   ]),
        // }),

        vnd(Panel, { header: "配置", toggleable: true, class: "my-1.5rem!" }, {
          default: () => vnd("div", {class: "grid grid-cols-3 gap-4"}, [

            ["url", "key", "model"].map((iKey, idx)=>vnd(FloatLabel, {
              variant: "on", class: "col-span-3 lg-col-span-1",
            }, { default: ()=>[ vnd(InputText, {
              id: `${iKey}Input`, fluid: true, key: `[${idx}]${iKey}`,
              modelValue: llmOptions[iKey],
              "onUpdate:modelValue": (value: string) => { llmOptions[iKey] = value; },
              ...(iKey === "key" ? { type: "password", } : {}),
            }), vnd("label", {for: `${iKey}Input`}, iKey) ] })),

          ]),
        }),

      ];
    };
  }
})

export default AppRootView;
