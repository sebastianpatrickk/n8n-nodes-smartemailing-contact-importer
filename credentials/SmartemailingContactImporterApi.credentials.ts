import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmartemailingContactImporterApi implements ICredentialType {
	name = 'smartemailingContactImporterApi';

	displayName = 'Smartemailing Contact Importer API';

	icon = {
		light: 'file:smartemailingContactImporter.svg',
		dark: 'file:smartemailingContactImporter.dark.svg',
	} as const;

	// Link to your community node's README
	documentationUrl =
		'https://github.com/sebastianpatrickk/n8n-nodes-smartemailing-contact-importer#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.smartemailing.cz/api/v3',
			url: '/check-credentials',
		},
	};
}
