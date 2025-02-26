// # pip3 install transformers
// # python3 deepseek_tokenizer.py
// import transformers

// chat_tokenizer_dir = "./"

// tokenizer = transformers.AutoTokenizer.from_pretrained( 
//         chat_tokenizer_dir, trust_remote_code=True
//         )

// result = tokenizer.encode("Hello!")
// print(result)



import { AutoTokenizer } from '@huggingface/transformers';

export async function deepseek_tokenizer_encode(text: string) {
  const tokenizer = await AutoTokenizer.from_pretrained('../deepseek_v3_tokenizer');
  const result = tokenizer.encode(text);
  return result;
}

