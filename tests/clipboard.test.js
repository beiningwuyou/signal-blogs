import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copyEventText,copyText} from '../src/client/live/api.js';

test('复制包含标题摘要和具体材料，不夹带私有笔记；拒绝或权限悬置不报告成功',async()=>{
  const value=copyEventText({title:'事件标题',summary:'信源摘要',record:{note:'私有判断'},materials:[{source:'原始信源',title:'证据文章',url:'https://example.com/articles/evidence'},{source:'无地址信源',title:'另一个材料',url:null}]});
  assert.match(value,/事件标题/);assert.match(value,/信源摘要/);assert.match(value,/https:\/\/example.com\/articles\/evidence/);assert.match(value,/原文地址缺失/);assert.doesNotMatch(value,/私有判断/);
  let received;
  await copyText(value,{clipboard:{writeText:async text=>{received=text;}}});assert.equal(received,value);
  await assert.rejects(copyText(value,{clipboard:{writeText:async()=>{throw new Error('permission denied');}}}),/permission denied/);
  await assert.rejects(copyText(value,{clipboard:{writeText:()=>new Promise(()=>{})},timeoutMs:20}),/未完成/);
});
