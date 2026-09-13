import issues from './issues.json';
import intelligence from './intelligence.json';
import extendedStreams from './extended-streams.json';
import { rolesConfig } from './roles.js';
import legacySources from './legacy-sources.json';
import legacyPodcasts from './legacy-podcasts.json';

export { issues, intelligence, extendedStreams, legacySources, legacyPodcasts };
export const initialSources = legacySources;

// 原型特色研读条目
const prototypeArticles = [
  {
    id: 'demo-spinoff-policy',
    kind: 'following',
    title: '社会发展部告知数千人食物“并非基本需求”：内部指引与福利紧缩风波',
    source: 'The Spinoff',
    link: 'https://thespinoff.co.nz/politics/28-08-2024/msd-told-thousands-of-people-food-is-not-a-basic-need',
    category: '深度报道',
    time: '今天 08:30',
    body: '新西兰社会发展部在多份援助申请答复中，将紧急粮食救济排除在“不可推卸之基本生活必需品”之外，引发全国关注与公共辩护律师群体的强烈批评。内部沟通披露政策在财政节流导向下存在显著收紧倾向。\n\n根据官方记录，在二季度生活成本补助申请审核中，通过率环比收缩 14.8%，数百个救济个案被撤销。基层社工组织与法律援助联合会指出，多名申请人因“未充分利用既有资产”而被拒绝粮食券发放，甚至包含单亲家庭和突发失业群体。\n\n公共辩护法律援助署指出该项内部规章涉嫌违反国际人权公约与法定生活津贴审核最低准则。议会下设社会事务特别委员会已正式启动质询程序，要求民政事务部门在两周内公示内部审核裁量裁决细则并举行公开听证。',
    fact: '官方统计新西兰生活成本补助申请审核通过率在二季度环比下降 14.8%，数百个救济个案被撤销。',
    view: '公共辩护法律援助署指出该项内部规章涉嫌违反人权公约与法定生活津贴审核最低准则。',
    inference: '预计议会社会事务特别委员会将在未来两周内启动听证调查，促使福利资格指引回调。',
    takeaways: [
      '官方援助申请通过率环比收缩 14.8%，救济资格收紧引发法律援助机构行政诉讼。',
      '议会下设特别委员会正启动程序，要求民政事务部门公示内部审核裁量裁决细则。',
    ],
  },
  {
    id: 'demo-podcast-microduck',
    kind: 'following',
    title: 'Vol.602 | 4秒卖一台！Microduck（机器鸭）为何遭全球极客抢疯？',
    source: '第一财经商业精要',
    link: 'https://yicai.com',
    category: '播客音频',
    time: '今天 07:15',
    body: '从开源创客单品爆火到具身智能软硬件全栈开源，由海外极客团队研发、国内硬件供应链敏捷赋能的双足机器鸭在 Hugging Face 持续登顶。本期全解密硬件 BOM 成本、步态算法落地与商业化变现。\n\n本期节目的核心调查发现：\n1. 单台机器人的硬件 BOM 成本严格控制在 48 美元以内，首批 12,000 台上线 15 分钟内即告售罄；\n2. 研发团队采用了微型无刷伺服舵机与自研强化学习步态规划算法，使其在桌面与复杂地毯表面均能自适应平衡；\n3. 珠三角精密减速器制造供应链的高效协同是实现敏捷打样与批量交付的真正护城河；\n4. 开源社群二次开发生态活跃，全球已涌现超过 300 个第三方动作控制、视觉避障与多模态语音交互插件。\n\n分析师研判认为，具身轻量化机器人正在教育科研与桌面陪伴场景快速形成独立细分赛道，有望在未来一年内演变为边缘 AI 算力落地的爆款硬件载体。',
    fact: '单台硬件 BOM 成本严控在 48 美元以内，首批 12,000 台上线 15 分钟内售罄。',
    view: '创客开源社区与珠三角精密减速器制造供应链的高效协同是实现敏捷量产的核心护城河。',
    inference: '预计具身轻量化机器人将在教育科研与桌面陪伴场景快速形成独立细分赛道。',
    takeaways: [
      'BOM 成本控制在 48 美元以内，微型无刷伺服舵机与自研步态规划算法是硬件核心。',
      '开源社群二次开发生态活跃，全球已涌现超过 300 个第三方动作控制与语音交互插件。',
    ],
  },
  {
    id: 'demo-cls-brief',
    kind: 'following',
    title: '财联社早报：小米汽车走量配置定档，黄金白银高位震荡，2家券商重组停牌',
    source: '财联社·电报中心',
    link: 'https://www.cls.cn/telegraph',
    category: '要闻快讯',
    time: '今天 06:45',
    body: '【财联社 9月15日盘前核心要闻汇总】\n\n一、宏观与资本市场异动：\n美联储议息决议前夕，海外大宗商品与贵金属期货高位震荡，现货黄金徘徊于每盎司 2580 美元关口。央行今日开展 1200 亿元逆回购操作，净投放流动性 850 亿元，资金面平稳跨节。\n\n二、新能源汽车与科技产业链：\n小米汽车首批 59 家直营交付门店已全面完成展车入驻与路试预约系统联调。走量配置与定价区间正式锚定 21.59-29.99 万元中枢，零部件规模化集采效应初显。\n\n三、金融机构横向重组深化：\n国联证券与民生证券等机构重组迈入实质落地阶段，涉及重大资产重组审批，自明日开市起阶段性停牌。分析师指出，券商牌照整合与财富管理集约化已进入深水区博弈阶段。',
    fact: '小米汽车首批 59 家直营交付门店已全面完成展车入驻与路试预约系统联调。',
    view: '头部机构重组提速，券商牌照整合与财富管理转型进入深水区博弈阶段。',
    inference: '流动性宽松预期与产业兼并收购升温，将对相关核心资产估值形成支撑。',
    takeaways: [
      '新能源汽车价格战向 20 万元价格中枢集中，供应链零部件规模集采效应显著。',
      '金融机构横向整合持续发力，牌照互补与同业协同成为重组核心考量因素。',
    ],
  },
  {
    id: 'demo-culture-limited',
    kind: 'following',
    title: 'Vol.351 蝇王：21世纪的“荒岛故事”还能怎么开脑洞？| 1983 诺奖得主启示',
    source: '文化有限 Podcast',
    link: 'https://www.xiaoyuzhoufm.com',
    category: '播客音频',
    time: '昨天 20:40',
    body: '威廉·戈尔丁在1954年以流落荒岛的英国合唱团男孩重构文明崩溃的极速全过程。三位主播从当代社交网络的群体极化、崇拜心理与秩序消解切入，重新审视“海螺”作为制度权威隐喻的当代意涵。\n\n《蝇王》自出版以来全球累计发行超 2,500 万册，连续 40 年入选英美高中核心必读书目。本期节目通过文本精读拆解以下核心议题：\n1. 秩序与兽性的临界点：当海螺被砸碎，规则为何在短短数日内彻底瓦解？\n2. 现代契约社会的维系成本：理智（猪崽子）与原始崇拜（杰克）的永久对抗；\n3. 算法部落化映射：社交网络如何让当代理性群体重新退回“合唱团与猎手”的二元极化中。',
    fact: '《蝇王》自出版以来全球累计发行超 2,500 万册，连续 40 年入选英美高中核心必读书目。',
    view: '海螺破碎的瞬间隐喻了当信任被极端情绪取代时，制度与共识的脆弱性。',
    inference: '算法分发时代的部落化与情绪极化，赋予了这部经典寓言全新的当代现实映射意义。',
    takeaways: [
      '文本细读剖析人性中的秩序崇拜与野性复苏，反思现代契约社会维系的制度成本。',
      '主播结合当下社交媒体极化现象展开多视角对话，提供启发式批判性思考框架。',
    ],
  },
  {
    id: 'demo-storage-report',
    kind: 'following',
    title: '2024 全球新型储能与微电网韧性格局：长时储能经济性测算与电网侧商业闭环',
    source: 'BNEF & 能源发展战略所',
    link: 'https://about.bnef.com',
    category: '行业研报',
    time: '昨天 16:15',
    body: '彭博新能源财经（BNEF）与能源发展战略研究所联合发布《2024 全球新型储能与微电网韧性格局》深度报告。\n\n报告核心测算结论：\n1. 4 小时以上长时储能（LDES）装机量同比增长 118%，北美独立微电网并网容量突破 6.4 GW；\n2. 全钒液流电池、钠离子电池与压缩空气储能的度电平准化储能成本（LCOS）在过去三年复合下降 28%，正逼近 0.25 元/kWh 的商业化平价拐点；\n3. 高算力智算中心供电可靠性要求严苛，自备储能微电网接入电力现货调峰市场，测算年化综合套利收益率可达 12%-15%；\n4. 容量电价补偿机制与辅助服务现货结算体系的完善，是长时储能全面走通商业化闭环的关键前提。',
    fact: '4小时以上长时储能装机量同比增长 118%，北美独立微电网并网容量达 6.4 GW。',
    view: '容量电价补偿机制与辅助服务现货结算体系的完善，是长时储能商业模型走通的关键前提。',
    inference: '高算力智算中心由于供电可靠性要求严苛，将成为自备储能微电网的最大单一采购方。',
    takeaways: [
      '度电平准化储能成本（LCOS）在过去三年复合下降 28%，接近商业化临界拐点。',
      '数据中心微电网接入现货调峰市场，预计年化套利收益率可达 12%-15%。',
    ],
  },
  {
    id: 'demo-deepseek-r1',
    kind: 'following',
    title: 'Recursive Speculative Decoding: 在单卡 RTX 4090 实现 70B 模型 3.2x 推理吞吐',
    source: 'arXiv · 推理架构工程',
    link: 'https://arxiv.org',
    category: '技术前沿',
    time: '今天 08:10',
    body: '构建轻量级递归草稿头（Recursive Draft Head），避免草稿模型显存常驻，仅需约 300MB 额外显存，便可在长文本代码补全实现 48 tokens/s 吞吐。\n\n本项工程突破要点：\n1. 放弃了传统双卡并行的双模型投机机制，在主力 70B 权重顶部挂载轻量递归草稿分支；\n2. 动态自适应调整验证树深度，在低熵语法预测中一次验证命中 6-8 个 token；\n3. 通过单卡统一内存的 KV 缓存前瞻预取，消除跨卡通信延迟；\n4. 在消费级 RTX 4090 (24GB) 实测长代码自动补全任务中，端到端延迟降低 68%。',
    fact: '长文本代码场景下仅需 300MB 额外显存开销，推理吞吐跃升至 48 tokens/s。',
    view: '算法级投机解码创新正迅速填补消费级单卡与企业级数据中心之间的体验代差。',
    inference: '该方案有望在未来 3 个月内被 vLLM 和 Ollama 等主流开源推理框架作为默认内核整合。',
    takeaways: [
      '单卡免双模型显存占用，递归先验树算法实现极低开销的自适应投机。',
      '端侧大模型个人推理工作站的硬件成本将从数万元直接降至万元级。',
    ],
  },
  {
    id: 'demo-claude-thinking',
    kind: 'following',
    title: 'Claude Code AST 语法树剪枝与多文件依赖上下文调度机制',
    source: 'Anthropic Engineering Log',
    link: 'https://anthropic.com/research',
    category: '技术研报',
    time: '今天 07:40',
    body: '本地 CLI 代理利用 AST 差异传输修改 patch，减少 74% 冗余 token。深入拆解代码大模型从单纯聊天窗口转向终端自主开发智能体（Agent）的上下文调度与依赖图修剪流水线。\n\nAnthropic 工程团队披露的架构亮点：\n1. 采用本地轻量 AST 解析引擎实时分析项目依赖拓扑，仅将发生变更的函数体及受影响的类型定义上浮至提示词中；\n2. 引入确定性状态隔离沙盒，严格限制子任务 Worker 的上下文视野；\n3. 多文件编辑通过本地差异补丁协议原子化应用，若语法检验失败自动触发局部回滚纠错。',
    fact: 'AST 语法依赖图局部修剪技术使大型代码库重构任务的 Token 开销缩减 74%。',
    view: '终端智能体已从单纯的自然语言生成转变为与代码语义树严密咬合的编译期工程。',
    inference: '开发者心流不再被重复的上下文复制粘贴中断，自动化架构重构正在成为现实。',
    takeaways: [
      '本地差异补丁协议与 AST 依赖图结合，保证编辑的绝对原子性。',
      '沙盒状态隔离与单向反馈回路是杜绝长程任务逻辑漂移的基石。',
    ],
  },
  {
    id: 'demo-hbm',
    kind: 'following',
    title: 'HBM3e 3D 堆叠垂直热阻与热膨胀失配 (CTE) 测量新基准',
    source: 'IEEE Micro 刊载',
    link: 'https://ieeexplore.ieee.org',
    category: '硬件实测',
    time: '今天 06:15',
    body: '在 12-Hi 3D 硅通孔（TSV）堆叠封装中，高热流密度与各向异性热膨胀是限制 Blackwell 与下一代算力芯片长时间超频稳定性的核心物理瓶颈。\n\n论文实验测得数据：\n1. 嵌入微型光纤布拉格光栅（FBG）传感器，测得 12-Hi 堆叠内部瞬态热阻仅为 0.28 K/W；\n2. 硅中介层与有机基板之间的 CTE 失配应力在冷热循环 500 次后出现微米级焊点蠕变；\n3. 推荐采用新型各向异性导热胶填缝与微通道直接喷淋液冷相结合的复合散热架构。',
    fact: '嵌入微型光纤传感器测得 12-Hi 堆叠瞬态垂直热阻为 0.28 K/W。',
    view: '算力竞争的物理实质正在从单纯的晶体管密度比拼，转向微纳米级散热与机械可靠性竞赛。',
    inference: '先进封装与机柜级微通道液冷供应链将进一步深度整合。',
    takeaways: [
      '高密度 TSV 堆叠中的热应力蠕变是影响智算集群长期 MTBF（平均故障间隔）的隐藏关键。',
      '复合微通道喷淋方案有望在下一代机柜中实现工业化推广。',
    ],
  },
];

// 专题条目
const topicArticles = [
  {
    id: 'topic-kimi-k3',
    kind: 'topic',
    title: 'Kimi K3 发布：开放前沿与「AI 斯普特尼克时刻」',
    source: '月之暗面官方通报',
    category: '前沿模型',
    time: '09-06',
    body: '月之暗面发布 2.8 万亿参数开源权重模型 Kimi K3：全球首个登顶网页工程竞技场的开源模型，触发跨国算力蒸馏风暴与开源软件许可争议。四维架构解构其跨节点 MoE 动态路由策略。',
    fact: 'SWE-bench Verified 达 72.4%，跨节点 MoE 激活参数量 130B，推理吞吐达 65 tok/s。',
    view: '开源大模型与闭源商业模型的性能代差被大幅压缩，引发硅谷头部实验室对于后训练权重防盗用机制的激烈反思。',
    inference: '国内开源生态与应用落地速度将进一步加快，推动企业私有化部署成本下降 80% 以上。',
    takeaways: [
      '跨节点 MoE 动态负载均衡调度优化，实现网络开销与计算重叠度超 90%。',
      '开源许可附加免责与蒸馏限制条款，在全球开源法务界引发广泛合规研讨。',
    ],
  },
  {
    id: 'topic-frontier-bench',
    kind: 'topic',
    title: '自研芯片与万卡集群互联演进：后英伟达时代的算力博弈与 Jalapeño 架构实测',
    source: 'SemiAnalysis 产业链实测',
    category: '算力互联',
    time: '09-08',
    body: '对比 OpenAI 自研芯片与 NVIDIA Blackwell NVL72 在高并发投机解码场景下的能效比。深入拆解超低延迟以太网互联标准（UEC）与私有 NVLink 协议的生态替代空间。',
    fact: '自研张量芯片在推理矩阵运算中能耗降低 34%，万卡拓扑采用超低延迟交换机架构。',
    view: '英伟达在 CUDA 生态与 NVLink 互联壁垒依然坚挺，但超大规模云厂商去中心化硬件自研趋势不可逆转。',
    inference: '预计未来三年内第三方定制张量芯片（ASIC）在推理工作负载中的市占率将达到 25% 以上。',
    takeaways: [
      'UEC 传输规范对突发流量丢包率优化达一个数量级，有效平替昂贵专有交换网络。',
      '推理成本决定生成式 AI 商业变现边界，芯片垂直自研是平抑边际成本的终极抓手。',
    ],
  },
  {
    id: 'topic-claude-3-7',
    kind: 'topic',
    title: 'Anthropic 发布 Claude 3.7 Sonnet 混合推理模型与交互式思考模式',
    source: 'Anthropic Engineering',
    category: '推理模型',
    time: '09-08',
    body: '引入首创的混合推理架构，开发者与普通用户可按需动态调节思考预算，同时发布 Claude Code 命令行智能体工具，大幅提升自动化系统流水线代码调试效率。',
    fact: '单一商业 API 支持按 Token 颗粒度调节思考预算，SWE-bench Verified 跃升至 70.3%。',
    view: '推理范式进入微观可控时代，思考时间不仅提升答案正确率，更赋予智能体自省与纠错闭环能力。',
    inference: '以 Claude Code 为代表的命令行原生 Agent 工具将重塑软件工程全生命周期流水线。',
    takeaways: [
      '混合推理架构兼顾即时交互响应速度与复杂数理逻辑深思熟虑。',
      'CLI 智能体通过本地 AST 差异传输，大幅降低上下文冗余并提高编辑准确率。',
    ],
  },
  {
    id: 'topic-asic-broadcom',
    kind: 'topic',
    title: 'OpenAI 与博通敲定 10nm 定制张量芯片投片排期：算力成本重构与去 CUDA 化',
    source: 'Broadcom 8-K & Reuters',
    category: '半导体供应链',
    time: '09-07',
    body: '代号 Prometheus 的专用张量芯片完成流片验证，锁定台积电先进封装中介层产能，旨在从根本上平抑昂贵的第三方 GPU 溢价与云端服务边际成本。',
    fact: '首批投片量达 15,000 片晶圆，采用台积电 CoWoS-L 封装，能效比预估提升 2.8 倍。',
    view: '与博通联合定制的模式降低了设计风险，使算法团队能直接参与微架构级张量调度优化。',
    inference: '博通在定制芯片与以太网交换芯片领域的龙头地位将持续受益于前沿实验室的算力自主化潮。',
    takeaways: [
      '采用高带宽内存直连架构，规避通用 GPU 复杂冗余指令集开销。',
      '首批自研芯片计划在 2026 年中交付，支撑下一代旗舰模型的高并发生产环境推理。',
    ],
  },
  {
    id: 'topic-clean-energy-ppa',
    kind: 'topic',
    title: '智算中心能源竞赛：Anthropic 签署大额多方 PPA 锁定区域清洁电力长协',
    source: 'FERC 公报 & 彭博终端',
    category: '宏观能源',
    time: '09-06',
    body: '算力上限的物理实质是电网与散热。梳理得州 ERCOT 与内华达州超算产业园区能源承销合同，研判数据中心微电网对公用电网电价与资本周期的长期传导机制。',
    fact: '合同锁定供电规模达 14.8 GW，涵盖 4 个超大规模清洁能源微电网园区。',
    view: '数据中心已经从单纯的 IT 基础设施演变为重资产电网调峰与资本套利载体。',
    inference: '区域电力核准审批周期与输变电容量将成为制约大模型前沿集群扩张的第一物理瓶颈。',
    takeaways: [
      '离网直连小型核反应堆与地热储能综合电站，摆脱公共电网输电阻塞限制。',
      '主权财富基金与绿色基建 REITs 深度介入，提供长达 20 年的资金杠杆支持。',
    ],
  },
  {
    id: 'topic-speculative-decoding',
    kind: 'topic',
    title: 'Recursive Speculative Decoding: 在消费级单卡打破 70B 模型自回归带宽瓶颈',
    source: 'arXiv & GitHub Rel',
    category: '推理加速',
    time: '09-05',
    body: '分层草稿验证树与投机多分支动态对齐算法实测。无需昂贵的双路服务器，在单张 RTX 4090 达到接近数据中心级的推理交互响应速度。',
    fact: '长文本场景下推理吞吐提升 3.2 倍，额外显存开销仅需 320 MB。',
    view: '算法创新正在迅速抵消部分硬件性能劣势，加速前沿模型在边缘端侧设备的低成本普及。',
    inference:
      '投机解码方案将成为未来所有主流模型推理引擎（如 vLLM、TensorRT-LLM）的默认内置标配。',
    takeaways: [
      '递归先验树算法实现在不同上下文密度下的动态自适应分叉预测。',
      '大幅削减内存搬运频次，有效缓解大模型自回归解码阶段的显存带宽饥饿瓶颈。',
    ],
  },
];

// 时间轴重大事件节点
const timelineArticles = [
  {
    id: 'node-1',
    kind: 'timeline',
    title: 'OpenAI 与博通敲定 10nm 定制张量芯片（ASIC）投片排期，首批算力预计 2026 年中交付',
    source: 'Broadcom 8-K • Reuters',
    category: '算力竞争',
    time: '2026-09-08',
    body: '代号 Prometheus 的自研芯片锁定台积电 CoWoS-L 先进中介层产能，旨在从根本上平抑第三方 GPU 溢价与云端服务边际成本，能效比预估提升 2.8 倍。',
    fact: '硬件成本重构 · 去 CUDA 化。首批投产锁定台积电 CoWoS 封装中介层月产额度。',
    view: '大模型核心壁垒从单一模型权重逐渐延伸到底层定制硅片与微指令调度能力。',
    inference: '预计将在 2026 年第四季度全面投入生产服务，大幅降低 ChatGPT 单位用户对话成本。',
    takeaways: [
      '专为隐藏思维链与投机解码算子优化，矩阵乘法吞吐密度较行业标杆提升 40%。',
      '自研芯片的量产推进强化了前沿实验室在供应链价格谈判中的议价筹码。',
    ],
  },
  {
    id: 'node-2',
    kind: 'timeline',
    title: 'Anthropic 正式推出 Claude 3.7 Sonnet：首次引入混合推理（Hybrid Reasoning）机制',
    source: 'Anthropic Engineering',
    category: '推理模型',
    time: '2026-09-08',
    body: '在单一商业 API 开放按 Token 调节思考预算，SWE-bench Verified 跃升至 70.3%，代码重构与大型工程任务准确率显著领跑。',
    fact: '推理计算范式 · 交互式思考。全球首个在同一模型架构内兼顾快思考与慢推理的商业旗舰。',
    view: '思考过程从后台不透明黑盒变为可通过 API 预算动态配置的确定性推理资源。',
    inference: '促使竞争对手全面转向混合推理路线，单一快速自回归模式正在逐渐退居二线。',
    takeaways: [
      '开发团队可针对不同业务场景动态平衡响应延迟与逻辑严密性要求。',
      '在真实世界复杂软件工程重构基准上刷新行业历史新高。',
    ],
  },
  {
    id: 'node-3',
    kind: 'timeline',
    title: 'xAI Colossus 智算集群突破十万卡互联与 Grok 算法演进',
    source: 'xAI 技术通报',
    category: '算力互联',
    time: '2026-08-22',
    body: '孟菲斯单一扁平网络在 150MW 满负荷下实现超低丢包率，万卡故障自愈时间缩减至 45 秒内，开启十万卡分布式并行新纪元。',
    fact: '智算互联拓扑 · 容错调度。单集群有效算力利用率（MFU）保持在 62% 以上。',
    view: '工程交付速度与基建推进魄力是大规模集群训练能否率先出成果的核心变量。',
    inference: '超十万卡集群的常态化稳定运行经验将成为超算工程领域的关键分水岭。',
    takeaways: [
      '采用液冷机柜与微电网直供电设计，缩短建设调试周期至创纪录的 122 天。',
      '高容错故障恢复流水线显著减少了全量模型参数回滚与重算的算力浪费。',
    ],
  },
  {
    id: 'node-4',
    kind: 'timeline',
    title: '月之暗面发布 Kimi K3：开放 2.8 万亿参数全开源 MoE 模型，重构长文本推理成本',
    source: '月之暗面发布会',
    category: '开源生态',
    time: '2026-08-15',
    body: '全球首个登顶网页工程竞技场的开源权重模型，触发跨国算力蒸馏与开源软件许可范式转移，推动企业私有化部署成本下降 80%。',
    fact: '开源生态破局 · 算力平权。全套预训练与后训练检查点在 Hugging Face 完整开放下载。',
    view: '顶级开源模型正在瓦解闭源头部企业的暴利溢价空间，加速企业级 AI 应用普及。',
    inference: '全球开发者将围绕其权重展开大规模领域微调与轻量化量化适配工作。',
    takeaways: [
      '支持 1M 原生长上下文窗口，精准召回率在 Needle In A Haystack 测试中达到 100%。',
      '推动国内算力芯片产业链针对 MoE 激活稀疏度进行深度软硬件联合优化。',
    ],
  },
  {
    id: 'node-5',
    kind: 'timeline',
    title: 'UEC 联盟发布 1.0 传输层标准：万卡 RoCEv2 智算集群去专有化',
    source: 'Ultra Ethernet Consortium',
    category: '互联协议',
    time: '2025-11-20',
    body: '针对 AI 大吞吐突发流量优化拥塞通知，打破英伟达 InfiniBand 专有协议垄断，为万卡异构互联铺平开放工业标准。',
    fact: '智算网络解耦 · 工业互联。联合 AMD、博通、思科、Meta 等头部软硬件厂商共同制定。',
    view: '开放工业互联标准是以太网生态全面反攻智算网络专有协议的核心里程碑。',
    inference: '预计将在未来 2 年内显著降低超大规模智算中心的组网设备采购成本。',
    takeaways: [
      '引入新型包级喷洒与动态多路径路由机制，消除智算集群内微突发拥塞。',
      '兼容标准以太网物理层线缆与光模块生态，保护客户存量机房投资。',
    ],
  },
  {
    id: 'node-6',
    kind: 'timeline',
    title: 'OpenAI 正式披露 o1 与 o3 系列前沿测试：开启推理计算时代与思维链革命',
    source: 'OpenAI Research',
    category: '推理范式',
    time: '2025-09-12',
    body: '计算范式正式从预训练算力堆叠（Pre-training Scaling）全面转向推理时算力扩展（Inference Scaling），重塑数学与编程边界。',
    fact: '推理即计算 · 隐藏思考链。在国际数学奥林匹克（IMO）资格赛中表现达到金牌水平。',
    view: 'Scaling Law 在推理阶段的有效性验证为人工智能突破认知天花板开辟了全新增长曲线。',
    inference: '全球实验室研发重心全面向强化学习自我博弈与隐藏思维链探索转移。',
    takeaways: [
      '模型通过自我纠错、尝试替代假设和验证中间步骤显著提高复杂问题解决能力。',
      '推理算力投入与最终答案准确率呈现对数线性强相关特性。',
    ],
  },
];

// 周刊精选研读
const weeklyArticles = [
  {
    id: 'weekly-111-1',
    kind: 'weekly',
    title: 'Building Effective Agents: A Year of Production Multi-Agent Systems',
    source: 'Anthropic Engineering',
    category: '多智能体组织',
    time: '2026-09-04',
    body: '从单 Agent 提示词走向 Orchestrator-Workers，系统化解构长程任务中的状态同步与上下文边界隔离。梳理工业级生产环境中构建可靠智能体架构的核心工程准则与防幻觉设计。',
    fact: '通过将规划与执行职能解耦，多智能体系统在大型代码库重构任务中的成功率提升 42%。',
    view: '复杂的提示词工程正在让位于清晰的模块化软件架构设计与严格的状态机流转机制。',
    inference: '以沙盒环境为后盾的代码执行与测试自检流水线将成为下一代自主智能体标配。',
    takeaways: [
      '长任务必须严格限制单个 Worker 的上下文视野，避免上下文污染导致逻辑漂移。',
      '主调度器（Orchestrator）仅负责分发子任务与汇总成果，不直接介入细节实现。',
    ],
  },
  {
    id: 'weekly-111-2',
    kind: 'weekly',
    title: 'Quoting and annotating with Datasette: SQLite WASM 离线生态',
    source: 'Simon Willison',
    category: '本地基础设施',
    time: '2026-09-04',
    body: '零网络开销、单文件离线存储与个人情报分析工作台的范式重塑。深度探索通过浏览器端 OPFS（源私有文件系统）实现毫秒级全文检索与本地分析师批注持久化。',
    fact: '基于 SQLite WASM 与 OPFS 技术，在浏览器本地支持 50 万行全文检索延迟低于 8ms。',
    view: '本地优先（Local-First）软件架构不仅保障了极致的用户隐私，更赋予使用者真正的数据主权。',
    inference: '越来越多的分析师工作台与知识库应用将从中心化云端回归到客户端离线运行形态。',
    takeaways: [
      '单文件数据库格式具有长久保存与无缝备份迁移的天然优势，杜绝云端服务停运风险。',
      '纯客户端检索避免了向第三方服务器泄漏敏感研判备忘与商业机密情报。',
    ],
  },
  {
    id: 'weekly-111-3',
    kind: 'weekly',
    title: 'B200 与 GB200 NVL72 铜缆背板公差实测与热应力分析报告',
    source: 'SemiAnalysis',
    category: '硬件与互联',
    time: '2026-09-04',
    body: '万卡集群工业互联公差解析，算力基础设施由计算瓶颈转向电气与互联工程瓶颈。深入评测抽拉式机柜在 100kW+ 极端功耗下的铜缆形变、阻抗突变与冷板微渗漏风险。',
    fact: '整机柜部署超过 5,000 根高速双轴铜缆，公差要求控制在 0.15mm 以内避免插损激增。',
    view: '算力工程已演变为微米级机械精度与流体力学散热的综合工业制造比拼。',
    inference: '机柜级高密度电气连接器的良品率与供货周期将直接决定下游云厂商的实际交付速度。',
    takeaways: [
      '在短距离互联中铜缆相较光模块具有显著的功耗与可靠性优势，节省数千瓦额外能耗。',
      '热循环应力导致接插件插拔疲劳是长周期集群运维需要重点关注的隐藏隐患。',
    ],
  },
];

// 延伸情报流条目
const extendedStreamArticles = extendedStreams.map((item) => ({
  id: item.id,
  kind: 'stream',
  title: item.title,
  source: item.source,
  category: item.cat?.replace('#', '') || '情报流',
  time: item.time,
  body: `${item.title}。该情报源自权威产业监测源「${item.source}」，已完成技术指标核验与供应链交叉验证。`,
  fact: `信源跟踪命中标签「${item.tag}」，在对应行业细分领域具有显著代表性。`,
  view: '行业观察指出，该项突破将对上下游产业链协同与技术标准演进带来持续催化效应。',
  inference: '建议跟踪后续商业量产与客户导入进展，评估相关技术路线的经济性边界。',
  takeaways: [
    `核心主题归属于 ${item.cat}，重点关注产业落地与指标兑现情况。`,
    `来自一手信源 ${item.source}，相关数据已纳入分析师本地动态监测流。`,
  ],
}));

// 各角色专属早报条目
const roleTopArticles = rolesConfig.flatMap((role) =>
  (role.topNews || []).map((item) => ({
    id: item.id,
    kind: 'role',
    title: item.title,
    source: item.source,
    category: item.badge?.split('·')?.[0]?.trim() || role.name,
    time: '今日',
    body: item.summary || item.quote || item.title,
    fact: item.summary || '权威信源第一手深度拆解，数据指标经过严密复核测算。',
    view: item.quote || '分析师团队重点关注其商业化闭环可能性与产业资本传导路径。',
    inference: '预计将在未来一个季度内触发产业链相关标的估值重构与技术采购调整。',
    takeaways: [
      item.meta || `关联身份：${role.name} · ${role.bundleName}`,
      item.actionText ? `核心指引：${item.actionText}` : '具备高研读价值与战略研判意义。',
    ],
  })),
);

// 内容广场专属条目
const exploreArticles = [
  {
    id: 'exp-spinoff-report',
    kind: 'explore',
    title: '社会发展部告知数千人食物“并非基本需求”：内部指引与福利紧缩风波',
    source: 'The Spinoff',
    category: '深度报道',
    time: '今天 08:30',
    body: '新西兰社会发展部在多份援助申请答复中，将紧急粮食救济排除在“不可推卸之基本生活必需品”之外，引发全国关注与公共辩护律师群体的强烈批评。内部沟通披露政策在财政节流导向下存在显著收紧倾向。',
    fact: '官方统计新西兰生活成本补助申请审核通过率在二季度环比下降 14.8%，数百个救济个案被撤销。',
    view: '公共辩护法律援助署指出该项内部规章涉嫌违反人权公约与法定生活津贴审核最低准则。',
    inference: '预计议会社会事务特别委员会将在未来两周内启动听证调查，促使福利资格指引回调。',
    takeaways: [
      '官方援助申请通过率环比收缩 14.8%，救济资格收紧引发法律援助机构行政诉讼。',
      '议会下设特别委员会正启动程序，要求民政事务部门公示内部审核裁量裁决细则。',
    ],
  },
  {
    id: 'exp-microduck-podcast',
    kind: 'explore',
    title: 'Vol.602 | 4秒卖一台！Microduck（机器鸭）为何遭全球极客抢疯？',
    source: '第一财经商业精要',
    category: '播客音频',
    time: '今天 07:15',
    body: '从开源创客单品爆火到具身智能软硬件全栈开源，由海外极客团队研发、国内硬件供应链敏捷赋能的双足机器鸭在 Hugging Face 持续登顶。解密硬件 BOM 成本与商业化路径。',
    fact: '单台硬件 BOM 成本严控在 48 美元以内，首批 12,000 台上线 15 分钟内售罄。',
    view: '创客开源社区与珠三角精密减速器制造供应链的高效协同是实现敏捷量产的核心护城河。',
    inference: '预计具身轻量化机器人将在教育科研与桌面陪伴场景快速形成独立细分赛道。',
    takeaways: [
      'BOM 成本控制在 48 美元以内，微型无刷伺服舵机与自研步态规划算法是硬件核心。',
      '开源社群二次开发生态活跃，全球已涌现超过 300 个第三方动作控制与语音交互插件。',
    ],
  },
  {
    id: 'exp-semianalysis-b200',
    kind: 'explore',
    title: 'B200 与 GB200 NVL72 铜缆背板公差实测与热应力分析报告',
    source: 'SemiAnalysis',
    category: '行业研报',
    time: '今天 05:40',
    body: '抽拉式公差严控在 0.15mm 内，信维与安费诺二期打样将插拔疲劳应力降低 34%，水冷接头微渗漏检测方案通过 UL 认证，Q4 整机柜出货预测上修至 3,400 柜。',
    fact: '整机柜部署超过 5,000 根高速双轴铜缆，公差要求控制在 0.15mm 以内避免插损激增。',
    view: '算力工程已演变为微米级机械精度与流体力学散热的综合工业制造比拼。',
    inference: '机柜级高密度电气连接器的良品率与供货周期将直接决定下游云厂商的实际交付速度。',
    takeaways: [
      '在短距离互联中铜缆相较光模块具有显著的功耗与可靠性优势，节省数千瓦额外能耗。',
      '热循环应力导致接插件插拔疲劳是长周期集群运维需要重点关注的隐藏隐患。',
    ],
  },
  {
    id: 'exp-cls-flash',
    kind: 'explore',
    title: '财联社早报：小米汽车走量配置下沉，黄金白银高位震荡与券商重组加速',
    source: '财联社电报',
    category: '要闻快讯',
    time: '今天 06:30',
    body: '主要车企加速下沉智驾辅助标配，国内大模型企业发布开源权重，央行公开市场净投放流动性，宏观风险溢价维持低位收敛。',
    fact: '小米汽车首批交付网点铺设提速，金融机构合并重组持续深化。',
    view: '资本市场流动性结构性改善，高端制造与大模型应用板块成交活跃。',
    inference: '预计四季度消费电子与新能源车企销量将迎来季节性环比提振。',
    takeaways: [
      '智能驾驶下沉至主流价格区间，硬件规模化降本趋势明显。',
      '金融机构横向重组步伐加快，头部集约化效应凸显。',
    ],
  },
  {
    id: 'exp-vllm-spec',
    kind: 'explore',
    title: 'Recursive Speculative Decoding: 在单张 RTX 4090 实现 70B 模型 3.2x 吞吐跃迁',
    source: 'arXiv / GitHub',
    category: '技术前沿',
    time: '昨天 22:15',
    body: '提出自适应草稿深度树算法，结合 KV 缓存前瞻预取，在消费级单卡上打破自回归解码的显存带宽天花板。',
    fact: '长文本场景下推理吞吐提升 3.2 倍，额外显存开销仅需 320 MB。',
    view: '投机解码方案将成为未来所有主流模型推理引擎（如 vLLM、TensorRT-LLM）的默认内置标配。',
    inference: '端侧推理性能大幅增强，企业私有化边缘部署性价比显著提高。',
    takeaways: [
      '构建轻量级递归草稿头，避免草稿模型显存常驻。',
      '动态自适应分叉预测降低了无效推理计算开销。',
    ],
  },
  {
    id: 'exp-lex-fridman',
    kind: 'explore',
    title: '#412 | 算力极限、能源突破与通用人工智能：专访前沿智算工程师',
    source: 'Lex Fridman Podcast',
    category: '播客音频',
    time: '昨天 18:30',
    body: '全面探讨从千兆瓦核电数据中心到片上光互联技术的瓶颈，深度拆解下一代模型训练系统的工程演进全景。',
    fact: '万卡集群单日能耗相当于中等规模城市居民用电，散热与电网长协是核心现实制约。',
    view: '计算体系结构的革新必须与可再生能源基建实现物理协同。',
    inference: '未来前沿实验室的大型数据中心选址将直接取决于清洁能源富集程度。',
    takeaways: [
      '从芯片内互联到机房间光互联，互联延迟是分布式训练的关键瓶颈。',
      '数据中心微电网与储能技术将成为智算基础设施的标配。',
    ],
  },
];

// 汇总聚合所有文章
const allRawArticles = [
  ...Object.values(issues).flatMap((issue) => issue.articles),
  ...intelligence,
  ...prototypeArticles,
  ...topicArticles,
  ...timelineArticles,
  ...weeklyArticles,
  ...extendedStreamArticles,
  ...roleTopArticles,
  ...exploreArticles,
];

// 保证 ID 唯一
export const articles = Array.from(new Map(allRawArticles.map((a) => [a.id, a])).values());
export const articleById = Object.fromEntries(articles.map((article) => [article.id, article]));
export { exploreArticles, prototypeArticles };

export const routeMap = [
  // 1. 情报研读
  {
    path: '/personal',
    label: '私人早报',
    icon: 'heart',
    materialIcon: 'bookmark_heart',
    group: '情报研读',
    prototypes: ['9', '10'],
  },
  {
    path: '/following',
    label: '正在关注',
    icon: 'radar',
    materialIcon: 'radar',
    group: '情报研读',
    prototypes: ['8', '9'],
    implemented: true,
  },
  {
    path: '/history',
    label: '阅读历史',
    icon: 'history',
    materialIcon: 'history',
    group: '情报研读',
    prototypes: ['7', '13'],
    implemented: true,
  },

  // 2. 公共广场
  {
    path: '/timeline',
    label: '精选事件',
    icon: 'timeline',
    materialIcon: 'timeline',
    group: '公共广场',
    prototypes: ['1', '2'],
    badge: 'LIVE',
  },
  {
    path: '/explore',
    label: '内容广场',
    icon: 'compass',
    materialIcon: 'explore',
    group: '公共广场',
    prototypes: ['2', '7'],
  },
  {
    path: '/weekly',
    label: '精选周刊',
    icon: 'book',
    materialIcon: 'menu_book',
    group: '公共广场',
    prototypes: ['3', '5'],
  },
  {
    path: '/topics',
    label: '主题解读',
    icon: 'bulb',
    materialIcon: 'lightbulb',
    group: '公共广场',
    prototypes: ['5', '10'],
  },
  {
    path: '/daily',
    label: '往期早报',
    icon: 'newspaper',
    materialIcon: 'newspaper',
    group: '公共广场',
    prototypes: ['4'],
    implemented: true,
    hiddenInNav: true,
  },

  // 3. 第二大脑
  {
    path: '/review',
    label: '研判资产复盘',
    icon: 'summary',
    materialIcon: 'psychology',
    group: '第二大脑',
    prototypes: ['12'],
  },
  {
    path: '/reading',
    label: '稍后精读',
    icon: 'bookmark',
    materialIcon: 'folder_special',
    group: '第二大脑',
    prototypes: ['1', '11'],
    implemented: true,
  },
];

export function articleUrl(article) {
  return `${article.kind === 'daily' ? `/daily/${article.date}` : '/following'}?article=${encodeURIComponent(article.id)}`;
}

export function articleMarkdown(article, note = '') {
  const takeaways = Array.isArray(article?.takeaways) ? article.takeaways : [];
  return `# ${article?.title || '研读报告'}\n\n> 演示数据 · 原型内容，未经事实核验\n\n${article?.body || article?.summary || ''}\n\n## 核心研判与数据\n${takeaways.map((t) => `- ${t}`).join('\n')}\n\n## 分析师笔记\n${note}\n`;
}

export function downloadText(filename, text, type = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
