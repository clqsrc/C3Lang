# C3Lang
这是一门新语言 This is a new language

类似于 typescript ，这门语言主要用于描述逻辑，并生成特定的语言代码。不过与 ts 主要生成 js 不同，我们的目标语言包括 js,golang,c/c++ 以及对大多数新生开发者来说比较老的 pascal/delphi/lazarus 。

Similar to typescript, this language is primarily used to describe logic and generate specific language code. However, unlike TS, which mainly generates JavaScript, our target languages include JavaScript, Golang, C/C++, and Pascal/Delphi/Lazarus, which is relatively old for most new developers.

我不太理解为什么那些中文大公司的开源项目也是全英文（难道是因为你们的开发者都是老外吗 :) ），因此我还是将项目以中文发布，然后自带“机翻”，省得老外朋友们还要开启翻译器 -- 假如真的有老外看我们这个项目的话。

I don't quite understand why the open source projects of those Chinese companies are also all in English (is it because your developers are all foreigners?😂), so I still released the project in Chinese and brought it with a "machine translator" to save foreign friends from having to open a translator - if there are really foreigners watching our project.

C3Lang 力求实现上的简单，以便在各个语言中快速实现它的本地版本(目前有 typescript, pascal 版本，很容易就可以出 c/c++ 版本)。在文法描述上也是力求简单，所以这有可能在文法上不是那么严谨，在一些语法上也不要求那么严格（这当然是有原因的，是有意而为之）。

C3Lang strives for simplicity in implementation, in order to quickly implement its local versions in various languages (currently available in typescript, pascal versions, and it is easy to produce c/c++versions). In terms of grammar description, we also strive for simplicity, so this may not be as rigorous in grammar, and in some grammar, it is not required to be so strict (of course, there is a reason for this, it is intentional).

我们还有一个目标：基本上它应该能作为一个编译原理的入门示例。因为在中文世界里编译原理的教程都太太糟糕了。不过很难知道未来会发生什么。

We also have a goal: basically it should serve as an introductory example of compilation principles. Because the tutorials on compilation principles in the Chinese world are terrible. However, it is difficult to know what will happen in the future.

因此，我们实现里可能会留有蹒跚学步的代码，这也是有意为之。

Therefore, there may be code for toddlers in our implementation. This is also intentional.

我们尽量使用最简单的数据结构去实现，应该不会有类，可能会有 map ，因此它的性能可能不会极高，更多的是要表述清楚我们的想法，没有类也就意味着有些结构体可能会比较冗长。

We try to use the simplest data structure to implement it, there should be no classes, there may be maps, so its performance may not be extremely high. More importantly, we need to express our ideas clearly. Without classes, some structures may be lengthy.

不过这门语言主要还是以实用为主。我们应该会以它为基础开发邮件相关的程序以及一个小型的跨目标语言的 3D 小游戏示例。这其实也是笔者开发这门语言的最初目的。

However, this language is mainly focused on practicality. We should be able to develop email related programs and a small cross target language 3D game example based on it. This is actually the original purpose of the author developing this language.

实现代码中不会包含正则表达式，虽然现在很流行这样做。因为你应该自己实现正则表达式，一个原因是 typescript 使用了太多的正则表达式，导致它不能在某些 js 环境中使用，我们希望能避免这种情况。

The implementation code will not include regular expressions, although it is now very popular to do so. Because you should implement regular expressions yourself, one reason is that typescript uses too many regular expressions, which makes it unable to be used in certain JavaScript environments. We hope to avoid this situation.

