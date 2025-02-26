// # pip3 install transformers
// # python3 deepseek_tokenizer.py
// import transformers

// chat_tokenizer_dir = "./"

// tokenizer = transformers.AutoTokenizer.from_pretrained( 
//         chat_tokenizer_dir, trust_remote_code=True
//         )

// result = tokenizer.encode("Hello!")
// print(result)



import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';

// https://github.com/lenML/tokenizers

import tokenizerJSON from "@utils/deepseek_v3_tokenizer/tokenizer.json"
import tokenizerConfig from "@utils/deepseek_v3_tokenizer/tokenizer_config.json"

console.log({tokenizerJSON, tokenizerConfig});

const tokenizerName = tokenizerConfig?.tokenizer_class?.replace(/Fast$/, '') ?? 'PreTrainedTokenizer';

let cls = AutoTokenizer.TOKENIZER_CLASS_MAPPING[tokenizerName as keyof typeof AutoTokenizer.TOKENIZER_CLASS_MAPPING];
if (!cls) {
  console.warn(`Unknown tokenizer class "${tokenizerName}", attempting to construct from base class.`);
  cls = PreTrainedTokenizer;
}

const tokenizer = new cls(tokenizerJSON, tokenizerConfig);

export async function deepseek_tokenizer_encode(text: string) {
  const result = tokenizer.encode(text);
  return result;
}

