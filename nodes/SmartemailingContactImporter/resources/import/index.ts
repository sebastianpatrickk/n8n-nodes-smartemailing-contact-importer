import type { INodeProperties } from 'n8n-workflow';
import { importContactsDescription } from './importContacts';

export const importDescription: INodeProperties[] = [...importContactsDescription];
