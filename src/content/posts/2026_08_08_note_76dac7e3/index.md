---
title: "如何使用AI学习"
pubDate: "2026-08-08"
categories:
  - "life"
tags:
  - "Life"
---

以下是阅读文章[使用 AI 学习的最佳方法](https://medium.com/heptabase/the-best-way-to-use-ai-for-learning-762c3467bdf1) 的一部分摘录：

> AI可以使学习效率变得更高，可以帮助我们独自一人完成复杂、抽象且具有挑战性的知识。我觉得作者的这句话说的很好：“学习的价值并不在于积累更多的知识，而是培养针对重要问题深入思考的能力，重要的问题往往也是具有挑战性知识的问题。” AI 可以让我们把更多认知资源投入到真正困难的部分。

在过去学习某个领域的知识依赖教科书，而阅读教科书是一个比较耗时的过程。有的时候，我们的时间并不十分充裕，但想要尽快了解并学习一个学科，网络上一些浅显的入门式教程是一个好的开始，比如一些教学视频可以快速进入重点，了解一些基础的知识，但这种教程始终浮于表面，它是创作者消化后的知识，在吸收容易的同时也伴随着一些营养的丧失，甚至带有一定的偏见。一种方法是直接使用AI与该领域最好的学术教科书进行互动，这不仅可以让我们直接接触原本的知识，有降低阅读和检索门槛，甚至量身定制适合自己的学习计划。

AI在某些人看来是一场炒作，是一种外包思考，会让人变得更差，我曾经也是这种观念的支持者，但AI降低了获取知识的难度，并可以成为我们的思考伙伴。AI帮我解决100道难题，并不能帮我变得更好，但当我卡住时，AI能够提供适当的提示，却可以让我坚持下去。AI的价值并不是低思考代价，它不能用于跳过必要的思考过程，我们需要一定的认知挣扎才能带来认知的提升。我们来决定什么重要，什么东西应该怎么表达，而不是让AI来代劳。

利用AI进行学习的过程需要几个因素：
- 一个高质量的PDF文件
- 一个高质量的PDF OCR解析器
- 一个好的AI模型
- 记笔记

## 学习步骤
### 解析原材料PDF
首先需要解析PDF：大多数模型并不会把整个PDF作为上下文来阅读，而是只提取与问题相关的部分--相关内容的查找算法目前仍然不完美（通常基于RAG）。PDF解析时，需要比较好地利用AI的上下文限制，幸运的是，目前的AI模型的上下文窗口已经相当大了，大多数都达到了1M token。

解析PDF是为了更好的创建学习材料：如果学习材料使用外语写的，并充满了术语，并且我们没有具备先验知识，可以让AI生成不同的学习材料。但应该生成什么呢？需要考虑两件事情：作为学习者的优势和劣势，以及所学习材料的性质。

比如技术或者科学性书籍：将除了术语以外的语言全部翻译为中文，以达到更快的理解与阅读。

> Translate all content into Simplified Chinese word for word, without omitting anything, and make sure it reads smoothly for Chinese readers. Keep personal names in the original language, and provide both Chinese and English for technical terms or proper nouns (as long as readability is not affected). Do not break the translation into parts just because the content is long. I want you to complete the entire translation in one go. Don’t worry about the output being too long, and make absolutely sure not to miss a single sentence.

外语和人文类书籍可以先理解作者的主要信息，让AI先生成一个摘要，再深入阅读。

> Summarize Chapter \[X] for a reader who has not read it yet. Focus on the main ideas, arguments, and themes, showing how they build on each other. Highlight the central questions the author is addressing, and explain the logical or narrative flow so the reader understands the mental structure of the chapter before reading. Keep it accessible, while preserving the depth of the author’s perspective.

对于数学来说，总结的帮助不大，因为数学相当于学习语言，真正的理解需要通过定义、结构、证明来学习。可以生成一个关键的定义列表，每一个定义都配有直观的解释，以及一些可以激发好奇心和动力的引导性问题。
### 生成摘要信息

创建好学习材料后，可以为每个部分创建一个摘要，包括关键定义、方程式以及结论。结合这些摘要信息更好地理解学习材料。

### 与AI讨论
阅读并与AI讨论：可以讨论困惑的段落、给一个简单具体的例子来解释、设计一个假设性问题并使用问题中的知识解决它，可以将自己的理解分享给AI，要求它判断自己是否正确，可以让AI阅读原始PDF。

### 复盘
最后一步：**即用自己的话整理成一篇笔记**，在阅读结束后，趁着知识还清晰，从一篇空白笔记开始，尝试用自己的话重写学习的一切，这就相当于费曼学习法的review以及teach，可以帮助填补阅读时没有注意到的逻辑漏洞。完全从0开始似乎比较困难，可以参考着生成的学习材料，编辑并重塑它，形成自己的描述，为一些关键地方添加自己的解释。在这个过程中，重新组织结果也是理解的一部分，可以批判性地思考哪些内容重要，哪些内容可以删除。

可以重复这样的循环：阅读->提问->做笔记，重复这样的过程，钻研几天，结束一个完整的章节后就可以进入下一个阶段：

### 整理与拆分
可视化与整合：当笔记内容变得很长时，可以将其分解成比较小的部分（这并不是彻底的原子化），并可视化它们之间的关系，这也是一个回顾并总结的过程。

最后总结：作者是使用软件 Heptabase 来进行上述过程的，但该软件并不是必须的，我可以借鉴他的思路，在进行一个章节或者阶段的学习时，可以先生成学习材料，在一个空白文件中做笔记，最后将笔记分解成几部分，并在它们之间建立关联。

> 许多高级的学习和问题解决方法，只有当低级能力变得快速高效时才可行，AI为我们提供了这样的可行性。

### 找原材料的tip
附：如何找到最好的书籍？
学习的目标非常关键，选择学习目标也是一个投资。可以先问AI，先让AI生成一个提示词：
> If I want to ask AI to find the best possible textbook to study machine learning, what is the best possible prompt I should use?

经过几次迭代后，发送给最佳可用的模型，并将其回答向其他模型提问，看看作者，看看使用情况，看看论坛和社区的评价以及问下专家或者朋友。作者提供了一个有效的规则：选一本对自己稍微比较难的书，自己可能单独难以应对，但在博士级导师的帮助下可以很好的完成。如果每一句话都需要使用AI，那么这本书就太难了。最好的情况是在几段话中需要用一次AI，一些资源网站如下：
- https://www.gutenberg.org/ 
- [FreeTechBooks](https://www.freetechbooks.com/about)