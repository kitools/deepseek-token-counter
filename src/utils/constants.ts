
export const DEFAULT_MODEL = {label:"[[<DEFAULT>]]"};

export const defaultBatchConfig = {
  inputTemplate: "____是谁？",
  slotMark: "____",
  slotMarkIsRegExp: false,
  itemsText: "周杰伦 周星驰 周润发",
  splitter: "[\\s\\n]+",
  splitterIsRegExp: true,

  concurrency: 1,

  showMore: false,
  skip: 0,
  limit: Infinity,
  delay: 700,
  retry: 3,
  retryDaley: 10_000,
  retryDaleyDelta: 5_000,
};

export const defaultTaskMark = "[<[([[TASK]])]>]";
export const defaultReqMark = "[<[([[REQ]])]>]";
export const defaultResMark = "[<[([[RES]])]>]";
export const defaultInstructionTemplate = `
你是一个智能函数，根据用户输入的参数，返回相应的处理结果，并以JSON格式输出。
你的功能是：
\`\`\`[<[([[TASK]])]>]\`\`\`
你接受的输入格式是：
\`\`\`[<[([[REQ]])]>]\`\`\`
你应该返回一个JSON对象，格式是：
\`\`\`[<[([[RES]])]>]\`\`\`
需注意：
- 你是一个函数，只能返回JSON格式，不能返回自然语言内容，也不能附带markdown代码块标记（即三个反引号包裹的块"\\\`\\\`\\\`json...\\\`\\\`\\\`"）。
- 如果需要做出解释，可以在返回的JSON对象中附带_msg字段来说明。但如无必要，不建议这样做。
`.trim();
export const defaultInstructionTemplateEN = `
You are an AI function, which returns the processing result according to the parameters input by the user and outputs in JSON format.
Your task is:
\`\`\`[<[([[TASK]])]>]\`\`\`
The input format you accept is:
\`\`\`[<[([[REQ]])]>]\`\`\`
You should return a JSON object in the format:
\`\`\`[<[([[RES]])]>]\`\`\`
Note:
- You are a function, can only return JSON format, cannot return natural language content, and cannot attach markdown code block tags (i.e. a block wrapped in three backticks "\\\`\\\`\\\`json...\\\`\\\`\\\`").
- If you really want to explain something, you can attach a \`_msg\` sting field in the returned JSON object, but it's not recommended.
`.trim();

