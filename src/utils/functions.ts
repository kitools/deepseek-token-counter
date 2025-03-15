
// https://github.com/lenML/tokenizers

import _ from 'lodash';

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
export async function deepseek_tokenizer_encode(
  tokenizer: Awaited<ReturnType<typeof initialize_deepseek_tokenizer>>,
  text: string,
) {
  const codes = tokenizer?.encode?.(text);
  const fragments = codes.map(dd=>tokenizer.decode([dd]));
  return _.zip(codes, fragments);
}

