import { DBService } from '@/lib/db/db-service';
import { MessageAI } from '@/lib/message';
import { TaskDefinition } from './task-definition';
import { ToolAI } from '@/lib/tool-ai';
import { ToolsBuilder } from './tools-builder';
import { User } from '@/lib/user';

export class TaskMachine {
    private readonly MAX_MESSAGES = 30;

    private db: DBService;

    constructor() {
        this.db = new DBService();
    }

    public async getAIPayload(
        user: User,
        task: string,
        thread: string,
        messages: MessageAI[]
    ): Promise<{ currentMessages: MessageAI[]; tools: ToolAI[] }> {
        // Save messages
        await this.saveMessages(user.id, task, thread, messages);

        // Get previous messages
        const previousMessages = await this.getPreviousMessages(
            user.id,
            thread
        );

        // Get task definition
        const taskDefinitions = await this.getTaskDefinitions();
        let taskDefinition = taskDefinitions.find((td) => td.name === task);

        // default task to Home if not found
        if (!taskDefinition) {
            task = 'Home';
            taskDefinition = taskDefinitions.find((td) => td.name === task);
        }
        if (!taskDefinition) {
            throw new Error(`Task definition not found for task: ${task}`);
        }

        const globalTaskDefinition = taskDefinitions.find(
            (td) => td.name === 'Global'
        );
        if (!globalTaskDefinition) {
            throw new Error(`Task definition not found for task: Global`);
        }

        // Get system messages
        const systemMessages = await this.getSystemMessages(
            user,
            taskDefinition,
            globalTaskDefinition
        );

        // Get tools
        const tools = await this.getTools(taskDefinition, globalTaskDefinition);

        return {
            currentMessages: [...systemMessages, ...previousMessages],
            tools: tools,
        };
    }

    private async getTools(
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<ToolAI[]> {
        // merge server, client, task, and global tool ids
        const toolIds: string[] = [
            ...new Set([
                ...taskDefinition.serverToolIds,
                ...taskDefinition.clientToolIds,
                ...globalTaskDefinition.serverToolIds,
                ...globalTaskDefinition.clientToolIds,
            ]),
        ];
        const builder = new ToolsBuilder();
        const tools = await builder.getTools(toolIds);
        return tools;
    }

    private async getServerData(
        user: User,
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<string> {
        // merge server data ids
        const serverDataIds: string[] = [
            ...new Set([
                ...taskDefinition.serverDataIds,
                ...globalTaskDefinition.serverDataIds,
            ]),
        ];
        let result = '';
        const builder = new ToolsBuilder();
        for (const serverDataId of serverDataIds) {
            const serverData = await builder.callServerData(user, serverDataId);
            result += `${serverData}\n`;
        }
        return result;
    }

    private async getSystemMessages(
        user: User,
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<MessageAI[]> {
        // Get server data
        const serverData = await this.getServerData(
            user,
            taskDefinition,
            globalTaskDefinition
        );

        return [
            { role: 'system', content: globalTaskDefinition.instructions },
            { role: 'system', content: taskDefinition.instructions },
            { role: 'system', content: serverData },
        ];
    }

    private async getTaskDefinitions() {
        const result = await this.db.getTaskDefinitions();
        return result;
    }

    public async saveMessages(
        userId: string,
        task: string,
        thread: string,
        messages: MessageAI[]
    ) {
        await this.db.saveMessages(userId, task, thread, messages);
    }

    private async getPreviousMessages(userId: string, thread: string) {
        const result = await this.db.getMessages(
            userId,
            thread,
            this.MAX_MESSAGES
        );
        return result;
    }
}
