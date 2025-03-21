import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function TaskDefinitionList({
    agentName,
    taskDefinitions,
}: {
    agentName: string;
    taskDefinitions: { id: string; name: string; description: string }[];
}) {
    return (
        <>
            <DemoMode />
            <div className="formCard">
                <div>
                    <Link href="/">&lt; Back</Link>
                </div>

                <h1>{agentName} Task Definitions</h1>
                <div className="instructions">
                    A task definition provides the instructions, AI model, and
                    custom tools used by an agent. The global task provides
                    default values for these settings. The home task is always
                    the first task that an AI agent performs.
                </div>
                <div className="space-y-4">
                    {taskDefinitions.map((td) => (
                        <div
                            key={td.id}
                            className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                            <div>
                                <span className="text-lg">{td.name}</span>
                                <br />
                                <span>{td.description}</span>
                            </div>
                            <Link
                                href={`/admin/${agentName}/task-definitions/edit/${td.id}`}
                                className="btn btnSecondary">
                                Edit
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <Link
                        href={`/admin/${agentName}/task-definitions/edit/`}
                        className="btn btnPrimary">
                        New Task Definition
                    </Link>
                    <Link href={`/`} className="btn btnCancel ml-4">
                        Cancel
                    </Link>
                </div>
            </div>
        </>
    );
}
