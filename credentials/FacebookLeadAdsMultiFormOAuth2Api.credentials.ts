import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class FacebookLeadAdsMultiFormOAuth2Api implements ICredentialType {
	name = 'facebookLeadAdsMultiFormOAuth2Api';

	displayName = 'Facebook Lead Ads OAuth2 API';

	extends = ['oAuth2Api'];

	icon = 'file:facebookLeadAds.svg';

	documentationUrl =
		'https://github.com/sebastianpatrickk/n8n-nodes-smartemailing-contact-importer#facebook-lead-ads-credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://www.facebook.com/v18.0/dialog/oauth',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://graph.facebook.com/v18.0/oauth/access_token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default:
				'leads_retrieval pages_show_list pages_manage_metadata pages_manage_ads ads_management pages_read_engagement',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
