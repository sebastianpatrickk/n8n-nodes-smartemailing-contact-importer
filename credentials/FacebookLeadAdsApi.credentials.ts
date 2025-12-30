import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class FacebookLeadAdsApi implements ICredentialType {
	name = 'facebookLeadAdsApi';

	displayName = 'Facebook Lead Ads API';

	icon = 'file:facebookLeadAds.svg';

	documentationUrl =
		'https://github.com/sebastianpatrickk/n8n-nodes-smartemailing-contact-importer#facebook-lead-ads-credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			description: 'Your Facebook App ID from developers.facebook.com',
		},
		{
			displayName: 'App Secret',
			name: 'appSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Facebook App Secret from developers.facebook.com',
		},
		{
			displayName: 'Page Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Long-lived Page Access Token with pages_read_engagement and leads_retrieval permissions',
		},
		{
			displayName: 'Verify Token',
			name: 'verifyToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Custom string used to verify webhook requests from Facebook. Must match the token configured in your Facebook App webhook settings.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://graph.facebook.com/v18.0',
			url: '/me',
			qs: {
				access_token: '={{$credentials.accessToken}}',
			},
		},
	};
}
