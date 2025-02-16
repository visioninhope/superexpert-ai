
'use client';

export class ClientToolsBuilder {

    private filterMethods(targetClass: any) {
        const prototype = targetClass?.prototype;
        if (!prototype) {
          return [];
        }
        return Object.getOwnPropertyNames(prototype)
            .filter(method => method !== 'constructor') // Ignore constructor
            .filter(method => Reflect.hasMetadata('tool', prototype, method))
            .map(method => ({
                methodName: method,
                metadata: Reflect.getMetadata('tool', prototype, method)
            }));
      }

    private getDecoratedGlobalClientToolMethods() {
        // Get global client tools
        const SystemClientTools = require('@/lib/task-definitions/system-client-tools').GlobalClientTools;
        const globalClientTools = this.filterMethods(SystemClientTools);
        return globalClientTools;
    }

    private getDecoratedCustomClientToolMethods() {
        // Get custom client tools
        const ClientTools = require('@/task-definitions/client-tools').ClientTools;
        const customClientTools = this.filterMethods(ClientTools);
        return customClientTools;
    }

    private getGlobalClientTool(toolName:string) {
        const tools = this.getDecoratedGlobalClientToolMethods();
        const tool = tools.find(tool => tool.metadata.name === toolName);
        return tool;
    }

    private getCustomClientTool(toolName:string) {
        const tools = this.getDecoratedCustomClientToolMethods();
        const tool = tools.find(tool => tool.metadata.name === toolName);
        return tool;
    }

    public getClientTool(toolName:string) {
        return this.getGlobalClientTool(toolName) || this.getCustomClientTool(toolName);
    }



    public async callClientTool(toolName:string, toolParams:Record<string, any>) {
        // Execute global client tool
        const SystemClientTools = require('@/lib/task-definitions/system-client-tools').SystemClientTools;
        const systemClientPrototype = SystemClientTools.prototype;
        if (toolName in systemClientPrototype) {
            const method = systemClientPrototype[toolName];
            const params: any[] = Object.values(toolParams);
            return await method.apply(systemClientPrototype, params);
        }

        // Execute custom client tool
        const ClientTools = require('@/task-definitions/client-tools').ClientTools;
        const customClientPrototype = ClientTools.prototype;
        if (toolName in systemClientPrototype) {
            const method = systemClientPrototype[toolName];
            const params: any[] = Object.values(toolParams);
            return await method.apply(systemClientPrototype, params);
        }



        // const ServerTools = require('@/task-definitions/server-tools').ServerTools;
        // const prototype = ServerTools.prototype;
  
        // const tools = [
        //   ...this.getDecoratedCustomServerToolMethods(),
        //   ...this.getDecoratedGlobalServerToolMethods()
        // ];
        // const tool = tools.find(tool => tool.metadata.name === toolName);
        // if (!tool) {
        //     throw new Error(`Tool ${toolName} not found`);
        // }
  
        // const method = prototype[tool.methodName];
        // const params: any[] = Object.values(toolParams);
        // return await method.apply(prototype, params);
      }


}