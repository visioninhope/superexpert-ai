import TaskDefinitionForm from '@/app/ui/task-definition-form';
import { Suspense } from 'react';
import { getAgentAction } from '@/lib/server/server-actions';
import {
    getServerDataAction,
    getServerToolsAction,
    getClientToolsAction,
    getTaskDefinitionByIdAction,
} from '@/lib/server/admin-actions';
import { TaskDefinition } from '@/lib/task-definition';

export default async function EditTaskDefinitionPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);

    const { id } = await params;
    const taskId = id && id.length === 1 ? id[0] : undefined;

    const isEditMode = Boolean(id);

    const serverData = await getServerDataAction();
    const serverTools = await getServerToolsAction();
    const clientTools = await getClientToolsAction();

    let taskDefinition: TaskDefinition = {
        agentId: agent.id,
        isSystem: false,
        name: '',
        description: '',
        instructions: '',
        serverDataIds: [],
        serverToolIds: [],
        clientToolIds: [],
    };

    if (isEditMode) {
        taskDefinition = await getTaskDefinitionByIdAction(taskId!);
    }

    return (
        <main className="flex items-center justify-center">
            <div className="mx-auto flex">
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <TaskDefinitionForm
                        agentId={agent.id}
                        agentName={agent.name}
                        taskDefinition={taskDefinition}
                        serverData={serverData}
                        serverTools={serverTools}
                        clientTools={clientTools}
                        isEditMode={isEditMode}
                    />
                </Suspense>
            </div>
        </main>
    );
}
