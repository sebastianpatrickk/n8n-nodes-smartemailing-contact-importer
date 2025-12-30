import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

interface FacebookLeadGenEntry {
	id: string;
	time: number;
	changes: Array<{
		field: string;
		value: {
			leadgen_id: string;
			page_id: string;
			form_id: string;
			adgroup_id?: string;
			ad_id?: string;
			created_time: number;
		};
	}>;
}

interface FacebookLeadData {
	id: string;
	created_time: string;
	ad_id?: string;
	form_id?: string;
	field_data: Array<{
		name: string;
		values: string[];
	}>;
}

interface FacebookPage {
	id: string;
	name: string;
	access_token?: string;
}

interface FacebookForm {
	id: string;
	name: string;
	status: string;
}

export class FacebookLeadAdsTriggerMultiForm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Facebook Lead Ads Multi-Form Trigger',
		name: 'facebookLeadAdsTriggerMultiForm',
		icon: 'file:facebookLeadAds.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["page"] ? "Page: " + $parameter["page"] : "All Pages"}}',
		description:
			'Triggers when a new lead is submitted through Facebook Lead Ads. Supports multiple forms unlike the built-in trigger.',
		defaults: {
			name: 'Facebook Lead Ads Multi-Form Trigger',
		},
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - usableAsTool is a valid n8n property not in types
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'facebookLeadAdsMultiFormOAuth2Api', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: '={{$parameter["httpMethod"] || "POST"}}',
				responseMode: 'onReceived',
				path: 'webhook',
				isFullPath: false,
			},
		],
		properties: [
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'hidden',
				default: '=GET,POST',
				description: 'The HTTP method to listen to (GET for verification, POST for events)',
			},
			{
				displayName: 'Verify Token',
				name: 'verifyToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				description:
					'Custom string for webhook verification. Must match the Verify Token configured in your Facebook App webhook settings.',
			},
			{
				displayName: 'Page Name or ID',
				name: 'page',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getPages',
				},
				default: '',
				description:
					'Select a Facebook Page to filter leads. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Form Name or ID',
				name: 'form',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
					loadOptionsDependsOn: ['page'],
				},
				default: '',
				description:
					'Select a Lead Form to filter leads. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Fetch Full Lead Data',
				name: 'fetchFullLeadData',
				type: 'boolean',
				default: true,
				description:
					'Whether to fetch the complete lead data (email, name, custom fields) from the Graph API. If disabled, only the leadgen event metadata is returned.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Graph API Version',
						name: 'apiVersion',
						type: 'string',
						default: 'v18.0',
						description: 'The Facebook Graph API version to use',
					},
					{
						displayName: 'Lead Fields',
						name: 'leadFields',
						type: 'string',
						default: 'created_time,id,ad_id,form_id,field_data',
						description:
							'Comma-separated list of fields to fetch from the lead. See Facebook Lead Ads API documentation for available fields.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getPages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				// Add "All Pages" option
				returnData.push({
					name: '-- All Pages --',
					value: '',
				});

				try {
					const credentials = await this.getCredentials('facebookLeadAdsMultiFormOAuth2Api');
					const accessToken = credentials.oauthTokenData as IDataObject;
					const token = (accessToken?.access_token as string) || '';

					const response = (await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://graph.facebook.com/v18.0/me/accounts',
						qs: {
							access_token: token,
							fields: 'id,name,access_token',
						},
					})) as { data: FacebookPage[] };

					if (response.data && Array.isArray(response.data)) {
						for (const page of response.data) {
							returnData.push({
								name: page.name,
								value: page.id,
							});
						}
					}
				} catch {
					// Return empty list on error, user can still use expressions
				}

				return returnData;
			},

			async getForms(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				// Add "All Forms" option
				returnData.push({
					name: '-- All Forms --',
					value: '',
				});

				const pageId = this.getCurrentNodeParameter('page') as string;

				if (!pageId) {
					return returnData;
				}

				try {
					const credentials = await this.getCredentials('facebookLeadAdsMultiFormOAuth2Api');
					const accessToken = credentials.oauthTokenData as IDataObject;
					const token = (accessToken?.access_token as string) || '';

					// First, get the page access token
					const pagesResponse = (await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://graph.facebook.com/v18.0/me/accounts',
						qs: {
							access_token: token,
							fields: 'id,name,access_token',
						},
					})) as { data: FacebookPage[] };

					const page = pagesResponse.data?.find((p) => p.id === pageId);
					const pageToken = page?.access_token || token;

					// Get lead gen forms for the page
					const formsResponse = (await this.helpers.httpRequest({
						method: 'GET',
						url: `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms`,
						qs: {
							access_token: pageToken,
							fields: 'id,name,status',
						},
					})) as { data: FacebookForm[] };

					if (formsResponse.data && Array.isArray(formsResponse.data)) {
						for (const form of formsResponse.data) {
							returnData.push({
								name: `${form.name} (${form.status})`,
								value: form.id,
							});
						}
					}
				} catch {
					// Return empty list on error, user can still use expressions
				}

				return returnData;
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Webhook is managed externally by Facebook
				// We just need to confirm the node is configured
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// Webhook is managed externally via Facebook App Dashboard
				// User must configure webhook URL in Facebook Developer Console
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// Webhook is managed externally by Facebook
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const verifyToken = this.getNodeParameter('verifyToken', '') as string;

		// Handle Facebook webhook verification (GET request)
		if (req.method === 'GET') {
			const mode = req.query['hub.mode'] as string;
			const token = req.query['hub.verify_token'] as string;
			const challenge = req.query['hub.challenge'] as string;

			if (mode === 'subscribe' && token === verifyToken) {
				// Return the challenge to verify the webhook
				return {
					webhookResponse: challenge,
				};
			}

			// Verification failed
			return {
				webhookResponse: 'Verification failed',
			};
		}

		// Handle incoming webhook events (POST request)
		const body = this.getBodyData() as {
			object?: string;
			entry?: FacebookLeadGenEntry[];
		};

		// Validate the webhook payload
		if (body.object !== 'page' || !body.entry || !Array.isArray(body.entry)) {
			return {
				webhookResponse: { received: true },
			};
		}

		// Get credentials for Graph API calls
		const credentials = await this.getCredentials('facebookLeadAdsMultiFormOAuth2Api');

		const filterPageId = this.getNodeParameter('page', '') as string;
		const filterFormId = this.getNodeParameter('form', '') as string;
		const fetchFullLeadData = this.getNodeParameter('fetchFullLeadData', true) as boolean;
		const options = this.getNodeParameter('options', {}) as IDataObject;
		const apiVersion = (options.apiVersion as string) || 'v18.0';
		const leadFields = (options.leadFields as string) || 'created_time,id,ad_id,form_id,field_data';

		const returnData: IDataObject[] = [];

		// Process each entry
		for (const entry of body.entry) {
			// Filter by page ID if specified
			if (filterPageId && entry.id !== filterPageId) {
				continue;
			}

			// Process each change (lead) in the entry
			for (const change of entry.changes) {
				if (change.field !== 'leadgen') {
					continue;
				}

				const leadgenValue = change.value;

				// Filter by form ID if specified
				if (filterFormId && leadgenValue.form_id !== filterFormId) {
					continue;
				}

				let leadData: IDataObject = {
					leadgen_id: leadgenValue.leadgen_id,
					page_id: leadgenValue.page_id,
					form_id: leadgenValue.form_id,
					ad_id: leadgenValue.ad_id,
					adgroup_id: leadgenValue.adgroup_id,
					created_time: leadgenValue.created_time,
					event_time: entry.time,
				};

				// Fetch full lead data from Graph API if enabled
				if (fetchFullLeadData) {
					try {
						// Use OAuth2 access token from existing n8n Facebook Lead Ads credentials
						const accessToken = credentials.oauthTokenData as IDataObject;
						const fullLeadData = (await this.helpers.httpRequest({
							method: 'GET',
							url: `https://graph.facebook.com/${apiVersion}/${leadgenValue.leadgen_id}`,
							qs: {
								access_token: (accessToken?.access_token as string) || '',
								fields: leadFields,
							},
						})) as FacebookLeadData;

						// Merge the full lead data
						leadData = {
							...leadData,
							...fullLeadData,
						};

						// Extract email and other common fields for easy access
						if (fullLeadData.field_data && Array.isArray(fullLeadData.field_data)) {
							for (const field of fullLeadData.field_data) {
								const fieldName = field.name.toLowerCase().replace(/\s+/g, '_');
								// Use the first value if available
								if (field.values && field.values.length > 0) {
									leadData[fieldName] = field.values[0];

									// Also map common field names for SmartEmailing compatibility
									if (
										fieldName === 'email' ||
										fieldName === 'e-mail' ||
										fieldName === 'emailaddress'
									) {
										leadData['emailaddress'] = field.values[0];
									}
									if (
										fieldName === 'full_name' ||
										fieldName === 'fullname' ||
										fieldName === 'name'
									) {
										leadData['name'] = field.values[0];
									}
									if (fieldName === 'first_name' || fieldName === 'firstname') {
										leadData['name'] = field.values[0];
									}
									if (fieldName === 'phone' || fieldName === 'phone_number') {
										leadData['cellphone'] = field.values[0];
									}
								}
							}
						}
					} catch {
						// If fetching fails, still return the basic lead data
						leadData['fetch_error'] = 'Failed to fetch lead data from Graph API';
					}
				}

				returnData.push(leadData);
			}
		}

		// If no leads matched filters, still acknowledge the webhook
		if (returnData.length === 0) {
			return {
				webhookResponse: { received: true, leads_processed: 0 },
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(returnData)],
			webhookResponse: { received: true, leads_processed: returnData.length },
		};
	}
}
