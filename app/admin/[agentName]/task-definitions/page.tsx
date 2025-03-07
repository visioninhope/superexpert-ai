import TaskDefinitionList from '@/app/ui/task-definition-list';
import { getAgentAction } from '@/lib/server/server-actions';
import { Suspense } from 'react';
import { getTaskDefinitionListAction } from '@/lib/server/admin-actions';

export default async function TaskListPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);

    const taskDefinitions = await getTaskDefinitionListAction(agent.id);
    return (
        <main className="">
            <Suspense
                fallback={
                    <div className="h-72 w-full animate-pulse bg-gray-100" />
                }>
                <TaskDefinitionList
                    agentName={agent.name}
                    taskDefinitions={taskDefinitions}
                />
            </Suspense>
        </main>
    );
}
