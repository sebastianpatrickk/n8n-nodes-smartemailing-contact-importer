import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmartemailingContactImporterApi implements ICredentialType {
	name = 'smartemailingContactImporterApi';

	displayName = 'Smartemailing Contact Importer API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/-smartemailing-contact-importer?tab=readme-ov-file#credentials';

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
			url: '/v1/user',
		},
	};
}
