/* eslint-disable @typescript-eslint/no-explicit-any */

// import { unified } from 'unified';
// import rehypeStringify from 'rehype-stringify'
// import remarkFrontmatter from 'remark-frontmatter'
// import remarkGfm from 'remark-gfm'
// import remarkParse from 'remark-parse'
// import remarkRehype from 'remark-rehype'

// import { reactive } from 'vue';

import markdownit from 'markdown-it';

import { nextTick } from 'vue';
import _ from 'lodash';
import * as zipson from "zipson";
import axios from 'axios';
import { saveAs } from 'file-saver';
import { AiFunc, AiClient } from 'ai-util';
import type { Message, SupplierDict } from 'ai-util';
import db_ from '@src/db';
import { Table } from 'dexie';
import { liveQuery } from "dexie";
import { useObservable } from "@vueuse/rxjs";

import { functionSettings as _functionSettings } from 'ai-util';
import { sleep } from '@utils/sleep';

const functionSettings = _functionSettings as any[];

interface Database {
  records: Table<{ [key: string]: any }, number>;
  kvs: Table<{ [key: string]: any }, number>;
  chats: Table<{ [key: string]: any }, number>;
}
const db = db_ as unknown as Database;

// export const textRenderEngine = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter).use(remarkRehype).use(rehypeStringify);

const md = markdownit({
  breaks: true,
  linkify: true,
});
export const textRenderEngine = {
  process: (text: string) => {
    return md.render(text);
  },
};

export const load = async (key: string) => {
  const value_ = (await db.kvs.get({key}))?.value;
  if (value_ == null) { return null; }
  return zipson.parse(value_);
}
export const save = async (key: string, value: any) => {
  const value_ = zipson.stringify(value);
  await db.kvs.put({id: key, key, value: value_});
};




export const 删除会话 = async (chatData: any) => {
  if (chatData.id!=null) {
    const oldId = chatData.id;
    await db.chats.delete(chatData.id as number);
    chatData.id = undefined;
    return { ok: true, id: oldId };
  }
  return { ok: false };
};
export const 新存会话 = async (chatData: any) => {
  const newId = await db.chats.add(_.cloneDeep({...chatData, id: undefined}));
  chatData.id = newId;
  return { ok: true, id: newId };
};
export const 保存会话 = async (chatData: any) => {
  if (chatData.id!=null) {
    await db.chats.put(_.cloneDeep(chatData));
    return { ok: true, id: chatData.id };
  }
  return 新存会话(chatData);
};
export const 获取全部已保存的会话 = async () => {
  return (await db.chats.toArray())??[];
};
export const 文本化会话 = async (chatData: any) => {
  const systemPrompt = chatData.systemPrompt;
  const text = [`\nsystem\n\n${systemPrompt??""}\n\n---\n`, ...chatData.messages.map((it: any)=>`\n${it.role}\n\n${it.content}\n\n---\n`)].join("\n");
  return text;
};
export const 保存文本化会话 = async (chatData: any) => {
  const text = await 文本化会话(chatData);
  const blob = new Blob([text], {type: "text/plain"});
  saveAs(blob, `[${chatData?.id??"-"}]${chatData?.title??"chat"}(${(new Date).toLocaleString()}).md`);
};



export const getIpAndCountryCode = async () => {
  let ipAndCountryCode = {};
  try {
    await axios.get("https://chat.deepseek.com/api/v0/ip_to_country_code").then(res=>{
      console.log(res);
      ipAndCountryCode = (res?.data?.data?.biz_data);
    });
  } catch (error) {
    console.error(error);
  }
  return ipAndCountryCode;
};


export const 刷新模型列表 = async (supplier: SupplierDict, form: any) => {

  const apiKeyDict = form.apiKeyDict as Record<string, string>;
  const supplierModelsDict = form.supplierModelsDict as Record<string, any>;

  try {
    const Authorization = `Bearer ${apiKeyDict[supplier.name]}`;
    console.log({supplier, apiKeyDict, Authorization});
    let res;
    try {
      res = await axios.get(`${supplier.baseUrl}${supplier.modelsUrl}`);
      console.log(res);
    } catch (err_1) {
      try {
        res = await axios.get(`${supplier.baseUrl}${supplier.modelsUrl}`, {
          headers: {
            Authorization: Authorization,
          },
        });
        console.log(res);
      } catch (err_2) {
        console.warn(err_1);
        console.warn(err_2);
      }
    }
    let models = res?.data?.data??[];
    console.log({models});
    if (!models?.length) {
      models = supplier?.models??[];
    }
    const newSupplierModelsDict = {...supplierModelsDict};
    newSupplierModelsDict[supplier.name] = models;
    // Object.assign(form, {supplierModelsDict: newSupplierModelsDict});
    form.supplierModelsDict = newSupplierModelsDict;
    save("supplierForm", form);
  } catch (error) {
    console.warn(error);
  }
};






// 配置列表 方法 开始
export const 保存配置 = async (item_: {name?: string}, form: any) => {
  const item = _.cloneDeep(item_);
  const list = _.cloneDeep(form.savedSettings);
  let bad = !!functionSettings.find(it=>it.name==item.name);
  while (bad) {
    item.name = `${item.name}*`;
    bad = !!functionSettings.find(it=>it.name==item.name);
  }
  form.functionSetting = item;
  save("functionSetting", item);
  const that = list.find((it: any)=>it.name==item.name);
  if (that==null) {
    list.push(item);
  } else {
    Object.assign(that, item);
  }
  form.savedSettings = list;
  save("savedSettings", list);
};
export const 删除配置 = async (item: {name?: string}, form: any) => {
  form.savedSettings = form.savedSettings.filter((it: any)=>it.name!=item.name);
  save("savedSettings", form.savedSettings);
};
export const 导出全部配置 = async (data: any, fileName?: string) => {
  fileName = fileName ?? `myFunctionSettings(${(new Date).toLocaleString()}).json`;
  const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
  saveAs(blob, fileName);
};
export const 导出当前配置 = async (data: any, fileName?: string) => {
  fileName = fileName ?? `${data?.name??"myFunctionSetting"}(${(new Date).toLocaleString()}).json`;
  const blob = new Blob([JSON.stringify([data])], {type: "application/json"});
  saveAs(blob, fileName);
};
export const 克隆当前配置 = async (data: any, form: any) => {
  const item = _.cloneDeep(data);
  item.name = `${item.name}*`;
  保存配置(item, form);
};
// 配置列表 方法 结束


// 历史记录 数据 开始
export const useDbRecords = (limit: number = 5) => {
  const lastNRecords = liveQuery(() => db.records.orderBy('id').reverse().limit(limit).toArray());
  return ({ lastNRecords: useObservable(lastNRecords as any) });
};
// 历史记录 数据 结束

export const useDbChats = (limit: number = 5) => {
  const lastNChats = liveQuery(() => db.chats.orderBy('id').reverse().limit(limit).toArray());
  return ({ lastNChats: useObservable(lastNChats as any) });
};


// 历史记录 方法 开始
export const 导出全部历史记录 = async () => {
  const 全部历史记录 = (await db.records.toArray())??[];
  const blob = new Blob([全部历史记录.map(JSON.stringify as any).join("\n")], {type: "application/json"});
  saveAs(blob, `records(${(new Date).toLocaleString()}).jsonl`);
}
export const 清空历史记录 = async () => {
  await db.records.clear();
};
// 历史记录 方法 结束



export const 单例脚本 = async (supplier: SupplierDict, apiKey: string, functionSetting: any, taskInput: any, callback?: any, historyMessages?: Message[], otherParams?: any) => {
  const aiFunc = new AiFunc({
    ...functionSetting,
    ai: {
      baseURL: supplier.baseUrl,
      apiKey,
      defaultModel: supplier.defaultModel,
    },
  });
  console.log({supplier, apiKey, functionSetting, taskInput, callback, aiFunc});
  const timeStart = Date.now();
  const result = await aiFunc.doTask(taskInput, historyMessages, otherParams).catch(error=>{
    console.error(String(error));
    console.error(error);
    return {error};
  });
  const timeEnd = Date.now();
  const timeCost = timeEnd - timeStart;
  const report = {result, timeCost, timeStart, timeEnd};
  console.log({report});
  if (callback) { return callback?.(report); }
  return report;
};


export const 单例流式传输脚本 = async (appData: any, supplier: SupplierDict, apiKey: string, functionSetting: any, taskInput: any, callback?: any, historyMessages?: Message[], otherParams?: any) => {
  const aiFunc = new AiFunc({
    ...functionSetting,
    ai: {
      baseURL: supplier.baseUrl,
      apiKey,
      defaultModel: supplier.defaultModel,
    },
  });
  console.log({supplier, apiKey, functionSetting, taskInput, callback, aiFunc});
  const timeStart = Date.now();
  const dogs = aiFunc.doTaskStream(taskInput, historyMessages, otherParams);
  const chunks = [];
  let resultText = "";
  for await (const chunk of dogs) {
    // console.log(chunk);
    if (chunk==null) {continue;}
    if (chunk?.done) {break;}
    resultText += _.isString(chunk) ? chunk : JSON.stringify(chunk);
    chunks.push(chunk);
    appData.result.result = resultText;
  }
  console.log({resultText});
  const timeEnd = Date.now();
  const timeCost = timeEnd - timeStart;

  const result = {result: undefined, error: undefined} as any;
  try {
    const jjj = JSON.parse(resultText);
    console.log({jjj, jjj_str: JSON.stringify(jjj)});
    result.result = jjj;
    // console.warn("ok");
  } catch (error) {
    console.warn("error");
    result.result = resultText;
    result.error = error;
  }
  console.log("result.result", result.result);

  const report = {
    ...result,
    chunks, timeCost, timeStart, timeEnd,
  };
  console.log({report});
  if (callback) { return callback?.(report); }
  return report;
};

export const 单例脚本后存储到历史记录 = async (
  appData: any,
  functionForm: any,
  supplier: SupplierDict,
  apiKey: string,
  dataDog: any,
  historyMessages?: Message[], otherParams?: any
) => {

  const fn = async (report: any)=>{
    // console.log("aaa");
    // console.log({report, report_str: JSON.stringify(report)});
    const result = JSON.parse(JSON.stringify(report));  //JSON.stringify(report, null, 2);
    save("result", result);
    // // console.log("bbb");
    // nextTick(async ()=>{
      // console.log("ccc");
      appData.result = JSON.parse(JSON.stringify(result));
      // // console.log("ddd");
      if (!result?.result?.error) {
        // console.log("eee");
        // console.log({result, result_str: JSON.stringify(result)});
        // console.log("fff");
        dataDog.output = result;
        // console.log({output: dataDog.output, output_str: JSON.stringify(dataDog.output)});
        // console.log("ggg");
        // console.log({dataDog});
        const newId = await db.records.add(_.cloneDeep(dataDog));
        // console.log("hhh");
        appData.lastRecordId = (newId);
        // console.log("zzz");
      }
    // });

    return report;
  };

  if (otherParams?.stream) {
    return 单例流式传输脚本(appData, supplier, apiKey, functionForm?.functionSetting, appData?.taskInput, fn, historyMessages, otherParams);
  }

  const output = await 单例脚本(
    supplier,
    apiKey,
    functionForm?.functionSetting,
    appData?.taskInput,
    fn,
    historyMessages,
    otherParams,
  );
  console.log({output});
  return output;
};

export const 执行单例 = async (
  appData: any,
  supplierForm: any,
  functionForm: any,
  historyMessages?: Message[],
  otherParams?: any,
) => {
  appData.result = {};
  appData.processing = true;
  appData.lastRecordId = null;

  const dataDog = _.cloneDeep({
    supplier: supplierForm?.selectedSupplier?.name,
    function: functionForm?.functionSetting,
    input: appData?.taskInput,
    otherParams,
  });

  const output = await 单例脚本后存储到历史记录(appData, functionForm, supplierForm?.selectedSupplier, supplierForm?.apiKeyDict[supplierForm?.selectedSupplier?.name], dataDog, historyMessages, otherParams);

  appData.processing = false;
  return output;
};

export const 执行流式传输 = 执行单例;

// For multiple updates:
export const updateMessageGradually = (chatData: any, finalText: string) => {
  const chars = finalText.split('');
  let currentText = '';

  chars.forEach((char, index) => {
    setTimeout(() => {
      currentText += char;
      chatData.newMessage = currentText;
    }, index * 50); // 50ms delay between each character
  });
};

export const 执行流式聊天 = async (
  appData: any,
  supplierForm: any,
  chatData: any,
  historyMessages?: Message[],
  otherParams?: any,
  callback?: any,
  emptyInput: boolean = false,
) => {
  appData.processing = true;
  const taskInput = appData?.taskInput ?? "";
  const oldMessages = _.clone(historyMessages);
  const aiClient = new AiClient({
    baseURL: supplierForm?.selectedSupplier?.baseUrl,
    apiKey: supplierForm?.apiKeyDict[supplierForm?.selectedSupplier?.name],
    defaultModel: supplierForm?.selectedSupplier?.defaultModel,
  });

  // chatData.messages.push({role: "user", content: taskInput});

  const timeStart = Date.now();
  const chunks = [];
  let resultText = "";
  for await (const chunk of aiClient.chatStream(taskInput, chatData?.systemPrompt, oldMessages, otherParams, emptyInput)) {
    // console.log(chunk);
    if (chunk==null) {continue;}
    if (chunk?.done) {break;}
    resultText += _.isString(chunk) ? chunk : JSON.stringify(chunk);
    chatData.newMessage = resultText;
    chunks.push(chunk);
    await nextTick();
  };
  const timeEnd = Date.now();
  const timeCost = timeEnd - timeStart;

  const result = {result: undefined, error: undefined} as any;
  try {
    result.result = JSON.parse(resultText);
  } catch (error) {
    result.result = resultText;
    result.error = error;
  }

  await callback?.(result);

  appData.processing = false;

  const report = {
    ...result,
    chunks, timeCost, timeStart, timeEnd,
  };
  console.log({report});
  return report;

};

export const 批处理单轮 = async (
  appData: any,
  supplierForm: any,
  functionForm: any,
  chunk: any[],
  historyMessages?: Message[],
  otherParams?: any,
) => {
  const dataDogs = chunk.map((item) => ({
    supplier: supplierForm?.selectedSupplier?.name,
    function: functionForm?.functionSetting,
    input: item.input,
    batchUnit: item.unit,
    batchIdx: item.idx,
    otherParams,
  }));

  const outputs = await Promise.all(dataDogs.map(async (dataDog)=>{
    const output = await 单例脚本后存储到历史记录(
      appData,
      functionForm,
      supplierForm?.selectedSupplier,
      supplierForm?.apiKeyDict[supplierForm?.selectedSupplier?.name],
      dataDog,
      historyMessages,
      otherParams,
    );
    return output;
  }));
  return outputs;
};
export const 执行批处理 = async (
  appData: any,
  batchConfig: any,
  batchItems: any[],
  supplierForm: any,
  functionForm: any,
  historyMessages?: Message[],
  otherParams?: any,
) => {
  const skip = _.max([batchConfig?.skip??0, 0]);
  let limit = _.min([batchConfig?.limit??Infinity, Infinity]);
  if (limit <= 0) { limit = Infinity; }
  console.log({skip, limit});
  const theItems = batchItems.slice(skip, skip+limit);
  const roundChunks = _.chunk(theItems, batchConfig?.concurrency??1);

  let ii = 0;
  loop1:
  for await (const chunk of roundChunks) {
    const chunkOutputs = await 批处理单轮(appData, supplierForm, functionForm, chunk, historyMessages??[], otherParams);

    const errorOutputs = chunkOutputs.filter((it: any)=>it?.result?.error);
    if (errorOutputs?.length) {
      const retryTimes = batchConfig?.retry??3;
      loop2:
      for (let jj = 0; jj < retryTimes; jj++) {
        const retryDaley = (batchConfig?.retryDaley??10_000) + jj * (batchConfig?.retryDaleyDelta??5_000);
        await sleep(retryDaley);
        const retryChunk = errorOutputs.map(it=>({
          unit: it?.batchUnit,
          idx: it?.batchIdx,
          input: it?.input,
        }));
        const retryOutputs = await 批处理单轮(appData, supplierForm, functionForm, retryChunk, historyMessages??[], otherParams);
        const retryErrorOutputs = retryOutputs.filter((it: any)=>it?.result?.error);
        if (!retryErrorOutputs?.length) { break loop2; }
        if (jj >= (retryTimes-1)) {
          console.error("批处理失败", {errorOutputs, retryOutputs});
          break loop1;
        }
      }
    }

    if (ii < roundChunks.length - 1) { sleep(batchConfig?.delay??700); }
    ii++;
  }

  console.log("批处理完成");
};





