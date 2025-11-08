import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';

export class SmartemailingContactImporter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Smartemailing Contact Importer',
		name: 'smartemailingContactImporter',
		icon: { light: 'file:smartemailingContactImporter.svg', dark: 'file:smartemailingContactImporter.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Smartemailing Contact Importer API',
		defaults: {
			name: 'Smartemailing Contact Importer',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'smartemailingContactImporterApi', required: true }],
		requestDefaults: {
			baseURL: 'https://app.smartemailing.cz/api/v3',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Company',
						value: 'company',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
		],
	};
}
