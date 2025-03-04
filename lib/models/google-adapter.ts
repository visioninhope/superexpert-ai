import { AIAdapter } from '@/lib/models/ai-adapter';
import {
    GoogleGenerativeAI,
    Part,
    Content,
    FunctionDeclaration,
} from '@google/generative-ai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import {ToolCall} from '@/lib/tool-call';

export class GoogleAdapter implements AIAdapter {
    constructor(public modelId: string) {}


    private collapseFunctionResponses(messages: Content[]): Content[] {
        const collapsedMessages: Content[] = [];
        let functionResponses: Part[] = [];
        let functionCallIndex = -1;
    
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
    
            if (message.role === 'model' && message.parts.some(part => part.functionCall)) {
                if (functionCallIndex !== -1 && functionResponses.length > 0) {
                    collapsedMessages.splice(functionCallIndex + 1, 0, {
                        role: 'function',
                        parts: functionResponses,
                    });
                    functionResponses = [];
                }
                functionCallIndex = i;
                collapsedMessages.push(message);
            } else if (message.role === 'function' && message.parts.some(part => part.functionResponse)) {
                if (functionCallIndex !== -1 && i > functionCallIndex) {
                    functionResponses = functionResponses.concat(message.parts);
                } else {
                    collapsedMessages.push(message);
                }
            } else {
                if (functionCallIndex !== -1 && message.role === 'model' && message.parts.some(part => part.text)){
                    if (functionResponses.length > 0) {
                        collapsedMessages.splice(functionCallIndex + 1, 0, {
                            role: 'function',
                            parts: functionResponses,
                        });
                        functionResponses = [];
                    }
                    functionCallIndex = -1;
                    collapsedMessages.push(message);
                } else {
                    collapsedMessages.push(message);
                }
            }
        }
    
        if (functionCallIndex !== -1 && functionResponses.length > 0) {
            collapsedMessages.splice(functionCallIndex + 1, 0, {
                role: 'function',
                parts: functionResponses,
            });
        }
    
        return collapsedMessages;
    }


    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

        // Map tools to functionDeclarations
        const functionDeclarations: FunctionDeclaration[] = tools.map(
            (tool) => ({
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters as any, // Cast to any to bypass type incompatibility
            })
        );

        const model = genAI.getGenerativeModel({
            model: this.modelId,
            tools: [
                {
                    functionDeclarations: functionDeclarations,
                },
            ],
        });

        // Map messages to Content objects
        let history: Content[] = inputMessages.map((message) => {
            if (message.role === 'assistant') {
                if (message.tool_calls) {
                    const functionCalls:Part[] = [];
                    for (const toolCall of message.tool_calls) {
                        const functionCall: Part = {
                            functionCall: {
                                name: toolCall.id,
                                args: JSON.parse(toolCall.function.arguments),
                            }
                        };    
                        functionCalls.push(functionCall);
                    }
                    return {
                        role: 'model',
                        parts: functionCalls
                    };
                }
                return {
                    role: 'model',
                    parts: [{ text: message.content}],
                };
            }
            if (message.role === 'tool') {
                // Corrected: functionResponse is a direct Part property
                const functionPart: Part = {
                    functionResponse: {
                        name: message.tool_call_id,
                        response: {result: message.content},
                    }
                };
                return {
                    role: 'function',
                    parts: [functionPart]
                };
            }

            // Otherwise, it's a user message
            return {
                role: message.role,
                parts: [{ text: message.content || '???' }],
            };
        });

        console.log("************ Pre-History ************");
        console.dir(history, {depth: null});
        
        history = this.collapseFunctionResponses(history);
        
        console.log("************ Post-History ************");
        console.dir(history, {depth: null});
        console.log("************ Tools ************");
        console.dir(functionDeclarations, {depth: null});

        // Get the last message (which is either the user or tool message)
        const lastMessage = history.pop();
        if (!lastMessage) {
            throw new Error('No last message found');
        }

        // Filter tool messages from history
        // history = history.filter((message) => message.role !== 'tool');

        const chat = model.startChat({
            history,
            safetySettings: [],
            ...(instructions && {
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: instructions }],
                },
            }),
        });

        console.log('*********** history ***********');
        console.dir(history, { depth: null });

        console.log('*********** chat ***********');
        console.dir(lastMessage, { depth: null });

        // Await the sendMessageStream promise and then iterate.
        let result;
        // if (lastMessage.parts[0].functionResponse) {
        //     result = await chat.sendMessage(lastMessage.parts);
        // } else {
        result = await chat.sendMessageStream(lastMessage.parts);
        //}
        //const result = await chat.sendMessageStream(lastMessage.parts);

        // let toolCallId: string = '';
        // let functionName: string = '';
        // let functionArguments: string = '';
        const functionAccumulator:ToolCall[] = [];
        

        for await (const chunk of result.stream) {
            console.log("CHUNK");
            //console.dir(chunk, {depth: null});
            console.log(JSON.stringify(chunk, null, 2))
            if (
                chunk.candidates &&
                chunk.candidates[0] &&
                chunk.candidates[0].content
            ) {
                for (const part of chunk.candidates[0].content.parts) {
                    if (part.text) {
                        yield { text: part.text };
                    } else if (part.functionCall) {
                        // Function call detected
                        // if (!toolCallId) {
                        //     toolCallId =
                        //         'gemini-tool-' +
                        //         Math.random().toString(36).substring(2, 15);
                        //     functionName = part.functionCall.name;
                        //     functionArguments = JSON.stringify(
                        //         part.functionCall.args
                        //     );
                        functionAccumulator.push({
                            id: part.functionCall.name,
                            type: 'function' as const,
                            function: {
                                name: part.functionCall.name,
                                arguments: JSON.stringify(part.functionCall.args),
                            },
                        });

                            // yield {
                            //     toolCall: {
                            //         id: toolCallId,
                            //         type: 'function' as const,
                            //         function: {
                            //             name: functionName,
                            //             arguments: functionArguments,
                            //         },
                            //     },
                            // };
                        
                    }
                }
            }
        }

        for (const toolCall of functionAccumulator) {
            yield { toolCall };
        }

    }
}

// ***

// import { AIAdapter } from '@/lib/models/ai-adapter';
// import { OpenAI } from 'openai';
// import { MessageAI } from '@/lib/message-ai';
// import { ToolAI } from '@/lib/tool-ai';

// export class GoogleAdapter implements AIAdapter {

//     constructor(public modelId: string) { }

//     async *generateResponse(
//         instructions: string,
//         inputMessages: MessageAI[],
//         tools: ToolAI[],
//         options = {}
//     ) {
//         const client = new OpenAI({
//             apiKey: process.env.GEMINI_API_KEY,
//             baseURL: "https://generativelanguage.googleapis.com/v1beta/"
//         });

//         // add instructions to the inputMessages
//         if (instructions) {
//             inputMessages.unshift({ role: 'system', content: instructions });
//         }

//         inputMessages = inputMessages.map((message) => {
//             if (message.role === 'tool') {
//                 return {
//                     role: 'tool',
//                     tool_call_id: message.tool_call_id,
//                     content: JSON.stringify({result:message.content}),
//                 };
//             }
//             return message;
//         });

//         console.log("inputMessages");
//         console.dir(inputMessages, {depth: null});

//         const response = await client.chat.completions.create({
//             model: this.modelId,
//             stream: true,
//             messages: inputMessages,
//             ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
//         });

//         console.log("kermit 1");

//         // let toolCallId: string = '';
//         // let functionName: string = '';
//         // let functionArguments: string | undefined = '';
//         //const functionAccumulator = [];

//         for await (const chunk of response) {
//             const delta = chunk.choices[0].delta;
//             if (delta.content) {
//                 yield { text: delta.content };
//             } else if (delta.tool_calls) {
//                 const toolCall = delta.tool_calls[0];

//                 console.dir(toolCall, {depth: null});

//                 // function tool call (Google does not stream tool calls)
//                 //const toolCallId = 'gemini-tool-' + Math.random().toString(36).substring(2, 15);
//                 const toolCallId  = "blah";
//                 const functionName = toolCall.function!.name!;
//                 const functionArguments = toolCall.function!.arguments;

//                 yield {
//                     toolCall: {
//                         id: toolCallId,
//                         type: 'function' as const,
//                         function: {
//                             name: functionName,
//                             arguments: functionArguments,
//                         }
//                     },
//                 };

//             }

//         }
//     }
// }
