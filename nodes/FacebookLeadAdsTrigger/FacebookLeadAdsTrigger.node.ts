import type {
	IDataObject,
	IHookFunctions,
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

export class FacebookLeadAdsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Facebook Lead Ads Trigger',
		name: 'facebookLeadAdsTrigger',
		icon: 'file:facebookLeadAds.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'Receives leads from Facebook Lead Ads',
		description:
			'Triggers when a new lead is submitted through Facebook Lead Ads. Supports multiple forms.',
		defaults: {
			name: 'Facebook Lead Ads Trigger',
		},
		// @ts-expect-error - usableAsTool is a valid n8n property
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'facebookLeadAdsApi', required: true }],
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
				displayName: 'Filter by Page ID',
				name: 'filterPageId',
				type: 'string',
				default: '',
				placeholder: 'e.g., 123456789',
				description:
					'Optional. Only process leads from this Facebook Page ID. Leave empty to receive leads from all pages.',
			},
			{
				displayName: 'Filter by Form ID',
				name: 'filterFormId',
				type: 'string',
				default: '',
				placeholder: 'e.g., 987654321',
				description:
					'Optional. Only process leads from this Form ID. Leave empty to receive leads from all forms.',
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
		const credentials = await this.getCredentials('facebookLeadAdsApi');

		// Handle Facebook webhook verification (GET request)
		if (req.method === 'GET') {
			const mode = req.query['hub.mode'] as string;
			const token = req.query['hub.verify_token'] as string;
			const challenge = req.query['hub.challenge'] as string;

			if (mode === 'subscribe' && token === credentials.verifyToken) {
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

		const filterPageId = this.getNodeParameter('filterPageId', '') as string;
		const filterFormId = this.getNodeParameter('filterFormId', '') as string;
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
						const fullLeadData = (await this.helpers.httpRequest({
							method: 'GET',
							url: `https://graph.facebook.com/${apiVersion}/${leadgenValue.leadgen_id}`,
							qs: {
								access_token: credentials.accessToken as string,
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
					} catch (error) {
						// If fetching fails, still return the basic lead data
						leadData['fetch_error'] =
							error instanceof Error ? error.message : 'Failed to fetch lead data';
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
