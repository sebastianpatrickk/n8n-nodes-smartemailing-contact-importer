import type { INodeProperties } from 'n8n-workflow';

export const importContactsDescription: INodeProperties[] = [
	{
		displayName: 'Contact List Name or ID',
		name: 'contactListId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getContactLists',
		},
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Contact Data Source',
		name: 'contactDataSource',
		type: 'options',
		options: [
			{
				name: 'From Input Items',
				value: 'input',
				description:
					'Use contact data from input items (each item should be a contact object, or items should have a "data" array)',
			},
			{
				name: 'From JSON Parameter',
				value: 'json',
				description: 'Provide contact data as a JSON array in the parameter below',
			},
		],
		default: 'input',
		description: 'Where to get the contact data from',
	},
	{
		displayName: 'Contact Data (JSON)',
		name: 'contactData',
		type: 'json',
		displayOptions: {
			show: {
				contactDataSource: ['json'],
			},
		},
		default: '',
		description:
			'JSON array of contact objects to import. Each contact should have emailaddress and other fields as per Smartemailing API schema.',
	},
	{
		displayName: 'Settings',
		name: 'settings',
		type: 'collection',
		placeholder: 'Add Setting',
		default: {},
		options: [
			{
				displayName: 'Add Genders',
				name: 'add_genders',
				type: 'boolean',
				default: false,
				description: 'Whether to add genders to contacts',
			},
			{
				displayName: 'Add Namedays',
				name: 'add_namedays',
				type: 'boolean',
				default: false,
				description: 'Whether to add namedays to contacts',
			},
			{
				displayName: 'Add Salutations',
				name: 'add_salutions',
				type: 'boolean',
				default: false,
				description: 'Whether to add salutations to contacts',
			},
			{
				displayName: 'Preserve Unsubscribed',
				name: 'preserve_unsubscribed',
				type: 'boolean',
				default: true,
				description: 'Whether to preserve unsubscribed status',
			},
			{
				displayName: 'Skip Invalid Emails',
				name: 'skip_invalid_emails',
				type: 'boolean',
				default: false,
				description: 'Whether to skip invalid email addresses',
			},
			{
				displayName: 'Update',
				name: 'update',
				type: 'boolean',
				default: true,
				description: 'Whether to update existing contacts',
			},
		],
	},
	{
		displayName: 'Double Opt-In Settings',
		name: 'doubleOptInSettings',
		type: 'collection',
		placeholder: 'Add Double Opt-In Setting',
		default: {},
		options: [
			{
				displayName: 'Confirmation Thank You Page URL',
				name: 'confirmation_thank_you_page_url',
				type: 'string',
				default: '',
				description: 'URL to redirect to after confirmation',
			},
			{
				displayName: 'Email ID',
				name: 'email_id',
				type: 'number',
				default: 0,
				description: 'ID of the email to send for double opt-in confirmation',
			},
			{
				displayName: 'Send To Mode',
				name: 'send_to_mode',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'New Only',
						value: 'new_only',
					},
				],
				default: 'all',
				description: 'Who should receive the double opt-in email',
			},
			{
				displayName: 'Sender From',
				name: 'sender_from',
				type: 'string',
				default: '',
				description: 'Email address to send from',
			},
			{
				displayName: 'Sender Name',
				name: 'sender_name',
				type: 'string',
				default: '',
				description: 'Name of the sender',
			},
			{
				displayName: 'Sender Reply To',
				name: 'sender_reply_to',
				type: 'string',
				default: '',
				description: 'Reply-to email address',
			},
			{
				displayName: 'Silence Period Unit',
				name: 'silence_period_unit',
				type: 'options',
				options: [
					{
						name: 'Days',
						value: 'days',
					},
					{
						name: 'Hours',
						value: 'hours',
					},
				],
				default: 'days',
				description: 'Unit for the silence period',
			},
			{
				displayName: 'Silence Period Value',
				name: 'silence_period_value',
				type: 'number',
				default: 0,
				description: 'Value for the silence period',
			},
		],
	},
];
