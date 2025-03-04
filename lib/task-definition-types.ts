import { User } from '@/lib/user';
import { PrismaClient } from '@prisma/client';
import 'reflect-metadata';

export function Tool(name: string, description: string) {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            'tool',
            { name, description },
            target,
            propertyKey
        );
    };
}



interface ToolParameterOptions {
    name: string;
    description: string;
    enumValues?: (string | number)[];
}

export function ToolParameter(options: ToolParameterOptions) {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        const existingParams: any[] =
            Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey
        );
        const paramType = parameterTypes?.[parameterIndex] || 'unknown';

        existingParams[parameterIndex] = {
            name: options.name,
            description: options.description,
            type: paramType.name || 'unknown',
            optional: false, // Mark as required
            enumValues: options.enumValues,
        };

        Reflect.defineMetadata(
            'tool-parameters',
            existingParams,
            target,
            propertyKey
        );
    };
}

// export function ToolParameter(name: string, description: string) {
//     return (target: Object, propertyKey: string, parameterIndex: number) => {
//         const existingParams: any[] =
//             Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
//         const parameterTypes = Reflect.getMetadata(
//             'design:paramtypes',
//             target,
//             propertyKey
//         );
//         const paramType = parameterTypes?.[parameterIndex] || 'unknown';

//         existingParams[parameterIndex] = {
//             name,
//             description,
//             type: paramType.name || 'unknown',
//             optional: false, // Mark as required
//         };

//         Reflect.defineMetadata(
//             'tool-parameters',
//             existingParams,
//             target,
//             propertyKey
//         );
//     };
// }

export function OptionalToolParameter(name: string, description: string) {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        const existingParams: any[] =
            Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey
        );
        const paramType = parameterTypes?.[parameterIndex] || 'unknown';

        existingParams[parameterIndex] = {
            name,
            description,
            type: paramType.name || 'unknown',
            optional: true, // Mark as optional
        };

        Reflect.defineMetadata(
            'tool-parameters',
            existingParams,
            target,
            propertyKey
        );
    };
}

export abstract class ServerDataBase {
    constructor(
        protected user: User,
        protected db: PrismaClient
    ) {}
}

export abstract class ServerToolsBase {
    constructor(
        protected user: User,
        protected db: PrismaClient
    ) {}
}

export abstract class ClientToolsBase {}
