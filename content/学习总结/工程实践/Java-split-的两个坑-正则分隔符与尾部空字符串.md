---
publish: true
title: Java split 的两个坑：正则分隔符与尾部空字符串
description: 从双竖线分隔的协议字段入手，讲清正则转义、尾部空字段和协议校验的职责。
created: 2025-08-25
modified: 2026-10-22
tags:
  - Java
  - 接口联调
  - 故障排查
---

# Java split 的两个坑：正则分隔符与尾部空字符串

接口返回 `DOC-42||`，含义是“文档编号为 DOC-42，校验字段为空”。接收端却因为拆分结果只有一个元素，把这条合法响应判成格式错误。

这类问题容易让排查方向偏向编码或接口数据，实际原因可能只是一行 `split`。Java 的 `String.split` 有两个需要同时记住的规则：参数是正则表达式；默认调用会丢弃尾部空字符串。

## 分隔符先经过两次解释

假设协议规定两个连续竖线 `||` 分隔字段。不能直接写 `split("||")`，因为竖线在正则表达式中表示“或”，并非普通字符。还需要考虑 Java 字符串对反斜线的转义。

| 层次 | 内容 | 含义 |
|---|---|---|
| 协议文本 | <code>||</code> | 两个普通竖线 |
| 正则表达式 | <code>\\|\\|</code> | 匹配两个普通竖线 |
| Java 源码 | <code>"\\\\|\\\\|"</code> | 构造上述正则字符串 |

如果分隔符来自配置，使用 `Pattern.quote` 更容易读，也避免手工为不同特殊字符补转义：

```java
String delimiter = "||";
String[] fields = raw.split(Pattern.quote(delimiter), -1);
```

第二个参数 `-1` 同样关键。它要求保留尾部的空字段，让“字段存在但为空”能够在数组中保留下来。

## 相同输入，不同 limit

```java
String raw = "DOC-42||";

System.out.println(Arrays.toString(raw.split("\\|\\|")));
// [DOC-42]

System.out.println(Arrays.toString(raw.split("\\|\\|", -1)));
// [DOC-42, ]
```

第一种结果长度为 1，第二种为 2。这里不是原始响应少了字段，而是默认拆分行为把末尾空串移除了。若协议用空字段表达“无校验码”，保留位置关系比单纯检查是否有字符更重要。

还要区分单竖线与双竖线。对于 `DOC-42||CHECK-7`，按单竖线拆分会得到三个位置，其中中间是空串；按双竖线拆分才得到两个协议字段。分隔符写得“更宽松”不一定增加兼容性，也可能破坏字段布局。

## 拆分完成以后，还没有完成解析

数组长度只描述文本结构，不能替代协议校验。以如下明确契约为例：响应必须包含两个字段；文档编号必填；校验码可以为空；字段本身不允许包含分隔符。

```java
record DocumentRef(String documentId, String checkCode) {}

static DocumentRef parse(String raw) {
    if (raw == null) {
        throw new IllegalArgumentException("response is null");
    }
    String[] parts = raw.split(Pattern.quote("||"), -1);
    if (parts.length != 2 || parts[0].isBlank()) {
        throw new IllegalArgumentException("invalid document reference");
    }
    return new DocumentRef(parts[0], parts[1]);
}
```

这段代码选择严格的“两字段契约”，因此 `DOC-42` 会被拒绝，而 `DOC-42||` 合法。若外部协议另有规定，允许省略最后一个空字段，就应在解析器中明确增加“长度为 1 时补空”的兼容分支。不要让默认 `split` 的偶然行为替协议做决定。

同样，是否 `trim()` 也属于契约选择。显示名称首尾空格通常可以去掉，签名原文、密码和某些标识则可能把空格视为有效内容。字符串工具只负责拆开文本，规范化规则应由字段含义决定。

## 用输入表锁定边界

| 输入 | 预期结果 |
|---|---|
| <code>DOC-42||CHECK-7</code> | 两个非空字段 |
| <code>DOC-42||</code> | 编号有效，校验码为空 |
| <code>||CHECK-7</code> | 拒绝：编号为空 |
| <code>DOC-42</code> | 拒绝：缺少协议分隔符 |
| <code>DOC-42||A||B</code> | 拒绝：多出字段 |
| <code>null</code> | 拒绝：响应缺失 |

这组用例比只测试一个正常字符串更有价值，因为它同时覆盖分隔符、字段数量和空值语义。返回对象而不是直接把数组传遍业务代码，还可以把这些约束封装在一个入口中，后续调用方只面对已经解析过的字段。

如果未来字段允许包含 `||`，当前协议就需要增加转义或改为 JSON 等有明确编码规则的格式。此时继续叠加 `split` 技巧并不能解决歧义：解析器首先需要一份能够唯一解释原文的协议。

这个例子的关键是保留信息，再按契约解释信息。双竖线作为字面量处理，空字段保持原有位置，合法性由解析器集中判断，三个步骤各自清楚，字符串边界问题就能变成一组可复现的普通用例。[Java String.split 官方说明](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html#split\(java.lang.String,int\))
