// # pip3 install transformers
// # python3 deepseek_tokenizer.py
// import transformers

// chat_tokenizer_dir = "./"

// tokenizer = transformers.AutoTokenizer.from_pretrained( 
//         chat_tokenizer_dir, trust_remote_code=True
//         )

// result = tokenizer.encode("Hello!")
// print(result)



// import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';
// https://github.com/lenML/tokenizers





// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function load_deepseek_tokenizer(wrapper: {tokenizerJSON: any, tokenizerConfig: any}) {

  const tokenizerJSON = await import("@utils/deepseek_v3_tokenizer/tokenizer.json");
  const tokenizerConfig = await import("@utils/deepseek_v3_tokenizer/tokenizer_config.json");

  wrapper.tokenizerJSON = tokenizerJSON;
  wrapper.tokenizerConfig = tokenizerConfig;

  console.log({tokenizerJSON, tokenizerConfig});

  return wrapper;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initialize_deepseek_tokenizer(wrapper: {tokenizerJSON: any, tokenizerConfig: any, tokenizer: any}) {

  const tokenizerJSON = wrapper.tokenizerJSON;
  const tokenizerConfig = wrapper.tokenizerConfig;

  const tokenizerName = tokenizerConfig?.tokenizer_class?.replace(/Fast$/, '') ?? 'PreTrainedTokenizer';

  const { AutoTokenizer, PreTrainedTokenizer } = await import("@huggingface/transformers");

  let cls = AutoTokenizer.TOKENIZER_CLASS_MAPPING[tokenizerName as keyof typeof AutoTokenizer.TOKENIZER_CLASS_MAPPING];
  if (!cls) {
    console.warn(`Unknown tokenizer class "${tokenizerName}", attempting to construct from base class.`);
    cls = PreTrainedTokenizer;
  }

  const tokenizer = new cls(tokenizerJSON, tokenizerConfig);
  wrapper.tokenizer = tokenizer;
  return tokenizer;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deepseek_tokenizer_encode(tokenizer: any, text: string) {
  const result = tokenizer?.encode?.(text);
  return result;
}

