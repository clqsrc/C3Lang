
import {
    TResult_ ,
    ltNONE ,
    lttINTEGER ,
    CurrentChar ,
    absPosition ,
    count ,
    NextChar ,
    lttFLOAT ,
    lttSTRING ,
    HaveChar ,
    new_TkResult ,

} from "./c3lang_lex";

///import_end
//正规点可以参考 ts 的引用 /// <reference path="./types.d.ts" />  

//lex 的辅助文件，处理类 pascal 的字符串分词


//--------------------------------------------------------
//子函数列表 //业务代码全部写在前面，以免混乱 //手写 js 的话它们应该是 GetToken_List() 中的变量

//取一个 Number 数字类型的 tk 节点 //注意，这时候确定知道它是数字节点了才能调用，另外根据不同的语言它还可能是整数、浮点等
export function ParseString_pascal(AResult_:TResult_):TResult_ {

    var AResult = new_TkResult();

    var state = "";       //tl.tl 状态机式算法需要的

    //----
    AResult.TokenType = lttSTRING; //lttINTEGER;
    AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

    //这时就要不停的 while 直到找到终止符号，这是最简单的算法  //参考注释的解析
    while (true) {

        //if (absPosition >= count) break;
        if (!HaveChar()) break;

        NextChar();


        if ("'" == CurrentChar){
            //AResult.TokenType = lttFLOAT;

            AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

            NextChar();  //要包含分隔符号本身的话，还要向下走一格。有些语言里不同的分隔符表示不同的处理方式，比如转不转义，所以最好是带上分隔符

            break;  //找到了..的结束符
        }//

        
        AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

    }//while

    //----

    return AResult;
}//


