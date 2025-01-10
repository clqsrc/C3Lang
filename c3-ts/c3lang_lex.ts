
import {
    ParseString_C

} from "./c3lang_lex_string_c";

import {
    ParseString_pascal
} from "./c3lang_lex_string_pascal";

import {
    strlen, arrlen, charat, include_src
} from "./pas2json_javascript";

//上面都是分离出的子函数 //为了维护方便而已，其实都应该在 GetToken_List 里
//-----------------------------------------------

//参考 BESEN 的就可以了

//其实完成 TBESENLexer.GetToken 就可以了，因为不同语法其实只是标记不同而已

//-----------------------------------------------
//TBESENLexerTokenType 的设计比较取巧，其实是模拟出了一个 hashmap 。不过对于只有数组没有 hashmap 的纯 c 这样的代码倒是比较较简单的实现，就是比较易错
//passcript 用的就是结构体数组，也比较巧妙

console.log("ok");

//有一个有趣的算法 https://github.com/SerenityOS/serenity/blob/master/Userland/Libraries/LibJS/Lexer.cpp

// js 版本不需要的类型定义。不过 interface 和 struct 有什么区别
export interface TConfig_{ //AResult_
    StringStart0:boolean
}//

//type TJsKV = any;  //专用来在其他语言中转换的 kv 类

var config:TConfig_ = { //var config = {
    StringStart0: true  //如果是 pas/lua 就是 false  //实际不用，因为太难处理，转而用不同的索引计算实现函数
}


//js 是没有办法简单实现枚举的，所以只能加人为标志 //不考虑性能的话可以当做字符串，倒也方便调试
//
//var ltoASSIGNMENT = 3; //用整数可能会重复，而且不好插入新元素在半截列表中，会很别扭
var ltoASSIGNMENT = "ltoASSIGNMENT";  //最简单的 //=
var ltoBITWISEAND = "ltoBITWISEAND";  //&  位操作的 与操作
var ltoBITWISEANDASSIGNMENT  = "ltoBITWISEANDASSIGNMENT"; //&=  位操作的赋值
var ltoOPENBRACE  = "ltoOPENBRACE";   //{
var ltoOPENPAREN  = "ltoOPENPAREN";   //(
var ltoOPENSQUARE = "ltoOPENSQUARE";  //[
var ltoPLUS       = "ltoPLUS";        //+
var ltoPLUSPLUS   = "ltoPLUSPLUS";    //++  //只是为支持 c 风格 for 语句，暂时不支持 "i--"

var ltoDIVIDE     = "ltoDIVIDE";      //似乎是 /

export var ltNONE        = "ltNONE";
export var ltUNKNOWN     = "ltUNKNOWN";
var ltEOF         = "ltEOF";          //跑完了源码

export var ltComment     = "ltComment";      //注释类型，实际上 BESEN 没有的，但我们需要

// Types
export var lttIDENTIFIER = "lttIDENTIFIER";  //应该指的是变量或者常量这些
// var lttIDENTIFIER = "lttIDENTIFIER";  //应该指的是变量或者常量这些
export var lttSTRING     = "lttSTRING";      //字符串类型
export var lttINTEGER    = "lttINTEGER";
export var lttFLOAT      = "lttFLOAT";


//几种括号的中英文名称
// { } Braces 或 curly brackets 大括号
// [ ] square brackets 或 brackets 方括号
// < > angled brackets 尖括号
// ( ) parentheses 圆括号 ​​​

//ts 不支持这种语法，那么 ts 中的 hashmap 怎样声明呢？
//var LexerTokenType = {ltoASSIGNMENT:"="};
var LexerTokenType = {"=":ltoASSIGNMENT};  //这样其实也是合法的，因为 js 的实现本身就是 hashmap
//var LexerTokenType:TJsKV = {"=":ltoASSIGNMENT};  //这样其实也是合法的，因为 js 的实现本身就是 hashmap //不太好，难处理

LexerTokenType["="] = ltoASSIGNMENT;

//高版本浏览器才支持 map ，所以没必要用
// let LexerTokenType_ts_map: Map<string, string> = new Map<string, string>(); 
// //LexerTokenType_ts_map["a"] = "b"; //居然不支持这种语法
// LexerTokenType_ts_map.set("a","b"); //居然不支持 x["a"] = "b"; 这种语法

//---- NextChar 和 CurrentChar
//在 BESEN 中 NextChar 和 CurrentChar 的设计非常巧妙，可以轻易的实现两字符标识的三字符标识。相比之下 LibJS 分别实现就显得笨拙，而且不好现在标识替换
//       NextChar();
//       if ord('=') = CurrentChar then

//另外还有 Position:integer; 作为辅助，而 LineNumber:integer; 其实主要是异常时提示，并没有语法意义，不要也是可以的


//-- GetToken 实现
//procedure GetToken(var AResult:TBESENLexerToken);     //clq 应该是分词过程
//解码注释和多行字符这样有嵌套的可以单独分离出来，以免太乱

////var src = "var i = 123; var str2 = 'abc123';";
//var src = ";";  //这个用例要过的
//var src = "";   //这个用例要过

////GetToken_List(src); //我们的语言必须要有变量、常量声明，因为象 golang 这样的 := 生成一个生成一个新变量太容易逻辑误判了

//----
// js 版本不需要的类型定义。不过 interface 和 struct 有什么区别
export interface TResult_{ //AResult_
    TokenType:string,  //tk 的类型
    //TokenSrc:"",       //tk 的原始字符串，其实就是注释中才用，记录一下而已
    TokenSrc:string, //上面那样写居然也可以过 //tk 的原始字符串，其实就是注释中才用，记录一下而已
    
    //Range:array[0..1] of integer;  //代码起始位置 //用于最后的替换 //对应 ast 同名节点
    //Range:int[], //Range:number[], //Range:array[0..1] of integer;  //代码起始位置 //用于最后的替换 //对应 ast 同名节点  //ts 里如何表示这种数据呢
    //range: [number, number]; //理论上可以用这个，但在 ts 中如果要定义 1024 个元素的那目前没有好办法
    //所以还是用动态数组吧 
    //注意，根据 ast 的定义，这是从 0 开始计算的

    //拆分成两个字段吧，其实语言好实现点，也不会的索引异常的问题，省去不少思维负担
    Range_0:int;
    Range_1:int;
    
	//-- 2025 暂时这样处理注释 //不过并不在分词时处理，而根据语法由语法分析自己决定如何处理
	StrComment:string; 
}//

//-- //为了方便分割文件，把它们放出去 //手写 js 的话它们应该是 GetToken_List() 中的变量
export var LineNumber  = 1;        //当前第几行，从 1 开始

type int = number;

export var Position:int    = string_start_index(); //1; // 0;        //当前解析到 s 字符串的是第几个字符 //如果是 pascal/lua 这样索引从 1 开始的，就要初始值为 1，所以这个值应该是可配置的
                                   //所以这个值在不同系统中是不同的，不可用统一做逻辑处理，只能处理字符串。如果要处理统一逻辑则要统一从 1 (或者0)开始。

// include_src("//hide_src");
// Position = 0; 
// include_src("//show_src");



const CR = '\r'; //#13;
const LF = '\n'; //#10;  

export var absPosition = 1;        //这个就是绝对正确的位置 
export var CurrentChar = ''; //很多语言接收不了 '\0';     // '\0x32';  //当前字符串 //实际上当前字符串有两个，按 BESEN 的算法 CurrentChar 实际上是下一个字符了，当前真正要处理的字符是 case 分支中的那个字符
                                   //这样做的巧妙之处在于可以很容易处理有多个字符的操作符的情况，因为确认是多字操作符就可以再 NextChar() 而且可以多次调用

export var CharEOF = false;        //应该是是否读完了整个字符串
export var count = 0; //s.length;  //全部字符的长度
//var fun1 = ()=>;
export var curSrc:string = "";            //当前的源码
//--

console.log(absPosition);

//2025 初始化一个节点，用到地方很多，很多语言又没有构造函数，所以还是应该有一个初始化的函数
export function InitTk():TResult_{

	var AResult:TResult_ = {
		TokenType:ltNONE, //tk 的类型
		TokenSrc:"",      //tk 的原始字符串，其实就是注释中才用，记录一下而已
		
		Range_0:0,
		Range_1:0,
		StrComment:'', 
	};

	return AResult;
}//

export function GetToken_List(s:string):TResult_[]{

    //s = "";

    /* //为了方便分割文件，把它们放出去
    var LineNumber  = 1;        //当前第几行，从 1 开始
    var Position    = 0;        //当前解析到 s 字符串的是第几个字符 //如果是 pascal/lua 这样索引从 1 开始的，就要初始值为 1，所以这个值应该是可配置的
                                //所以这个值在不同系统中是不同的，不可用统一做逻辑处理，只能处理字符串。如果要处理统一逻辑则要统一从 1 (或者0)开始。
    var absPosition = 1;        //这个就是绝对正确的位置 
    var CurrentChar = '\0';     // '\0x32';  //当前字符串 //实际上当前字符串有两个，按 BESEN 的算法 CurrentChar 实际上是下一个字符了，当前真正要处理的字符是 case 分支中的那个字符
                                //这样做的巧妙之处在于可以很容易处理有多个字符的操作符的情况，因为确认是多字操作符就可以再 NextChar() 而且可以多次调用

    var CharEOF = false;        //应该是是否读完了整个字符串
    */

    //-----------------------------------------------
    //虽然变量放出去了，但是要重置它们的值的，否则会有怪异现象

    LineNumber  = 1;        //当前第几行，从 1 开始
    Position    = string_start_index();  //0;        //当前解析到 s 字符串的是第几个字符 //如果是 pascal/lua 这样索引从 1 开始的，就要初始值为 1，所以这个值应该是可配置的
                                //所以这个值在不同系统中是不同的，不可用统一做逻辑处理，只能处理字符串。如果要处理统一逻辑则要统一从 1 (或者0)开始。
    absPosition = 1;        //这个就是绝对正确的位置 
    CurrentChar = '\0';     // '\0x32';  //当前字符串 //实际上当前字符串有两个，按 BESEN 的算法 CurrentChar 实际上是下一个字符了，当前真正要处理的字符是 case 分支中的那个字符
                                //这样做的巧妙之处在于可以很容易处理有多个字符的操作符的情况，因为确认是多字操作符就可以再 NextChar() 而且可以多次调用

    CharEOF = false;        //应该是是否读完了整个字符串    

    //--------------------------------------------------------
    //上面都是成员变量

    //var count = s.length;
    //count = s.length;
    count = strlen(s);
    curSrc = s;

    //--
    //var tk_list = [];
    var tk_list:TResult_[] = [];  //要转换成其他强类型语言，这样写好一点 //例如 delphi11 可以用 var Ints: TArray<Integer>:=[];

    //----
    //简单一点，先走一个
    NextChar(); //从 BESEN 源码上看，确实在分析整个字符串时第一个字符应该是在第一次调用 GetToken() 之前调用一次的。不过要注意的是，不是每次调用 GetToken() 前都调用 

    //取出所有 tk 节点
    while (true) {

        //if (absPosition >= count) break;
        //if (absPosition > count) break;    //等于的时候是最后一个字符，还是要处理的
        if (absPosition > count+1) break;

        let old_pos = Position;

        var tk = GetToken();

        //-- GetToken 有可能没能正确前进，这时候就要退出 //目前语言转换没完善会这样，可能还有其他情况
        if (old_pos == Position){

            console.log("未能步进。old_pos == Position", JSON.stringify(tk));

            break;
        }//

        //-- --


        //---- tk_list.push 在 delphi 中的动态数组难以处理，所以暂时

        include_src("//hide_src");  //在生成的目标代码中隐藏（注释）掉随后的代码段 //暂时
        tk_list.push(tk);
        include_src("//show_src");  //恢复

        //delphi 中目前只能这样直接用代码代替，因为无法传递相关参数 //也许以后可以
        include_src("setlength(tk_list, length(tk_list) + 1); tk_list[length(tk_list) - 1] := tk; ");
    }//


    console.log(tk_list);

    return tk_list;
    //--------------------------------------------------------
    //下面都是子函数列表


    //取一个 tk 节点 //这是个子函数
    function GetToken():TResult_{

        //按状态机算法，AResult 应该放在外面。如果是传统算法，那么 AResult 应该在 while 里面，因为它要每次重置
        var AResult:TResult_ = InitTk();

        var state = "";       //tl.tl 状态机式算法需要的

        //----
        //简单一点，先走一个
        //NextChar(); //从 BESEN 源码上看确实不是每次都取一个的，要先判断当前的字符是什么内容

        //AResult.Range[0] := absPosition;  //不能这样写，因为 AResult 整体在子函数中可能会改变
        //var codeStart = absPosition; 
        var codeStart = absPosition - 2;  //absPosition 是从 1 开始算的，而 NextChar 里又向前走了一步，所以这时候 absPosition 应该是 2
        //但我们的值是要从 0 开始的字符 CurrentChar 在字符串中的位置，所以得减去 2

        let c = CurrentChar;

        while (true) {

            //if (absPosition >= count) break;
            //if (absPosition > count) break;    //等于的时候是最后一个字符，还是要处理的
            if (absPosition > count+1) break; 

            //NextChar();
            AResult.TokenSrc = AResult.TokenSrc + CurrentChar;

            //下面一般用 case ，不过从语法明晰来看，还是用 if 吧
            var bCase = false;

            //可能包括其他字符的要放在前面处理

            //--------------------------------------------------------
            //优先级 1 的列表

            //因为行号在注释中也要累加，所以它的优先级比注释更高
            //在 BESEN 中则是嵌入在注释中处理的，当然也可以，不过会有冗余代码可能会出错
            if ('\n' == CurrentChar){
                LineNumber = LineNumber + 1;
            }//
            //\r\n 的特殊处理
            if ('\r' == CurrentChar){
                NextChar();
                // @ts-ignore CurrentChar 会被 NextChar() 修改，所以忽略 TS2367
                if ('\n' == CurrentChar){
                    NextChar();                       //说的是，如果 \r 后面是 \n 那么跳过这个 \n
                    LineNumber = LineNumber + 1;
                }else{
                    LineNumber = LineNumber + 1;
                }//
                //break;
            }//

            //--------------------------------------------------------
            //优先级 2 的列表

            //因为注释中含其他普通符号，所以它的优先级更高
            //注释 //c.g4 中语法为 BlockComment 直接被忽略 //在 pascal.g4 中为 COMMENT_2 也一样是直接忽略 //而且并不是用优先级实现，而是直接的正则表达式过滤 
            //tl.tl 中则是用状态机实现的 //我们这里也用状态机吧
            if ('/' == CurrentChar){

                //其实可以在这里保存当前位置，然后调用一个查找注释的函数，没找到则回退就可以了 //这样就可以支持通用语言，而不是拘泥于某个特定语法

                //算法类似 tl.tl 的 state == "got --"
                NextChar();

				//--------------------------------------------------------
            	//2025 先处理一下单行注释 
				if ('/' == CurrentChar) { 
					AResult.TokenType = ltComment;
					bCase = true;

					for(;;){ 
						if (! HaveChar()) break ;
						NextChar();
						
						// @ts-ignore CurrentChar 会被 NextChar() 修改，所以忽略 TS2367
						if ((CR == CurrentChar) || (LF == CurrentChar)) { 
							NextChar();
							break;  //找到了注释的结束符 
						}//
						
						AResult.TokenSrc=AResult.TokenSrc + CurrentChar; 
					}//while "cr lf" 
					
					break; 
				} //if "/" 


				//--------------------------------------------------------

                //ts 的编译还是弱，这个会报 TS2367: This comparison appears to be unintentional because the types '"\n"' and '"\r"' have no overlap.
                //TS2367: This comparison appears to be unintentional because the types '"*"' and '"/"' have no overlap.
                //但实际上 CurrentChar 会被修改啊 //用 // @ts-ignore 可忽略
                // @ts-ignore CurrentChar 会被 NextChar() 修改，所以忽略 TS2367
                if ('*' == CurrentChar){
                    AResult.TokenType = ltComment;  //这时候就可以确认是注释了
                    bCase = true;

                    //这时就要不停的 while 直到找到终止符号，这是最简单的算法
                    while (true) {

                        //if (absPosition >= count) break;
                        if (!HaveChar()) break;

                        NextChar();

                        if ('*' == CurrentChar){
                            NextChar();
                            if ('/' == CurrentChar){
                                NextChar();
                                break;  //找到了注释的结束符
                            }//
                        }//

                        AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下注释的内容

                    }//while *

                    break;
                }//if *

                //-- 默认处理方式
                AResult.TokenType = ltoDIVIDE;

                bCase = true;
                break;
            }//if /

            //-- 普通的 tk ,优先级最低
            if ('(' == CurrentChar){
                NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = ltoOPENPAREN;

                bCase = true;
                break;
            }//

            //-----------------------------------------------
            //在普通运算符号之前可以解析 "--" 这样的运算符号，把 2 字符长度的运算符号做一个函数，三个的做一个函数。这样更清晰一些
            if (('+' == CurrentChar) || ('-' == CurrentChar) || ('*' == CurrentChar) || ('/' == CurrentChar) ||
				('!' == CurrentChar)|| ('<' == CurrentChar)|| ('>' == CurrentChar)|| ('^' == CurrentChar)||
				('|' == CurrentChar)||
				('=' == CurrentChar)){  //这是为了提高性能的过滤，其实可以不要

                AResult = Parse_Oprate2char(AResult); //Parse_IDENTIFIER
                if (ltNONE != AResult.TokenType){

                    bCase = true;
                    break;

                }//

            }//

            //-----------------------------------------------

            if ('+' == CurrentChar){
                NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = ltoPLUS;

                //算了，现在 update.. 已经能处理了，加上反而不对
                //可以进一步支持 "i++" 这样的语法，要不后面语法分析时不好处理 forsta //这样 parseUpdateExpression 要修改，似乎也不太好处理
                // if ('+' == CurrentChar){
                //     AResult.TokenSrc = AResult.TokenSrc + CurrentChar;

                //     NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                //     AResult.TokenType = ltoPLUSPLUS;
                //     //AResult.TokenSrc = AResult.TokenSrc + CurrentChar;
    
                //     //bCase = true;
                //     //break;
                // }//

                bCase = true;
                break;
            }//

            if (CurrentChar >= '0' && CurrentChar <= '9'){

                //NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = lttINTEGER; //lttSTRING;

                bCase = true;

                //ParseNumber(#0,AResult);
                AResult = ParseNumber(AResult);
                break;
            }//

            //字符串的处理其实有点啰嗦，不同的语言特别是类 c 的还要考虑转义符不能简单的认为有结束符了就要停止。所以放到单独的文件里实现
            if ('"' == CurrentChar){

                //NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = lttSTRING; //lttIDENTIFIER; //lttSTRING;

                bCase = true;

                //ParseNumber(#0,AResult);
                AResult = ParseString_C(AResult);
                break;  //不用 case 那么 break 就是每一项必须的
            }//

            if ("'" == CurrentChar){

                //NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = lttSTRING; //lttIDENTIFIER; //lttSTRING;

                bCase = true;

                AResult = ParseString_pascal(AResult);
                break;  //不用 case 那么 break 就是每一项必须的
            }//

            //这里显然可以做成可配置的 //比如 php 是以 '$' 为起始的
            if ((CurrentChar >= 'a' && CurrentChar <= 'z')||(CurrentChar >= 'A' && CurrentChar <= 'Z')||('_' == CurrentChar)){

                //NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = lttIDENTIFIER; //lttSTRING;

                bCase = true;

                //ParseNumber(#0,AResult);
                AResult = Parse_IDENTIFIER(AResult);
                break;  //不用 case 那么 break 就是每一项必须的
            }//

            if ('=' == CurrentChar){
                NextChar();  //找到了要处理的字符一定要调用 NextChar() 除非不确定，想进一步处理 
                AResult.TokenType = ltoASSIGNMENT;

                bCase = true;
                break;
            }//


            //---- 如果没有 case 到的默认处理 //实际上单字符的 tk 都可以用这个处理，根本不需要再开一个分支，只要再给一个分配类型的函数就行
            if (false == bCase){
                NextChar();  //没找到也要向下走一格
                AResult.TokenType = ltUNKNOWN;
                break;
            }//

            if (bCase) break;

        }//while

        AResult.Range_0 = codeStart;
        AResult.Range_1 = absPosition - 2;

        return AResult;
    }//GetToken

    //--------------------------------------------------------
    //子函数列表 //业务代码全部写在前面，以免混乱

    //取一个 Number 数字类型的 tk 节点 //注意，这时候确定知道它是数字节点了才能调用，另外根据不同的语言它还可能是整数、浮点等
    function ParseNumber(AResult_:TResult_):TResult_{

        var AResult:TResult_ = InitTk();

        var state = "";       //tl.tl 状态机式算法需要的

        //----
        AResult.TokenType = lttINTEGER;
        AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容
        NextChar();

        //这时就要不停的 while 直到找到终止符号，这是最简单的算法  //参考注释的解析
        while (true) {

            //if (absPosition >= count) break;
            if (!HaveChar()) break;  //前面已经走了一格了，所以不应该在最开始的时候再判断 //还是要的，因为哪个节点已经处理了

            //NextChar();

            if ('.' == CurrentChar){
                AResult.TokenType = lttFLOAT;
            }//

            //终止符号  //应该有个统一的，但是暂时这样吧
            if (' ' == CurrentChar || ';' == CurrentChar || ',' == CurrentChar){
                //NextChar();  //不应该吞
                break;  //找到了注释的结束符
            }//

            //如果是 '(' 这样的是不能吞的，所以这时候不能调用 NextChar()
            if (CurrentChar >= '0' && CurrentChar <= '9'){
                //AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容
            }else{
                //NextChar();
                break;  //找到了注释的结束符
            }//

            
            AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

            NextChar();
            //if (!HaveChar()) break;  //前面已经走了一格了，所以不应该在最开始的时候再判断

        }//while

        //----

        return AResult;
    }//ParseNumber

    //解析出 lttIDENTIFIER ，实际上也有可能是关键字
    function Parse_IDENTIFIER(AResult_:TResult_):TResult_{

        var AResult:TResult_ = new_TkResult();

        var state = "";       //tl.tl 状态机式算法需要的

        //----
        AResult.TokenType = lttIDENTIFIER;
        AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

        NextChar();

        //这时就要不停的 while 直到找到终止符号，这是最简单的算法  //参考注释的解析
        while (true) {

            //if (absPosition >= count) break;
            if (!HaveChar()) break;

            //NextChar();

            if ('.' == CurrentChar){
                //AResult.TokenType = lttFLOAT;
            }//

            //终止符号  //应该有个统一的，但是暂时这样吧
            if (' ' == CurrentChar || ';' == CurrentChar || ',' == CurrentChar){
                //NextChar();  //不应该吞
                break;  //找到了..的结束符
            }//

            //如果是 '(' 这样的是不能吞的，所以这时候不能调用 NextChar()
            //(CurrentChar >= 'a' && CurrentChar <= 'z')||(CurrentChar >= 'A' && CurrentChar <= 'Z')||(CurrentChar == '_')
            if ((CurrentChar >= '0' && CurrentChar <= '9')
                ||(CurrentChar >= 'a' && CurrentChar <= 'z')||(CurrentChar >= 'A' && CurrentChar <= 'Z')
                ||(CurrentChar == '_')){
                //AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容
            }else{
                //NextChar();
                break;  //找到了注释的结束符
            }//

            
            AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

            NextChar();

        }//while

        //----

        return AResult;
    }//Parse_IDENTIFIER

    //为方便分源码文件，分离出来的子函数
    //取下一个字符 //BESEN 的 NextChar() 还考虑了 utf8 的情况，那样太复杂了
    //其实从简化算法的角度来说可以再定义一个向前回退的类似函数，只不过传统来说只有向后的，不知是否和性能有关
    //function NextChar(){}

    //--------------------------------------------------------
}//GetToken


//-----------------------------------------------
//为方便分源码文件，分离出来的子函数

//比较当前字符串位置后是否是某个字符串 //类似于 if (strcmp(code, "++") == 0) 的作用
//不过这样性能应该不高，毕竟每个字符都要比较一大串 //不过可以再优化首字符过滤就行了
//目前只用来比较运算符号
function strcmp_curchar(oprate:string):boolean{

    let charNONE = "";

    let CurrentChar2 = charNONE;
    let CurrentChar3 = charNONE;

    let count_op = strlen(oprate);

    if (absPosition <= count){
        CurrentChar2 = curSrc[Position];
    }
    if ((absPosition + 1) <= count){
        CurrentChar3 = curSrc[Position + 1];
    }

    if (2 == count_op){

        if ((CurrentChar == oprate[string_start_index()]) && 
            (CurrentChar2 == oprate[string_start_index() + 1])){

            return true;
        }//if 2

    }//if 1

    if (3 == count_op){

        if ((CurrentChar == oprate[string_start_index()]) && 
            (CurrentChar2 == oprate[string_start_index() + 1]) &&
            (CurrentChar3 == oprate[string_start_index() + 2])){

            return true;
        }//if 2
        
    }//if 1

    return false;
}//

//解析出 "++" "--" 这个两个字符的运算符号
function Parse_Oprate2char(AResult_:TResult_):TResult_{

    var AResult:TResult_ = new_TkResult();

    var state = "";       //tl.tl 状态机式算法需要的

    //----
    //AResult.TokenType = ltUNKNOWN; //lttIDENTIFIER;
    //AResult.TokenSrc = AResult.TokenSrc + CurrentChar; //取一下内容

    //NextChar();

    //-- 简单一点，直接在 NextChar 时取出后面的几个字符。也可以象 c 语言一样写一个比较开头字符串的函数。
    //用比较函数吧，这样能直接兼容 3 字符长度的运算符号。还能把这种比较直接移植到语法分析部分

    //'+=',  '-=',  '*=',  '/=',  '%=',  '<<=',  '>>=',  '&=',  '|=',  '^='
    let op_list = ["++", "--", '+=',  '-=',  '*=',  '/=',  '%=',  '<<=',  '>>=',  '&=',  '|=',  '^=',
		//2025 "==" 应该也是
        '==', '!=', '<>', '||', '&&', '>=', '<=', 
        //其实还有 3 个字符的运算符号
        "==="
    ];

    let op_list_count = arrlen(op_list);

    for (let i = 0; i < op_list_count; i++) {

        let op = op_list[i]; //"++";
        let count_op = strlen(op);

        if (strcmp_curchar(op)){
            AResult.TokenType = ltUNKNOWN; //lttIDENTIFIER;
            AResult.TokenSrc = op; //"++"; //取一下内容

            //匹配了还要移动当前字符位置
            for (let j = 0; j < count_op; j++) {
                NextChar();
            }//

            return AResult;
        }//if

    }//for

    return AResult_;
    //return AResult;  //不对，应该原样输出，否则会出错。因为里面已经有部分解析结果
}//Parse_IDENTIFIER


//-----------------------------------------------
//保存一个临时位置 //是想代替只能一步的 NextChar
//用小写，因为不知道常规用什么
export interface TChar_Position{
    char_pos_:number;
    char_pos_abs_:number;
}//

function save_char_pos():TChar_Position{
    
    let cur_pos:TChar_Position = {
        char_pos_ : Position,
        char_pos_abs_ : absPosition,      
    }//

    return cur_pos;

}//save_char_pos 保存

function restore_char_pos(pos:TChar_Position):TChar_Position{
    
    let cur_pos:TChar_Position = {
        char_pos_ : Position,
        char_pos_abs_ : absPosition,      
    }//

    Position = pos.char_pos_;
    absPosition = pos.char_pos_abs_;  

    //-- 上面的本来是对的，但是因为还要恢复 CurrentTk 所以要调整一下
    //CurrentTk = tk_list[tk_pos - 1];
    CurrentChar = curSrc[Position - 1];

    return cur_pos;

}//restore_char_pos 恢复

//-----------------------------------------------


//取下一个字符 //BESEN 的 NextChar() 还考虑了 utf8 的情况，那样太复杂了
//其实从简化算法的角度来说可以再定义一个向前回退的类似函数，只不过传统来说只有向后的，不知是否和性能有关
export function NextChar(){
    //Position = Position + 1;  //如果是 pascal/lua 这样索引从 1 开始的，就要这样
    //CurrentChar = s[Position];

    //if (absPosition >= count){
    if (absPosition > count){  //这里和别的地方的判断不同，即使是最后一个字符了也是要执行的。其他地方可以用 HaveChar 这里是不可以的
        CharEOF = true;    //应该是是否读完了整个字符串
    }else{
        CurrentChar = curSrc[Position];
    }//    

    //CurrentChar = curSrc[Position];
    Position = Position + 1;

    console.log(absPosition, absPosition, count);
    console.log(CurrentChar);

    //absPosition = Position;
    // if (config.StringStart0){
    //     absPosition = Position + 1;  //pas/lua 是不用加的
    // }//if

    absPosition = absPosition + 1;  //自己累加更通用


}//NextChar


//if (absPosition >= count) break; 未必正确，应该用一个函数判断是否还有字符可读取
export function HaveChar():boolean {

    //if (absPosition >= count) return false;
    //if (absPosition > count) return false;    //等于的时候是最后一个字符还是要处理的
    //最后一个字符的状态时是 absPosition 比 count 大 1 的，因为每次取节点后都向前移动了
    if (absPosition > count+1) return false;    //等于的时候是最后一个字符还是要处理的

    return true;
}//


//字符串的起始位置 //c 系为 0, delphi/lua 为 1
export function string_start_index(){
    
    let i = 1;
    include_src("//hide_src");  //在生成的目标代码中隐藏（注释）掉随后的代码段 //暂时
    i = 0;
    include_src("//show_src");  //恢复

    return i;
}//


//内部辅助函数，小写开头好了，大写开头的是正式的重要函数
export function new_TkResult():TResult_{
    //按状态机算法，AResult 应该放在外面。如果是传统算法，那么 AResult 应该在 while 里面，因为它要每次重置
    var AResult:TResult_ = InitTk();

    return AResult;
}//

// function list_add_item(list:any, item:any){
//     include_src("//hide_src");  //在生成的目标代码中隐藏（注释）掉随后的代码段 //暂时
//     tk_list.push(tk);
//     include_src("//show_src");  //恢复

//     //delphi 中目前只能这样直接用代码代替，因为无法传递相关参数 //也许以后可以
//     include_src("setlength(tk_list, length(tk_list) + 1); tk_list[length(tk_list) - 1] := tk; ");
// }//

//-----------------------------------------------

//测试，简单地生成代码
export function CreateSource_TokenList(list:TResult_[]):string {

    var r = "";

    let count = arrlen(list);

    for (let i = 0; i < count; i++) { //for (let i = 0; i < list.length; i++) {
        var item = list[i];
        
        r = r + " " + item.TokenSrc;
    }

    return r;
}//



//-----------------------------------------------
//export var lttIDENTIFIER = "lttIDENTIFIER";  这样的写法容易出问题，还是手工 export 变量为好

//var v1;

//export default lttIDENTIFIER;
//export default v1; //一个模块不能具有多个默认导出
