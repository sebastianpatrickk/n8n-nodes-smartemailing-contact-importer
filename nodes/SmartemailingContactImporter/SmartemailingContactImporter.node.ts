import {
	NodeConnectionType,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { importDescription } from './resources/import';

export class SmartemailingContactImporter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Smartemailing Contact Importer',
		name: 'smartemailingContactImporter',
		icon: 'file:smartemailingContactImporter.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Import contacts into Smartemailing contact lists',
		defaults: {
			name: 'Smartemailing Contact Importer',
		},
		// @ts-expect-error - usableAsTool is a valid n8n property
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [{ name: 'smartemailingContactImporterApi', required: true }],
		requestDefaults: {
			baseURL: 'https://app.smartemailing.cz/api/v3',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [...importDescription],
	};

	methods = {
		loadOptions: {
			async getContactLists(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('smartemailingContactImporterApi');
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: '/contactlists',
					baseURL: 'https://app.smartemailing.cz/api/v3',
					auth: {
						username: credentials.username as string,
						password: credentials.password as string,
					},
				});

				if (response.status === 'ok' && Array.isArray(response.data)) {
					return response.data.map((list: IDataObject) => ({
						name: (list.name as string) || `List ${list.id}`,
						value: list.id as number,
					}));
				}

				return [];
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		if (items.length === 0) {
			return [this.helpers.returnJsonArray([])];
		}

		const contactListId = this.getNodeParameter('contactListId', 0) as number;
		const contactDataSource = this.getNodeParameter('contactDataSource', 0, 'input') as string;
		const settings = this.getNodeParameter('settings', 0, {}) as IDataObject;
		const doubleOptInSettings = this.getNodeParameter('doubleOptInSettings', 0, {}) as IDataObject;

		// Get contact data based on source
		let contactData: IDataObject[];
		if (contactDataSource === 'json') {
			const contactDataJson = this.getNodeParameter('contactData', 0) as string;
			try {
				const parsed = JSON.parse(contactDataJson);
				if (!Array.isArray(parsed)) {
					throw new NodeOperationError(this.getNode(), 'Contact Data must be a JSON array');
				}
				contactData = parsed;
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Invalid JSON in Contact Data: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		} else {
			// Collect contact data from all input items
			contactData = [];
			for (const item of items) {
				const itemJson = item.json;

				// If the item contains a 'data' array, use it; otherwise, treat the item itself as contact data
				if (Array.isArray(itemJson.data)) {
					contactData.push(...(itemJson.data as IDataObject[]));
				} else if (Array.isArray(itemJson)) {
					contactData.push(...(itemJson as IDataObject[]));
				} else {
					// Single contact object - add to array
					contactData.push(itemJson as IDataObject);
				}
			}
		}

		// Add selected contact list ID to each contact
		const processedData = contactData.map((contact: IDataObject) => {
			const processedContact = { ...contact };

			// Ensure contactlists array exists
			if (!processedContact.contactlists) {
				processedContact.contactlists = [];
			}

			// Add the selected contact list if not already present
			const contactlists = processedContact.contactlists as IDataObject[];
			const listExists = contactlists.some((list: IDataObject) => list.id === contactListId);

			if (!listExists) {
				contactlists.push({
					id: contactListId,
					status: 'confirmed',
				});
			}

			return processedContact;
		});

		// Build settings object
		const importSettings: IDataObject = { ...settings };

		// Add double opt-in settings if provided
		if (Object.keys(doubleOptInSettings).length > 0) {
			const doubleOptIn: IDataObject = {};

			if (doubleOptInSettings.email_id) {
				if (!doubleOptIn.campaign) {
					doubleOptIn.campaign = {};
				}
				(doubleOptIn.campaign as IDataObject).email_id = doubleOptInSettings.email_id;
			}

			if (
				doubleOptInSettings.sender_from ||
				doubleOptInSettings.sender_reply_to ||
				doubleOptInSettings.sender_name
			) {
				if (!doubleOptIn.campaign) {
					doubleOptIn.campaign = {};
				}
				if (!(doubleOptIn.campaign as IDataObject).sender_credentials) {
					(doubleOptIn.campaign as IDataObject).sender_credentials = {};
				}
				const senderCreds = (doubleOptIn.campaign as IDataObject).sender_credentials as IDataObject;

				if (doubleOptInSettings.sender_from) {
					senderCreds.from = doubleOptInSettings.sender_from;
				}
				if (doubleOptInSettings.sender_reply_to) {
					senderCreds.reply_to = doubleOptInSettings.sender_reply_to;
				}
				if (doubleOptInSettings.sender_name) {
					senderCreds.sender_name = doubleOptInSettings.sender_name;
				}
			}

			if (doubleOptInSettings.confirmation_thank_you_page_url) {
				if (!doubleOptIn.campaign) {
					doubleOptIn.campaign = {};
				}
				(doubleOptIn.campaign as IDataObject).confirmation_thank_you_page_url =
					doubleOptInSettings.confirmation_thank_you_page_url;
			}

			if (doubleOptInSettings.send_to_mode) {
				doubleOptIn.send_to_mode = doubleOptInSettings.send_to_mode;
			}

			if (doubleOptInSettings.silence_period_unit && doubleOptInSettings.silence_period_value) {
				doubleOptIn.silence_period = {
					unit: doubleOptInSettings.silence_period_unit,
					value: doubleOptInSettings.silence_period_value,
				};
			}

			if (Object.keys(doubleOptIn).length > 0) {
				importSettings.double_opt_in_settings = doubleOptIn;
			}
		}

		// Make the import request
		const credentials = await this.getCredentials('smartemailingContactImporterApi');
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: '/import',
			baseURL: 'https://app.smartemailing.cz/api/v3',
			auth: {
				username: credentials.username as string,
				password: credentials.password as string,
			},
			body: {
				settings: importSettings,
				data: processedData,
			},
		});

		returnData.push(response);

		return [this.helpers.returnJsonArray(returnData)];
	}
}
